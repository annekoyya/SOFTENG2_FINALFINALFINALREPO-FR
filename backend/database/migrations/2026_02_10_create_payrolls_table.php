<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');

            // Pay period
            $table->date('pay_period_start');
            $table->date('pay_period_end');

            // Earnings
            $table->decimal('base_salary', 12, 2);
            $table->decimal('overtime_pay', 12, 2)->default(0);
            $table->decimal('bonuses', 12, 2)->default(0);
            $table->decimal('allowances', 12, 2)->default(0);
            $table->decimal('gross_salary', 12, 2);

            // Philippine statutory deductions
            $table->decimal('sss_contribution', 12, 2)->default(0);
            $table->decimal('philhealth_contribution', 12, 2)->default(0);
            $table->decimal('pagibig_contribution', 12, 2)->default(0);
            $table->decimal('tax_withholding', 12, 2)->default(0);
            $table->decimal('other_deductions', 12, 2)->default(0);
            $table->decimal('total_deductions', 12, 2);

            // Net pay
            $table->decimal('net_salary', 12, 2);

            // Workflow status
            $table->enum('status', ['draft', 'pending_approval', 'approved', 'processed', 'paid', 'failed'])->default('draft');

            // Metadata
            $table->text('notes')->nullable();
            $table->json('calculation_breakdown')->nullable(); // Stores itemized breakdown

            // Audit trail
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();

            $table->timestamps();

            // Prevent duplicate payroll for same employee in same period
            $table->unique(['employee_id', 'pay_period_start', 'pay_period_end']);

            // Indexes
            $table->index('employee_id');
            $table->index('status');
            $table->index('pay_period_start');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};