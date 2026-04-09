<?php
// database/migrations/2026_04_04_xxxxxx_create_interviews_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('interviews')) {
            Schema::create('interviews', function (Blueprint $table) {
                $table->id();
                $table->foreignId('applicant_id')->constrained('applicants')->onDelete('cascade');
                $table->foreignId('interviewer_id')->constrained('users');
                $table->dateTime('scheduled_at');
                $table->enum('status', ['scheduled', 'completed', 'cancelled'])->default('scheduled');
                $table->text('feedback')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};