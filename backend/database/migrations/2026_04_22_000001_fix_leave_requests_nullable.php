<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite doesn't support modifyColumn, so we recreate the table
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->integer('number_of_days')->default(0)->change();
            $table->decimal('hours_requested', 5, 2)->default(0)->change();
        });
    }

    public function down(): void {}
};
