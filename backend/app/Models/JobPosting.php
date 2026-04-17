<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobPosting extends Model
{
    protected $fillable = [
        'title', 'department', 'job_category',
        'description', 'status', 'slots',
        'posted_date', 'deadline', 'created_by',
    ];

    protected $casts = [
        'posted_date' => 'date',
        'deadline'    => 'date',
        'slots'       => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function applicants(): HasMany
    {
        return $this->hasMany(Applicant::class);
    }

    // Check if slots are still available
    public function hasAvailableSlots(): bool
    {
        if (!$this->slots) return true;
        $hired = $this->applicants()->where('pipeline_stage', 'hired')->count();
        return $hired < $this->slots;
    }
}