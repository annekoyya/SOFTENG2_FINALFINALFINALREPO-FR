<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            
            // Leave details
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('leave_type', ['vacation', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity'])->default('vacation');
            
            // Status
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
            
            // Leave duration
            $table->integer('number_of_days');
            $table->decimal('hours_requested', 5, 2);
            
            // Approval trail
            $table->foreignId('approver_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_reason')->nullable();
            
            // Reason for leave
            $table->text('reason');
            
            // Contact info during leave
            $table->string('contact_person')->nullable();
            $table->string('contact_phone')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['employee_id', 'status']);
            $table->index(['start_date', 'end_date']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
