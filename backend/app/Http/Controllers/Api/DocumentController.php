<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ExtractDocumentTextJob;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    // GET /api/documents (pagination 20) — بلا content_text
    public function index()
    {
        $docs = Document::query()
            ->select([
                'id',
                'type',
                'case_number',
                'judgement_number',
                'judge_name',
                'division',
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
            ->paginate(20);

        return response()->json($docs);
    }

    // POST /api/documents (multipart/form-data)
    public function store(Request $request)
    {
        $data = $request->validate([
            'pdf' => ['required', 'file', 'mimes:pdf', 'max:51200'], // 50MB
            'type' => ['nullable', 'string', 'max:50'],
            'case_number' => ['nullable', 'string', 'max:255'],
            'judgement_number' => ['nullable', 'string', 'max:255'],
            'judge_name' => ['nullable', 'string', 'max:255'],
            'division' => ['nullable', 'string', 'max:255'],
            'keyword' => ['nullable', 'string', 'max:255'],
        ]);

        $pdf = $data['pdf'];
        $path = $pdf->store('documents', 'public'); // documents/xxx.pdf

        $doc = new Document();
        $doc->type = $data['type'] ?? null;
        $doc->case_number = $data['case_number'] ?? null;
        $doc->judgement_number = $data['judgement_number'] ?? null;
        $doc->judge_name = $data['judge_name'] ?? null;
        $doc->division = $data['division'] ?? null;
        $doc->keyword = $data['keyword'] ?? null;

        $doc->original_filename = $pdf->getClientOriginalName();
        $doc->file_path = $path;

        // fields for extraction
        $doc->content_text = null;
        $doc->status = 'pending';          // عندك فـ الجدول
        $doc->extract_status = 'pending';  // ديال job
        $doc->extract_error = null;

        $doc->save();

        // ✅ dispatch extraction job
        ExtractDocumentTextJob::dispatch($doc->id);

        return response()->json([
            'message' => 'تم رفع الوثيقة بنجاح وتمت إضافتها للمعالجة',
            'data' => $doc->only([
                'id',
                'type',
                'case_number',
                'judgement_number',
                'judge_name',
                'division',
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

    // GET /api/documents/search?type=&case_number=&judgement_number=&judge_name=&division=&keyword=
    // (كيـرجع data[] limit 50)
    public function search(Request $request)
    {
        $type = trim((string) $request->query('type', ''));
        $caseNumber = trim((string) $request->query('case_number', ''));
        $judgementNumber = trim((string) $request->query('judgement_number', ''));
        $judgeName = trim((string) $request->query('judge_name', ''));
        $division = trim((string) $request->query('division', ''));
        $keyword = trim((string) $request->query('keyword', ''));

        $q = Document::query()
            ->select([
                'id',
                'type',
                'case_number',
                'judgement_number',
                'judge_name',
                'division',
                'keyword',
                'status',
                'extract_status',
                'created_at',
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
        if ($division !== '') {
            $q->where('division', 'like', "%{$division}%");
        }
        if ($keyword !== '') {
            $q->where(function ($qq) use ($keyword) {
                $qq->where('keyword', 'like', "%{$keyword}%")
                    ->orWhere('content_text', 'like', "%{$keyword}%")
                    ->orWhere('original_filename', 'like', "%{$keyword}%");
            });
        }

        $docs = $q->limit(50)->get();

        return response()->json(['data' => $docs]);
    }

    // GET /api/documents/{id}
    public function show(int $id)
    {
        $doc = Document::findOrFail($id);

        // هنا كنرجعو content_text باش details يقدر يبينو
        return response()->json($doc);
    }

    // PUT/PATCH /api/documents/{id}
    public function update(Request $request, int $id)
    {
        $doc = Document::findOrFail($id);

        $data = $request->validate([
            'type' => ['nullable', 'string', 'max:50'],
            'case_number' => ['nullable', 'string', 'max:255'],
            'judgement_number' => ['nullable', 'string', 'max:255'],
            'judge_name' => ['nullable', 'string', 'max:255'],
            'division' => ['nullable', 'string', 'max:255'],
            'keyword' => ['nullable', 'string', 'max:255'],
            // status اختياري (إلا بغيتي تتحكم فيه من admin)
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $doc->fill($data);
        $doc->save();

        return response()->json([
            'message' => 'تم تحديث الوثيقة بنجاح',
            'data' => $doc,
        ]);
    }

    // DELETE /api/documents/{id}
    public function destroy(int $id)
    {
        $doc = Document::findOrFail($id);

        if ($doc->file_path && Storage::disk('public')->exists($doc->file_path)) {
            Storage::disk('public')->delete($doc->file_path);
        }

        $doc->delete();

        return response()->json(['message' => 'تم حذف الوثيقة بنجاح']);
    }

    // GET /api/documents/{id}/download
    public function download(int $id)
    {
        $doc = Document::findOrFail($id);

        if (!$doc->file_path || !Storage::disk('public')->exists($doc->file_path)) {
            return response()->json(['message' => 'الملف غير موجود'], 404);
        }

        // كيحافظ على الاسم الأصلي فالتحميل
        $downloadName = $doc->original_filename ?: basename($doc->file_path);

        return Storage::disk('public')->download($doc->file_path, $downloadName);
    }
}
