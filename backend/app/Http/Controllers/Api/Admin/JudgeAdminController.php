<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Judge;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class JudgeAdminController extends Controller
{
    private function logJudgeAction(Request $request, Judge $judge, string $action, ?string $message = null): void
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
                'entity_type' => 'judge',
                'entity_id' => $judge->id,
                'message' => $message,
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    // GET /api/admin/judges?q=&active=
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $active = $request->query('active', null); // null | 0 | 1

        $query = Judge::query()
            ->select(['id', 'full_name', 'is_active', 'sort_order', 'created_at', 'updated_at'])
            ->when($active !== null, fn($x) => $x->where('is_active', (bool) $active))
            ->when($q !== '', fn($x) => $x->where('full_name', 'like', "%{$q}%"))
            ->orderBy('sort_order')
            ->orderBy('full_name');

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    // POST /api/admin/judges
    public function store(Request $request)
    {
        $data = $request->validate([
            'full_name'  => ['required', 'string', 'max:255', 'unique:judges,full_name'],
            'is_active'  => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $judge = Judge::create([
            'full_name'  => $data['full_name'],
            'is_active'  => $data['is_active'] ?? true,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        $this->logJudgeAction($request, $judge, 'created', $judge->full_name);

        return response()->json([
            'message' => 'تمت إضافة القاضي.',
            'data' => $judge,
        ], 201);
    }

    // PATCH /api/admin/judges/{judge}
    public function update(Request $request, Judge $judge)
    {
        $data = $request->validate([
            'full_name'  => [
                'required',
                'string',
                'max:255',
                Rule::unique('judges', 'full_name')->ignore($judge->id),
            ],
            'is_active'  => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $judge->fill([
            'full_name'  => $data['full_name'],
            'is_active'  => $data['is_active'] ?? $judge->is_active,
            'sort_order' => $data['sort_order'] ?? $judge->sort_order,
        ]);

        $changed = $judge->isDirty();
        $judge->save();

        if ($changed) {
            $this->logJudgeAction($request, $judge, 'updated', $judge->full_name);
        }

        return response()->json([
            'message' => 'تم تحديث القاضي.',
            'data' => $judge->fresh(),
        ]);
    }

    // DELETE /api/admin/judges/{judge}
    public function destroy(Request $request, Judge $judge)
    {
        $judge->delete();

        $this->logJudgeAction($request, $judge, 'deleted', $judge->full_name);

        return response()->json([
            'message' => 'تم حذف القاضي.',
        ]);
    }
}
