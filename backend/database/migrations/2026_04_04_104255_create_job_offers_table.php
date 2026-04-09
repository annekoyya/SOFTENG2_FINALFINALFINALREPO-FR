<?php
// database/migrations/2026_04_04_xxxxxx_create_job_offers_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('job_offers')) {
            Schema::create('job_offers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('applicant_id')->constrained('applicants')->onDelete('cascade');
                $table->decimal('offered_salary', 12, 2);
                $table->date('start_date');
                $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('job_offers');
    }
};