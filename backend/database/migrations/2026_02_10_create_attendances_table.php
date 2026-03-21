<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');

            // Date and time information
            $table->date('date');
            $table->time('time_in')->nullable();
            $table->time('time_out')->nullable();

            // Status tracking
            $table->enum('status', ['present', 'late', 'absent', 'on_leave', 'half_day'])->default('absent');

            // Computed fields
            $table->integer('minutes_late')->default(0);
            $table->decimal('hours_worked', 5, 2)->default(0);

            // Audit trail — nullable so system-generated absences don't require a user
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();

            // Grace period tracking
            $table->boolean('within_grace_period')->default(false);

            // Security tracking
            $table->string('clock_in_ip')->nullable();
            $table->string('clock_out_ip')->nullable();
            $table->string('device_info')->nullable();

            $table->timestamps();

            // Prevent duplicate records for same employee on same day
            $table->unique(['employee_id', 'date']);

            // Performance indexes
            $table->index(['employee_id', 'date']);
            $table->index('status');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};