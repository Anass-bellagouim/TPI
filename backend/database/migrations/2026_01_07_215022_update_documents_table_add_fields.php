<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('documents', function (Blueprint $table) {
            if (!Schema::hasColumn('documents', 'type')) {
                $table->string('type')->nullable()->index();
            }
            if (!Schema::hasColumn('documents', 'case_number')) {
                $table->string('case_number')->nullable()->index();
            }
            if (!Schema::hasColumn('documents', 'judgement_number')) {
                $table->string('judgement_number')->nullable()->index();
            }
            if (!Schema::hasColumn('documents', 'judge_name')) {
                $table->string('judge_name')->nullable()->index();
            }
            if (!Schema::hasColumn('documents', 'division')) {
                $table->string('division')->nullable()->index();
            }
            if (!Schema::hasColumn('documents', 'keyword')) {
                $table->string('keyword')->nullable()->index();
            }
            if (!Schema::hasColumn('documents', 'file_path')) {
                $table->string('file_path')->nullable();
            }
            if (!Schema::hasColumn('documents', 'original_filename')) {
                $table->string('original_filename')->nullable();
            }
            // content_text موجود غالباً، نتركه كما هو
        });
    }

    public function down(): void {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn([
                'type','case_number','judgement_number','judge_name','division',
                'keyword','file_path','original_filename'
            ]);
        });
    }
};
