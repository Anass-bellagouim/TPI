<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $rangeDays = (int) $request->query('range_days', 30);
        if ($rangeDays < 7) $rangeDays = 7;
        if ($rangeDays > 180) $rangeDays = 180;

        $now = Carbon::now();
        $start = $now->copy()->subDays($rangeDays - 1)->startOfDay();
        $todayStart = $now->copy()->startOfDay();
        $monthStart = $now->copy()->startOfMonth();

        // ✅ prefer extract_status (your UI uses it), fallback to status
        $statusCol = Schema::hasColumn('documents', 'extract_status')
            ? 'extract_status'
            : (Schema::hasColumn('documents', 'status') ? 'status' : null);

        // =========================
        // KPIs
        // =========================
        $totalDocuments = Document::query()->count();

        $docsToday = Document::query()
            ->where('created_at', '>=', $todayStart)
            ->count();

        $docsMonth = Document::query()
            ->where('created_at', '>=', $monthStart)
            ->count();

        $docsByStatusKpi = null;
        if ($statusCol) {
            $rows = Document::query()
                ->select(DB::raw("$statusCol as status"), DB::raw("COUNT(*) as count"))
                ->groupBy(DB::raw("$statusCol"))
                ->orderByDesc('count')
                ->get();

            $map = [];
            foreach ($rows as $r) {
                $st = $r->status ?? 'unknown';
                $map[(string) $st] = (int) $r->count;
            }
            $docsByStatusKpi = $map;
        }

        $totalDivisions = $this->countTable('divisions');
        $totalCaseTypes = $this->countTable('case_types');
        $totalJudges = $this->countTable('judges');

        $activeUsers = $this->countUsersByActive(true);
        $inactiveUsers = $this->countUsersByActive(false);

        // =========================
        // Charts: daily counts (last N days) with zero-fill
        // =========================
        $dailyRaw = Document::query()
            ->where('created_at', '>=', $start)
            ->select(DB::raw('DATE(created_at) as d'), DB::raw('COUNT(*) as c'))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('d', 'asc')
            ->get();

        $dailyMap = [];
        foreach ($dailyRaw as $r) {
            $dailyMap[(string) $r->d] = (int) $r->c;
        }

        $dailyCounts = [];
        $cursor = $start->copy();
        for ($i = 0; $i < $rangeDays; $i++) {
            $key = $cursor->format('Y-m-d');
            $dailyCounts[] = [
                'date' => $key,
                'count' => $dailyMap[$key] ?? 0,
            ];
            $cursor->addDay();
        }

        // =========================
        // Charts: by division (Top 8) — documents.division (string)
        // =========================
        $byDivision = Document::query()
            ->select('division', DB::raw('COUNT(*) as count'))
            ->whereNotNull('division')
            ->where(DB::raw('TRIM(division)'), '!=', '')
            ->groupBy('division')
            ->orderByDesc('count')
            ->limit(8)
            ->get()
            ->map(fn ($r) => [
                'division' => $r->division,
                'count' => (int) $r->count,
            ])
            ->toArray();

        // =========================
        // Charts: by case type code (Top 10) — documents.keyword
        // join case_types.code to get name (optional)
        // =========================
        $byCaseType = [];
        if (Schema::hasTable('case_types') && Schema::hasColumn('case_types', 'code')) {
            $byCaseType = DB::table('documents')
                ->leftJoin('case_types', 'case_types.code', '=', 'documents.keyword')
                ->select(
                    DB::raw('documents.keyword as code'),
                    DB::raw('MAX(case_types.name) as name'),
                    DB::raw('COUNT(*) as count')
                )
                ->whereNotNull('documents.keyword')
                ->where(DB::raw('TRIM(documents.keyword)'), '!=', '')
                ->groupBy(DB::raw('documents.keyword'))
                ->orderByDesc('count')
                ->limit(10)
                ->get()
                ->map(function ($r) {
                    return [
                        'code' => $r->code,
                        'name' => $r->name ?: null,
                        'count' => (int) $r->count,
                    ];
                })
                ->toArray();
        } else {
            $byCaseType = Document::query()
                ->select(DB::raw('keyword as code'), DB::raw('COUNT(*) as count'))
                ->whereNotNull('keyword')
                ->where(DB::raw('TRIM(keyword)'), '!=', '')
                ->groupBy(DB::raw('keyword'))
                ->orderByDesc('count')
                ->limit(10)
                ->get()
                ->map(fn ($r) => [
                    'code' => $r->code,
                    'name' => null,
                    'count' => (int) $r->count,
                ])
                ->toArray();
        }

        // =========================
        // Charts: by status
        // =========================
        $byStatus = [];
        if ($statusCol) {
            $byStatus = Document::query()
                ->select(DB::raw("$statusCol as status"), DB::raw('COUNT(*) as count'))
                ->groupBy(DB::raw("$statusCol"))
                ->orderByDesc('count')
                ->get()
                ->map(fn ($r) => [
                    'status' => $r->status ?? 'unknown',
                    'count' => (int) $r->count,
                ])
                ->toArray();
        }

        // =========================
        // Optional: processing time (Done) avg minutes/day
        // =========================
        $processingTime = [];
        if ($statusCol) {
            $rows = Document::query()
                ->where('created_at', '>=', $start)
                ->whereNotNull('updated_at')
                ->whereRaw("LOWER($statusCol) = ?", ['done'])
                ->select(
                    DB::raw('DATE(created_at) as d'),
                    DB::raw('AVG(TIMESTAMPDIFF(SECOND, created_at, updated_at)) as avg_seconds')
                )
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('d', 'asc')
                ->get();

            foreach ($rows as $r) {
                $sec = (float) ($r->avg_seconds ?? 0);
                $processingTime[] = [
                    'date' => (string) $r->d,
                    'avg_minutes' => $sec > 0 ? round($sec / 60, 2) : 0,
                ];
            }
        }

        // =========================
        // Latest uploads (10)
        // =========================
        $latestDocs = Document::query()
            ->select([
                'id',
                'division',
                'type',
                'keyword',
                'case_number',
                'judgement_number',
                'judge_name',
                'status',
                'extract_status',
                'original_filename',
                'file_path',
                'created_at',
                'updated_at',
            ])
            ->orderByDesc('id')
            ->limit(10)
            ->get();

        $latest = $latestDocs->map(function ($d) {
            $typeName = trim((string) ($d->type ?? ''));
            $code = trim((string) ($d->keyword ?? ''));

            $typeOrKeyword = null;
            if ($typeName !== '' && $code !== '') $typeOrKeyword = $typeName . " (" . $code . ")";
            elseif ($typeName !== '') $typeOrKeyword = $typeName;
            elseif ($code !== '') $typeOrKeyword = $code;

            // status: prefer extract_status
            $st = null;
            if (Schema::hasColumn('documents', 'extract_status')) $st = $d->extract_status;
            elseif (Schema::hasColumn('documents', 'status')) $st = $d->status;

            $hasFile = (string) ($d->file_path ?? '') !== '';

            return [
                'id' => $d->id,
                'division' => $d->division,
                'type_or_keyword' => $typeOrKeyword,
                'type' => $d->type,
                'keyword' => $d->keyword,
                'case_number' => $d->case_number,
                'judgement_number' => $d->judgement_number,
                'judge_name' => $d->judge_name,
                'status' => $st,
                'created_at' => $d->created_at,
                'updated_at' => $d->updated_at,
                'has_file' => $hasFile,
                'download_url' => url("/api/documents/{$d->id}/download"),
            ];
        })->toArray();

        $payload = [
            'kpis' => [
                'total_documents' => $totalDocuments,
                'documents_today' => $docsToday,
                'documents_month' => $docsMonth,

                'total_divisions' => $totalDivisions,
                'total_case_types' => $totalCaseTypes,
                'total_judges' => $totalJudges,

                'active_users' => $activeUsers,
                'inactive_users' => $inactiveUsers,
            ],
            'charts' => [
                'daily_counts' => $dailyCounts,
                'by_division' => $byDivision,
                'by_case_type' => $byCaseType,
                'by_status' => $byStatus,
                'processing_time' => $processingTime,
            ],
            'latest' => $latest,
            'meta' => [
                'range_days' => $rangeDays,
            ],
        ];

        if ($docsByStatusKpi !== null) {
            $payload['kpis']['documents_by_status'] = $docsByStatusKpi;
        }

        return response()->json($payload);
    }

    private function countTable(string $table): int
    {
        try {
            if (!Schema::hasTable($table)) return 0;
            return (int) DB::table($table)->count();
        } catch (\Throwable $e) {
            return 0;
        }
    }

    private function countUsersByActive(bool $active): int
    {
        try {
            if (!Schema::hasTable('users')) return 0;
            if (!Schema::hasColumn('users', 'is_active')) return 0;
            return (int) DB::table('users')->where('is_active', $active ? 1 : 0)->count();
        } catch (\Throwable $e) {
            return 0;
        }
    }
}
