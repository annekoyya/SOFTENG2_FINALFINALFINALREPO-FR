<?php
// app/Models/TrainingAssignment.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingAssignment extends Model
{
    protected $fillable = [
        'training_id', 'applicant_id', 'trainer_id', 'status', 'completed_at'
    ];

    protected $casts = [
        'completed_at' => 'date',
    ];

    public function training()
    {
        return $this->belongsTo(Training::class);
    }

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function trainer()
    {
        return $this->belongsTo(Employee::class, 'trainer_id');
    }
}