<?php
// app/Models/Interview.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Interview extends Model
{
    protected $fillable = [
        'applicant_id', 'interviewer_id', 'scheduled_at', 'status', 'feedback'
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function interviewer()
    {
        return $this->belongsTo(User::class, 'interviewer_id');
    }
}