<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('new_hires', function (Blueprint $table) {
            $table->id();

            // Who added this new hire record
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();

            // Track which step of onboarding is complete
            $table->enum('onboarding_status', [
                'pending',      // Just created
                'complete',     // All required fields filled — auto-transfers
                'transferred',  // Already moved to employees table
            ])->default('pending');

            // Link to the employee record once transferred
            $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete();

            // ── Personal Info ─────────────────────────────────────────────
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('name_extension')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('email')->unique();
            $table->string('phone_number')->nullable();
            $table->text('home_address')->nullable();

            // ── Emergency Contact ─────────────────────────────────────────
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_number')->nullable();
            $table->string('relationship')->nullable();

            // ── Government IDs ────────────────────────────────────────────
            $table->string('tin')->nullable();
            $table->string('sss_number')->nullable();
            $table->string('pagibig_number')->nullable();
            $table->string('philhealth_number')->nullable();

            // ── Banking ───────────────────────────────────────────────────
            $table->string('bank_name')->nullable();
            $table->string('account_name')->nullable();
            $table->string('account_number')->nullable();

            // ── Employment Details ────────────────────────────────────────
            $table->date('start_date')->nullable();
            $table->string('department')->nullable();
            $table->string('job_category')->nullable();
            $table->enum('employment_type', [
                'regular', 'probationary', 'contractual', 'part_time', 'intern'
            ])->default('probationary');
            $table->string('role')->default('Employee');
            $table->decimal('basic_salary', 12, 2)->nullable();
            $table->string('reporting_manager')->nullable();

            // Tracks which required fields have been filled (JSON array of field names)
            $table->json('completed_fields')->nullable();

            $table->timestamp('transferred_at')->nullable();
            $table->timestamps();

            $table->index('onboarding_status');
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('new_hires');
    }
};