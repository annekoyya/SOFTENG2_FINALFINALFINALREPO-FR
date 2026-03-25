<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Each row = one HR evaluator's answer to one question
        Schema::create('evaluation_responses', function (Blueprint $table) {
            $table->id();

            // Which assignment this response belongs to
            $table->foreignId('evaluation_assignment_id')
                  ->constrained('evaluation_assignments')
                  ->cascadeOnDelete();

            // Which question was answered
            $table->foreignId('evaluation_question_id')
                  ->constrained('evaluation_questions')
                  ->cascadeOnDelete();

            // For likert questions — stores the numeric value (4=Excellent, 3=Great, etc.)
            $table->unsignedTinyInteger('likert_value')->nullable();

            // For open-ended questions — stores the text response
            $table->text('text_response')->nullable();

            $table->timestamps();

            // One response per question per assignment
            $table->unique(
                ['evaluation_assignment_id', 'evaluation_question_id'],
                'unique_response_per_question'
            );

            $table->index('evaluation_assignment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_responses');
    }
};