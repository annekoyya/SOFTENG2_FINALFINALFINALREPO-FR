<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int         $id
 * @property string      $first_name
 * @property string      $last_name
 * @property string|null $middle_name
 * @property string|null $name_extension
 * @property string      $date_of_birth
 * @property string      $email
 * @property string      $phone_number
 * @property string      $home_address
 * @property string      $emergency_contact_name
 * @property string      $emergency_contact_number
 * @property string      $relationship
 * @property string|null $tin
 * @property string|null $sss_number
 * @property string|null $pagibig_number
 * @property string|null $philhealth_number
 * @property string|null $bank_name
 * @property string|null $account_name
 * @property string|null $account_number
 * @property string      $start_date
 * @property string|null $end_date
 * @property string      $department
 * @property string      $job_category
 * @property string      $employment_type
 * @property string|null $reporting_manager
 * @property float       $basic_salary
 * @property string      $role
 * @property string      $status
 * @property string|null $photo_path
 * @property int|null    $manager_id
 * @property int|null    $new_hire_id
 */
class Employee extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'new_hire_id',
        'manager_id',
        'role',
        'status',
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
        'end_date',
        'department',
        'job_category',
        'employment_type',
        'reporting_manager',
        'basic_salary',
        'shift_sched',
        'photo_path',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'start_date'    => 'date',
        'end_date'      => 'date',
        'shift_sched' => 'string',
        'basic_salary'  => 'decimal:2',
    ];

    protected $hidden = [
        'tin',
        'sss_number',
        'pagibig_number',
        'philhealth_number',
        'account_number',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function manager(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }

    public function subordinates(): HasMany
    {
        return $this->hasMany(Employee::class, 'manager_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function payrolls(): HasMany
    {
        return $this->hasMany(Payroll::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeByDepartment(Builder $query, string $department): Builder
    {
        return $query->where('department', $department);
    }

    public function scopeByRole(Builder $query, string $role): Builder
    {
        return $query->where('role', $role);
    }

    public function scopeByEmploymentType(Builder $query, string $type): Builder
    {
        return $query->where('employment_type', $type);
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    public function getFullNameAttribute(): string
    {
        $middle = $this->middle_name ? ' ' . strtoupper($this->middle_name[0]) . '.' : '';
        $ext    = $this->name_extension ? ' ' . $this->name_extension : '';

        return "{$this->first_name}{$middle} {$this->last_name}{$ext}";
    }

    /**
     * Use Carbon::parse() explicitly — the 'date' cast returns \DateTime to
     * static analyzers, not Carbon, so ->age and ->diffInDays() would be flagged.
     */
    public function getAgeAttribute(): int
    {
        return Carbon::parse($this->date_of_birth)->age;
    }

    public function getYearsOfServiceAttribute(): float
    {
        return round(Carbon::parse($this->start_date)->diffInDays(now()) / 365, 1);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isOnLeaveToday(): bool
    {
        return $this->leaveRequests()
            ->where('status', 'approved')
            ->where('start_date', '<=', today())
            ->where('end_date', '>=', today())
            ->exists();
    }

    public function todayAttendance(): ?Attendance
    {
        return $this->attendances()->where('date', today())->first();
    }

    public function isClockedInToday(): bool
    {
        $record = $this->todayAttendance();
        return $record && $record->isClockedIn();
    }

    public function getEmploymentTypeLabel(): string
    {
        return match ($this->employment_type) {
            'regular'      => 'Regular',
            'probationary' => 'Probationary',
            'contractual'  => 'Contractual',
            'part_time'    => 'Part-time',
            'intern'       => 'Intern',
            default        => ucfirst($this->employment_type),
        };
    }

    public function getStatusLabel(): string
    {
        return match ($this->status) {
            'active'     => 'Active',
            'on_leave'   => 'On Leave',
            'terminated' => 'Terminated',
            'suspended'  => 'Suspended',
            default      => ucfirst($this->status),
        };
    }

    public function getStatusColor(): string
    {
        return match ($this->status) {
            'active'     => 'green',
            'on_leave'   => 'blue',
            'suspended'  => 'yellow',
            'terminated' => 'red',
            default      => 'gray',
        };
    }
}