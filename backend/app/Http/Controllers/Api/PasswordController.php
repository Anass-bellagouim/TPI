<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use App\Models\Employee;

class PasswordController extends Controller
{
    /**
     * POST /api/auth/forgot-password
     * body: { "email": "admin@gmail.com" }
     * ✅ ADMIN ONLY (التحقق داخل controller)
     */
    public function forgot(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = trim((string) $request->email);

        $user = Employee::where('email', $email)->first();

        // 🔒 فقط admin يقدر يستعمل الإيميل reset
        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'استرجاع كلمة المرور عبر البريد الإلكتروني متاح للإدارة فقط. المرجو التواصل مع الإدارة.'
            ], 403);
        }

        $status = Password::sendResetLink(['email' => $email]);

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
            ]);
        }

        // throttle / other errors
        $code = ($status === Password::RESET_THROTTLED) ? 429 : 422;

        return response()->json([
            'message' => __($status),
        ], $code);
    }

    /**
     * POST /api/auth/reset-password
     * body: { token, email, password, password_confirmation }
     * ✅ ADMIN ONLY (يتأكد من email ديال admin)
     */
    public function reset(Request $request)
    {
        $request->validate([
            'token'    => ['required', 'string'],
            'email'    => ['required', 'email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $email = trim((string) $request->email);

        $user = Employee::where('email', $email)->first();

        // 🔒 فقط admin
        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'إعادة تعيين كلمة المرور عبر البريد الإلكتروني متاحة للإدارة فقط.'
            ], 403);
        }

        $status = Password::reset(
            [
                'email'                 => $email,
                'password'              => $request->password,
                'password_confirmation' => $request->password_confirmation,
                'token'                 => $request->token,
            ],
            function ($user) use ($request) {
                $user->forceFill([
                    'password' => Hash::make($request->password),
                ])->save();

                if (method_exists($user, 'tokens')) {
                    $user->tokens()->delete();
                }
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'تم تغيير كلمة المرور بنجاح'
            ]);
        }

        return response()->json([
            'message' => __($status),
        ], 422);
    }
}
