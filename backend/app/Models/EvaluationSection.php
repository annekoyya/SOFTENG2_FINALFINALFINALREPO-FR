<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int         $id
 * @property int         $evaluation_form_id
 * @property string      $title
 * @property string|null $description
 * @property string      $type
 * @property int         $order
 */
class EvaluationSection extends Model
{
    protected $fillable = [
        'evaluation_form_id', 'title', 'description', 'type', 'order',
    ];

    public function form(): BelongsTo
    {
        return $this->belongsTo(\App\Models\EvaluationForm::class, 'evaluation_form_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(\App\Models\EvaluationQuestion::class)->orderBy('order');
    }

    public function likertOptions(): HasMany
    {
        return $this->hasMany(\App\Models\EvaluationLikertOption::class)->orderBy('order');
    }
}