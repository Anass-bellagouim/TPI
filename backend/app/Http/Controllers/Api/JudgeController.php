<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JudgeController extends Controller
{
    public function index(Request $request)
    {
        // أسماء من جدول judges
        $fromJudges = DB::table('judges')
            ->whereNotNull('name')
            ->where('name', '!=', '')
            ->pluck('name');

        // أسماء من documents
        $fromDocs = DB::table('documents')
            ->whereNotNull('judge_name')
            ->where('judge_name', '!=', '')
            ->distinct()
            ->pluck('judge_name');

        $names = $fromJudges
            ->merge($fromDocs)
            ->map(fn ($n) => trim((string)$n))
            ->filter(fn ($n) => $n !== '')
            ->unique()
            ->sort()
            ->values();

        return response()->json(['data' => $names]);
    }
}
