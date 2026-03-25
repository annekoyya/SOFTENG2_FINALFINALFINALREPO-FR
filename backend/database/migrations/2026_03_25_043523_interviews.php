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
        Schema::create('interviews', function (Blueprint $table) {
    $table->id();
    $table->foreignId('applicant_id')->constrained('applicants')->cascadeOnDelete();
    $table->enum('interview_type', ['phone','video','onsite','technical'])->default('onsite');
    $table->dateTime('scheduled_at');
    $table->string('location')->nullable();
    $table->foreignId('interviewer_id')->constrained('users')->cascadeOnDelete();
    $table->enum('result', ['pending','passed','failed','no_show'])->default('pending');
    $table->text('feedback')->nullable();
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
