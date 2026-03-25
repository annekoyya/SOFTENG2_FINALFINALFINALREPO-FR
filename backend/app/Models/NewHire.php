<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

/**
 * @property int         $id
 * @property int         $created_by
 * @property string      $onboarding_status
 * @property int|null    $employee_id
 * @property string      $first_name
 * @property string      $last_name
 * @property string      $email
 * @property array|null  $completed_fields
 */
class NewHire extends Model
{
    protected $fillable = [
        'created_by', 'onboarding_status', 'employee_id',
        'first_name', 'last_name', 'middle_name', 'name_extension',
        'date_of_birth', 'email', 'phone_number', 'home_address',
        'emergency_contact_name', 'emergency_contact_number', 'relationship',
        'tin', 'sss_number', 'pagibig_number', 'philhealth_number',
        'bank_name', 'account_name', 'account_number',
        'start_date', 'department', 'job_category', 'employment_type',
        'role', 'basic_salary', 'reporting_manager',
        'completed_fields', 'transferred_at',
    ];

    protected $casts = [
        'date_of_birth'    => 'date',
        'start_date'       => 'date',
        'transferred_at'   => 'datetime',
        'basic_salary'     => 'float',
        'completed_fields' => 'array',
    ];

    // Required fields that must ALL be filled before auto-transfer
    public const REQUIRED_FIELDS = [
        'first_name', 'last_name', 'date_of_birth', 'email',
        'phone_number', 'home_address',
        'emergency_contact_name', 'emergency_contact_number', 'relationship',
        'start_date', 'department', 'job_category', 'employment_type',
        'basic_salary',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Employee::class);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Check if all required fields are filled.
     */
    public function isComplete(): bool
    {
        foreach (self::REQUIRED_FIELDS as $field) {
            if (empty($this->getAttribute($field))) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get list of still-missing required fields.
     */
    public function getMissingFields(): array
    {
        return array_filter(
            self::REQUIRED_FIELDS,
            fn($f) => empty($this->getAttribute($f))
        );
    }

    /**
     * Auto-transfer to employees table if all required fields are filled.
     * Called automatically after every update.
     */
    public function attemptTransfer(): bool
    {
        if ($this->onboarding_status === 'transferred') return false;
        if (!$this->isComplete()) return false;

        $employee = DB::transaction(function () {
            $employee = \App\Models\Employee::create([
                'new_hire_id'              => $this->id,
                'first_name'               => $this->first_name,
                'last_name'                => $this->last_name,
                'middle_name'              => $this->middle_name,
                'name_extension'           => $this->name_extension,
                'date_of_birth'            => $this->date_of_birth,
                'email'                    => $this->email,
                'phone_number'             => $this->phone_number,
                'home_address'             => $this->home_address,
                'emergency_contact_name'   => $this->emergency_contact_name,
                'emergency_contact_number' => $this->emergency_contact_number,
                'relationship'             => $this->relationship,
                'tin'                      => $this->tin,
                'sss_number'               => $this->sss_number,
                'pagibig_number'           => $this->pagibig_number,
                'philhealth_number'        => $this->philhealth_number,
                'bank_name'                => $this->bank_name,
                'account_name'             => $this->account_name,
                'account_number'           => $this->account_number,
                'start_date'               => $this->start_date,
                'department'               => $this->department,
                'job_category'             => $this->job_category,
                'employment_type'          => $this->employment_type,
                'role'                     => $this->role,
                'basic_salary'             => $this->basic_salary ?? 0,
                'reporting_manager'        => $this->reporting_manager,
                'status'                   => 'active',
            ]);

            $this->update([
                'onboarding_status' => 'transferred',
                'employee_id'       => $employee->id,
                'transferred_at'    => now(),
            ]);

            return $employee;
        });

        return $employee !== null;
    }

    public function getCompletionPercentage(): int
    {
        $total   = count(self::REQUIRED_FIELDS);
        $missing = count($this->getMissingFields());
        return (int) round((($total - $missing) / $total) * 100);
    }
}