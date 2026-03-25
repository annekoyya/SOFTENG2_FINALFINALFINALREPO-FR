<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int      $id
 * @property int      $evaluation_assignment_id
 * @property int      $evaluation_question_id
 * @property int|null $likert_value
 * @property string|null $text_response
 */
class EvaluationResponse extends Model
{
    protected $fillable = [
        'evaluation_assignment_id',
        'evaluation_question_id',
        'likert_value',
        'text_response',
    ];

    protected $casts = [
        'likert_value' => 'integer',
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