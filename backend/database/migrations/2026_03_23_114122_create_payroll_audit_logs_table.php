<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Immutable audit trail — NEVER update or delete rows here
        Schema::create('payroll_audit_logs', function (Blueprint $table) {
            $table->id();

            // What entity was affected
            $table->enum('entity_type', ['payroll_period', 'payslip', 'employee_loan', 'employee_allowance']);
            $table->unsignedBigInteger('entity_id');

            // What action was performed
            $table->enum('action', [
                'created',
                'computed',
                'adjusted',     // Manual adjustment made
                'approved',
                'rejected',
                'paid',
                'email_sent',
                'pdf_generated',
                'cancelled',
                'loan_deducted',
                'allowance_applied',
            ]);

            // Who performed the action
            $table->foreignId('performed_by')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Snapshot of before/after values for audit purposes
            $table->json('before_values')->nullable();
            $table->json('after_values')->nullable();

            // Human-readable description
            $table->text('description')->nullable();

            // IP address for security audit
            $table->string('ip_address')->nullable();

            // Timestamp — created_at only (no updated_at — immutable)
            $table->timestamp('created_at')->useCurrent();

            $table->index(['entity_type', 'entity_id']);
            $table->index('performed_by');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_audit_logs');
    }
};