<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            if (!Schema::hasColumn('documents', 'extract_status')) {
                $table->string('extract_status')->default('pending')->after('content_text');
            }
            if (!Schema::hasColumn('documents', 'extract_error')) {
                $table->text('extract_error')->nullable()->after('extract_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            if (Schema::hasColumn('documents', 'extract_error')) {
                $table->dropColumn('extract_error');
            }
            if (Schema::hasColumn('documents', 'extract_status')) {
                $table->dropColumn('extract_status');
            }
        });
    }
};
