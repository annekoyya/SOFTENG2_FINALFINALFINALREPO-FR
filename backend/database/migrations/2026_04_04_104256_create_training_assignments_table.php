<?php
// database/migrations/2026_04_04_xxxxxx_create_training_assignments_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('training_assignments')) {
            Schema::create('training_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('training_id')->constrained('trainings')->onDelete('cascade');
                $table->foreignId('employee_id')->constrained('employees');
                $table->foreignId('trainer_id')->nullable()->constrained('employees');
                $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
                $table->date('completed_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('training_assignments');
    }
};