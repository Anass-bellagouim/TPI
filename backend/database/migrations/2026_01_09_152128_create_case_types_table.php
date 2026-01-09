<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('case_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('division_id')->constrained('divisions')->cascadeOnUpdate()->restrictOnDelete();

            $table->string('code', 4);                 // "2101"
            $table->string('name');                    // "جنحي عادي تأديبي"
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();

            $table->unique(['division_id', 'code']);   // نفس الرمز ما يتعاودش داخل نفس الشعبة
            $table->index(['code', 'is_active']);
            $table->index(['division_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_types');
    }
};
