<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {

            // ✅ add columns only if not exist (باش migration تبقى idempotent)
            if (!Schema::hasColumn('employees', 'first_name')) {
                $table->string('first_name')->nullable()->after('id');
            }

            if (!Schema::hasColumn('employees', 'last_name')) {
                $table->string('last_name')->nullable()->after('first_name');
            }

            if (!Schema::hasColumn('employees', 'empname')) {
                $table->string('empname')->unique()->nullable()->after('last_name');
            }

            if (!Schema::hasColumn('employees', 'role')) {
                $table->enum('role', ['admin', 'employee'])->default('employee')->after('password');
            }

            if (!Schema::hasColumn('employees', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('role');
            }
        });

        // ✅ data backfill (غير إلا كان عندك أعمدة قديمة)
        // IMPORTANT: name ممكن ما تكونش موجودة دابا -> نديرو guard
        if (Schema::hasColumn('employees', 'name')) {
            DB::statement("UPDATE `employees` SET `first_name` = COALESCE(`first_name`, `name`) WHERE `first_name` IS NULL");
            DB::statement("UPDATE `employees` SET `last_name` = COALESCE(`last_name`, '') WHERE `last_name` IS NULL");
        } else {
            // إذا ما كايناش name: ما ندير والو (فـ fresh DB مكاين حتى data قديمة)
        }
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // خليه safe: حيد غير الأعمدة اللي ممكن تزادو هنا
            if (Schema::hasColumn('employees', 'is_active')) $table->dropColumn('is_active');
            if (Schema::hasColumn('employees', 'role')) $table->dropColumn('role');
            if (Schema::hasColumn('employees', 'empname')) $table->dropUnique(['empname']);
            if (Schema::hasColumn('employees', 'empname')) $table->dropColumn('empname');
            if (Schema::hasColumn('employees', 'last_name')) $table->dropColumn('last_name');
            if (Schema::hasColumn('employees', 'first_name')) $table->dropColumn('first_name');
        });
    }
};
