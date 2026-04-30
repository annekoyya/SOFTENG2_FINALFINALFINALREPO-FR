<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('leave_requests', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->constrained('users');
            }
            if (!Schema::hasColumn('leave_requests', 'approver_id')) {
                $table->foreignId('approver_id')->nullable()->constrained('users');
            }
        });
    }

    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn('approved_by');
            $table->dropForeign(['approver_id']);
            $table->dropColumn('approver_id');
        });
    }
};