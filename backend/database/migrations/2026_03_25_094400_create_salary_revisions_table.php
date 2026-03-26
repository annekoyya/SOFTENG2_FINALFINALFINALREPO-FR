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
        Schema::create('salary_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->decimal('previous_salary', 12, 2);
            $table->decimal('new_salary', 12, 2);
            $table->decimal('change_amount', 12, 2); // computed: new - previous
            $table->decimal('change_pct', 6, 2); // computed: %
            $table->enum('reason', [
                'promotion', 'annual_review', 'merit',
                'market_adjustment', 'correction', 'other',
            ])->default('annual_review');
            $table->text('notes')->nullable();
            $table->date('effective_date');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_revisions');
    }
};
