<?php
// app/Models/EvaluationSection.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EvaluationSection extends Model
{
    protected $fillable = [
        'evaluation_form_id',
        'title',
        'description',
        'type',
        'order',
    ];

    public function form(): BelongsTo
    {
        return $this->belongsTo(EvaluationForm::class, 'evaluation_form_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(EvaluationQuestion::class, 'evaluation_section_id');
    }
}