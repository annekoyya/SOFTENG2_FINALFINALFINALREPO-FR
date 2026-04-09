<?php
// app/Models/TrainingAssignment.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingAssignment extends Model
{
    protected $table = 'training_assignments';
    
    protected $fillable = [
        'training_id',
        'applicant_id',  
        'employee_id',
        'trainer_id',
        'status',
        'completed_at'
    ];

    protected $casts = [
        'completed_at' => 'date',
    ];

    public function training()
    {
        return $this->belongsTo(Training::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function trainer()
    {
        return $this->belongsTo(Employee::class, 'trainer_id');
    }
}