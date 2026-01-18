<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * POST /api/auth/login
     * body: { identifier, password }
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'identifier' => ['required', 'string'],
            'password'   => ['required', 'string'],
        ]);

        $identifier = trim((string) $data['identifier']);

        $user = User::where('username', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        // ✅ Invalid credentials -> 401
        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'بيانات الدخول غير صحيحة'], 401);
        }

        // ✅ Block login if disabled
        if (($user->is_active ?? true) === false) {
            return response()->json([
                'message' => 'هذا الحساب موقوف مؤقتاً. المرجو الاتصال بالإدارة.'
            ], 403);
        }

        // ✅ create sanctum token
        $token = $user->createToken('web')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id'         => $user->id,
                'first_name' => $user->first_name,
                'last_name'  => $user->last_name,
                'username'   => $user->username,
                'email'      => $user->email,
                'role'       => $user->role,
                'is_active'  => (bool) ($user->is_active ?? true),
            ],
        ]);
    }

    /**
     * POST /api/auth/forgot-password/check (PUBLIC)
     * body: { identifier }
     *
     * ✅ الهدف:
     * - إذا role=user => يرجع غير role (ما يرجعش email)
     * - إذا role=admin => يرجع role + email
     * - إذا ما كاينش => exists=false
     */
    public function forgotPasswordCheck(Request $request)
    {
        $data = $request->validate([
            'identifier' => ['required', 'string'],
        ]);

        $identifier = trim((string) $data['identifier']);

        $user = User::where('username', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        if (!$user) {
            return response()->json(['exists' => false]);
        }

        // 👤 USER: ما نرجعوش email نهائياً
        if ($user->role === 'user') {
            return response()->json([
                'exists' => true,
                'role'   => 'user',
            ]);
        }

        // 👑 ADMIN: نرجعو email باش يبان الفورم
        return response()->json([
            'exists' => true,
            'role'   => 'admin',
            'email'  => $user->email,
        ]);
    }

    /**
     * GET /api/auth/me (auth:sanctum)
     */
    public function me(Request $request)
    {
        $u = $request->user();

        return response()->json([
            'id'         => $u->id,
            'first_name' => $u->first_name,
            'last_name'  => $u->last_name,
            'username'   => $u->username,
            'email'      => $u->email,
            'role'       => $u->role,
            'is_active'  => (bool) ($u->is_active ?? true),
        ]);
    }

    /**
     * POST /api/auth/logout (auth:sanctum)
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'تم تسجيل الخروج'
        ]);
    }

    /**
     * PATCH /api/auth/change-password (auth:sanctum)
     * body: { current_password, password, password_confirmation }
     */
    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password'         => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $user = $request->user();

        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'message' => 'كلمة المرور الحالية غير صحيحة'
            ], 422);
        }

        $user->password = Hash::make($data['password']);
        $user->save();

        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => 'تم تغيير كلمة المرور بنجاح'
        ]);
    }
}
