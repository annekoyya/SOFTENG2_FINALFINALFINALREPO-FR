<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class AttendanceService
{
    private const GRACE_PERIOD_MINUTES = 15;
    private const SHIFT_START_TIME     = '08:00';
    private const SHIFT_END_TIME       = '17:00';
    private const STANDARD_HOURS       = 160; // per month

    // ─── Clock In / Out ───────────────────────────────────────────────────────

    /**
     * Fix: explicit ?string nullable syntax (PHP 8.1+ deprecates implicit nullable).
     */
    public function clockIn(Employee $employee, ?string $ipAddress = null, ?string $deviceInfo = null): Attendance
    {
        $today = today()->toDateString();

        $existing = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        if ($existing && $existing->time_in !== null && $existing->time_out === null) {
            throw new \Exception('Employee is already clocked in');
        }

        $timeIn   = now()->format('H:i:s');
        $onLeave  = $this->isEmployeeOnLeave($employee, $today);
        $status   = $onLeave ? 'on_leave' : $this->calculateStatus($timeIn);
        $minsLate = $this->calculateMinutesLate($timeIn);

        return Attendance::create([
            'employee_id'         => $employee->getKey(), // getKey() always resolves correctly
            'date'                => $today,
            'time_in'             => $timeIn,
            'status'              => $status,
            'minutes_late'        => $minsLate,
            'recorded_by'         => Auth::id() ?? $employee->getKey(),
            'within_grace_period' => $minsLate > 0 && $minsLate <= self::GRACE_PERIOD_MINUTES,
            'clock_in_ip'         => $ipAddress,
            'device_info'         => $deviceInfo,
        ]);
    }

    /**
     * Fix: explicit ?string nullable syntax.
     */
    public function clockOut(Employee $employee, ?string $ipAddress = null): Attendance
    {
        $today = today()->toDateString();

        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        if (!$attendance) {
            throw new \Exception('No clock-in record found for today');
        }

        if (!$attendance->isClockedIn()) {
            throw new \Exception('Employee has not clocked in or already clocked out');
        }

        $timeOut     = now()->format('H:i:s');
        $hoursWorked = $this->calculateHoursWorked($attendance->time_in, $timeOut);

        $attendance->update([
            'time_out'     => $timeOut,
            'hours_worked' => $hoursWorked,
            'clock_out_ip' => $ipAddress,
        ]);

        return $attendance;
    }

    // ─── Status Helpers ───────────────────────────────────────────────────────

    private function calculateStatus(string $timeIn): string
    {
        return Carbon::createFromTimeString($timeIn)
            ->greaterThan(Carbon::createFromTimeString(self::SHIFT_START_TIME))
            ? 'late'
            : 'present';
    }

    private function calculateMinutesLate(string $timeIn): int
    {
        $clockIn = Carbon::createFromTimeString($timeIn);
        $shift   = Carbon::createFromTimeString(self::SHIFT_START_TIME);

        return $clockIn->lessThanOrEqualTo($shift) ? 0 : (int) $clockIn->diffInMinutes($shift);
    }

    private function calculateHoursWorked(string $timeIn, string $timeOut): float
    {
        return max(
            0,
            Carbon::createFromTimeString($timeOut)->diffInMinutes(Carbon::createFromTimeString($timeIn)) / 60
        );
    }

    // ─── Leave Check ──────────────────────────────────────────────────────────

    private function isEmployeeOnLeave(Employee $employee, string $date): bool
    {
        return LeaveRequest::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->where('start_date', '<=', $date)
            ->where('end_date', '>=', $date)
            ->exists();
    }

    // ─── Absence Processing ───────────────────────────────────────────────────

    public function markAbsent(Employee $employee, string $date, int $recordedBy): Attendance
    {
        $existing = Attendance::where('employee_id', $employee->id)
            ->where('date', $date)
            ->first();

        if ($existing) {
            $existing->update(['status' => 'absent', 'recorded_by' => $recordedBy]);
            return $existing;
        }

        return Attendance::create([
            'employee_id' => $employee->getKey(),
            'date'        => $date,
            'status'      => 'absent',
            'recorded_by' => $recordedBy,
        ]);
    }

    /**
     * Cron job: mark all employees without attendance today as absent.
     */
    public function processDailyAttendance(?string $date = null): array
    {
        // Always work with a plain date string — never pass Carbon into isEmployeeOnLeave
        $dateString = $date
            ? Carbon::parse($date)->toDateString()
            : today()->toDateString();

        if ($this->isWeekend($dateString)) {
            return ['processed' => [], 'skipped' => [], 'total_employees' => 0, 'reason' => 'weekend'];
        }

        // Use Eloquent so $employee is always Employee, not stdClass
        /** @var Collection<int, Employee> $employees */
        $employees = Employee::where('status', '!=', 'terminated')->get();

        $processed = [];
        $skipped   = [];

        foreach ($employees as $employee) {
            /** @var Employee $employee */
            $hasRecord = Attendance::where('employee_id', $employee->id)
                ->where('date', $dateString)
                ->exists();

            $onLeave = $this->isEmployeeOnLeave($employee, $dateString);

            if (!$hasRecord && !$onLeave) {
                $this->markAbsent($employee, $dateString, 1);
                $processed[$employee->id] = 'marked_absent';
            } else {
                $skipped[$employee->id] = $onLeave ? 'on_leave' : 'already_recorded';
            }
        }

        return [
            'date'            => $dateString,
            'processed'       => $processed,
            'skipped'         => $skipped,
            'total_employees' => $employees->count(),
        ];
    }

    /**
     * Fix: use integer literals instead of Carbon::SATURDAY/SUNDAY which are
     * CarbonInterface constants accessed through child (triggers PHP6606).
     * 0 = Sunday, 6 = Saturday (Carbon/PHP convention).
     */
    private function isWeekend(string $date): bool
    {
        $dow = Carbon::parse($date)->dayOfWeek;
        return $dow === CarbonInterface::SUNDAY || $dow === CarbonInterface::SATURDAY;
    }

    // ─── Statistics ───────────────────────────────────────────────────────────

    public function getAttendanceSummary(Employee $employee, string $startDate, string $endDate): array
    {
        $records = Attendance::where('employee_id', $employee->id)
            ->forDateRange($startDate, $endDate)
            ->get();

        $summary = [
            'total_days'          => 0,
            'present'             => 0,
            'late'                => 0,
            'absent'              => 0,
            'on_leave'            => 0,
            'half_day'            => 0,
            'total_hours'         => 0.0,
            'total_minutes_late'  => 0,
            'records'             => $records,
        ];

        foreach ($records as $record) {
            $summary['total_days']++;
            if (array_key_exists($record->status, $summary)) {
                $summary[$record->status]++;
            }
            $summary['total_hours']        += (float) $record->hours_worked;
            $summary['total_minutes_late'] += (int) $record->minutes_late;
        }

        return $summary;
    }

    public function getLiveWorkforceStatus(): array
    {
        $today   = today()->toDateString();
        $records = Attendance::where('date', $today)->with('employee')->get();

        $grouped = [
            'clocked_in'  => [],
            'clocked_out' => [],
            'not_arrived' => [],
            'on_leave'    => [],
            'absent'      => [],
        ];

        /** @var Collection<int, Employee> $allEmployees */
        $allEmployees = Employee::where('status', '!=', 'terminated')->get();

        foreach ($allEmployees as $employee) {
            /** @var Employee $employee */
            $record = $records->firstWhere('employee_id', $employee->id);

            if ($this->isEmployeeOnLeave($employee, $today)) {
                $grouped['on_leave'][] = ['employee' => $employee, 'status' => 'on_leave', 'color' => 'blue'];
            } elseif (!$record) {
                $afterShift = now()->greaterThan(Carbon::createFromTimeString(self::SHIFT_END_TIME));
                $key        = $afterShift ? 'absent' : 'not_arrived';
                $grouped[$key][] = ['employee' => $employee, 'status' => $key, 'color' => $afterShift ? 'red' : 'gray'];
            } elseif ($record->isClockedIn()) {
                $grouped['clocked_in'][] = [
                    'employee' => $employee,
                    'record'   => $record,
                    'status'   => $record->status,
                    'color'    => $record->getStatusColor(),
                    'time_in'  => $record->getFormattedTimeIn(),
                ];
            } else {
                $grouped['clocked_out'][] = [
                    'employee' => $employee,
                    'record'   => $record,
                    'status'   => $record->status,
                    'color'    => $record->getStatusColor(),
                    'time_in'  => $record->getFormattedTimeIn(),
                    'time_out' => $record->getFormattedTimeOut(),
                ];
            }
        }

        return $grouped;
    }

    public function getMonthlyStatistics(Employee $employee, int $month, int $year): array
    {
        $records = Attendance::where('employee_id', $employee->id)
            ->forMonth($year, $month)
            ->get();

        return [
            'month'               => $month,
            'year'                => $year,
            'total_working_days'  => $this->getWorkingDays($month, $year),
            'present'             => $records->where('status', 'present')->count(),
            'late'                => $records->where('status', 'late')->count(),
            'absent'              => $records->where('status', 'absent')->count(),
            'on_leave'            => $records->where('status', 'on_leave')->count(),
            'total_hours'         => $records->sum('hours_worked'),
            'total_minutes_late'  => $records->sum('minutes_late'),
            'attendance_rate'     => $this->calculateAttendancePercentage($records),
        ];
    }

    private function calculateAttendancePercentage(Collection $records): float
    {
        if ($records->isEmpty()) {
            return 0.0;
        }
        return ($records->whereIn('status', ['present', 'late'])->count() / $records->count()) * 100;
    }

    private function getWorkingDays(int $month, int $year): int
    {
        $date        = Carbon::createFromDate($year, $month, 1);
        $workingDays = 0;

        while ($date->month === $month) {
            if (!$this->isWeekend($date->toDateString())) {
                $workingDays++;
            }
            $date->addDay();
        }

        return $workingDays;
    }

    // ─── Validation ───────────────────────────────────────────────────────────

    public function validateClockInOut(Employee $employee, string $action = 'in'): array
    {
        $errors = [];
        $today  = today()->toDateString();

        if ($action === 'in') {
            $alreadyIn = Attendance::where('employee_id', $employee->id)
                ->where('date', $today)
                ->whereNotNull('time_in')
                ->whereNull('time_out')
                ->exists();

            if ($alreadyIn) {
                $errors[] = 'Employee is already clocked in';
            }
        } elseif ($action === 'out') {
            $record = Attendance::where('employee_id', $employee->id)
                ->where('date', $today)
                ->first();

            if (!$record || !$record->isClockedIn()) {
                $errors[] = 'Employee must clock in before clocking out';
            }
        }

        return ['valid' => empty($errors), 'errors' => $errors];
    }
}