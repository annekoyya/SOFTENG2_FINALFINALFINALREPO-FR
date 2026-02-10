<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AttendanceService
{
    private const GRACE_PERIOD_MINUTES = 15;
    private const SHIFT_START_TIME = '08:00';
    private const SHIFT_END_TIME = '17:00';
    private const STANDARD_WORKING_HOURS = 8;

    /**
     * Clock in an employee.
     */
    public function clockIn(Employee $employee, string $ipAddress = null, string $deviceInfo = null): Attendance
    {
        $today = today();
        
        // Check if employee already has a clock-in today
        $existingRecord = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        if ($existingRecord && $existingRecord->time_in !== null && $existingRecord->time_out === null) {
            throw new \Exception('Employee is already clocked in');
        }

        $now = now();
        $timeIn = $now->format('H:i:s');
        
        // Check if on approved leave
        $onLeave = $this->isEmployeeOnLeave($employee, $today);
        $status = $onLeave ? 'on_leave' : $this->calculateStatus($timeIn);
        $minutesLate = $this->calculateMinutesLate($timeIn);
        $withinGracePeriod = $minutesLate <= self::GRACE_PERIOD_MINUTES && $minutesLate > 0;

        $attendance = Attendance::create([
            'employee_id' => $employee->id,
            'date' => $today,
            'time_in' => $timeIn,
            'status' => $status,
            'minutes_late' => $minutesLate,
            'recorded_by' => auth()->id() ?? $employee->id,
            'within_grace_period' => $withinGracePeriod,
            'clock_in_ip' => $ipAddress,
            'device_info' => $deviceInfo,
        ]);

        return $attendance;
    }

    /**
     * Clock out an employee.
     */
    public function clockOut(Employee $employee, string $ipAddress = null): Attendance
    {
        $today = today();
        
        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        if (!$attendance) {
            throw new \Exception('No clock-in record found for today');
        }

        if (!$attendance->isClockedIn()) {
            throw new \Exception('Employee has not clocked in or already clocked out');
        }

        $now = now();
        $timeOut = $now->format('H:i:s');
        
        // Calculate hours worked
        $hoursWorked = $this->calculateHoursWorked($attendance->time_in, $timeOut);
        
        $attendance->update([
            'time_out' => $timeOut,
            'hours_worked' => $hoursWorked,
            'clock_out_ip' => $ipAddress,
        ]);

        return $attendance;
    }

    /**
     * Calculate status based on clock-in time.
     */
    private function calculateStatus(string $timeIn): string
    {
        $clockInTime = Carbon::createFromTimeString($timeIn);
        $shiftStartTime = Carbon::createFromTimeString(self::SHIFT_START_TIME);

        if ($clockInTime->greaterThan($shiftStartTime)) {
            return 'late';
        }

        return 'present';
    }

    /**
     * Calculate minutes late.
     */
    private function calculateMinutesLate(string $timeIn): int
    {
        $clockInTime = Carbon::createFromTimeString($timeIn);
        $shiftStartTime = Carbon::createFromTimeString(self::SHIFT_START_TIME);

        if ($clockInTime->lessThanOrEqualTo($shiftStartTime)) {
            return 0;
        }

        return $clockInTime->diffInMinutes($shiftStartTime);
    }

    /**
     * Calculate hours worked between clock in and clock out.
     */
    private function calculateHoursWorked(string $timeIn, string $timeOut): float
    {
        $inTime = Carbon::createFromTimeString($timeIn);
        $outTime = Carbon::createFromTimeString($timeOut);

        return max(0, $outTime->diffInMinutes($inTime) / 60);
    }

    /**
     * Check if employee is on approved leave.
     */
    private function isEmployeeOnLeave(Employee $employee, $date): bool
    {
        return LeaveRequest::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->where('start_date', '<=', $date)
            ->where('end_date', '>=', $date)
            ->exists();
    }

    /**
     * Mark employee as absent for a specific date.
     */
    public function markAbsent(Employee $employee, $date, int $recordedBy): Attendance
    {
        $existingRecord = Attendance::where('employee_id', $employee->id)
            ->where('date', $date)
            ->first();

        if ($existingRecord) {
            $existingRecord->update([
                'status' => 'absent',
                'recorded_by' => $recordedBy,
            ]);
            return $existingRecord;
        }

        return Attendance::create([
            'employee_id' => $employee->id,
            'date' => $date,
            'status' => 'absent',
            'recorded_by' => $recordedBy,
        ]);
    }

    /**
     * Process daily attendance records (Cron Job).
     * Marks employees without clock-in as absent.
     */
    public function processDailyAttendance($date = null): array
    {
        $date = $date ? Carbon::parse($date)->startOfDay() : today();
        
        // Get all active employees
        $employees = Employee::where('employment_type', '!=', 'terminated')->get();
        
        $processed = [];
        $skipped = [];

        foreach ($employees as $employee) {
            // Check if employee already has an attendance record for this date
            $attendance = Attendance::where('employee_id', $employee->id)
                ->where('date', $date)
                ->first();

            // Check if employee is on approved leave
            $onLeave = $this->isEmployeeOnLeave($employee, $date);

            if (!$attendance && !$onLeave && !$this->isWeekend($date)) {
                // Mark as absent
                $this->markAbsent($employee, $date, 1); // System user ID = 1
                $processed[$employee->id] = 'marked_absent';
            } else if ($attendance) {
                $skipped[$employee->id] = 'already_recorded';
            } else if ($onLeave) {
                $skipped[$employee->id] = 'on_leave';
            } else if ($this->isWeekend($date)) {
                $skipped[$employee->id] = 'weekend';
            }
        }

        return [
            'processed' => $processed,
            'skipped' => $skipped,
            'total_employees' => $employees->count(),
        ];
    }

    /**
     * Check if a date is a weekend.
     */
    private function isWeekend($date): bool
    {
        $day = Carbon::parse($date)->dayOfWeek;
        return $day === Carbon::SATURDAY || $day === Carbon::SUNDAY;
    }

    /**
     * Get attendance summary for a date range.
     */
    public function getAttendanceSummary(Employee $employee, $startDate, $endDate): array
    {
        $records = Attendance::where('employee_id', $employee->id)
            ->forDateRange($startDate, $endDate)
            ->get();

        $summary = [
            'total_days' => 0,
            'present' => 0,
            'late' => 0,
            'absent' => 0,
            'on_leave' => 0,
            'half_day' => 0,
            'total_hours' => 0,
            'total_minutes_late' => 0,
            'records' => $records,
        ];

        foreach ($records as $record) {
            $summary['total_days']++;
            $summary[$record->status]++;
            $summary['total_hours'] += $record->hours_worked;
            $summary['total_minutes_late'] += $record->minutes_late;
        }

        return $summary;
    }

    /**
     * Get live status of workforce.
     */
    public function getLiveWorkforceStatus(): array
    {
        $today = today();
        $now = now();
        
        $records = Attendance::where('date', $today)->with('employee')->get();

        $grouped = [
            'clocked_in' => [],
            'clocked_out' => [],
            'not_arrived' => [],
            'on_leave' => [],
            'absent' => [],
        ];

        $allEmployees = Employee::where('employment_type', '!=', 'terminated')->get();

        foreach ($allEmployees as $employee) {
            $record = $records->firstWhere('employee_id', $employee->id);

            if ($this->isEmployeeOnLeave($employee, $today)) {
                $grouped['on_leave'][] = [
                    'employee' => $employee,
                    'status' => 'on_leave',
                    'color' => 'blue',
                ];
            } elseif (!$record) {
                // Check if it's after work hours
                if ($now->greaterThan(Carbon::createFromTimeString(self::SHIFT_END_TIME))) {
                    $grouped['absent'][] = [
                        'employee' => $employee,
                        'status' => 'absent',
                        'color' => 'red',
                    ];
                } else {
                    $grouped['not_arrived'][] = [
                        'employee' => $employee,
                        'status' => 'not_arrived',
                        'color' => 'gray',
                    ];
                }
            } elseif ($record->isClockedIn()) {
                $grouped['clocked_in'][] = [
                    'employee' => $employee,
                    'record' => $record,
                    'status' => $record->status,
                    'color' => $record->getStatusColor(),
                    'time_in' => $record->getFormattedTimeIn(),
                ];
            } else {
                $grouped['clocked_out'][] = [
                    'employee' => $employee,
                    'record' => $record,
                    'status' => $record->status,
                    'color' => $record->getStatusColor(),
                    'time_in' => $record->getFormattedTimeIn(),
                    'time_out' => $record->getFormattedTimeOut(),
                ];
            }
        }

        return $grouped;
    }

    /**
     * Get monthly statistics for an employee.
     */
    public function getMonthlyStatistics(Employee $employee, int $month, int $year): array
    {
        $records = Attendance::where('employee_id', $employee->id)
            ->forMonth($year, $month)
            ->get();

        return [
            'month' => $month,
            'year' => $year,
            'total_working_days' => $this->getWorkingDays($month, $year),
            'present' => $records->where('status', 'present')->count(),
            'late' => $records->where('status', 'late')->count(),
            'absent' => $records->where('status', 'absent')->count(),
            'on_leave' => $records->where('status', 'on_leave')->count(),
            'total_hours' => $records->sum('hours_worked'),
            'total_minutes_late' => $records->sum('minutes_late'),
            'attendance_percentage' => $this->calculateAttendancePercentage($records),
        ];
    }

    /**
     * Calculate attendance percentage.
     */
    private function calculateAttendancePercentage(Collection $records): float
    {
        if ($records->isEmpty()) {
            return 0;
        }

        $presentCount = $records->whereIn('status', ['present', 'late'])->count();
        return ($presentCount / $records->count()) * 100;
    }

    /**
     * Get working days in a month.
     */
    private function getWorkingDays(int $month, int $year): int
    {
        $date = Carbon::createFromDate($year, $month, 1);
        $workingDays = 0;

        while ($date->month === $month) {
            if (!$this->isWeekend($date)) {
                $workingDays++;
            }
            $date->addDay();
        }

        return $workingDays;
    }

    /**
     * Validate clock in/out request.
     */
    public function validateClockInOut(Employee $employee, string $action = 'in'): array
    {
        $errors = [];

        if ($action === 'in') {
            $today = today();
            $existingRecord = Attendance::where('employee_id', $employee->id)
                ->where('date', $today)
                ->where('time_in', '!=', null)
                ->where('time_out', null)
                ->first();

            if ($existingRecord) {
                $errors[] = 'Employee is already clocked in';
            }
        } elseif ($action === 'out') {
            $today = today();
            $record = Attendance::where('employee_id', $employee->id)
                ->where('date', $today)
                ->first();

            if (!$record || !$record->isClockedIn()) {
                $errors[] = 'Employee must clock in first before clocking out';
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }
}
