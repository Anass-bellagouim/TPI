<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('empname')->unique();
            $table->string('email')->nullable()->unique();
            $table->string('password');
            $table->enum('role', ['admin', 'employee'])->default('employee');
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('employees');
    }
};
