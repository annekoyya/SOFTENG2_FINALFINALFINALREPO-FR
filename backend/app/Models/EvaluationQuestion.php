<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int    $id
 * @property int    $evaluation_section_id
 * @property string $text
 * @property string $type
 * @property int    $order
 */
class EvaluationQuestion extends Model
{
    protected $fillable = [
        'evaluation_section_id', 'text', 'type', 'order',
    ];

    protected $casts = [
        'order' => 'integer',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(EvaluationSection::class, 'evaluation_section_id');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(EvaluationResponse::class);
    }

    public function isLikert(): bool
    {
        return $this->type === 'likert';
    }

    public function isOpenEnded(): bool
    {
        return $this->type === 'open_ended';
    }
}