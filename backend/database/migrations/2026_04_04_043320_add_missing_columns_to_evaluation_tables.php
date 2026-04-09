<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add sections_data to evaluation_forms
        if (Schema::hasTable('evaluation_forms')) {
            Schema::table('evaluation_forms', function (Blueprint $table) {
                if (!Schema::hasColumn('evaluation_forms', 'sections_data')) {
                    $table->json('sections_data')->nullable();
                }
                if (!Schema::hasColumn('evaluation_forms', 'date_start')) {
                    $table->date('date_start')->nullable();
                }
            });
        }
        
        // Add responses_data to evaluation_assignments
        if (Schema::hasTable('evaluation_assignments')) {
            Schema::table('evaluation_assignments', function (Blueprint $table) {
                if (!Schema::hasColumn('evaluation_assignments', 'responses_data')) {
                    $table->json('responses_data')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('evaluation_forms')) {
            Schema::table('evaluation_forms', function (Blueprint $table) {
                $table->dropColumn(['sections_data', 'date_start']);
            });
        }
        
        if (Schema::hasTable('evaluation_assignments')) {
            Schema::table('evaluation_assignments', function (Blueprint $table) {
                $table->dropColumn('responses_data');
            });
        }
    }
};