<?php
// app/Models/EvaluationAssignment.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EvaluationAssignment extends Model
{
    protected $table = 'evaluation_assignments';
    
    protected $fillable = [
        'evaluation_form_id',
        'user_id',
        'status',
        'submitted_at',
        'responses_data',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'responses_data' => 'array',
    ];

    public function form(): BelongsTo
    {
        return $this->belongsTo(EvaluationForm::class, 'evaluation_form_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    
    public function responses()
    {
        return $this->hasMany(EvaluationResponse::class, 'evaluation_assignment_id');
    }
}