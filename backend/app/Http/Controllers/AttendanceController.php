<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    // FIX #8: shift-aware time windows
    private const SHIFTS = [
        'morning'   => ['start' => '07:00', 'end' => '15:00'],
        'afternoon' => ['start' => '15:00', 'end' => '23:00'],
        'night'     => ['start' => '23:00', 'end' => '07:00'],
    ];
    private const GRACE_MINUTES = 30;

    // ─── GET /api/attendance ───────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = Attendance::with('employee:id,first_name,last_name,department,shift_sched')
            ->orderBy('date', 'desc');

        if ($request->filled('start_date')) $query->where('date', '>=', $request->start_date);
        if ($request->filled('end_date'))   $query->where('date', '<=', $request->end_date);
        if ($request->filled('status'))     $query->where('status', $request->status);
        if ($request->filled('employee_id'))$query->where('employee_id', $request->employee_id);
        if ($request->filled('department')) {
            $query->whereHas('employee', fn($q) => $q->where('department', $request->department));
        }

        $records = $query->paginate((int) $request->input('per_page', 30));
        return response()->json(['success' => true, 'data' => $records]);
    }

    // ─── GET /api/attendance/live-status ──────────────────────────────────────
    // FIX #6: was crashing because Employee::full_name accessor was missing
    public function liveStatus(): JsonResponse
    {
        $today     = now()->toDateString();
        $employees = Employee::where('status', 'active')->get();
        $total     = $employees->count();

        $todayRecords = Attendance::where('date', $today)
            ->get()
            ->keyBy('employee_id');

        $summary        = ['present' => 0, 'late' => 0, 'absent' => 0, 'on_leave' => 0];
        $recentClockIns = [];

        foreach ($employees as $emp) {
            $record = $todayRecords[$emp->id] ?? null;
            if ($record) {
                $st = strtolower($record->status);
                if (array_key_exists($st, $summary)) $summary[$st]++;
                if ($record->time_in) {
                    $recentClockIns[] = [
                        'id'         => $emp->id,
                        'name'       => $emp->full_name,
                        'department' => $emp->department,
                        'time'       => $record->time_in,
                        'status'     => $st,
                    ];
                }
            } else {
                $summary['absent']++;
            }
        }

        // Sort by time desc, take 10
        usort($recentClockIns, fn($a, $b) => strcmp($b['time'], $a['time']));
        $recentClockIns = array_slice($recentClockIns, 0, 10);

        // Department breakdown
        $deptBreakdown = Employee::where('status', 'active')
            ->selectRaw('department, COUNT(*) as total')
            ->groupBy('department')
            ->get()
            ->map(function ($dept) use ($today) {
                $present = Attendance::where('date', $today)
                    ->whereIn('status', ['present', 'late'])
                    ->whereHas('employee', fn($q) => $q->where('department', $dept->department))
                    ->count();
                return [
                    'department' => $dept->department,
                    'clocked_in' => $present,
                    'total'      => (int) $dept->total,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => [
                'total_employees' => $total,
                'present'         => $summary['present'],
                'late'            => $summary['late'],
                'absent'          => $summary['absent'],
                'on_leave'        => $summary['on_leave'],
                'date'            => $today,
                'recent_clockins' => $recentClockIns,
                'dept_breakdown'  => $deptBreakdown,
            ],
        ]);
    }

    // ─── GET /api/attendance/monthly-stats ────────────────────────────────────
    public function monthlyStats(Request $request): JsonResponse
    {
        $month = (int) $request->input('month', now()->month);
        $year  = (int) $request->input('year',  now()->year);

        $query = Attendance::whereYear('date', $year)->whereMonth('date', $month);
        if ($request->filled('employee_id')) $query->where('employee_id', $request->employee_id);

        $records = $query->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'present'      => $records->where('status', 'present')->count(),
                'late'         => $records->where('status', 'late')->count(),
                'absent'       => $records->where('status', 'absent')->count(),
                'on_leave'     => $records->where('status', 'on_leave')->count(),
                'total_days'   => $records->count(),
                'total_hours'  => round($records->sum('hours_worked'), 2),
                'minutes_late' => $records->sum('minutes_late'),
            ],
        ]);
    }

    // ─── POST /api/attendance/import ──────────────────────────────────────────
    // FIX #8: reads employee shift_sched for late calculation
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'rows'               => 'required|array|min:1',
            'rows.*.employee_id' => 'required|integer',
            'rows.*.date'        => 'required|date_format:Y-m-d',
            'rows.*.shift'       => 'nullable|in:morning,afternoon,night',
        ]);

        $saved = 0;
        $errors = [];

        DB::transaction(function () use ($request, &$saved, &$errors) {
            foreach ($request->rows as $i => $row) {
                try {
                    $employee = Employee::find((int) $row['employee_id']);
                    if (!$employee) {
                        $errors[] = "Row {$i}: Employee #{$row['employee_id']} not found";
                        continue;
                    }

                    // FIX #8: prefer row shift, fall back to employee's shift_sched
                    $shift   = !empty($row['shift']) ? $row['shift'] : ($employee->shift_sched ?? 'morning');
                    $timeIn  = !empty($row['time_in'])  ? (string) $row['time_in']  : null;
                    $timeOut = !empty($row['time_out']) ? (string) $row['time_out'] : null;
                    $status  = !empty($row['status'])   ? $row['status'] : $this->calcStatus($timeIn, $shift);
                    $late    = $this->calcMinutesLate($timeIn, $shift);
                    $hours   = $this->calcHoursWorked($timeIn, $timeOut, $shift);

                    Attendance::updateOrCreate(
                        ['employee_id' => $employee->id, 'date' => $row['date']],
                        [
                            'time_in'      => $timeIn,
                            'time_out'     => $timeOut,
                            'status'       => $status,
                            'minutes_late' => $late,
                            'hours_worked' => $hours,
                            'notes'        => $row['notes'] ?? null,
                            'recorded_by'  => Auth::id(),
                        ]
                    );
                    $saved++;
                } catch (\Throwable $e) {
                    $errors[] = "Row {$i}: " . $e->getMessage();
                }
            }
        });

        return response()->json([
            'success' => true,
            'data'    => ['saved' => $saved, 'errors' => $errors],
            'message' => "{$saved} records imported." . (count($errors) ? ' ' . count($errors) . ' errors.' : ''),
        ]);
    }

    // ─── POST /api/attendance/manual ──────────────────────────────────────────
    // FIX #8: reads employee shift_sched for late calculation
    public function manual(Request $request): JsonResponse
    {
        $v = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date'        => 'required|date',
            'time_in'     => 'nullable|date_format:H:i',
            'time_out'    => 'nullable|date_format:H:i',
            'status'      => 'nullable|in:present,late,absent,on_leave,half_day',
            'notes'       => 'nullable|string|max:500',
        ]);

        $employee = Employee::findOrFail($v['employee_id']);
        $shift    = $employee->shift_sched ?? 'morning';
        $timeIn   = $v['time_in']  ?? null;
        $timeOut  = $v['time_out'] ?? null;

        $record = Attendance::updateOrCreate(
            ['employee_id' => $v['employee_id'], 'date' => $v['date']],
            [
                'time_in'      => $timeIn,
                'time_out'     => $timeOut,
                'status'       => $v['status'] ?? $this->calcStatus($timeIn, $shift),
                'minutes_late' => $this->calcMinutesLate($timeIn, $shift),
                'hours_worked' => $this->calcHoursWorked($timeIn, $timeOut, $shift),
                'notes'        => $v['notes'] ?? null,
                'recorded_by'  => Auth::id(),
            ]
        );

        return response()->json(['success' => true, 'data' => $record]);
    }

    // ─── GET /api/attendance/export ───────────────────────────────────────────
    // FIX #7: proper streamed CSV with auth headers (works via authFetch + blob)
    public function export(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $start = $request->input('start_date', now()->startOfMonth()->toDateString());
        $end   = $request->input('end_date',   now()->toDateString());

        $records = Attendance::with('employee:id,first_name,last_name,department,shift_sched')
            ->whereBetween('date', [$start, $end])
            ->orderBy('date')
            ->get();

        $filename = "attendance_{$start}_{$end}.csv";

        return response()->streamDownload(function () use ($records) {
            $out = fopen('php://output', 'w');
            fputcsv($out, [
                'Employee ID', 'Name', 'Department', 'Shift',
                'Date', 'Time In', 'Time Out',
                'Hours Worked', 'Minutes Late', 'Status', 'Notes',
            ]);
            foreach ($records as $r) {
                fputcsv($out, [
                    $r->employee_id,
                    $r->employee?->full_name ?? '',
                    $r->employee?->department,
                    $r->employee?->shift_sched,
                    $r->date instanceof \Carbon\Carbon ? $r->date->toDateString() : $r->date,
                    $r->time_in,
                    $r->time_out,
                    $r->hours_worked,
                    $r->minutes_late,
                    $r->status,
                    $r->notes,
                ]);
            }
            fclose($out);
        }, $filename, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    // ─── FIX #8: Shift-aware calculation helpers ──────────────────────────────

    private function calcStatus(?string $timeIn, string $shift): string
    {
        if (!$timeIn) return 'absent';
        return $this->calcMinutesLate($timeIn, $shift) > 0 ? 'late' : 'present';
    }

    private function calcMinutesLate(?string $timeIn, string $shift): int
    {
        if (!$timeIn) return 0;

        $shiftStart = self::SHIFTS[$shift]['start'] ?? '07:00';

        try {
            $clockIn = Carbon::createFromTimeString($timeIn);
            $start   = Carbon::createFromTimeString($shiftStart);
            $cutoff  = $start->copy()->addMinutes(self::GRACE_MINUTES);

            // Handle midnight crossover for night shift
            if ($shift === 'night' && $clockIn->hour >= 6 && $clockIn->hour < 20) {
                // Probably a previous-day clock-in, treat as on-time
                return 0;
            }

            if ($clockIn->gt($cutoff)) {
                return (int) $clockIn->diffInMinutes($start);
            }
        } catch (\Throwable) {}

        return 0;
    }

    private function calcHoursWorked(?string $timeIn, ?string $timeOut, string $shift = 'morning'): float
    {
        if (!$timeIn || !$timeOut) return 0.0;

        try {
            $in  = Carbon::createFromTimeString($timeIn);
            $out = Carbon::createFromTimeString($timeOut);

            // Handle overnight shifts (e.g., night shift 23:00 → 07:00)
            if ($out->lt($in)) $out->addDay();

            return round($in->diffInMinutes($out) / 60, 2);
        } catch (\Throwable) {
            return 0.0;
        }
    }
}