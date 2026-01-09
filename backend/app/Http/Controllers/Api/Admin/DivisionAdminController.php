<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Division;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DivisionAdminController extends Controller
{
    // GET /api/admin/divisions
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));

        $rows = Division::query()
            ->select(['id', 'name', 'is_active', 'sort_order', 'created_at', 'updated_at'])
            ->when($q !== '', fn($x) => $x->where('name', 'like', "%{$q}%"))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $rows,
        ]);
    }

    // POST /api/admin/divisions
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:divisions,name'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $division = Division::create([
            'name' => trim($data['name']),
            'is_active' => $data['is_active'] ?? true,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return response()->json([
            'message' => 'تمت إضافة الشعبة بنجاح.',
            'data' => $division,
        ], 201);
    }

    // PATCH /api/admin/divisions/{division}
    public function update(Request $request, Division $division)
    {
        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('divisions', 'name')->ignore($division->id),
            ],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $division->update([
            'name' => trim($data['name']),
            'is_active' => array_key_exists('is_active', $data) ? (bool)$data['is_active'] : $division->is_active,
            'sort_order' => array_key_exists('sort_order', $data) ? (int)$data['sort_order'] : $division->sort_order,
        ]);

        return response()->json([
            'message' => 'تم تحديث الشعبة بنجاح.',
            'data' => $division->fresh(),
        ]);
    }

    // DELETE /api/admin/divisions/{division}
    public function destroy(Division $division)
    {
        // ⚠️ إذا كان عندك case_types مرتبطة بهاد division، delete غادي يفشل بسبب FK restrictOnDelete
        // الأفضل: تمنع الحذف وتستعمل "تعطيل" is_active=false
        try {
            $division->delete();
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'لا يمكن حذف هذه الشعبة لأنها مرتبطة ببيانات أخرى. استعمل تعطيل (Inactive) بدل الحذف.',
            ], 409);
        }

        return response()->json([
            'message' => 'تم حذف الشعبة بنجاح.',
        ]);
    }
}
