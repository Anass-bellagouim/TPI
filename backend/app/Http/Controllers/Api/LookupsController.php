<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CaseType;
use App\Models\Division;
use App\Models\Judge;
use Illuminate\Http\Request;

class LookupsController extends Controller
{
    public function divisions(Request $request)
    {
        $onlyActive = $request->boolean('active', true);

        $rows = Division::query()
            ->select(['id', 'name', 'is_active', 'sort_order'])
            ->when($onlyActive, fn ($x) => $x->where('is_active', true))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $rows,
            'meta' => ['count' => $rows->count()],
        ]);
    }

    // GET /api/lookups/case-types?division_id=1&q=2101&active=1
    public function caseTypes(Request $request)
    {
        $onlyActive = $request->boolean('active', true);
        $divisionId = $request->integer('division_id') ?: null;
        $search = trim((string) $request->query('q', ''));

        $rows = CaseType::query()
            ->select(['id', 'division_id', 'code', 'name', 'is_active', 'sort_order'])
            ->with(['division:id,name'])
            ->when($onlyActive, fn ($x) => $x->where('is_active', true))
            ->when($divisionId, fn ($x) => $x->where('division_id', $divisionId))
            ->when($search !== '', function ($x) use ($search) {
                $x->where(function ($qq) use ($search) {
                    $qq->where('code', 'like', "%{$search}%")
                       ->orWhere('name', 'like', "%{$search}%");
                });
            })
            ->orderBy('sort_order')
            ->orderBy('code')
            ->limit(200)
            ->get();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'count' => $rows->count(),
                'division_id' => $divisionId,
                'q' => $search,
                'active' => $onlyActive,
            ],
        ]);
    }

    // GET /api/lookups/judges?q=محمد&active=1
    public function judges(Request $request)
    {
        $onlyActive = $request->boolean('active', true);
        $search = trim((string) $request->query('q', ''));

        $rows = Judge::query()
            ->select(['id', 'full_name', 'is_active', 'sort_order'])
            ->when($onlyActive, fn ($x) => $x->where('is_active', true))
            ->when($search !== '', fn ($x) => $x->where('full_name', 'like', "%{$search}%"))
            ->orderBy('sort_order')
            ->orderBy('full_name')
            ->limit(50)
            ->get();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'count' => $rows->count(),
                'q' => $search,
                'active' => $onlyActive,
            ],
        ]);
    }
}
