<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('activity_logs') && !Schema::hasColumn('activity_logs', 'employee_id')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->foreignId('employee_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('employees')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('activity_logs') && Schema::hasColumn('activity_logs', 'employee_id')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->dropConstrainedForeignId('employee_id');
            });
        }
    }
};
