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
                'vacation','sick','emergency','maternity',
                'paternity','bereavement','solo_parent','unpaid',
            ]);
            $table->year('year');
            $table->decimal('entitled_days', 5, 1)->default(0);
            $table->decimal('used_days',     5, 1)->default(0);
            $table->decimal('carried_over',  5, 1)->default(0);
            $table->timestamps();

            // One balance record per employee per type per year
            $table->unique(['employee_id', 'leave_type', 'year']);
        });

        // Add columns to existing leave_requests if not already present
        Schema::table('leave_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('leave_requests', 'days_requested')) {
                $table->decimal('days_requested', 5, 1)->default(1)->after('end_date');
            }
            if (!Schema::hasColumn('leave_requests', 'rejected_reason')) {
                $table->text('rejected_reason')->nullable()->after('approved_by');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_balances');
    }
};