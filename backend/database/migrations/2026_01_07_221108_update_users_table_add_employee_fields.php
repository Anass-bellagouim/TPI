<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {

            // ✅ add columns only if not exist (باش migration تبقى idempotent)
            if (!Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name')->nullable()->after('id');
            }

            if (!Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name')->nullable()->after('first_name');
            }

            if (!Schema::hasColumn('users', 'username')) {
                $table->string('username')->unique()->nullable()->after('last_name');
            }

            if (!Schema::hasColumn('users', 'role')) {
                $table->enum('role', ['admin', 'user'])->default('user')->after('password');
            }

            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('role');
            }
        });

        // ✅ data backfill (غير إلا كان عندك أعمدة قديمة)
        // IMPORTANT: name ممكن ما تكونش موجودة دابا -> نديرو guard
        if (Schema::hasColumn('users', 'name')) {
            DB::statement("UPDATE `users` SET `first_name` = COALESCE(`first_name`, `name`) WHERE `first_name` IS NULL");
            DB::statement("UPDATE `users` SET `last_name` = COALESCE(`last_name`, '') WHERE `last_name` IS NULL");
        } else {
            // إذا ما كايناش name: ما ندير والو (فـ fresh DB مكاين حتى data قديمة)
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // خليه safe: حيد غير الأعمدة اللي ممكن تزادو هنا
            if (Schema::hasColumn('users', 'is_active')) $table->dropColumn('is_active');
            if (Schema::hasColumn('users', 'role')) $table->dropColumn('role');
            if (Schema::hasColumn('users', 'username')) $table->dropUnique(['username']);
            if (Schema::hasColumn('users', 'username')) $table->dropColumn('username');
            if (Schema::hasColumn('users', 'last_name')) $table->dropColumn('last_name');
            if (Schema::hasColumn('users', 'first_name')) $table->dropColumn('first_name');
        });
    }
};
