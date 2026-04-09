<?php
// database/migrations/2026_04_04_xxxxxx_add_sections_data_to_evaluation_forms.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evaluation_forms', function (Blueprint $table) {
            if (!Schema::hasColumn('evaluation_forms', 'sections_data')) {
                $table->json('sections_data')->nullable()->after('date_end');
            }
        });
    }

    public function down(): void
    {
        Schema::table('evaluation_forms', function (Blueprint $table) {
            $table->dropColumn('sections_data');
        });
    }
};