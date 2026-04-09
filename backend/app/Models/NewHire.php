<?php
// app/Models/NewHire.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewHire extends Model
{
    protected $fillable = [
        'created_by',
        'status',
        'onboarding_status',
        'employee_id',
        'first_name',
        'last_name',
        'middle_name',
        'name_extension',
        'date_of_birth',
        'email',
        'phone_number',
        'home_address',
        'emergency_contact_name',
        'emergency_contact_number',
        'relationship',
        'tin',
        'sss_number',
        'pagibig_number',
        'philhealth_number',
        'bank_name',
        'account_name',
        'account_number',
        'start_date',
        'department',
        'job_category',
        'employment_type',
        'role',
        'basic_salary',
        'reporting_manager',
        'completed_fields',
        'transferred_at',
        'training_id',
        'applicant_id',
    ];

    protected $casts = [
        'completed_fields' => 'array',
        'transferred_at' => 'datetime',
        'date_of_birth' => 'date',
        'start_date' => 'date',
        'basic_salary' => 'decimal:2',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function training()
    {
        return $this->belongsTo(Training::class);
    }

    public function applicant()
    {
        return $this->belongsTo(Applicant::class);
    }
}