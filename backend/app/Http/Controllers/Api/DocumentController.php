<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ExtractDocumentTextJob;
use App\Models\ActivityLog;
use App\Models\CaseType;
use App\Models\Document;
use App\Models\Judge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    /**
     * ✅ Helper: per_page safe
     */
    private function perPage(Request $request, int $default = 20): int
    {
        $pp = (int) $request->query('per_page', $default);
        return max(1, min($pp, 100));
    }

    private function logDocumentAction(Request $request, Document $doc, string $action, ?string $message = null): void
    {
        try {
            $user = $request->user();
            $actorName = null;
            if ($user) {
                $actorName = trim((string) ($user->full_name ?? ''));
                if ($actorName === '') {
                    $actorName = (string) ($user->empname ?? $user->email ?? '');
                }
            }

            ActivityLog::create([
                'employee_id' => $user?->id,
                'actor_name' => $actorName ?: null,
                'action' => $action,
                'entity_type' => 'document',
                'entity_id' => $doc->id,
                'message' => $message,
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }


    public function index(Request $request)
    {
        $perPage = $this->perPage($request, 20);

        $docs = Document::query()
            ->select([
                'id',
                'type',
                'case_number',
                'judgement_number',
                'judge_name',
                'judge_id',
                'division',
                'case_type_id',
                'employee_id',
                'keyword',
                'original_filename',
                'file_path',
                'status',
                'extract_status',
                'extract_error',
                'created_at',
                'updated_at',
            ])
            ->orderByDesc('id')
            ->paginate($perPage)
            ->appends($request->query()); // باش next/prev يحتافظو بالفلترات

        return response()->json($docs);
    }

    /**
     * POST /api/documents (multipart/form-data)
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'pdf' => ['required', 'file', 'mimes:pdf', 'max:51200'], // 50MB
            'type' => ['nullable', 'string', 'max:50'],
            'case_number' => ['nullable', 'string', 'max:255'],
            'judgement_number' => ['nullable', 'string', 'max:255'],
            'judge_name' => ['nullable', 'string', 'max:255'],
            'judge_id' => ['nullable', 'integer', 'exists:judges,id'],
            'division' => ['nullable', 'string', 'max:255'],
            'case_type_id' => ['nullable', 'integer', 'exists:case_types,id'],
            'keyword' => ['nullable', 'string', 'max:255'],
        ]);

        $pdf = $data['pdf'];
        $path = $pdf->store('documents', 'public'); // documents/xxx.pdf
        unset($data['pdf']);

        $judge = null;
        if (!empty($data['judge_id'])) {
            $judge = Judge::find($data['judge_id']);
        } elseif (!empty($data['judge_name'])) {
            $judge = Judge::query()->where('full_name', $data['judge_name'])->first();
            if ($judge) {
                $data['judge_id'] = $judge->id;
            }
        }

        $caseType = null;
        if (!empty($data['case_type_id'])) {
            $caseType = CaseType::query()->with('division:id,name')->find($data['case_type_id']);
        } elseif (!empty($data['keyword'])) {
            $caseQuery = CaseType::query()->with('division:id,name')->where('code', $data['keyword']);
            if (!empty($data['division'])) {
                $caseQuery->whereHas('division', fn ($q) => $q->where('name', $data['division']));
            }
            $matches = $caseQuery->get();
            if ($matches->count() === 1) {
                $caseType = $matches->first();
                $data['case_type_id'] = $caseType->id;
            }
        }

        if ($judge && empty($data['judge_name'])) {
            $data['judge_name'] = $judge->full_name;
        }

        if ($caseType) {
            if (empty($data['keyword'])) {
                $data['keyword'] = $caseType->code;
            }
            if (empty($data['type'])) {
                $data['type'] = $caseType->name;
            }
            if (empty($data['division']) && $caseType->division) {
                $data['division'] = $caseType->division->name;
            }
        }

        $doc = new Document();
        $doc->fill($data);
        $doc->employee_id = $request->user()?->id;

        $doc->original_filename = $pdf->getClientOriginalName();
        $doc->file_path = $path;

        // fields for extraction
        $doc->content_text = null;
        $doc->status = 'pending';
        $doc->extract_status = 'pending';
        $doc->extract_error = null;

        $doc->save();

        $this->logDocumentAction($request, $doc, 'created', $doc->original_filename);

        ExtractDocumentTextJob::dispatch($doc->id);

        return response()->json([
            'message' => 'تم رفع الوثيقة بنجاح وتمت إضافتها للمعالجة',
            'data' => $doc->only([
                'id',
                'type',
                'case_number',
                'judgement_number',
                'judge_name',
                'judge_id',
                'division',
                'case_type_id',
                'employee_id',
                'keyword',
                'original_filename',
                'file_path',
                'status',
                'extract_status',
                'extract_error',
                'created_at',
            ]),
        ], 201);
    }

    /**
     * ✅ GET /api/documents/search?per_page=10&page=1&type=&case_number=&judgement_number=&judge_name=&division=&keyword=&q=
     * (pagination بدل limit 50)
     *
     * ملاحظة: أنت فالـReact كتستعمل:
     * - division
     * - keyword (case_type_code)
     * - judge_name
     * - case_number
     * - judgement_number
     * - q (كلمة مفتاحية عامة)
     *
     * دابا غادي نخدم keyword و q بجوج:
     * - keyword: نفس سلوكك الحالي (يقلب فـ keyword/content_text/original_filename)
     * - q: نفس الشيء (باش React يبقى خدام)
     */
    public function search(Request $request)
    {
        $perPage = $this->perPage($request, 20);

        $type = trim((string) $request->query('type', ''));
        $caseNumber = trim((string) $request->query('case_number', ''));
        $judgementNumber = trim((string) $request->query('judgement_number', ''));
        $judgeName = trim((string) $request->query('judge_name', ''));
        $judgeId = $request->integer('judge_id') ?: null;
        $division = trim((string) $request->query('division', ''));
        $caseTypeId = $request->integer('case_type_id') ?: null;
        $keyword = trim((string) $request->query('keyword', ''));
        $qText = trim((string) $request->query('q', ''));

        $q = Document::query()
            ->select([
                'id',
                'type',
                'case_number',
                'judgement_number',
                'judge_name',
                'judge_id',
                'division',
                'case_type_id',
                'employee_id',
                'keyword',
                'status',
                'extract_status',
                'created_at',
                'updated_at',
            ])
            ->orderByDesc('id');

        if ($type !== '') {
            $q->where('type', $type);
        }
        if ($caseNumber !== '') {
            $q->where('case_number', 'like', "%{$caseNumber}%");
        }
        if ($judgementNumber !== '') {
            $q->where('judgement_number', 'like', "%{$judgementNumber}%");
        }
        if ($judgeName !== '') {
            $q->where('judge_name', 'like', "%{$judgeName}%");
        }
        if ($judgeId) {
            $q->where('judge_id', $judgeId);
        }
        if ($division !== '') {
            $q->where('division', 'like', "%{$division}%");
        }
        if ($caseTypeId) {
            $q->where('case_type_id', $caseTypeId);
        }

        // keyword filter (كما كان)
        if ($keyword !== '') {
            $q->where(function ($qq) use ($keyword) {
                $qq->where('keyword', 'like', "%{$keyword}%")
                    ->orWhere('content_text', 'like', "%{$keyword}%")
                    ->orWhere('original_filename', 'like', "%{$keyword}%");
            });
        }

        // ✅ q general filter (React كيرسلو فـ params.q)
        if ($qText !== '') {
            $q->where(function ($qq) use ($qText) {
                $qq->where('keyword', 'like', "%{$qText}%")
                    ->orWhere('content_text', 'like', "%{$qText}%")
                    ->orWhere('original_filename', 'like', "%{$qText}%")
                    ->orWhere('type', 'like', "%{$qText}%")
                    ->orWhere('division', 'like', "%{$qText}%")
                    ->orWhere('judge_name', 'like', "%{$qText}%")
                    ->orWhere('case_number', 'like', "%{$qText}%")
                    ->orWhere('judgement_number', 'like', "%{$qText}%");
            });
        }

        $docs = $q->paginate($perPage)->appends($request->query());

        return response()->json($docs);
    }

    /**
     * GET /api/documents/{id}
     */
    public function show(int $id)
    {
        $doc = Document::findOrFail($id);
        return response()->json($doc);
    }

    /**
     * PUT/PATCH /api/documents/{id}
     */
    public function update(Request $request, int $id)
    {
        $doc = Document::findOrFail($id);

        $data = $request->validate([
            'type' => ['nullable', 'string', 'max:50'],
            'case_number' => ['nullable', 'string', 'max:255'],
            'judgement_number' => ['nullable', 'string', 'max:255'],
            'judge_name' => ['nullable', 'string', 'max:255'],
            'judge_id' => ['nullable', 'integer', 'exists:judges,id'],
            'division' => ['nullable', 'string', 'max:255'],
            'case_type_id' => ['nullable', 'integer', 'exists:case_types,id'],
            'keyword' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $judge = null;
        if (array_key_exists('judge_id', $data) && !empty($data['judge_id'])) {
            $judge = Judge::find($data['judge_id']);
        } elseif (array_key_exists('judge_name', $data) && !empty($data['judge_name'])) {
            $judge = Judge::query()->where('full_name', $data['judge_name'])->first();
            if ($judge) {
                $data['judge_id'] = $judge->id;
            }
        }

        $caseType = null;
        if (array_key_exists('case_type_id', $data) && !empty($data['case_type_id'])) {
            $caseType = CaseType::query()->with('division:id,name')->find($data['case_type_id']);
        } elseif (array_key_exists('keyword', $data) && !empty($data['keyword'])) {
            $caseQuery = CaseType::query()->with('division:id,name')->where('code', $data['keyword']);
            if (!empty($data['division'])) {
                $caseQuery->whereHas('division', fn ($q) => $q->where('name', $data['division']));
            }
            $matches = $caseQuery->get();
            if ($matches->count() === 1) {
                $caseType = $matches->first();
                $data['case_type_id'] = $caseType->id;
            }
        }

        if ($judge && (!array_key_exists('judge_name', $data) || empty($data['judge_name']))) {
            $data['judge_name'] = $judge->full_name;
        }

        if ($caseType) {
            if (!array_key_exists('keyword', $data) || empty($data['keyword'])) {
                $data['keyword'] = $caseType->code;
            }
            if (!array_key_exists('type', $data) || empty($data['type'])) {
                $data['type'] = $caseType->name;
            }
            if ((!array_key_exists('division', $data) || empty($data['division'])) && $caseType->division) {
                $data['division'] = $caseType->division->name;
            }
        }

        $doc->fill($data);
        $changed = $doc->isDirty();
        $doc->save();

        if ($changed) {
            $this->logDocumentAction($request, $doc, 'updated');
        }

        return response()->json([
            'message' => 'تم تحديث الوثيقة بنجاح',
            'data' => $doc,
        ]);
    }

    /**
     * DELETE /api/documents/{id}
     */
    public function destroy(Request $request, int $id)
    {
        $doc = Document::findOrFail($id);

        if ($doc->file_path && Storage::disk('public')->exists($doc->file_path)) {
            Storage::disk('public')->delete($doc->file_path);
        }

        $this->logDocumentAction($request, $doc, 'deleted', $doc->original_filename);

        $doc->delete();

        return response()->json(['message' => 'تم حذف الوثيقة بنجاح']);
    }

    /**
     * GET /api/documents/{id}/download
     */
    public function download(int $id)
    {
        $doc = Document::findOrFail($id);

        if (!$doc->file_path || !Storage::disk('public')->exists($doc->file_path)) {
            return response()->json(['message' => 'الملف غير موجود'], 404);
        }

        $downloadName = $doc->original_filename ?: basename($doc->file_path);

        return Storage::disk('public')->download($doc->file_path, $downloadName);
    }
}
