<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewHire extends Model
{
    protected $fillable = [
        'created_by',
        'onboarding_status',
        'employee_id',
        // Personal
        'first_name', 'last_name', 'middle_name', 'name_extension',
        'date_of_birth', 'email', 'phone_number', 'home_address',
        // Emergency
        'emergency_contact_name', 'emergency_contact_number', 'relationship',
        // Gov IDs
        'tin', 'sss_number', 'pagibig_number', 'philhealth_number',
        // Banking
        'bank_name', 'account_name', 'account_number',
        // Employment
        'start_date', 'department', 'job_category', 'employment_type',
        'role', 'basic_salary', 'reporting_manager', 'shift_sched',
        // Meta
        'completed_fields', 'transferred_at',
        // Recruitment links
        'training_id', 'applicant_id',
    ];

    protected $casts = [
        'date_of_birth'   => 'date',
        'start_date'      => 'date',
        'transferred_at'  => 'datetime',
        'completed_fields'=> 'array',
        'basic_salary'    => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function training(): BelongsTo
    {
        return $this->belongsTo(Training::class);
    }

    // Helper to get the full name
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }
}