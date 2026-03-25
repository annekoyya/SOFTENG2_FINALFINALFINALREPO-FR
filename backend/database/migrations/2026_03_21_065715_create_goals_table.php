<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('goals', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                  ->constrained('employees')
                  ->cascadeOnDelete();

            // Who set this goal
            $table->foreignId('set_by')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->string('title');
            $table->text('description')->nullable();

            // SMART goal fields
            $table->date('due_date');
            $table->unsignedTinyInteger('progress')->default(0); // 0-100%

            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');

            $table->enum('status', [
                'not_started',
                'in_progress',
                'completed',
                'overdue',
                'cancelled',
            ])->default('not_started');

            $table->enum('category', [
                'professional_development',
                'performance',
                'project',
                'behavioral',
                'other',
            ])->default('other');

            // Link goal to an evaluation period (optional)
            $table->foreignId('evaluation_id')->nullable()
                  ->constrained('evaluations')
                  ->nullOnDelete();

            $table->text('completion_notes')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index(['employee_id', 'status']);
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goals');
    }
};
