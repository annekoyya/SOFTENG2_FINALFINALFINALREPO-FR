<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// ══════════════════════════════════════════════════════════════════════════════
//  LeaveBalance
// ══════════════════════════════════════════════════════════════════════════════

class LeaveBalance extends Model
{
    protected $fillable = [
        'employee_id', 'leave_type', 'year',
        'entitled_days', 'used_days', 'carried_over',
    ];

    protected $casts = [
        'entitled_days' => 'decimal:1',
        'used_days'     => 'decimal:1',
        'carried_over'  => 'decimal:1',
    ];

    protected $appends = ['remaining_days', 'pending_days'];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /** Remaining = (entitled + carried_over) - used - pending */
    public function getRemainingDaysAttribute(): float
    {
        return max(0,
            (float)$this->entitled_days
            + (float)$this->carried_over
            - (float)$this->used_days
            - (float)$this->getPendingDaysAttribute()
        );
    }

    /** Days currently sitting in pending requests */
    public function getPendingDaysAttribute(): float
    {
        return (float) LeaveRequest::where('employee_id', $this->employee_id)
            ->where('leave_type', $this->leave_type)
            ->where('status', 'pending')
            ->whereYear('start_date', $this->year)
            ->sum('days_requested');
    }

    public function scopeForYear($q, int $year)
    {
        return $q->where('year', $year);
    }

    /**
     * Monthly accrual amounts per leave type (PH Labour Code).
     * Accrued types earn 1.25 days/month = 15/year.
     */
    public static function monthlyAccrual(string $leaveType): float
    {
        return match ($leaveType) {
            'vacation', 'sick' => 1.25,   // 15 days / 12 months
            default            => 0,
        };
    }

    /**
     * Full annual entitlement for non-accrued leave types.
     * These are granted up-front at the start of the year.
     */
    public static function annualEntitlement(string $leaveType): float
    {
        return match ($leaveType) {
            'emergency'   => 3,
            'maternity'   => 105,
            'paternity'   => 7,
            'bereavement' => 3,
            'solo_parent' => 7,
            'unpaid'      => 0,
            default       => 0,
        };
    }

    /** Max days that can carry over to the next year */
    public static function carryOverMax(string $leaveType): float
    {
        return match ($leaveType) {
            'vacation', 'sick' => 5,
            default            => 0,
        };
    }
}


// ══════════════════════════════════════════════════════════════════════════════
//  LeaveRequest (updated model — replace your existing one)
// ══════════════════════════════════════════════════════════════════════════════

class LeaveRequest extends Model
{
    protected $fillable = [
        'employee_id', 'leave_type', 'start_date', 'end_date',
        'days_requested', 'reason', 'status',
        'approved_by', 'rejected_reason',
    ];

    protected $casts = [
        'start_date'     => 'date',
        'end_date'       => 'date',
        'days_requested' => 'decimal:1',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}