<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up()
{
    Schema::table('employees', function (Blueprint $table) {
        // Modify the status enum to include 'onboarding'
        $table->enum('status', ['active', 'on_leave', 'terminated', 'suspended', 'onboarding'])->default('onboarding')->change();
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
