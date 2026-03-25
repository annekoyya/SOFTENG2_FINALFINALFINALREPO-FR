<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_periods', function (Blueprint $table) {
            $table->id();

            // Semi-monthly: "2026-03-01 to 2026-03-15" or "2026-03-16 to 2026-03-31"
            // Monthly: "2026-03-01 to 2026-03-31"
            $table->enum('type', ['semi_monthly', 'monthly'])->default('semi_monthly');

            $table->date('period_start');
            $table->date('period_end');

            // Human-readable label e.g. "March 1-15, 2026"
            $table->string('label');

            $table->enum('status', [
                'open',         // Accepting attendance data
                'processing',   // Payroll being computed
                'computed',     // All payslips generated
                'approved',     // Manager/Admin approved
                'paid',         // Disbursed
            ])->default('open');

            // Who approved this payroll run
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();

            // Who processed (triggered computation)
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();

            // Prevent duplicate periods
            $table->unique(['period_start', 'period_end'], 'unique_period');
            $table->index(['status', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_periods');
    }
};