<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ExtractDocumentTextJob;
use App\Models\ActivityLog;
use App\Models\CaseType;
use App\Models\Division;
use App\Models\Document;
use App\Models\Employee;
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

    private function logDocumentAction(Request $request, Document $doc, string $action, $message = null): void
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

            $payload = [
                'employee_id' => $user?->id,
                'actor_name' => $actorName ?: null,
                'action' => $action,
                'entity_type' => 'document',
                'entity_id' => $doc->id,
                'message' => $message,
            ];

            if (is_array($message)) {
                $payload['message'] = json_encode($message, JSON_UNESCAPED_UNICODE);
            }

            ActivityLog::create($payload);
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

        // منع تكرار نفس (رقم الملف + رقم الحكم)
        $caseNumber = trim((string) ($data['case_number'] ?? ''));
        $judgementNumber = trim((string) ($data['judgement_number'] ?? ''));
        if ($caseNumber !== '' && $judgementNumber !== '') {
            $exists = Document::query()
                ->where('case_number', $caseNumber)
                ->where('judgement_number', $judgementNumber)
                ->exists();
            if ($exists) {
                return response()->json([
                    'message' => 'لا يمكن إنشاء وثيقة بنفس رقم الملف ورقم الحكم.',
                ], 422);
            }
        }

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
        $logs = [];
        try {
            $logs = ActivityLog::query()
                ->with(['employee:id,first_name,last_name,empname'])
                ->select([
                    'id',
                    'employee_id',
                    'actor_name',
                    'action',
                    'entity_type',
                    'entity_id',
                    'message',
                    'created_at',
                ])
                ->where('entity_type', 'document')
                ->where('entity_id', $doc->id)
                ->orderByDesc('id')
                ->limit(50)
                ->get()
                ->map(function ($log) {
                    $actorName = trim((string) ($log->actor_name ?? ''));
                    if ($actorName === '' && $log->employee) {
                        $actorName = trim((string) ($log->employee->full_name ?? ''));
                        if ($actorName === '') {
                            $actorName = (string) ($log->employee->empname ?? $log->employee->email ?? '');
                        }
                    }

                    return [
                        'id' => $log->id,
                        'employee_id' => $log->employee_id,
                        'actor_name' => $actorName !== '' ? $actorName : null,
                        'action' => $log->action,
                        'entity_type' => $log->entity_type,
                        'entity_id' => $log->entity_id,
                        'message' => $log->message,
                        'created_at' => $log->created_at,
                    ];
                })
                ->toArray();
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'data' => $doc,
            'logs' => $logs,
        ]);
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

        // منع تكرار نفس (رقم الملف + رقم الحكم) مع تجاهل الوثيقة الحالية
        $caseNumber = trim((string) ($data['case_number'] ?? $doc->case_number ?? ''));
        $judgementNumber = trim((string) ($data['judgement_number'] ?? $doc->judgement_number ?? ''));
        if ($caseNumber !== '' && $judgementNumber !== '') {
            $exists = Document::query()
                ->where('case_number', $caseNumber)
                ->where('judgement_number', $judgementNumber)
                ->where('id', '!=', $doc->id)
                ->exists();
            if ($exists) {
                return response()->json([
                    'message' => 'لا يمكن تعديل وثيقة بنفس رقم الملف ورقم الحكم.',
                ], 422);
            }
        }

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

        $createdByName = null;
        if ($doc->employee_id) {
            $creator = Employee::query()->select(['id', 'first_name', 'last_name', 'empname'])->find($doc->employee_id);
            if ($creator) {
                $createdByName = trim((string) ($creator->full_name ?? ''));
                if ($createdByName === '') {
                    $createdByName = (string) ($creator->empname ?? $creator->email ?? '');
                }
            }
        }

        $lastUpdated = ActivityLog::query()
            ->with(['employee:id,first_name,last_name,empname'])
            ->where('entity_type', 'document')
            ->where('action', 'updated')
            ->where('entity_id', $doc->id)
            ->orderByDesc('id')
            ->first();

        $updatedByName = null;
        $updatedById = null;
        $updatedAt = null;
        if ($lastUpdated) {
            $updatedById = $lastUpdated->employee_id;
            $updatedByName = trim((string) ($lastUpdated->actor_name ?? ''));
            if ($updatedByName === '' && $lastUpdated->employee) {
                $updatedByName = trim((string) ($lastUpdated->employee->full_name ?? ''));
                if ($updatedByName === '') {
                    $updatedByName = (string) ($lastUpdated->employee->empname ?? $lastUpdated->employee->email ?? '');
                }
            }
            $updatedAt = $lastUpdated->created_at;
        }

        $snapshot = [
            'division' => $doc->division,
            'type' => $doc->type,
            'keyword' => $doc->keyword,
            'case_number' => $doc->case_number,
            'judgement_number' => $doc->judgement_number,
            'judge_name' => $doc->judge_name,
            'created_at' => $doc->created_at,
            'created_by_id' => $doc->employee_id,
            'created_by_name' => $createdByName,
            'updated_by_id' => $updatedById,
            'updated_by_name' => $updatedByName,
            'updated_at' => $updatedAt,
            'original_filename' => $doc->original_filename,
        ];

        $this->logDocumentAction($request, $doc, 'deleted', $snapshot);

        $doc->delete();

        return response()->json(['message' => 'تم حذف الوثيقة بنجاح']);
    }

    
    /**
     * GET /api/documents/judgement-missing?year=2026
     */
    public function judgementMissing(Request $request)
    {
        $year = trim((string) $request->query('year', ''));
        if (!preg_match('/^\d{4}$/', $year)) {
            return response()->json([
                'message' => 'Invalid year.',
            ], 422);
        }

        $divisionId = $request->query('division_id');
        $caseTypeId = $request->query('case_type_id');

        $query = Document::query()
            ->select(['judgement_number'])
            ->whereNotNull('judgement_number')
            ->where('judgement_number', 'like', "%/{$year}");

        if (!empty($caseTypeId)) {
            $query->where('case_type_id', $caseTypeId);
        } elseif (!empty($divisionId)) {
            $division = Division::find($divisionId);
            if ($division) {
                $caseTypeIds = CaseType::query()->where('division_id', $divisionId)->pluck('id')->all();
                $query->where(function ($q) use ($caseTypeIds, $division) {
                    if (!empty($caseTypeIds)) {
                        $q->whereIn('case_type_id', $caseTypeIds);
                        if (!empty($division->name)) {
                            $q->orWhere('division', $division->name);
                        }
                        return;
                    }
                    if (!empty($division->name)) {
                        $q->where('division', $division->name);
                    }
                });
            }
        }

        $rows = $query->get();

        $seen = [];
        $max = 0;
        foreach ($rows as $r) {
            $v = trim((string) $r->judgement_number);
            if ($v === '') continue;
            if (!preg_match('/^(\d+)\/(\d{4})$/', $v, $m)) continue;
            if ($m[2] !== $year) continue;
            $n = (int) $m[1];
            if ($n <= 0) continue;
            $seen[$n] = true;
            if ($n > $max) $max = $n;
        }

        $width = max(2, strlen((string) $max));
        $missing = [];
        for ($i = 1; $i <= $max; $i++) {
            if (!isset($seen[$i])) {
                $missing[] = str_pad((string) $i, $width, '0', STR_PAD_LEFT) . '/' . $year;
            }
        }

        return response()->json([
            'year' => $year,
            'max' => $max,
            'missing' => $missing,
            'count' => count($missing),
        ]);
    }

    /**
     * GET /api/documents/judgement-years
     */
    public function judgementYears()
    {
        $divisionId = request()->query('division_id');
        $caseTypeId = request()->query('case_type_id');

        $query = Document::query()
            ->select(['judgement_number'])
            ->whereNotNull('judgement_number');

        if (!empty($caseTypeId)) {
            $query->where('case_type_id', $caseTypeId);
        } elseif (!empty($divisionId)) {
            $division = Division::find($divisionId);
            if ($division) {
                $caseTypeIds = CaseType::query()->where('division_id', $divisionId)->pluck('id')->all();
                $query->where(function ($q) use ($caseTypeIds, $division) {
                    if (!empty($caseTypeIds)) {
                        $q->whereIn('case_type_id', $caseTypeIds);
                        if (!empty($division->name)) {
                            $q->orWhere('division', $division->name);
                        }
                        return;
                    }
                    if (!empty($division->name)) {
                        $q->where('division', $division->name);
                    }
                });
            }
        }

        $rows = $query->get();

        $years = [];
        foreach ($rows as $r) {
            $v = trim((string) $r->judgement_number);
            if ($v === '') continue;
            if (!preg_match('/^(\d+)\/(\d{4})$/', $v, $m)) continue;
            $years[$m[2]] = true;
        }

        $list = array_keys($years);
        rsort($list, SORT_STRING);

        return response()->json([
            'years' => $list,
        ]);
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
