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

        // تقدر تزيد filter role إذا بغيتي:
        // if ($request->filled('role')) $q->where('role', $request->query('role'));

        $page = $q->orderByDesc('id')->paginate(20);

        // باش نضمن full_name و is_active واضحين
        $page->getCollection()->transform(function (User $u) {
            return [
                'id' => $u->id,
                'full_name' => $u->name ?? trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? '')),
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
            'email'      => ['required', 'email', 'max:255', 'unique:users,email'],
            'role'       => ['required', Rule::in(['admin', 'user'])],
            'password'   => ['required', 'string', 'min:6', 'confirmed'],
            'is_active'  => ['sometimes', 'boolean'],
        ]);

        $u = new User();
        $u->first_name = $data['first_name'];
        $u->last_name  = $data['last_name'];
        $u->name       = trim($data['first_name'] . ' ' . $data['last_name']); // ✅ مهم
        $u->username   = $data['username'];
        $u->email      = $data['email'];
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
            'full_name' => $user->name ?? trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')),
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
            'email'      => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role'       => ['sometimes', Rule::in(['admin', 'user'])],
            'is_active'  => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('first_name', $data)) $user->first_name = $data['first_name'];
        if (array_key_exists('last_name', $data))  $user->last_name  = $data['last_name'];
        if (array_key_exists('username', $data))   $user->username   = $data['username'];
        if (array_key_exists('email', $data))      $user->email      = $data['email'];
        if (array_key_exists('role', $data))       $user->role       = $data['role'];
        if (array_key_exists('is_active', $data))  $user->is_active  = (bool) $data['is_active'];

        // ✅ keep "name" consistent
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

    // PATCH /api/employees/{user}/password (reset + revoke tokens)
    public function resetPassword(Request $request, User $user)
    {
        $data = $request->validate([
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $user->password = Hash::make($data['password']);
        $user->save();

        // revoke all tokens
        $user->tokens()->delete();

        return response()->json([
            'message' => 'تم تغيير كلمة المرور وسحب التوكنز القديمة',
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
        // revoke tokens
        $user->tokens()->delete();

        $user->delete();

        return response()->json(['message' => 'تم حذف الموظف بنجاح']);
    }
}

// Helper صغيرة باش ما نكرّروش trim (اختياري)
if (!function_exists('remind_full_name')) {
    function remind_full_name(User $u): string
    {
        return trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''));
    }
}
