<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deduction_categories', function (Blueprint $table) {
            $table->id();

            $table->string('name');                     // e.g. "SSS Contribution", "Uniform Loan"

            // Which government ID field on the employee record must be filled
            // for this deduction to apply.
            // 'none' means no ID requirement — always deduct.
            $table->enum('required_id', [
                'sss_number',
                'philhealth_number',
                'pagibig_number',
                'tin_number',
                'none',
            ])->default('none');

            // If true: missing ID → skip deduction AND raise a warning on the payslip.
            // If false: missing ID → skip silently (used for optional deductions).
            $table->boolean('is_mandatory')->default(true);

            // Fixed monthly amount. NULL = calculated from contribution table
            // (used for SSS / PhilHealth / PagIBIG which are bracket-based).
            $table->decimal('fixed_amount', 12, 2)->nullable();

            $table->text('description')->nullable();

            // System categories (gov-mandated) cannot be deleted via UI.
            $table->boolean('is_system')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deduction_categories');
    }
};