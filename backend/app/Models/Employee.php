<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

use App\Notifications\ResetPasswordNotification;

class Employee extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'employees';

    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'empname',
        'email',
        'password',
        'role',
        'is_active',
        'is_super_admin', // ✅ NEW
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_super_admin' => 'boolean', // ✅ NEW
        // 'email_verified_at' => 'datetime', // خليه غير إلا كان فالـ DB
    ];

    // full_name accessor
    public function getFullNameAttribute(): string
    {
        $fn = trim((string)($this->first_name ?? ''));
        $ln = trim((string)($this->last_name ?? ''));

        $full = trim($fn . ' ' . $ln);
        if ($full !== '') return $full;

        return (string)($this->name ?? '');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isSuperAdmin(): bool
    {
        return (bool) $this->is_super_admin;
    }

    /**
     * Override reset password notification:
     * كيسيفط رابط Frontend مباشرة (ما كيحتاجش route password.reset ديال Laravel)
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}
