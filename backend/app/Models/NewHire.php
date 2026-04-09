<?php
// app/Models/NewHire.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewHire extends Model
{
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'department',
        'job_category',
        'start_date',
        'offered_salary',
        'status',      // pending, in_progress, completed, transferred
        'source',      // recruitment, direct
        'applicant_id',
        'training_id',
        'employee_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'offered_salary' => 'decimal:2',
    ];

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function training()
    {
        return $this->belongsTo(Training::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}