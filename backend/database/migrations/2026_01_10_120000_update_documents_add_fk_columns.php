<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            if (!Schema::hasColumn('documents', 'judge_id')) {
                $table->foreignId('judge_id')
                    ->nullable()
                    ->constrained('judges')
                    ->cascadeOnUpdate()
                    ->nullOnDelete()
                    ->after('judgement_number');
            }

            if (!Schema::hasColumn('documents', 'case_type_id')) {
                $table->foreignId('case_type_id')
                    ->nullable()
                    ->constrained('case_types')
                    ->cascadeOnUpdate()
                    ->nullOnDelete()
                    ->after('judge_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            if (Schema::hasColumn('documents', 'case_type_id')) {
                $table->dropConstrainedForeignId('case_type_id');
            }
            if (Schema::hasColumn('documents', 'judge_id')) {
                $table->dropConstrainedForeignId('judge_id');
            }
        });
    }
};
