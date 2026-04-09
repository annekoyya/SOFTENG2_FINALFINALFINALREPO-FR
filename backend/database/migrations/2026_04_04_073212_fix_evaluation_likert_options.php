<?php
// database/migrations/2026_04_04_xxxxxx_fix_evaluation_likert_options.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evaluation_likert_options', function (Blueprint $table) {
            if (!Schema::hasColumn('evaluation_likert_options', 'evaluation_section_id')) {
                $table->foreignId('evaluation_section_id')->after('id')->constrained('evaluation_sections')->onDelete('cascade');
            }
            if (!Schema::hasColumn('evaluation_likert_options', 'order')) {
                $table->integer('order')->default(0);
            }
        });
    }

    public function down(): void
    {
        Schema::table('evaluation_likert_options', function (Blueprint $table) {
            $table->dropColumn(['evaluation_section_id', 'order']);
        });
    }
};