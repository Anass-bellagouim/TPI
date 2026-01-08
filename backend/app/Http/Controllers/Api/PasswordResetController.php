<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class PasswordResetController extends Controller
{
    public function forgot(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ], [
            'email.required' => 'البريد الإلكتروني مطلوب.',
            'email.email' => 'صيغة البريد الإلكتروني غير صحيحة.',
        ]);

        $status = Password::sendResetLink(['email' => $data['email']]);

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.']);
        }

        return response()->json(['message' => 'تعذر إرسال رابط إعادة التعيين. تأكد من البريد الإلكتروني.'], 422);
    }

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

        $status = Password::reset(
            [
                'email' => $data['email'],
                'token' => $data['token'],
                'password' => $data['password'],
                'password_confirmation' => $request->input('password_confirmation'),
            ],
            function ($user) use ($data) {
                $user->forceFill([
                    'password' => Hash::make($data['password']),
                    'remember_token' => Str::random(60),
                ])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'تم تغيير كلمة المرور بنجاح.']);
        }

        return response()->json(['message' => 'فشل إعادة تعيين كلمة المرور. تحقق من البريد أو التوكن.'], 422);
    }
}
