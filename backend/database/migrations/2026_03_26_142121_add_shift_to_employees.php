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
        Schema::table('employees', function (Blueprint $table) {
    $table->string('shift_name')->nullable()->default('Regular shift')->after('department');
    $table->string('shift_start')->nullable()->default('08:00')->after('shift_name');
    $table->string('shift_end')->nullable()->default('17:00')->after('shift_start');
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            //
        });
    }
};
