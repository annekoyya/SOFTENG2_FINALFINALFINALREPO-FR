<?php
// database/migrations/2026_04_04_xxxxxx_update_recruitment_pipeline.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add pipeline stage to applicants
        Schema::table('applicants', function (Blueprint $table) {
            if (!Schema::hasColumn('applicants', 'pipeline_stage')) {
                $table->enum('pipeline_stage', [
                    'new',                    // Just applied
                    'reviewed',               // Resume reviewed
                    'interview_scheduled',    // Interview booked
                    'interview_completed',    // Interview done
                    'hired',                  // Selected for job
                    'rejected'                // Not selected
                ])->default('new');
            }
            if (!Schema::hasColumn('applicants', 'hired_at')) {
                $table->timestamp('hired_at')->nullable();
            }
        });

        // Add training_id to new_hires table
        Schema::table('new_hires', function (Blueprint $table) {
            if (!Schema::hasColumn('new_hires', 'training_id')) {
                $table->foreignId('training_id')->nullable()->constrained('trainings');
            }
            if (!Schema::hasColumn('new_hires', 'applicant_id')) {
                $table->foreignId('applicant_id')->nullable()->constrained('applicants');
            }
        });

        // Add applicant_id to trainings table
        Schema::table('trainings', function (Blueprint $table) {
            if (!Schema::hasColumn('trainings', 'applicant_id')) {
                $table->foreignId('applicant_id')->nullable()->constrained('applicants');
            }
        });
    }

    public function down(): void
    {
        Schema::table('applicants', function (Blueprint $table) {
            $table->dropColumn(['pipeline_stage', 'hired_at']);
        });
        Schema::table('new_hires', function (Blueprint $table) {
            $table->dropColumn(['training_id', 'applicant_id']);
        });
        Schema::table('trainings', function (Blueprint $table) {
            $table->dropColumn('applicant_id');
        });
    }
};