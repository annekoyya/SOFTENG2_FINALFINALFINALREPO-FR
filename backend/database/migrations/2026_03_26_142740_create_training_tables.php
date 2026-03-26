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
        Schema::create('training_courses', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->string('category')->default('Orientation');
    $table->text('description')->nullable();
    $table->decimal('duration_hours', 5, 1)->default(1);
    $table->unsignedSmallInteger('validity_months')->nullable(); // null = no expiry
    $table->boolean('is_mandatory')->default(false);
    $table->timestamps();
});
 
Schema::create('training_assignments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
    $table->foreignId('course_id')->constrained('training_courses')->cascadeOnDelete();
    $table->enum('status', ['assigned','in_progress','completed','expired'])->default('assigned');
    $table->date('assigned_date')->useCurrent();
    $table->date('due_date')->nullable();
    $table->date('completed_date')->nullable();
    $table->date('expires_at')->nullable();
    $table->unsignedTinyInteger('score')->nullable(); // 0-100
    $table->text('notes')->nullable();
    $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('training_tables');
    }
};
