<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class PasswordResetController extends Controller
{
    /**
     * POST /api/auth/forgot-password
     * body: { email }
     * ✅ ADMIN ONLY
     */
    public function forgot(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ], [
            'email.required' => 'البريد الإلكتروني مطلوب.',
            'email.email' => 'صيغة البريد الإلكتروني غير صحيحة.',
        ]);

        $email = trim((string) $data['email']);

        $user = User::where('email', $email)->first();

        // 🔒 غير admin
        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'استرجاع كلمة المرور عبر البريد الإلكتروني غير متاح للموظفين. المرجو التواصل مع الإدارة.'
            ], 403);
        }

        $status = Password::sendResetLink(['email' => $email]);

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريد الإدارة.'
            ]);
        }

        // ✅ throttle
        if ($status === Password::RESET_THROTTLED) {
            return response()->json([
                'message' => 'المرجو الانتظار قبل إعادة المحاولة.'
            ], 429);
        }

        return response()->json([
            'message' => __($status),
        ], 422);
    }

    /**
     * POST /api/auth/reset-password
     * body: { token, email, password, password_confirmation }
     * ✅ ADMIN ONLY
     */
    public function reset(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ], [
            'token.required' => 'Token مطلوب.',
            'email.required' => 'البريد الإلكتروني مطلوب.',
            'password.required' => 'كلمة المرور مطلوبة.',
            'password.confirmed' => 'تأكيد كلمة المرور غير مطابق.',
        ]);

        $email = trim((string) $data['email']);

        $user = User::where('email', $email)->first();

        // 🔒 reset غير admin
        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'إعادة تعيين كلمة المرور عبر البريد الإلكتروني متاحة للإدارة فقط.'
            ], 403);
        }

        $status = Password::reset(
            [
                'email' => $email,
                'token' => $data['token'],
                'password' => $data['password'],
                'password_confirmation' => $request->input('password_confirmation'),
            ],
            function ($user) use ($data) {
                $user->forceFill([
                    'password' => Hash::make($data['password']),
                    'remember_token' => Str::random(60),
                ])->save();

                // ✅ revoke Sanctum tokens (أفضل أمنياً)
                if (method_exists($user, 'tokens')) {
                    $user->tokens()->delete();
                }
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'تم تغيير كلمة المرور بنجاح.'
            ]);
        }

        return response()->json([
            'message' => __($status),
        ], 422);
    }
}
