<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int         $id
 * @property int         $evaluation_form_id
 * @property int         $user_id
 * @property string      $status
 * @property string|null $submitted_at
 */
class EvaluationAssignment extends Model
{
    protected $fillable = [
        'evaluation_form_id', 'user_id', 'status', 'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function form(): BelongsTo
    {
        return $this->belongsTo(EvaluationForm::class, 'evaluation_form_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(EvaluationResponse::class);
    }

    public function canSubmit(): bool
    {
        return $this->status === 'pending';
    }

    public function submit(): void
    {
        if (!$this->canSubmit()) {
            throw new \Exception('This evaluation has already been submitted.');
        }
        $this->update([
            'status'       => 'submitted',
            'submitted_at' => now(),
        ]);
    }
}