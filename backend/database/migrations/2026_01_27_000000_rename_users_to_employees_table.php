<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('users') && !Schema::hasTable('employees')) {
            // Drop foreign keys pointing to users before renaming
            if (Schema::hasTable('documents') && Schema::hasColumn('documents', 'employee_id')) {
                Schema::table('documents', function (Blueprint $table) {
                    $table->dropConstrainedForeignId('employee_id');
                });
            }
            if (Schema::hasTable('documents') && Schema::hasColumn('documents', 'user_id')) {
                Schema::table('documents', function (Blueprint $table) {
                    $table->dropConstrainedForeignId('user_id');
                });
            }

            if (Schema::hasTable('activity_logs') && Schema::hasColumn('activity_logs', 'employee_id')) {
                Schema::table('activity_logs', function (Blueprint $table) {
                    $table->dropConstrainedForeignId('employee_id');
                });
            }
            if (Schema::hasTable('activity_logs') && Schema::hasColumn('activity_logs', 'user_id')) {
                Schema::table('activity_logs', function (Blueprint $table) {
                    $table->dropConstrainedForeignId('user_id');
                });
            }

            Schema::rename('users', 'employees');

            // Re-add foreign keys to employees
            if (Schema::hasTable('documents') && Schema::hasColumn('documents', 'employee_id')) {
                Schema::table('documents', function (Blueprint $table) {
                    $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnUpdate()->nullOnDelete();
                });
            }
            if (Schema::hasTable('documents') && Schema::hasColumn('documents', 'user_id')) {
                Schema::table('documents', function (Blueprint $table) {
                    $table->foreign('user_id')->references('id')->on('employees')->cascadeOnUpdate()->nullOnDelete();
                });
            }

            if (Schema::hasTable('activity_logs') && Schema::hasColumn('activity_logs', 'employee_id')) {
                Schema::table('activity_logs', function (Blueprint $table) {
                    $table->foreign('employee_id')->references('id')->on('employees')->nullOnDelete();
                });
            }
            if (Schema::hasTable('activity_logs') && Schema::hasColumn('activity_logs', 'user_id')) {
                Schema::table('activity_logs', function (Blueprint $table) {
                    $table->foreign('user_id')->references('id')->on('employees')->nullOnDelete();
                });
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('employees') && !Schema::hasTable('users')) {
            if (Schema::hasTable('documents') && Schema::hasColumn('documents', 'employee_id')) {
                Schema::table('documents', function (Blueprint $table) {
                    $table->dropForeign(['employee_id']);
                });
            }
            if (Schema::hasTable('documents') && Schema::hasColumn('documents', 'user_id')) {
                Schema::table('documents', function (Blueprint $table) {
                    $table->dropForeign(['user_id']);
                });
            }

            if (Schema::hasTable('activity_logs') && Schema::hasColumn('activity_logs', 'employee_id')) {
                Schema::table('activity_logs', function (Blueprint $table) {
                    $table->dropForeign(['employee_id']);
                });
            }
            if (Schema::hasTable('activity_logs') && Schema::hasColumn('activity_logs', 'user_id')) {
                Schema::table('activity_logs', function (Blueprint $table) {
                    $table->dropForeign(['user_id']);
                });
            }

            Schema::rename('employees', 'users');

            if (Schema::hasTable('documents') && Schema::hasColumn('documents', 'employee_id')) {
                Schema::table('documents', function (Blueprint $table) {
                    $table->foreign('employee_id')->references('id')->on('users')->cascadeOnUpdate()->nullOnDelete();
                });
            }
            if (Schema::hasTable('documents') && Schema::hasColumn('documents', 'user_id')) {
                Schema::table('documents', function (Blueprint $table) {
                    $table->foreign('user_id')->references('id')->on('users')->cascadeOnUpdate()->nullOnDelete();
                });
            }

            if (Schema::hasTable('activity_logs') && Schema::hasColumn('activity_logs', 'employee_id')) {
                Schema::table('activity_logs', function (Blueprint $table) {
                    $table->foreign('employee_id')->references('id')->on('users')->nullOnDelete();
                });
            }
            if (Schema::hasTable('activity_logs') && Schema::hasColumn('activity_logs', 'user_id')) {
                Schema::table('activity_logs', function (Blueprint $table) {
                    $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
                });
            }
        }
    }
};
