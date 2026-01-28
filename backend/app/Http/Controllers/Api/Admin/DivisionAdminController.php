<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Division;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DivisionAdminController extends Controller
{
    private function logDivisionAction(Request $request, Division $division, string $action, ?string $message = null): void
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
                'entity_type' => 'division',
                'entity_id' => $division->id,
                'message' => $message,
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }

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

        $this->logDivisionAction($request, $division, 'created', $division->name);

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

        $division->fill([
            'name' => trim($data['name']),
            'is_active' => array_key_exists('is_active', $data) ? (bool)$data['is_active'] : $division->is_active,
            'sort_order' => array_key_exists('sort_order', $data) ? (int)$data['sort_order'] : $division->sort_order,
        ]);

        $changed = $division->isDirty();
        $division->save();

        if ($changed) {
            $this->logDivisionAction($request, $division, 'updated', $division->name);
        }

        return response()->json([
            'message' => 'تم تحديث الشعبة بنجاح.',
            'data' => $division->fresh(),
        ]);
    }

    // DELETE /api/admin/divisions/{division}
    public function destroy(Request $request, Division $division)
    {
        // NOTE: If case_types are linked to this division, delete will fail due to FK restrictOnDelete.
        // Prefer disabling (is_active=false) instead of deleting.
        try {
            $division->delete();
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Unable to delete this division because it is linked to other data. Use Inactive instead.',
            ], 409);
        }

        $this->logDivisionAction($request, $division, 'deleted', $division->name);

        return response()->json([
            'message' => 'Division deleted successfully.',
        ]);
    }


}
