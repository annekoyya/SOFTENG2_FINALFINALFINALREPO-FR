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
        Schema::create('employees', function (Blueprint $table) {
    $table->id(); // PK 
    $table->unsignedBigInteger('new_hire_id')->nullable(); // FK to NewHires 
    $table->foreignId('employee_id')->nullable()->constrained('employees')->onDelete('cascade');
$table->string('role')->default('Employee'); // To identify if they are Admin, HR, or Staff
    
    // Personal & Contact Information 
    $table->string('first_name');
    $table->string('last_name');
    $table->string('middle_name')->nullable();
    $table->string('name_extension')->nullable();
    $table->date('date_of_birth');
    $table->string('email')->unique();
    $table->string('phone_number');
    $table->text('home_address');

    // Emergency Contact 
    $table->string('emergency_contact_name');
    $table->string('emergency_contact_number');
    $table->string('relationship');

    // Government IDs & Banking 
    $table->string('tin')->nullable();
    $table->string('sss_number')->nullable();
    $table->string('pagibig_number')->nullable();
    $table->string('bank_name')->nullable();
    $table->string('account_name')->nullable();
    $table->string('account_number')->nullable();

    // Employment Details 
    $table->date('start_date');
    $table->string('department'); 
    $table->string('job_category');
    $table->string('employment_type'); // e.g., Regular, Probationary 
    $table->string('reporting_manager')->nullable();

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
