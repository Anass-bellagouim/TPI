<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CaseType;
use App\Models\Division;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CaseTypeAdminController extends Controller
{
    // GET /api/admin/case-types?division_id=&q=&active=
    public function index(Request $request)
    {
        $divisionId = $request->integer('division_id');
        $q = trim((string) $request->query('q', ''));
        $active = $request->query('active', null); // null => all

        $rows = CaseType::query()
            ->select(['id', 'division_id', 'code', 'name', 'is_active', 'sort_order', 'created_at', 'updated_at'])
            ->with(['division:id,name'])
            ->when($divisionId, fn($x) => $x->where('division_id', $divisionId))
            ->when($q !== '', function ($x) use ($q) {
                $x->where(function ($qq) use ($q) {
                    $qq->where('code', 'like', "%{$q}%")
                       ->orWhere('name', 'like', "%{$q}%");
                });
            })
            ->when($active !== null, fn($x) => $x->where('is_active', (bool) filter_var($active, FILTER_VALIDATE_BOOLEAN)))
            ->orderBy('sort_order')
            ->orderBy('code')
            ->get();

        return response()->json(['data' => $rows]);
    }

    // POST /api/admin/case-types
    public function store(Request $request)
    {
        $data = $request->validate([
            'division_id' => ['required', 'integer', 'exists:divisions,id'],
            'code' => ['required', 'string', 'regex:/^\d{4}$/'],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        // Unique code within same division
        $exists = CaseType::where('division_id', $data['division_id'])
            ->where('code', $data['code'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'هذا الرمز موجود بالفعل داخل نفس الشعبة.',
            ], 422);
        }

        $row = CaseType::create([
            'division_id' => (int) $data['division_id'],
            'code' => $data['code'],
            'name' => trim($data['name']),
            'is_active' => $data['is_active'] ?? true,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return response()->json([
            'message' => 'تمت إضافة نوع القضية بنجاح.',
            'data' => $row->load('division:id,name'),
        ], 201);
    }

    // PATCH /api/admin/case-types/{caseType}
    public function update(Request $request, CaseType $caseType)
    {
        $data = $request->validate([
            'division_id' => ['required', 'integer', 'exists:divisions,id'],
            'code' => ['required', 'string', 'regex:/^\d{4}$/'],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $exists = CaseType::where('division_id', $data['division_id'])
            ->where('code', $data['code'])
            ->where('id', '!=', $caseType->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'هذا الرمز موجود بالفعل داخل نفس الشعبة.',
            ], 422);
        }

        $caseType->update([
            'division_id' => (int) $data['division_id'],
            'code' => $data['code'],
            'name' => trim($data['name']),
            'is_active' => array_key_exists('is_active', $data) ? (bool)$data['is_active'] : $caseType->is_active,
            'sort_order' => array_key_exists('sort_order', $data) ? (int)$data['sort_order'] : $caseType->sort_order,
        ]);

        return response()->json([
            'message' => 'تم تحديث نوع القضية بنجاح.',
            'data' => $caseType->fresh()->load('division:id,name'),
        ]);
    }

    // DELETE /api/admin/case-types/{caseType}
    public function destroy(CaseType $caseType)
    {
        $caseType->delete();

        return response()->json([
            'message' => 'تم حذف نوع القضية بنجاح.',
        ]);
    }
}
