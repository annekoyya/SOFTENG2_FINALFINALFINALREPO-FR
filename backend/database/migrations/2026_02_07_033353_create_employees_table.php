<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();

            // FK to new_hires table (optional onboarding link)
            $table->unsignedBigInteger('new_hire_id')->nullable();

            // Self-referencing manager relationship
            $table->unsignedBigInteger('manager_id')->nullable();
            $table->foreign('manager_id')->references('id')->on('employees')->onDelete('set null');

            // Role / access level
            $table->string('role')->default('Employee'); // Employee, HR, Admin, Manager, Accountant

            // Employment status
            $table->enum('status', ['active', 'on_leave', 'terminated', 'suspended'])->default('active');

            // Personal & Contact Information
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('name_extension')->nullable(); // Jr., Sr., III, etc.
            $table->date('date_of_birth');
            $table->string('email')->unique();
            $table->string('phone_number');
            $table->text('home_address');

            // Emergency Contact
            $table->string('emergency_contact_name');
            $table->string('emergency_contact_number');
            $table->string('relationship');

            // Government IDs & Banking
            $table->string('tin')->nullable();
            $table->string('sss_number')->nullable();
            $table->string('pagibig_number')->nullable();
            $table->string('philhealth_number')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('account_name')->nullable();
            $table->string('account_number')->nullable();

            // Employment Details
            $table->date('start_date');
            $table->date('end_date')->nullable(); // For contract/terminated employees
            $table->string('department');
            $table->string('job_category');
            $table->enum('employment_type', ['regular', 'probationary', 'contractual', 'part_time', 'intern'])->default('probationary');
            $table->string('reporting_manager')->nullable(); // Name string (can be upgraded to FK later)

            // Compensation
            $table->decimal('basic_salary', 12, 2)->default(0);

            // Profile photo
            $table->string('photo_path')->nullable();

            // Soft deletes for archiving
            $table->softDeletes();
            $table->timestamps();

            // Indexes
            $table->index(['last_name', 'first_name']);
            $table->index('department');
            $table->index('status');
            $table->index('employment_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};