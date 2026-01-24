<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            if (!Schema::hasColumn('documents', 'user_id')) {
                $table->foreignId('user_id')
                    ->nullable()
                    ->constrained('users')
                    ->cascadeOnUpdate()
                    ->nullOnDelete()
                    ->after('case_type_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            if (Schema::hasColumn('documents', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }
        });
    }
};
