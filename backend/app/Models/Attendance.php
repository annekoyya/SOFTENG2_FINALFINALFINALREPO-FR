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

    // Note: time_in / time_out are stored as TIME strings — not cast to datetime
    // to avoid Carbon date-wrapping issues. Use getFormattedTimeIn/Out accessors.

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

    public function isClockedIn(): bool
    {
        return $this->time_in !== null && $this->time_out === null;
    }

    public function canClockOut(): bool
    {
        return $this->isClockedIn();
    }

    // ─── Calculations ─────────────────────────────────────────────────────────

    /**
     * Calculate and return hours worked between time_in and time_out.
     */
    public function calculateHoursWorked(): float
    {
        if ($this->time_in === null || $this->time_out === null) {
            return 0;
        }

        $timeIn  = Carbon::createFromTimeString($this->time_in);
        $timeOut = Carbon::createFromTimeString($this->time_out);

        return round($timeOut->diffInMinutes($timeIn) / 60, 2);
    }

    /**
     * Check if employee clocked in after shift start (default 08:00).
     */
    public function isLate(string $shiftStartTime = '08:00'): bool
    {
        if ($this->time_in === null) {
            return false;
        }

        return Carbon::createFromTimeString($this->time_in)
            ->greaterThan(Carbon::createFromTimeString($shiftStartTime));
    }

    /**
     * Calculate minutes late from shift start.
     */
    public function calculateMinutesLate(string $shiftStartTime = '08:00'): int
    {
        if ($this->time_in === null || !$this->isLate($shiftStartTime)) {
            return 0;
        }

        $clockIn = Carbon::createFromTimeString($this->time_in);
        $shift   = Carbon::createFromTimeString($shiftStartTime);

        return (int) $clockIn->diffInMinutes($shift);
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    public function getFormattedTimeIn(): ?string
    {
        return $this->time_in
            ? Carbon::createFromTimeString($this->time_in)->format('h:i A')
            : null;
    }

    public function getFormattedTimeOut(): ?string
    {
        return $this->time_out
            ? Carbon::createFromTimeString($this->time_out)->format('h:i A')
            : null;
    }

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
}