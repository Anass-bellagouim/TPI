<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'identifier' => ['required', 'string'],
            'password'   => ['required', 'string'],
        ]);

        $user = User::where('email', $data['identifier'])
            ->orWhere('username', $data['identifier'])
            ->first();

        // Invalid credentials
        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'بيانات الدخول غير صحيحة'], 422);
        }

        // ✅ Block login if account is disabled
        // If column doesn't exist yet in DB, this will be null — treat null as active
        if (isset($user->is_active) && !$user->is_active) {
            return response()->json([
                'message' => 'هذا الحساب موقوف مؤقتاً. المرجو الاتصال بالإدارة.'
            ], 403);
        }

        $token = $user->createToken('web')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => (bool) ($user->is_active ?? true),
            ],
        ]);
    }

    public function me(Request $request)
    {
        $u = $request->user();

        return response()->json([
            'id' => $u->id,
            'full_name' => $u->full_name,
            'username' => $u->username,
            'email' => $u->email,
            'role' => $u->role,
            'is_active' => (bool) ($u->is_active ?? true),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'تم تسجيل الخروج']);
    }
}
