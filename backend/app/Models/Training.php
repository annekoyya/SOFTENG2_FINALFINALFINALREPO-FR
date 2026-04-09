<?php
// app/Models/Training.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Training extends Model
{
    protected $fillable = [
        'title', 'description', 'material_path', 'applicant_id', 'created_by'
    ];

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }

    public function assignments()
    {
        return $this->hasMany(TrainingAssignment::class);
    }
    
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}