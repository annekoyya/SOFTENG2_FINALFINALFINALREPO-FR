<?php
// app/Models/JobOffer.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobOffer extends Model
{
    protected $fillable = [
        'applicant_id', 'offered_salary', 'start_date', 'status', 'notes'
    ];

    protected $casts = [
        'start_date' => 'date',
    ];

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }
}