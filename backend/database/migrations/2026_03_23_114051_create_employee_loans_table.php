<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_loans', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                  ->constrained('employees')
                  ->cascadeOnDelete();

            $table->enum('type', ['sss', 'pagibig', 'company'])->default('sss');

            $table->string('reference_number')->nullable(); // SSS/PagIBIG loan reference
            $table->decimal('principal_amount', 12, 2);     // Original loan amount
            $table->decimal('outstanding_balance', 12, 2);  // Remaining balance
            $table->decimal('monthly_amortization', 12, 2); // Deduction per period

            $table->enum('status', ['active', 'fully_paid', 'suspended'])->default('active');

            $table->date('start_date');
            $table->date('end_date')->nullable(); // Estimated payoff date

            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();

            $table->timestamps();

            $table->index(['employee_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_loans');
    }
};