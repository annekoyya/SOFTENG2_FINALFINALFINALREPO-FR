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
        Schema::create('job_postings', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->string('department');
    $table->enum('employment_type', ['full_time','part_time','contractual','probationary'])
          ->default('full_time');
    $table->string('location')->default('Blue Lotus Hotel, Davao City');
    $table->decimal('salary_min', 10, 2)->nullable();
    $table->decimal('salary_max', 10, 2)->nullable();
    $table->text('description');
    $table->text('requirements')->nullable();
    $table->unsignedSmallInteger('slots')->default(1);
    $table->enum('status', ['draft','open','closed','cancelled'])->default('open');
    $table->foreignId('posted_by')->constrained('users')->cascadeOnDelete();
    $table->timestamp('closes_at')->nullable();
    $table->timestamps();
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
