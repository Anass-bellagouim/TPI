<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // employees: username -> empname
        if (Schema::hasTable('employees')) {
            if (!Schema::hasColumn('employees', 'empname')) {
                Schema::table('employees', function (Blueprint $table) {
                    $table->string('empname')->nullable()->after('last_name');
                });
            }

            if (Schema::hasColumn('employees', 'username')) {
                DB::statement("UPDATE `employees` SET `empname` = COALESCE(`empname`, `username`) WHERE `empname` IS NULL");
                // drop unique index on username only if it exists
                try {
                    $exists = DB::table('information_schema.statistics')
                        ->where('table_schema', DB::raw('DATABASE()'))
                        ->where('table_name', 'employees')
                        ->where('index_name', 'employees_username_unique')
                        ->exists();
                    if ($exists) {
                        Schema::table('employees', function (Blueprint $table) {
                            $table->dropUnique(['username']);
                        });
                    }
                } catch (\Throwable $e) {
                    // Ignore if we can't check/drop the index
                }
                Schema::table('employees', function (Blueprint $table) {
                    $table->dropColumn('username');
                });
            }

            Schema::table('employees', function (Blueprint $table) {
                try {
                    $table->unique('empname');
                } catch (\Throwable $e) {
                    // Ignore if the index already exists
                }
            });

            // role: user -> employee
            if (Schema::hasColumn('employees', 'role')) {
                if (DB::getDriverName() === 'mysql') {
                    DB::statement("ALTER TABLE `employees` MODIFY `role` ENUM('admin','user','employee') NOT NULL DEFAULT 'employee'");
                }

                DB::table('employees')->where('role', 'user')->update(['role' => 'employee']);

                if (DB::getDriverName() === 'mysql') {
                    DB::statement("ALTER TABLE `employees` MODIFY `role` ENUM('admin','employee') NOT NULL DEFAULT 'employee'");
                }
            }
        }

        // documents: user_id -> employee_id
        if (Schema::hasTable('documents')) {
            if (!Schema::hasColumn('documents', 'employee_id')) {
                Schema::table('documents', function (Blueprint $table) {
                    $table->unsignedBigInteger('employee_id')->nullable()->after('case_type_id');
                });
            }

            if (Schema::hasColumn('documents', 'user_id')) {
                DB::statement("UPDATE `documents` SET `employee_id` = COALESCE(`employee_id`, `user_id`)");
                Schema::table('documents', function (Blueprint $table) {
                    try {
                        $table->dropForeign(['user_id']);
                    } catch (\Throwable $e) {
                        // Ignore if the FK doesn't exist
                    }
                });
                Schema::table('documents', function (Blueprint $table) {
                    $table->dropColumn('user_id');
                });
            }

            Schema::table('documents', function (Blueprint $table) {
                try {
                    $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnUpdate()->nullOnDelete();
                } catch (\Throwable $e) {
                    // Ignore if the FK already exists
                }
            });
        }

        // activity_logs: user_id -> employee_id
        if (Schema::hasTable('activity_logs')) {
            if (!Schema::hasColumn('activity_logs', 'employee_id')) {
                Schema::table('activity_logs', function (Blueprint $table) {
                    $table->unsignedBigInteger('employee_id')->nullable()->after('id');
                });
            }

            if (Schema::hasColumn('activity_logs', 'user_id')) {
                DB::statement("UPDATE `activity_logs` SET `employee_id` = COALESCE(`employee_id`, `user_id`)");
                Schema::table('activity_logs', function (Blueprint $table) {
                    try {
                        $table->dropForeign(['user_id']);
                    } catch (\Throwable $e) {
                        // Ignore if the FK doesn't exist
                    }
                });
                Schema::table('activity_logs', function (Blueprint $table) {
                    $table->dropColumn('user_id');
                });
            }

            Schema::table('activity_logs', function (Blueprint $table) {
                try {
                    $table->foreign('employee_id')->references('id')->on('employees')->nullOnDelete();
                } catch (\Throwable $e) {
                    // Ignore if the FK already exists
                }
            });
        }
    }

    public function down(): void
    {
        // employees: empname -> username
        if (Schema::hasTable('employees')) {
            if (!Schema::hasColumn('employees', 'username')) {
                Schema::table('employees', function (Blueprint $table) {
                    $table->string('username')->nullable()->after('last_name');
                });
            }

            if (Schema::hasColumn('employees', 'empname')) {
                DB::statement("UPDATE `employees` SET `username` = COALESCE(`username`, `empname`) WHERE `username` IS NULL");
                // drop unique index on empname only if it exists
                try {
                    $exists = DB::table('information_schema.statistics')
                        ->where('table_schema', DB::raw('DATABASE()'))
                        ->where('table_name', 'employees')
                        ->where('index_name', 'employees_empname_unique')
                        ->exists();
                    if ($exists) {
                        Schema::table('employees', function (Blueprint $table) {
                            $table->dropUnique(['empname']);
                        });
                    }
                } catch (\Throwable $e) {
                    // Ignore if we can't check/drop the index
                }
                Schema::table('employees', function (Blueprint $table) {
                    $table->dropColumn('empname');
                });
            }

            Schema::table('employees', function (Blueprint $table) {
                try {
                    $table->unique('username');
                } catch (\Throwable $e) {
                    // Ignore if the index already exists
                }
            });

            if (Schema::hasColumn('employees', 'role')) {
                if (DB::getDriverName() === 'mysql') {
                    DB::statement("ALTER TABLE `employees` MODIFY `role` ENUM('admin','user','employee') NOT NULL DEFAULT 'user'");
                }

                DB::table('employees')->where('role', 'employee')->update(['role' => 'user']);

                if (DB::getDriverName() === 'mysql') {
                    DB::statement("ALTER TABLE `employees` MODIFY `role` ENUM('admin','user') NOT NULL DEFAULT 'user'");
                }
            }
        }

        // documents: employee_id -> user_id
        if (Schema::hasTable('documents')) {
            if (!Schema::hasColumn('documents', 'user_id')) {
                Schema::table('documents', function (Blueprint $table) {
                    $table->unsignedBigInteger('user_id')->nullable()->after('case_type_id');
                });
            }

            if (Schema::hasColumn('documents', 'employee_id')) {
                DB::statement("UPDATE `documents` SET `user_id` = COALESCE(`user_id`, `employee_id`)");
                Schema::table('documents', function (Blueprint $table) {
                    try {
                        $table->dropForeign(['employee_id']);
                    } catch (\Throwable $e) {
                        // Ignore if the FK doesn't exist
                    }
                });
                Schema::table('documents', function (Blueprint $table) {
                    $table->dropColumn('employee_id');
                });
            }

            Schema::table('documents', function (Blueprint $table) {
                try {
                    $table->foreign('user_id')->references('id')->on('employees')->cascadeOnUpdate()->nullOnDelete();
                } catch (\Throwable $e) {
                    // Ignore if the FK already exists
                }
            });
        }

        // activity_logs: employee_id -> user_id
        if (Schema::hasTable('activity_logs')) {
            if (!Schema::hasColumn('activity_logs', 'user_id')) {
                Schema::table('activity_logs', function (Blueprint $table) {
                    $table->unsignedBigInteger('user_id')->nullable()->after('id');
                });
            }

            if (Schema::hasColumn('activity_logs', 'employee_id')) {
                DB::statement("UPDATE `activity_logs` SET `user_id` = COALESCE(`user_id`, `employee_id`)");
                Schema::table('activity_logs', function (Blueprint $table) {
                    try {
                        $table->dropForeign(['employee_id']);
                    } catch (\Throwable $e) {
                        // Ignore if the FK doesn't exist
                    }
                });
                Schema::table('activity_logs', function (Blueprint $table) {
                    $table->dropColumn('employee_id');
                });
            }

            Schema::table('activity_logs', function (Blueprint $table) {
                try {
                    $table->foreign('user_id')->references('id')->on('employees')->nullOnDelete();
                } catch (\Throwable $e) {
                    // Ignore if the FK already exists
                }
            });
        }
    }
};
