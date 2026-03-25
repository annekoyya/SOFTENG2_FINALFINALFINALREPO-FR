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
        Schema::create('job_offers', function (Blueprint $table) {
    $table->id();
    $table->foreignId('applicant_id')->constrained('applicants')->cascadeOnDelete();
    $table->foreignId('job_posting_id')->constrained('job_postings')->cascadeOnDelete();
    $table->decimal('offered_salary', 10, 2);
    $table->date('start_date');
    $table->enum('status', ['pending','accepted','declined','expired'])->default('pending');
    $table->text('notes')->nullable();
    $table->foreignId('offered_by')->constrained('users')->cascadeOnDelete();
    $table->timestamp('expires_at')->nullable();
    $table->timestamp('responded_at')->nullable();
    // Once accepted + converted, link to the resulting new_hire record
    $table->foreignId('new_hire_id')->nullable()->constrained('new_hires')->nullOnDelete();
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
