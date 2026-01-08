<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

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
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

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
}
