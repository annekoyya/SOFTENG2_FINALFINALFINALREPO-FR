<?php
// app/Models/Applicant.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Applicant extends Model
{
    protected $fillable = [
        'first_name', 'last_name', 'email', 'phone', 'resume_path',
        'job_posting_id', 'pipeline_stage', 'notes', 'hired_at'
    ];

    public function jobPosting()
    {
        return $this->belongsTo(JobPosting::class);
    }

    public function interview()
    {
        return $this->hasOne(Interview::class);
    }

    public function training()
    {
        return $this->hasOne(Training::class);
    }
    
    public function newHire()
    {
        return $this->hasOne(NewHire::class);
    }
    
    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }
}