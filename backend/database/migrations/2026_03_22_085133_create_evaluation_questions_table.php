<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluation_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')
                  ->constrained('evaluation_sections')
                  ->cascadeOnDelete();
            $table->string('question_text');
            $table->enum('question_type', ['likert', 'text', 'numeric'])->default('likert');
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_questions');
    }
};