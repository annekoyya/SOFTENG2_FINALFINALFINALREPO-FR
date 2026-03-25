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
       Schema::create('applicants', function (Blueprint $table) {
    $table->id();
    $table->foreignId('job_posting_id')->constrained('job_postings')->cascadeOnDelete();
    $table->string('first_name');
    $table->string('last_name');
    $table->string('email');
    $table->string('phone')->nullable();
    $table->text('address')->nullable();
    $table->string('resume_path')->nullable();
    $table->text('cover_letter')->nullable();
    $table->enum('source', ['referral','walk_in','online','agency','other'])->default('online');
    $table->enum('status', [
        'applied','screening','interview','offer','hired','rejected','withdrawn'
    ])->default('applied');
    $table->unsignedTinyInteger('rating')->nullable(); // 1-5
    $table->text('notes')->nullable();
    $table->timestamp('applied_at')->useCurrent();
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
