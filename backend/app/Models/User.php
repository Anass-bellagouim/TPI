<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

// ✅ زِد هاد السطر
use App\Notifications\ResetPasswordNotification;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'username',
        'email',
        'password',
        'role',
        'is_active', // ✅ إذا عندك فـ DB (مستحسن يكون هنا)
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean', // ✅ إذا موجودة
    ];

    // ✅ full_name accessor
    public function getFullNameAttribute(): string
    {
        $fn = trim((string)($this->first_name ?? ''));
        $ln = trim((string)($this->last_name ?? ''));

        $full = trim($fn . ' ' . $ln);
        if ($full !== '') return $full;

        // fallback للبيانات القديمة
        return (string)($this->name ?? '');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * ✅ Override reset password notification
     * باش Laravel ما يبقاش كيحتاج Route [password.reset]
     * وغادي يرسل رابط Frontend مباشرة.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}
