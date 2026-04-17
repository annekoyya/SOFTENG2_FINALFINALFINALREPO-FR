<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Attendance extends Model
{
    protected $fillable = [
        'employee_id',
        'date',
        'time_in',
        'time_out',
        'status',
        'minutes_late',
        'hours_worked',
        'recorded_by',
        'notes',
        'within_grace_period',
        'clock_in_ip',
        'clock_out_ip',
        'device_info',
    ];

    protected $casts = [
        'date'                => 'date',
        'within_grace_period' => 'boolean',
        'minutes_late'        => 'integer',
        'hours_worked'        => 'decimal:2',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeForDate($query, $date)
    {
        return $query->where('date', $date);
    }

    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeToday($query)
    {
        return $query->where('date', today());
    }

    public function scopeForMonth($query, $year, $month)
    {
        return $query->whereYear('date', $year)
                     ->whereMonth('date', $month);
    }

    // ─── State Checks ─────────────────────────────────────────────────────────

    /**
     * Check if employee is currently clocked in (has time_in but no time_out)
     */
    public function isClockedIn(): bool
    {
        return $this->time_in !== null && $this->time_out === null;
    }

    /**
     * Check if employee can clock out
     */
    public function canClockOut(): bool
    {
        return $this->isClockedIn();
    }

    // ─── Calculations ─────────────────────────────────────────────────────────

    /**
     * Calculate and return hours worked between time_in and time_out
     */
    public function calculateHoursWorked(): float
    {
        if ($this->time_in === null || $this->time_out === null) {
            return 0;
        }

        $timeIn = Carbon::createFromTimeString($this->time_in);
        $timeOut = Carbon::createFromTimeString($this->time_out);

        // Handle overnight shifts
        if ($timeOut->lt($timeIn)) {
            $timeOut->addDay();
        }

        return round($timeOut->diffInMinutes($timeIn) / 60, 2);
    }

    /**
     * Check if employee clocked in after their shift start time
     */
    public function isLate(?string $shiftStartTime = null): bool
    {
        if ($this->time_in === null) {
            return false;
        }

        // Get shift start from employee if not provided
        if ($shiftStartTime === null && $this->employee) {
            $shiftStartTime = $this->employee->shift_sched ?? 'morning';
            $shiftStartTime = $this->getShiftStartTime($shiftStartTime);
        }

        $shiftStart = Carbon::createFromTimeString($shiftStartTime ?? '07:00');
        $clockIn = Carbon::createFromTimeString($this->time_in);

        return $clockIn->gt($shiftStart);
    }

    /**
     * Calculate minutes late from shift start
     */
    public function calculateMinutesLate(?string $shiftStartTime = null): int
    {
        if ($this->time_in === null) {
            return 0;
        }

        // Get shift start from employee if not provided
        if ($shiftStartTime === null && $this->employee) {
            $shiftStartTime = $this->employee->shift_sched ?? 'morning';
            $shiftStartTime = $this->getShiftStartTime($shiftStartTime);
        }

        $clockIn = Carbon::createFromTimeString($this->time_in);
        $shiftStart = Carbon::createFromTimeString($shiftStartTime ?? '07:00');

        if ($clockIn->lte($shiftStart)) {
            return 0;
        }

        return (int) $clockIn->diffInMinutes($shiftStart);
    }

    /**
     * Get shift start time based on shift schedule name
     */
    private function getShiftStartTime(string $shiftSched): string
    {
        return match ($shiftSched) {
            'morning'   => '07:00:00',
            'afternoon' => '15:00:00',
            'night'     => '23:00:00',
            default     => '07:00:00',
        };
    }

    /**
     * Get grace period cutoff time
     */
    public function getGraceCutoffTime(?string $shiftStartTime = null): ?Carbon
    {
        if ($shiftStartTime === null && $this->employee) {
            $shiftStartTime = $this->employee->shift_sched ?? 'morning';
            $shiftStartTime = $this->getShiftStartTime($shiftStartTime);
        }

        $start = Carbon::createFromTimeString($shiftStartTime ?? '07:00');
        return $start->addMinutes(30); // 30-minute grace period
    }

    /**
     * Check if clock-in was within grace period
     */
    public function isWithinGracePeriod(): bool
    {
        if ($this->time_in === null) {
            return false;
        }

        $cutoff = $this->getGraceCutoffTime();
        if (!$cutoff) {
            return false;
        }

        $clockIn = Carbon::createFromTimeString($this->time_in);
        return $clockIn->lte($cutoff);
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    /**
     * Get formatted time_in (e.g., "08:00 AM")
     */
    public function getFormattedTimeIn(): ?string
    {
        return $this->time_in
            ? Carbon::createFromTimeString($this->time_in)->format('h:i A')
            : null;
    }

    /**
     * Get formatted time_out (e.g., "05:00 PM")
     */
    public function getFormattedTimeOut(): ?string
    {
        return $this->time_out
            ? Carbon::createFromTimeString($this->time_out)->format('h:i A')
            : null;
    }

    /**
     * Get status color for UI badges
     */
    public function getStatusColor(): string
    {
        return match ($this->status) {
            'present'  => 'green',
            'late'     => 'yellow',
            'absent'   => 'red',
            'on_leave' => 'blue',
            'half_day' => 'orange',
            default    => 'gray',
        };
    }

    /**
     * Get status label for UI
     */
    public function getStatusLabel(): string
    {
        return match ($this->status) {
            'present'  => 'Present',
            'late'     => 'Late',
            'absent'   => 'Absent',
            'on_leave' => 'On Leave',
            'half_day' => 'Half Day',
            default    => ucfirst($this->status),
        };
    }

    /**
     * Get total hours worked as formatted string
     */
    public function getFormattedHoursWorked(): string
    {
        if ($this->hours_worked <= 0) {
            return '—';
        }
        
        $hours = floor($this->hours_worked);
        $minutes = round(($this->hours_worked - $hours) * 60);
        
        if ($minutes > 0) {
            return "{$hours}h {$minutes}m";
        }
        
        return "{$hours}h";
    }

    /**
     * Get minutes late as formatted string
     */
    public function getFormattedMinutesLate(): string
    {
        if ($this->minutes_late <= 0) {
            return '—';
        }
        
        $hours = floor($this->minutes_late / 60);
        $minutes = $this->minutes_late % 60;
        
        if ($hours > 0) {
            return "{$hours}h {$minutes}m";
        }
        
        return "{$minutes}m";
    }
}