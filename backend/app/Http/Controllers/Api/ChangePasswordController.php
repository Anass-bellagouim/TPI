<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ChangePasswordController extends Controller
{
    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password'     => ['required', 'string', 'min:8', 'max:255'],
        ]);

        $user = $request->user();

        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->password = Hash::make($data['new_password']);
        $user->save();

        // نبدّل السياسة: نقدر نخلّيه كيبقى داخل، ولكن الأفضل نحيد tokens باش يكون آمن
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Password changed successfully (tokens revoked). Please login again.',
        ]);
    }
}
