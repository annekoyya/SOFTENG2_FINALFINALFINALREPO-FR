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
        'date' => 'date',
        'time_in' => 'datetime:H:i:s',
        'time_out' => 'datetime:H:i:s',
        'within_grace_period' => 'boolean',
        'minutes_late' => 'integer',
        'hours_worked' => 'decimal:2',
    ];

    /**
     * Get the employee associated with this attendance record.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the user who recorded this attendance.
     */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /**
     * Scope to get records for a specific date.
     */
    public function scopeForDate($query, $date)
    {
        return $query->where('date', $date);
    }

    /**
     * Scope to get records for a date range.
     */
    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    /**
     * Scope to get records by status.
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get today's records.
     */
    public function scopeToday($query)
    {
        return $query->where('date', today());
    }

    /**
     * Scope to get employee attendance for a month.
     */
    public function scopeForMonth($query, $year, $month)
    {
        return $query->whereYear('date', $year)
                     ->whereMonth('date', $month);
    }

    /**
     * Check if employee is currently clocked in.
     */
    public function isClockedIn(): bool
    {
        return $this->time_in !== null && $this->time_out === null;
    }

    /**
     * Check if employee can clock out.
     */
    public function canClockOut(): bool
    {
        return $this->isClockedIn();
    }

    /**
     * Calculate hours worked.
     */
    public function calculateHoursWorked(): float
    {
        if ($this->time_in === null || $this->time_out === null) {
            return 0;
        }

        $timeIn = Carbon::createFromTimeString($this->time_in);
        $timeOut = Carbon::createFromTimeString($this->time_out);

        return $timeOut->diffInMinutes($timeIn) / 60;
    }

    /**
     * Check if attendance is late based on shift start time.
     */
    public function isLate(string $shiftStartTime = '08:00'): bool
    {
        if ($this->time_in === null) {
            return false;
        }

        $clockInTime = Carbon::createFromTimeString($this->time_in);
        $shiftTime = Carbon::createFromTimeString($shiftStartTime);

        return $clockInTime->greaterThan($shiftTime);
    }

    /**
     * Calculate minutes late.
     */
    public function calculateMinutesLate(string $shiftStartTime = '08:00'): int
    {
        if ($this->time_in === null || !$this->isLate($shiftStartTime)) {
            return 0;
        }

        $clockInTime = Carbon::createFromTimeString($this->time_in);
        $shiftTime = Carbon::createFromTimeString($shiftStartTime);

        return $clockInTime->diffInMinutes($shiftTime);
    }

    /**
     * Get status badge color.
     */
    public function getStatusColor(): string
    {
        return match ($this->status) {
            'present' => 'green',
            'late' => 'yellow',
            'absent' => 'red',
            'on_leave' => 'blue',
            'half_day' => 'orange',
            default => 'gray',
        };
    }

    /**
     * Get formatted time_in.
     */
    public function getFormattedTimeIn(): ?string
    {
        return $this->time_in ? Carbon::createFromTimeString($this->time_in)->format('h:i A') : null;
    }

    /**
     * Get formatted time_out.
     */
    public function getFormattedTimeOut(): ?string
    {
        return $this->time_out ? Carbon::createFromTimeString($this->time_out)->format('h:i A') : null;
    }
}
