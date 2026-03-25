<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Each row = one HR user assigned to fill out one evaluation form
        Schema::create('evaluation_assignments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('evaluation_form_id')
                  ->constrained('evaluation_forms')
                  ->cascadeOnDelete();

            // The HR user assigned to fill this out
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->enum('status', ['pending', 'submitted'])->default('pending');
            $table->timestamp('submitted_at')->nullable();

            $table->timestamps();

            // One assignment per user per form
            $table->unique(['evaluation_form_id', 'user_id']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_assignments');
    }
};