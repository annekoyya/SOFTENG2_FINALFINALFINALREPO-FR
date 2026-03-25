<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluation_forms', function (Blueprint $table) {
            $table->id();

            $table->string('title');
            $table->text('description')->nullable();

            // Department this evaluation is about
            $table->string('department');

            // Admin/Manager who created it
            $table->foreignId('created_by')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->enum('status', ['draft', 'active', 'closed'])->default('draft');

            // Deadline for HR evaluators to submit
            $table->date('deadline')->nullable();

            // Period dates
            $table->date('date_start')->nullable();
            $table->date('date_end')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index(['department', 'status']);
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_forms');
    }
};