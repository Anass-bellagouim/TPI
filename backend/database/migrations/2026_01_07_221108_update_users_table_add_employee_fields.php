<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {

            // first_name, last_name
            if (!Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name')->nullable()->after('id');
            }
            if (!Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name')->nullable()->after('first_name');
            }

            // username unique
            if (!Schema::hasColumn('users', 'username')) {
                $table->string('username')->nullable()->after('last_name');
            }

            // role
            if (!Schema::hasColumn('users', 'role')) {
                $table->enum('role', ['admin', 'user'])->default('user')->after('password');
            }
        });

        // تعبئة البيانات القديمة (name) → first_name/last_name إن كانوا null
        // ونولّد username مؤقت إذا كان null
        DB::table('users')->whereNull('first_name')->update([
            'first_name' => DB::raw("COALESCE(first_name, name)")
        ]);

        DB::table('users')->whereNull('last_name')->update([
            'last_name' => DB::raw("COALESCE(last_name, '')")
        ]);

        // username: إن لم يكن موجود نولّد user{id}
        DB::table('users')->whereNull('username')->update([
            'username' => DB::raw("CONCAT('user', id)")
        ]);
        Schema::table('users', function (Blueprint $table) {
            $table->unique('username');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'username')) {
                // drop unique أولاً
                try { $table->dropUnique('users_username_unique'); } catch (\Throwable $e) {}
                $table->dropColumn('username');
            }
            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
            if (Schema::hasColumn('users', 'last_name')) {
                $table->dropColumn('last_name');
            }
            if (Schema::hasColumn('users', 'first_name')) {
                $table->dropColumn('first_name');
            }
        });
    }
};
