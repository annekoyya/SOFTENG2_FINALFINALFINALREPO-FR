<?php
// database/migrations/2026_04_04_xxxxxx_fix_evaluation_questions_column.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evaluation_questions', function (Blueprint $table) {
            if (Schema::hasColumn('evaluation_questions', 'section_id')) {
                $table->renameColumn('section_id', 'evaluation_section_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('evaluation_questions', function (Blueprint $table) {
            if (Schema::hasColumn('evaluation_questions', 'evaluation_section_id')) {
                $table->renameColumn('evaluation_section_id', 'section_id');
            }
        });
    }
};