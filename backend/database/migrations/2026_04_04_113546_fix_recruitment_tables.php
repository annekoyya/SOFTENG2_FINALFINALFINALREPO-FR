<?php
// database/migrations/2026_04_04_xxxxxx_fix_recruitment_tables.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fix job_postings table
        Schema::table('job_postings', function (Blueprint $table) {
            if (!Schema::hasColumn('job_postings', 'job_category')) {
                $table->string('job_category')->nullable();
            }
            if (!Schema::hasColumn('job_postings', 'slots')) {
                $table->integer('slots')->default(1);
            }
            if (!Schema::hasColumn('job_postings', 'posted_date')) {
                $table->date('posted_date')->nullable();
            }
            if (!Schema::hasColumn('job_postings', 'deadline')) {
                $table->date('deadline')->nullable();
            }
        });

        // Fix applicants table - remove old status, add pipeline_stage
        Schema::table('applicants', function (Blueprint $table) {
            if (Schema::hasColumn('applicants', 'status')) {
                $table->dropColumn('status');
            }
            if (!Schema::hasColumn('applicants', 'pipeline_stage')) {
                $table->enum('pipeline_stage', [
                    'applied',
                    'reviewed', 
                    'interview_scheduled',
                    'interviewed',
                    'hired',
                    'rejected'
                ])->default('applied');
            }
            if (!Schema::hasColumn('applicants', 'resume_path')) {
                $table->string('resume_path')->nullable();
            }
        });

        // Create new_hires table if not exists
        if (!Schema::hasTable('new_hires')) {
            Schema::create('new_hires', function (Blueprint $table) {
                $table->id();
                $table->string('first_name');
                $table->string('last_name');
                $table->string('email')->unique();
                $table->string('phone')->nullable();
                $table->string('department');
                $table->string('job_category');
                $table->date('start_date');
                $table->decimal('offered_salary', 12, 2)->nullable();
                $table->enum('status', ['pending', 'transferred'])->default('pending');
                $table->foreignId('applicant_id')->constrained('applicants');
                $table->foreignId('training_id')->nullable()->constrained('trainings');
                $table->foreignId('employee_id')->nullable()->constrained('employees');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            $table->dropColumn(['job_category', 'slots', 'posted_date', 'deadline']);
        });
        Schema::table('applicants', function (Blueprint $table) {
            $table->dropColumn('pipeline_stage');
            $table->string('status')->nullable();
        });
        Schema::dropIfExists('new_hires');
    }
};