<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('activity_logs')) return;
        DB::statement("ALTER TABLE `activity_logs` MODIFY `message` TEXT NULL");
    }

    public function down(): void
    {
        if (!Schema::hasTable('activity_logs')) return;
        DB::statement("ALTER TABLE `activity_logs` MODIFY `message` VARCHAR(255) NULL");
    }
};
