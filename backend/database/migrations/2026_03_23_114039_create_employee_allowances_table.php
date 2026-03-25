<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Recurring allowances assigned to an employee
        // Applied automatically to every payslip in the period
        Schema::create('employee_allowances', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                  ->constrained('employees')
                  ->cascadeOnDelete();

            $table->enum('type', [
                'transport',
                'meal',
                'custom',
            ])->default('custom');

            $table->string('name');                    // "Transport Allowance", "Meal Subsidy", etc.
            $table->decimal('amount', 12, 2);          // Amount per payroll period
            $table->boolean('is_taxable')->default(false); // Whether to include in BIR computation

            // Whether this allowance is currently active
            $table->boolean('is_active')->default(true);

            // Optional: restrict to a date range
            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();

            $table->text('notes')->nullable();

            // Who added this allowance
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();

            $table->timestamps();

            $table->index(['employee_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_allowances');
    }
};