<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ✅ already added in previous migration (no-op)
        if (!Schema::hasColumn('employees', 'is_active')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('role');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('employees', 'is_active')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->dropColumn('is_active');
            });
        }
    }
};
