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
 Schema::create('shifts', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('start_time');          // "06:00"
    $table->string('end_time');            // "14:00"
    $table->enum('shift_type', ['morning','afternoon','night','custom'])->default('morning');
    $table->decimal('differential_pct', 5, 2)->default(0); // night differential %
    $table->unsignedSmallInteger('break_minutes')->default(60);
    $table->timestamps();
});
 
// Employee → shift assignments (current assignment per employee)
Schema::create('employee_shifts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
    $table->foreignId('shift_id')->constrained('shifts')->cascadeOnDelete();
    $table->date('effective_date');
    $table->timestamps();
 
    $table->unique(['employee_id']); // one active shift per employee
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shifts_tables');
    }
};
