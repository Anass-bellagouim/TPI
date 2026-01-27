<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('documents') && !Schema::hasColumn('documents', 'employee_id')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->foreignId('employee_id')
                    ->nullable()
                    ->after('case_type_id')
                    ->constrained('employees')
                    ->cascadeOnUpdate()
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('documents') && Schema::hasColumn('documents', 'employee_id')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->dropConstrainedForeignId('employee_id');
            });
        }
    }
};
