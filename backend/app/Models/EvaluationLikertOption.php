<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int    $id
 * @property int    $evaluation_section_id
 * @property string $label
 * @property int    $value
 * @property int    $order
 */
class EvaluationLikertOption extends Model
{
    protected $fillable = [
        'evaluation_section_id', 'label', 'value', 'order',
    ];

    protected $casts = [
        'value' => 'integer',
        'order' => 'integer',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(\App\Models\EvaluationSection::class, 'evaluation_section_id');
    }
}