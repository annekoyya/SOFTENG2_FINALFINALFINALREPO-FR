<?php
// database/migrations/2026_04_04_xxxxxx_add_shift_sched_to_employees.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'shift_sched')) {
                $table->enum('shift_sched', ['morning', 'afternoon', 'night'])->nullable()->after('employment_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('shift_sched');
        });
    }
};