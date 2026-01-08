<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'first_name' => 'Admin',
                'last_name'  => 'System',
                'email'      => 'anassaitbelagouim@gmail.com', // ✅ admin عندو email
                'password'   => Hash::make('admin123'),
                'role'       => 'admin',
                'is_active'  => true,
            ]
        );
    }
}
