<?php
// database/migrations/2026_04_09_000001_fix_training_assignments_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_assignments', function (Blueprint $table) {
            // Add applicant_id if it doesn't exist
            if (!Schema::hasColumn('training_assignments', 'applicant_id')) {
                $table->foreignId('applicant_id')->constrained('applicants')->onDelete('cascade');
            }
            
            // Add employee_id if it doesn't exist (as fallback)
            if (!Schema::hasColumn('training_assignments', 'employee_id')) {
                $table->foreignId('employee_id')->nullable()->constrained('employees')->onDelete('cascade');
            }
        });
    }

    public function down(): void
    {
        Schema::table('training_assignments', function (Blueprint $table) {
            $table->dropColumn(['applicant_id', 'employee_id']);
        });
    }
};