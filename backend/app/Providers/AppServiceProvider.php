<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\ResetPassword;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // ✅ Generate reset link to React frontend
        ResetPassword::createUrlUsing(function ($user, string $token) {
            $frontend = rtrim(config('app.frontend_url'), '/');

            return $frontend
                . '/reset-password?token=' . urlencode($token)
                . '&email=' . urlencode($user->email);
        });
    }
}
