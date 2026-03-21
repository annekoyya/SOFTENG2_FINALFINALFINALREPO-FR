<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveRequest extends Model
{
    protected $fillable = [
        'employee_id',
        'start_date',
        'end_date',
        'leave_type',
        'status',
        'number_of_days',
        'hours_requested',
        'approver_id',
        'approved_at',
        'approval_reason',
        'reason',
        'contact_person',
        'contact_phone',
    ];

    protected $casts = [
        'start_date'      => 'date',
        'end_date'        => 'date',
        'approved_at'     => 'datetime',
        'number_of_days'  => 'integer',
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

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Overlapping date range query — catches all leave that touches the given window.
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

    // ─── State Checks ─────────────────────────────────────────────────────────

    public function canApprove(): bool
    {
        return $this->status === 'pending';
    }

    public function canReject(): bool
    {
        return $this->status === 'pending';
    }

    public function canCancel(): bool
    {
        return in_array($this->status, ['pending', 'approved']);
    }

    // ─── Actions ──────────────────────────────────────────────────────────────

    public function approve(int $approverId, string $reason = ''): void
    {
        if (!$this->canApprove()) {
            throw new \Exception('This leave request cannot be approved.');
        }

        $this->update([
            'status'          => 'approved',
            'approver_id'     => $approverId,
            'approved_at'     => now(),
            'approval_reason' => $reason,
        ]);
    }

    public function reject(int $approverId, string $reason): void
    {
        if (!$this->canReject()) {
            throw new \Exception('This leave request cannot be rejected.');
        }

        $this->update([
            'status'          => 'rejected',
            'approver_id'     => $approverId,
            'approved_at'     => now(),
            'approval_reason' => $reason,
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Check if a given date falls within this approved leave period.
     */
    public function isDateInLeave($date): bool
    {
        return $this->status === 'approved'
            && $date->between($this->start_date, $this->end_date);
    }

    public function getLeaveTypeLabel(): string
    {
        return match ($this->leave_type) {
            'vacation'  => 'Vacation',
            'sick'      => 'Sick Leave',
            'emergency' => 'Emergency Leave',
            'unpaid'    => 'Unpaid Leave',
            'maternity' => 'Maternity Leave',
            'paternity' => 'Paternity Leave',
            default     => 'Leave',
        };
    }
}