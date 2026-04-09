<?php
// app/Models/EvaluationForm.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EvaluationForm extends Model
{
    use SoftDeletes;
    
    protected $table = 'evaluation_forms';
    
    protected $fillable = [
        'title',
        'description',
        'department',
        'created_by',
        'status',
        'deadline',
        'date_start',
        'date_end',
        'sections_data',
    ];

    protected $casts = [
        'deadline' => 'date',
        'date_start' => 'date',
        'date_end' => 'date',
        'sections_data' => 'array',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(EvaluationAssignment::class, 'evaluation_form_id');
    }
    
    public function sections()
    {
        return $this->hasMany(EvaluationSection::class, 'evaluation_form_id');
    }
}