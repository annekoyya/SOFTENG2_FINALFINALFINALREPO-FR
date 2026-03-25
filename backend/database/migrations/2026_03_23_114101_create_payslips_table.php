<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payslips', function (Blueprint $table) {
            $table->id();

            $table->foreignId('payroll_period_id')
                  ->constrained('payroll_periods')
                  ->cascadeOnDelete();

            $table->foreignId('employee_id')
                  ->constrained('employees')
                  ->cascadeOnDelete();

            // ── Attendance Summary for the Period ──────────────────────────
            $table->decimal('working_days_in_period', 5, 2)->default(13); // 13 or 26
            $table->decimal('days_worked', 5, 2)->default(0);
            $table->decimal('days_absent', 5, 2)->default(0);
            $table->decimal('days_on_leave', 5, 2)->default(0);        // Paid leave
            $table->decimal('days_unpaid_leave', 5, 2)->default(0);    // Unpaid leave
            $table->integer('minutes_late')->default(0);
            $table->decimal('overtime_hours', 5, 2)->default(0);

            // ── Earnings ───────────────────────────────────────────────────
            $table->decimal('basic_pay', 12, 2)->default(0);           // Pro-rated basic
            $table->decimal('overtime_pay', 12, 2)->default(0);
            $table->decimal('transport_allowance', 12, 2)->default(0);
            $table->decimal('meal_allowance', 12, 2)->default(0);
            $table->decimal('other_allowances', 12, 2)->default(0);    // Sum of custom
            $table->decimal('bonuses', 12, 2)->default(0);             // Manually added
            $table->decimal('thirteenth_month_pay', 12, 2)->default(0); // Dec only or monthly accrual

            // Computed total gross
            $table->decimal('gross_pay', 12, 2)->default(0);

            // ── Deductions ─────────────────────────────────────────────────
            $table->decimal('late_deduction', 12, 2)->default(0);
            $table->decimal('absent_deduction', 12, 2)->default(0);
            $table->decimal('unpaid_leave_deduction', 12, 2)->default(0);

            // Statutory — employee share only
            $table->decimal('sss_employee', 12, 2)->default(0);
            $table->decimal('philhealth_employee', 12, 2)->default(0);
            $table->decimal('pagibig_employee', 12, 2)->default(0);
            $table->decimal('bir_withholding_tax', 12, 2)->default(0);

            // Loan repayments
            $table->decimal('sss_loan_deduction', 12, 2)->default(0);
            $table->decimal('pagibig_loan_deduction', 12, 2)->default(0);
            $table->decimal('company_loan_deduction', 12, 2)->default(0);

            $table->decimal('other_deductions', 12, 2)->default(0);    // Any manual deduction

            // Computed total deductions
            $table->decimal('total_deductions', 12, 2)->default(0);

            // ── Employer Contributions (for audit / cost tracking) ─────────
            $table->decimal('sss_employer', 12, 2)->default(0);
            $table->decimal('philhealth_employer', 12, 2)->default(0);
            $table->decimal('pagibig_employer', 12, 2)->default(0);

            // ── Net Pay ────────────────────────────────────────────────────
            $table->decimal('net_pay', 12, 2)->default(0);

            // ── Workflow ───────────────────────────────────────────────────
            $table->enum('status', [
                'draft',      // Being computed
                'computed',   // Calculation done, pending review
                'approved',   // Approved by manager
                'paid',       // Disbursed
                'cancelled',  // Voided
            ])->default('draft');

            // Manual adjustments note
            $table->text('adjustments_note')->nullable();

            // PDF path once generated
            $table->string('pdf_path')->nullable();

            // Whether email has been sent to employee
            $table->boolean('email_sent')->default(false);
            $table->timestamp('email_sent_at')->nullable();

            // Who computed/approved this payslip
            $table->foreignId('computed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('computed_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();

            // One payslip per employee per period
            $table->unique(['payroll_period_id', 'employee_id'], 'unique_payslip');
            $table->index(['employee_id', 'status']);
            $table->index('payroll_period_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payslips');
    }
};