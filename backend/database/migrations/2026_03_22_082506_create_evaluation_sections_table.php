<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluation_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_form_id')->constrained('evaluation_forms')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['likert', 'open_ended'])->default('likert');
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
            $table->index(['evaluation_form_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_sections');
    }
};
