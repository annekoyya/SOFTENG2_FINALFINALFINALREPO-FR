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
        Schema::create('notifications', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->enum('type', [
        'leave_request','leave_approved','leave_rejected',
        'payslip_ready','overtime_approved','overtime_rejected',
        'new_hire_ready','offer_accepted','general',
    ])->default('general');
    $table->string('title');
    $table->text('body');
    $table->string('link')->nullable();   // frontend route e.g. /leave
    $table->boolean('read')->default(false);
    $table->timestamps();
 
    $table->index(['user_id', 'read']);
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
