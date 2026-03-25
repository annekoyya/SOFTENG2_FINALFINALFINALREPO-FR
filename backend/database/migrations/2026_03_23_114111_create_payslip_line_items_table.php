<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Granular line items for the payslip — displayed on the actual PDF
        // Allows unlimited custom entries beyond the fixed columns on payslips table
        Schema::create('payslip_line_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('payslip_id')
                  ->constrained('payslips')
                  ->cascadeOnDelete();

            $table->enum('category', ['earning', 'deduction']);

            $table->string('label');                   // "Overtime Pay", "SSS Contribution", etc.
            $table->decimal('amount', 12, 2);
            $table->text('description')->nullable();   // e.g. "2.5 hours × ₱125/hr"

            // Display order on payslip
            $table->unsignedInteger('order')->default(0);

            // Whether this was manually added vs auto-computed
            $table->boolean('is_manual')->default(false);

            $table->timestamps();

            $table->index(['payslip_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payslip_line_items');
    }
};