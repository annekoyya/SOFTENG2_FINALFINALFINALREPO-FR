<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class LeaveRequest extends Model
{
    protected $fillable = [
        'employee_id',
        'leave_type',
        'start_date',
        'end_date',
        'days_requested',
        'number_of_days',
        'hours_requested',
        'reason',
        'status',
        'approver_id',
        'approved_by',
        'approved_at',
        'approval_reason',
        'rejected_reason',
        'contact_person',
        'contact_phone',
    ];

    protected $casts = [
        'start_date'  => 'date',
        'end_date'    => 'date',
        'approved_at' => 'datetime',
        'days_requested' => 'float',
        'number_of_days' => 'float',
        'hours_requested' => 'decimal:2',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    /**
     * Scope for pending leave requests
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for approved leave requests
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope for rejected leave requests
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Scope for cancelled leave requests
     */
    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    /**
     * Scope for leave requests by type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('leave_type', $type);
    }

    /**
     * Scope for leave requests in a date range
     * Catches all leave that touches the given window
     */
    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
              ->orWhereBetween('end_date', [$startDate, $endDate])
              ->orWhere(function ($q) use ($startDate, $endDate) {
                  $q->where('start_date', '<=', $startDate)
                    ->where('end_date', '>=', $endDate);
              });
        });
    }

    /**
     * Scope for current year
     */
    public function scopeCurrentYear($query)
    {
        return $query->whereYear('start_date', now()->year);
    }

    // ─── State Checks ─────────────────────────────────────────────────────────

    /**
     * Check if leave request can be approved
     */
    public function canApprove(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if leave request can be rejected
     */
    public function canReject(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if leave request can be cancelled
     */
    public function canCancel(): bool
    {
        return in_array($this->status, ['pending', 'approved']);
    }

    /**
     * Check if leave request is currently active (approved and today is within range)
     */
    public function isActive(): bool
    {
        if ($this->status !== 'approved') {
            return false;
        }
        
        $today = Carbon::today();
        return $today->between($this->start_date, $this->end_date);
    }

    /**
     * Check if leave request is upcoming (approved and start date in future)
     */
    public function isUpcoming(): bool
    {
        if ($this->status !== 'approved') {
            return false;
        }
        
        return Carbon::today()->lt($this->start_date);
    }

    /**
     * Check if leave request is past (end date passed)
     */
    public function isPast(): bool
    {
        return Carbon::today()->gt($this->end_date);
    }

    // ─── Actions ──────────────────────────────────────────────────────────────

    /**
     * Approve the leave request
     */
    public function approve(int $approverId, string $reason = ''): void
    {
        if (!$this->canApprove()) {
            throw new \Exception('This leave request cannot be approved.');
        }

        $this->update([
            'status'          => 'approved',
            'approver_id'     => $approverId,
            'approved_by'     => $approverId,
            'approved_at'     => now(),
            'approval_reason' => $reason,
        ]);
    }

    /**
     * Reject the leave request
     */
    public function reject(int $approverId, string $reason): void
    {
        if (!$this->canReject()) {
            throw new \Exception('This leave request cannot be rejected.');
        }

        $this->update([
            'status'          => 'rejected',
            'approver_id'     => $approverId,
            'approved_by'     => $approverId,
            'approved_at'     => now(),
            'rejected_reason' => $reason,
        ]);
    }

    /**
     * Cancel the leave request (employee can cancel pending/approved)
     */
    public function cancel(): void
    {
        if (!$this->canCancel()) {
            throw new \Exception('This leave request cannot be cancelled.');
        }

        $this->update(['status' => 'cancelled']);
    }

    // ─── Calculations ─────────────────────────────────────────────────────────

    /**
     * Calculate number of days requested (business days only)
     */
    public function calculateDaysRequested(): float
    {
        $start = Carbon::parse($this->start_date);
        $end = Carbon::parse($this->end_date);
        $days = 0;
        
        while ($start->lte($end)) {
            // Skip weekends (Saturday = 6, Sunday = 7)
            if (!in_array($start->dayOfWeek, [6, 7])) {
                $days++;
            }
            $start->addDay();
        }
        
        return (float) $days;
    }

    /**
     * Get the number of days (with fallback to stored value)
     */
    public function getDaysCount(): float
    {
        return (float) ($this->days_requested ?? $this->number_of_days ?? $this->calculateDaysRequested());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Check if a given date falls within this approved leave period
     */
    public function isDateInLeave($date): bool
    {
        if ($this->status !== 'approved') {
            return false;
        }
        
        $checkDate = $date instanceof Carbon ? $date : Carbon::parse($date);
        return $checkDate->between($this->start_date, $this->end_date);
    }

    /**
     * Get human-readable leave type label
     */
    public function getLeaveTypeLabel(): string
    {
        return match ($this->leave_type) {
            'vacation'    => 'Vacation Leave',
            'sick'        => 'Sick Leave',
            'emergency'   => 'Emergency Leave',
            'unpaid'      => 'Unpaid Leave',
            'maternity'   => 'Maternity Leave',
            'paternity'   => 'Paternity Leave',
            'bereavement' => 'Bereavement Leave',
            'solo_parent' => 'Solo Parent Leave',
            default       => ucfirst(str_replace('_', ' ', $this->leave_type)),
        };
    }

    /**
     * Get status badge color for UI
     */
    public function getStatusColor(): string
    {
        return match ($this->status) {
            'pending'   => 'yellow',
            'approved'  => 'green',
            'rejected'  => 'red',
            'cancelled' => 'gray',
            default     => 'gray',
        };
    }

    /**
     * Get status label for UI
     */
    public function getStatusLabel(): string
    {
        return match ($this->status) {
            'pending'   => 'Pending Approval',
            'approved'  => 'Approved',
            'rejected'  => 'Rejected',
            'cancelled' => 'Cancelled',
            default     => ucfirst($this->status),
        };
    }

    /**
     * Get date range as formatted string
     */
    public function getDateRangeFormatted(): string
    {
        $start = Carbon::parse($this->start_date)->format('M d, Y');
        $end = Carbon::parse($this->end_date)->format('M d, Y');
        
        if ($start === $end) {
            return $start;
        }
        
        return "{$start} - {$end}";
    }

    /**
     * Check if leave request overlaps with another leave request
     */
    public function overlapsWith(LeaveRequest $other): bool
    {
        return $this->start_date <= $other->end_date && $this->end_date >= $other->start_date;
    }

    /**
     * Get remaining days for this leave type (if balance is tracked)
     */
    public function getRemainingBalance(?LeaveBalance $balance = null): ?float
    {
        if (!$balance) {
            $balance = LeaveBalance::where('employee_id', $this->employee_id)
                ->where('leave_type', $this->leave_type)
                ->where('year', now()->year)
                ->first();
        }
        
        if (!$balance) {
            return null;
        }
        
        return max(0, $balance->entitled_days + $balance->carried_over - $balance->used_days);
    }
}