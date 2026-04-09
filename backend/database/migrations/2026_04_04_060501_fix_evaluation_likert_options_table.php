<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // First drop the existing table if it exists
        Schema::dropIfExists('evaluation_likert_options');
        
        // Recreate with correct structure
        Schema::create('evaluation_likert_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_section_id')->constrained('evaluation_sections')->onDelete('cascade');
            $table->string('label');
            $table->integer('value');
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_likert_options');
    }
};