<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    // GET /api/employees?search=
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));

        $q = User::query();

        if ($search !== '') {
            $q->where(function ($qq) use ($search) {
                $qq->where('first_name', 'like', "%{$search}%")
                   ->orWhere('last_name', 'like', "%{$search}%")
                   ->orWhere('name', 'like', "%{$search}%")
                   ->orWhere('username', 'like', "%{$search}%")
                   ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $page = $q->orderByDesc('id')->paginate(20);

        $page->getCollection()->transform(function (User $u) {
            return [
                'id' => $u->id,
                'full_name' => $u->name ?? remind_full_name($u),
                'first_name' => $u->first_name,
                'last_name' => $u->last_name,
                'username' => $u->username,
                'email' => $u->email,
                'role' => $u->role,
                'is_active' => (bool) ($u->is_active ?? true),
            ];
        });

        return response()->json($page);
    }

    // POST /api/employees
    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name'  => ['required', 'string', 'max:255'],
            'username'   => ['required', 'string', 'max:255', 'unique:users,username'],

            // ✅ email nullable globally, لكن admin لازم
            'email'      => ['nullable', 'email', 'max:255', 'unique:users,email'],

            'role'       => ['required', Rule::in(['admin', 'user'])],

            // ✅ مهم: نخلي password OPTIONAL هنا
            // - admin: إذا بغيتيه required، كنفرضه تحت (منطق)
            // - user: default 123456
            'password'   => ['nullable', 'string', 'min:6', 'confirmed'],

            'is_active'  => ['sometimes', 'boolean'],
        ]);

        // ✅ rules:
        // admin لازم email + (اختياري لكن مستحسن) لازم password
        if (($data['role'] ?? null) === 'admin') {
            if (empty($data['email'])) {
                return response()->json(['message' => 'Email إجباري للـ admin.'], 422);
            }
            if (empty($data['password'])) {
                return response()->json(['message' => 'كلمة المرور إجباريّة للـ admin.'], 422);
            }
        }

        // user: ما عندوش email + password default 123456 (إلا ما تعطاتش)
        if (($data['role'] ?? null) === 'user') {
            $data['email'] = null;
            if (empty($data['password'])) {
                $data['password'] = '123456';
            }
        }

        $u = new User();
        $u->first_name = $data['first_name'];
        $u->last_name  = $data['last_name'];
        $u->name       = trim($data['first_name'] . ' ' . $data['last_name']);
        $u->username   = $data['username'];
        $u->email      = $data['email'] ?? null;
        $u->role       = $data['role'];
        $u->password   = Hash::make($data['password']);
        $u->is_active  = $data['is_active'] ?? true;
        $u->save();

        return response()->json([
            'message' => 'تم إنشاء الموظف بنجاح',
            'data' => [
                'id' => $u->id,
                'full_name' => $u->name,
                'first_name' => $u->first_name,
                'last_name' => $u->last_name,
                'username' => $u->username,
                'email' => $u->email,
                'role' => $u->role,
                'is_active' => (bool) $u->is_active,
            ],
        ], 201);
    }

    // GET /api/employees/{user}
    public function show(User $user)
    {
        return response()->json([
            'id' => $user->id,
            'full_name' => $user->name ?? remind_full_name($user),
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => (bool) ($user->is_active ?? true),
        ]);
    }

    // PATCH /api/employees/{user}
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name'  => ['sometimes', 'string', 'max:255'],
            'username'   => ['sometimes', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'email'      => ['sometimes', 'nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role'       => ['sometimes', Rule::in(['admin', 'user'])],
            'is_active'  => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('first_name', $data)) $user->first_name = $data['first_name'];
        if (array_key_exists('last_name', $data))  $user->last_name  = $data['last_name'];
        if (array_key_exists('username', $data))   $user->username   = $data['username'];

        // role update
        if (array_key_exists('role', $data)) {
            $user->role = $data['role'];
        }

        /**
         * ✅ email rules:
         * - إذا role=admin => email لازم يكون موجود
         * - إذا role=user  => email = null دائماً
         */
        if (($user->role ?? null) === 'user') {
            // user ما كياخدش email نهائياً
            $user->email = null;
        } else {
            // admin: إذا تصيفط email كنحدثوه، وإذا ما تصيفطش كنخليه كيفما هو
            if (array_key_exists('email', $data)) {
                if (empty($data['email'])) {
                    return response()->json(['message' => 'Email إجباري للـ admin.'], 422);
                }
                $user->email = $data['email'];
            }

            // ✅ مهم: إلا تبدّل role ل admin وما عندوش email أصلاً => نرفض
            if (empty($user->email)) {
                return response()->json(['message' => 'Email إجباري للـ admin.'], 422);
            }
        }

        if (array_key_exists('is_active', $data)) $user->is_active = (bool) $data['is_active'];

        // keep name consistent
        $user->name = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));

        $user->save();

        return response()->json([
            'message' => 'تم تحديث الموظف بنجاح',
            'data' => [
                'id' => $user->id,
                'full_name' => $user->name,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => (bool) ($user->is_active ?? true),
            ],
        ]);
    }

    /**
     * PATCH /api/employees/{user}/password
     * ✅ Reset default password = "123456" + revoke tokens
     * IMPORTANT: ما كنقبلو حتى password من client
     */
    public function resetPassword(Request $request, User $user)
    {
        // اختياري: ما تخليش reset على admin من هنا
        if ($user->role === 'admin') {
            return response()->json([
                'message' => 'لا يمكن إعادة تعيين كلمة مرور admin من هنا.',
            ], 403);
        }

        $defaultPassword = '123456';

        $user->password = Hash::make($defaultPassword);
        $user->save();

        // revoke all tokens
        $user->tokens()->delete();

        return response()->json([
            'message' => 'تمت إعادة تعيين كلمة المرور إلى 123456 وتم سحب التوكنز القديمة.',
        ]);
    }

    // PATCH /api/employees/{user}/toggle-active
    public function toggleActive(User $user)
    {
        // اختياري: ما تخليش admin يتوقف
        if ($user->role === 'admin') {
            return response()->json([
                'message' => 'لا يمكن توقيف حساب admin.',
            ], 403);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        // revoke tokens immediately
        $user->tokens()->delete();

        return response()->json([
            'message' => $user->is_active ? 'تم تفعيل الحساب بنجاح.' : 'تم توقيف الحساب بنجاح.',
            'data' => [
                'id' => $user->id,
                'full_name' => $user->name ?? remind_full_name($user),
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => (bool) $user->is_active,
            ],
        ]);
    }

    // DELETE /api/employees/{user}
    public function destroy(User $user)
    {
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'تم حذف الموظف بنجاح']);
    }
}

/**
 * Helper صغيرة باش ما نكرّروش trim
 */
if (!function_exists('remind_full_name')) {
    function remind_full_name(User $u): string
    {
        return trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''));
    }
}
