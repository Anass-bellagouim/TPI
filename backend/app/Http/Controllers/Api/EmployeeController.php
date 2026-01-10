<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    // GET /api/admin/employees?search=&per_page=
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));

        // ✅ per_page from query (allowed values only)
        $perPage = (int) $request->query('per_page', 10);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $q = User::query()
            // ✅ select only existing columns
            ->select([
                'id',
                'first_name',
                'last_name',
                'username',
                'email',
                'role',
                'is_active',
            ]);

        if ($search !== '') {
            $q->where(function ($qq) use ($search) {
                $qq->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $page = $q->orderByDesc('id')->paginate($perPage);

        $page->getCollection()->transform(function (User $u) {
            return $this->shapeUser($u);
        });

        return response()->json($page);
    }

    // POST /api/admin/employees
    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name'  => ['required', 'string', 'max:255'],
            'username'   => ['required', 'string', 'max:255', 'unique:users,username'],

            // email nullable عامة
            'email'      => ['nullable', 'email', 'max:255', 'unique:users,email'],

            'role'       => ['required', Rule::in(['admin', 'user'])],

            // password nullable هنا (غادي نفرضه حسب role)
            'password'   => ['nullable', 'string', 'min:6', 'confirmed'],

            'is_active'  => ['sometimes', 'boolean'],
        ]);

        // rules by role
        if (($data['role'] ?? null) === 'admin') {
            if (empty($data['email'])) {
                return response()->json(['message' => 'Email إجباري للـ admin.'], 422);
            }
            if (empty($data['password'])) {
                return response()->json(['message' => 'كلمة المرور إجباريّة للـ admin.'], 422);
            }
        }

        if (($data['role'] ?? null) === 'user') {
            // user: بلا email
            $data['email'] = null;

            // default password إذا ما تعطاتش
            if (empty($data['password'])) {
                $data['password'] = '123456';
            }
        }

        $u = new User();
        $u->first_name = $data['first_name'];
        $u->last_name  = $data['last_name'];
        $u->username   = $data['username'];
        $u->email      = $data['email'] ?? null;
        $u->role       = $data['role'];
        $u->password   = Hash::make($data['password']);
        $u->is_active  = array_key_exists('is_active', $data) ? (bool)$data['is_active'] : true;
        $u->save();

        return response()->json([
            'message' => 'تم إنشاء الموظف بنجاح',
            'data' => $this->shapeUser($u),
        ], 201);
    }

    // GET /api/admin/employees/{user}
    public function show(User $user)
    {
        return response()->json([
            'data' => $this->shapeUser($user),
        ]);
    }

    // PATCH /api/admin/employees/{user}
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
         * email rules:
         * - user => null دائماً
         * - admin => email لازم
         */
        if (($user->role ?? null) === 'user') {
            $user->email = null;
        } else {
            // admin: إذا جا email فـ request
            if (array_key_exists('email', $data)) {
                if (empty($data['email'])) {
                    return response()->json(['message' => 'Email إجباري للـ admin.'], 422);
                }
                $user->email = $data['email'];
            }

            // إذا تبدل role ل admin وما عندوش email أصلاً
            if (empty($user->email)) {
                return response()->json(['message' => 'Email إجباري للـ admin.'], 422);
            }
        }

        if (array_key_exists('is_active', $data)) $user->is_active = (bool) $data['is_active'];

        $user->save();

        return response()->json([
            'message' => 'تم تحديث الموظف بنجاح',
            'data' => $this->shapeUser($user),
        ]);
    }

    /**
     * PATCH /api/admin/employees/{user}/password
     * Reset default password = 123456 + revoke tokens
     */
    public function resetPassword(Request $request, User $user)
    {
        if ($user->role === 'admin') {
            return response()->json([
                'message' => 'لا يمكن إعادة تعيين كلمة مرور admin من هنا.',
            ], 403);
        }

        $user->password = Hash::make('123456');
        $user->save();

        // revoke tokens (Sanctum)
        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => 'تمت إعادة تعيين كلمة المرور إلى 123456 وتم سحب التوكنز القديمة.',
        ]);
    }

    // PATCH /api/admin/employees/{user}/toggle-active
    public function toggleActive(User $user)
    {
        if ($user->role === 'admin') {
            return response()->json([
                'message' => 'لا يمكن توقيف حساب admin.',
            ], 403);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => $user->is_active ? 'تم تفعيل الحساب بنجاح.' : 'تم توقيف الحساب بنجاح.',
            'data' => $this->shapeUser($user),
        ]);
    }

    // DELETE /api/admin/employees/{user}
    public function destroy(User $user)
    {
        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        $user->delete();

        return response()->json(['message' => 'تم حذف الموظف بنجاح']);
    }

    /**
     * ✅ Formatter واحد للـ API
     */
    private function shapeUser(User $u): array
    {
        return [
            'id' => $u->id,
            'full_name' => $this->fullName($u),
            'first_name' => $u->first_name,
            'last_name' => $u->last_name,
            'username' => $u->username,
            'email' => $u->email,
            'role' => $u->role,
            'is_active' => (bool) ($u->is_active ?? true),
        ];
    }

    private function fullName(User $u): string
    {
        return trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''));
    }
}
