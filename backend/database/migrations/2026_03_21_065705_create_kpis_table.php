<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kpis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('set_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('unit')->nullable();
            $table->decimal('target_value', 12, 2);
            $table->decimal('current_value', 12, 2)->default(0);
            $table->decimal('weight', 5, 2)->default(1.00);
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['active', 'achieved', 'not_achieved', 'cancelled'])->default('active');
            $table->enum('category', ['productivity', 'quality', 'attendance', 'customer_service', 'teamwork', 'other'])->default('other');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['employee_id', 'status']);
            $table->index(['start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kpis');
    }
};
