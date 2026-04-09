<?php
// database/migrations/2026_04_09_000000_fix_applicants_pipeline_stage_enum.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;  // Add this line


return new class extends Migration
{
    public function up(): void
    {
        // SQLite doesn't support modifying ENUM directly, so we need to recreate
        // First, check if the column exists and what values it has
        Schema::table('applicants', function (Blueprint $table) {
            // For SQLite, we need to create a new temporary column
            if (Schema::hasColumn('applicants', 'pipeline_stage')) {
                // Add a new text column
                $table->text('pipeline_stage_new')->nullable();
            }
        });

        // Copy data to new column
        DB::statement("UPDATE applicants SET pipeline_stage_new = pipeline_stage");

        // Drop old column
        Schema::table('applicants', function (Blueprint $table) {
            $table->dropColumn('pipeline_stage');
        });

        // Recreate column with proper values
        Schema::table('applicants', function (Blueprint $table) {
            $table->enum('pipeline_stage', [
                'applied', 'reviewed', 'interview_scheduled', 
                'interviewed', 'hired', 'rejected'
            ])->default('applied');
        });

        // Copy data back
        DB::statement("UPDATE applicants SET pipeline_stage = pipeline_stage_new");

        // Drop temporary column
        Schema::table('applicants', function (Blueprint $table) {
            $table->dropColumn('pipeline_stage_new');
        });
    }

    public function down(): void
    {
        // Revert changes if needed
        Schema::table('applicants', function (Blueprint $table) {
            if (Schema::hasColumn('applicants', 'pipeline_stage')) {
                $table->dropColumn('pipeline_stage');
                $table->string('pipeline_stage')->nullable();
            }
        });
    }
};