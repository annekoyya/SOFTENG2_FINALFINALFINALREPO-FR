<?php
// database/migrations/2026_04_09_000000_add_applicant_id_to_training_assignments.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_assignments', function (Blueprint $table) {
            if (!Schema::hasColumn('training_assignments', 'applicant_id')) {
                $table->foreignId('applicant_id')->nullable()->constrained('applicants')->onDelete('cascade');
            }
        });
    }

    public function down(): void
    {
        Schema::table('training_assignments', function (Blueprint $table) {
            $table->dropColumn('applicant_id');
        });
    }
};