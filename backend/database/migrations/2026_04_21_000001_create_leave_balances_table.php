<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->enum('leave_type', [
                'vacation', 'sick', 'emergency', 'maternity',
                'paternity', 'bereavement', 'solo_parent', 'unpaid'
            ]);
            $table->float('entitled_days')->default(0);
            $table->float('used_days')->default(0);
            $table->float('carried_over')->default(0);
            $table->integer('year');
            $table->timestamps();

            $table->unique(['employee_id', 'leave_type', 'year']);
            $table->index('employee_id');
            $table->index('year');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_balances');
    }
};
