<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends BaseResetPassword
{
    use Queueable;

    /**
     * Generate frontend reset password URL (HashRouter)
     */
    protected function resetUrl($notifiable): string
    {
        $frontend = rtrim(config('app.frontend_url', 'http://localhost:5174'), '/');

        // ✅ مهم: /#/reset-password
        return $frontend
            . '/#/reset-password'
            . '?token=' . urlencode($this->token)
            . '&email=' . urlencode($notifiable->getEmailForPasswordReset());
    }

    /**
     * Optional: customize mail (recommended)
     */
    public function toMail($notifiable)
    {
        $url = $this->resetUrl($notifiable);

        return (new MailMessage)
            ->subject('إعادة تعيين كلمة المرور')
            ->line('توصلنا بطلب إعادة تعيين كلمة المرور.')
            ->action('إعادة تعيين كلمة المرور', $url)
            ->line('إلا ماشي أنت اللي طلبت، تجاهل هاد الرسالة.');
    }
}
