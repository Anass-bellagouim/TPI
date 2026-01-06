<?php

namespace App\Jobs;

use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Spatie\PdfToText\Pdf;
use thiagoalessio\TesseractOCR\TesseractOCR;

class ExtractDocumentTextJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $documentId) {}

    public function handle(): void
    {
        $doc = Document::find($this->documentId);
        if (!$doc) {
            return;
        }

        $doc->update([
            'extract_status' => 'processing',
            'extract_error' => null,
        ]);

        try {
            $pdfPath = storage_path("app/public/{$doc->file_path}");
            if (!file_exists($pdfPath)) {
                throw new \Exception("File not found: {$pdfPath}");
            }

            // ✅ Poppler binaries
            $pdftotextPath = 'C:\\poppler\\Library\\bin\\pdftotext.exe';
            $pdftoppmPath  = 'C:\\poppler\\Library\\bin\\pdftoppm.exe';

            if (!file_exists($pdftotextPath)) {
                throw new \Exception("pdftotext not found at: {$pdftotextPath}");
            }
            if (!file_exists($pdftoppmPath)) {
                throw new \Exception("pdftoppm not found at: {$pdftoppmPath}");
            }

            // 1) Try extracting text directly (text-based PDFs)
            $text = Pdf::getText($pdfPath, $pdftotextPath);
            $text = trim(preg_replace('/\s+/', ' ', $text));

            // 2) Fallback to OCR if empty (scanned PDFs)
            if ($text === '') {
                $text = $this->ocrPdf($pdfPath, $pdftoppmPath);
                $text = trim(preg_replace('/\s+/', ' ', $text));

                if ($text === '') {
                    throw new \Exception('OCR produced empty text. Check Tesseract install & languages (ara/fra).');
                }
            }

            $doc->update([
                'content_text' => $text,
                'extract_status' => 'done',
            ]);
        } catch (\Throwable $e) {
            $doc->update([
                'extract_status' => 'failed',
                'content_text' => null,
                'extract_error' => $e->getMessage(),
            ]);
        }
    }

    private function ocrPdf(string $pdfPath, string $pdftoppmPath): string
    {
        $tmpDir = storage_path('app/tmp_ocr_' . uniqid());
        if (!is_dir($tmpDir)) {
            mkdir($tmpDir, 0777, true);
        }

        $prefix = $tmpDir . DIRECTORY_SEPARATOR . 'page';

        // Convert PDF pages -> PNG images
        $cmd = "\"{$pdftoppmPath}\" -png -r 300 \"{$pdfPath}\" \"{$prefix}\"";
        exec($cmd, $out, $code);

        if ($code !== 0) {
            throw new \Exception("pdftoppm failed with code {$code}");
        }

        $images = glob($tmpDir . DIRECTORY_SEPARATOR . 'page-*.png');
        if (!$images) {
            throw new \Exception("No images generated for OCR (pdftoppm).");
        }

        $allText = '';

        foreach ($images as $img) {
            $pageText = (new TesseractOCR($img))
                ->lang('ara', 'fra', 'eng')
                ->run();

            $allText .= "\n" . $pageText;
        }

        // cleanup
        foreach ($images as $img) {
            @unlink($img);
        }
        @rmdir($tmpDir);

        return $allText;
    }
}
