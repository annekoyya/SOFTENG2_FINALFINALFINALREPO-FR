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
       Schema::create('overtime_requests', function (Blueprint $table) {
    $table->id();
    $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
    $table->date('date');
    $table->enum('overtime_type', ['regular','rest_day','special_holiday','regular_holiday'])
          ->default('regular');
    $table->decimal('hours_requested', 4, 1);
    $table->decimal('hours_approved',  4, 1)->nullable();
    $table->text('reason');
    $table->enum('status', ['pending','approved','rejected','paid'])->default('pending');
    $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
    $table->text('rejected_reason')->nullable();
    // Computed pay amount (filled on approve, based on employee's daily rate)
    $table->decimal('computed_amount', 10, 2)->nullable();
    // Once included in a payslip
    $table->foreignId('payslip_id')->nullable()->constrained('payslips')->nullOnDelete();
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};


