<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds columns needed for bonus tracking and deduction warnings
 * to the existing payslips table.
 *
 * Run: php artisan migrate
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->decimal('total_bonuses', 12, 2)->default(0)->after('total_allowances');
            $table->boolean('has_warnings')->default(false)->after('net_pay');
            $table->json('deduction_warnings')->nullable()->after('has_warnings');
        });
    }

    public function down(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->dropColumn(['total_bonuses', 'has_warnings', 'deduction_warnings']);
        });
    }
};