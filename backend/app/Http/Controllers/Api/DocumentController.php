<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ExtractDocumentTextJob;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index()
    {
        return Document::latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'max:100'],
            'judgement_number' => ['nullable', 'string', 'max:100'],
            'case_number' => ['nullable', 'string', 'max:100'],
            'judge_name' => ['nullable', 'string', 'max:200'],
            'file' => ['required', 'file', 'mimes:pdf', 'max:20480'], // 20MB
        ]);

        $file = $request->file('file');
        $path = $file->store('documents', 'public'); // storage/app/public/documents/...

        $doc = Document::create([
            'type' => $validated['type'],
            'judgement_number' => $validated['judgement_number'] ?? null,
            'case_number' => $validated['case_number'] ?? null,
            'judge_name' => $validated['judge_name'] ?? null,
            'original_filename' => $file->getClientOriginalName(),
            'file_path' => $path,
            'extract_status' => 'pending',
            'content_text' => null,
            'extract_error' => null,
        ]);

        // ✅ dispatch job ديال استخراج النص من PDF
        ExtractDocumentTextJob::dispatch($doc->id);

        return response()->json([
            'status' => 'ok',
            'document' => $doc
        ], 201);
    }

    public function show($id)
    {
        return Document::findOrFail($id);
    }

    public function download($id)
    {
        $doc = Document::findOrFail($id);

        if (!$doc->file_path || !Storage::disk('public')->exists($doc->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        $downloadName = $doc->original_filename ?: ("document_" . $doc->id . ".pdf");

        // كيـفرض التحميل: Content-Disposition: attachment
        return Storage::disk('public')->download(
            $doc->file_path,
            $downloadName,
            ['Content-Type' => 'application/pdf']
        );
    }

    public function update(Request $request, $id)
    {
        $doc = Document::findOrFail($id);

        $validated = $request->validate([
            'type' => ['sometimes', 'required', 'string', 'max:100'],
            'judgement_number' => ['nullable', 'string', 'max:100'],
            'case_number' => ['nullable', 'string', 'max:100'],
            'judge_name' => ['nullable', 'string', 'max:200'],
        ]);

        $doc->update($validated);

        return response()->json([
            'status' => 'ok',
            'document' => $doc
        ]);
    }

    public function destroy($id)
    {
        $doc = Document::findOrFail($id);

        // حذف الملف من storage
        if ($doc->file_path && Storage::disk('public')->exists($doc->file_path)) {
            Storage::disk('public')->delete($doc->file_path);
        }

        $doc->delete();

        return response()->json([
            'status' => 'ok',
            'message' => 'Document deleted'
        ]);
    }

    public function search(Request $request)
    {
        $q = (string) $request->query('q', '');

        if (trim($q) === '') {
            return response()->json([
                'status' => 'ok',
                'count' => 0,
                'data' => []
            ]);
        }

        $results = Document::query()
            ->select([
                'id',
                'type',
                'judgement_number',
                'case_number',
                'judge_name',
                'original_filename',
                'file_path',
                'extract_status',
                'created_at',
            ])
            ->where(function ($query) use ($q) {
                $query->where('content_text', 'like', '%' . $q . '%')
                      ->orWhere('judgement_number', 'like', '%' . $q . '%')
                      ->orWhere('case_number', 'like', '%' . $q . '%')
                      ->orWhere('judge_name', 'like', '%' . $q . '%');
            })
            ->latest()
            ->limit(50)
            ->get();

        return response()->json([
            'status' => 'ok',
            'count' => $results->count(),
            'data' => $results
        ]);
    }
}
