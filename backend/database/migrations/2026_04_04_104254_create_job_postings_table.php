<?php
// database/migrations/2026_04_04_xxxxxx_create_job_postings_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('job_postings')) {
            Schema::create('job_postings', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('department');
                $table->string('job_category');
                $table->text('description');
                $table->enum('status', ['open', 'closed'])->default('open');
                $table->foreignId('created_by')->constrained('users');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('job_postings');
    }
};