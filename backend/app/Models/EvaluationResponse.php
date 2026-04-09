<?php
// app/Models/EvaluationResponse.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EvaluationResponse extends Model
{
    protected $fillable = [
        'evaluation_assignment_id',
        'evaluation_question_id',
        'likert_value',
        'text_response',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(EvaluationAssignment::class, 'evaluation_assignment_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(EvaluationQuestion::class, 'evaluation_question_id');
    }
}