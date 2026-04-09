<?php
// database/migrations/2026_04_04_xxxxxx_create_applicants_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('applicants')) {
            Schema::create('applicants', function (Blueprint $table) {
                $table->id();
                $table->string('first_name');
                $table->string('last_name');
                $table->string('email');
                $table->string('phone');
                $table->string('resume_path')->nullable();
                $table->foreignId('job_posting_id')->constrained('job_postings')->onDelete('cascade');
                $table->enum('status', ['new', 'reviewed', 'interviewed', 'offered', 'hired', 'rejected'])->default('new');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('applicants');
    }
};