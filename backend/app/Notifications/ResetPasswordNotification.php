<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;

class ResetPasswordNotification extends BaseResetPassword
{
    use Queueable;

    protected function resetUrl($notifiable)
    {
        $frontend = config('app.frontend_url', 'http://localhost:5173');

        return $frontend . '/reset-password?token=' . urlencode($this->token)
            . '&email=' . urlencode($notifiable->getEmailForPasswordReset());
    }
}
