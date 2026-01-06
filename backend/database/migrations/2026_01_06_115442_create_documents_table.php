<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();

            $table->string('type'); // jonah / mokhalafat / hawadit ...
            $table->string('judgement_number')->nullable();
            $table->string('case_number')->nullable();
            $table->string('judge_name')->nullable();

            $table->string('original_filename');
            $table->string('file_path'); // storage path

            $table->longText('content_text')->nullable(); // النص المستخرج كامل
            $table->string('extract_status')->default('pending'); // pending|done|failed

            $table->timestamps();

            $table->index(['type', 'judgement_number', 'case_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
