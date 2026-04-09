<?php
// app/Models/JobPosting.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobPosting extends Model
{
    protected $fillable = [
        'title', 'department', 'job_category', 'description', 'status', 'created_by'
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function applicants()
    {
        return $this->hasMany(Applicant::class);
    }
}