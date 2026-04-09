<?php
// backend/app/Http/Controllers/DashboardController.php
// REPLACE ENTIRE FILE

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\Payroll;
use App\Models\JobPosting;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $today = now()->toDateString();
        $year  = now()->year;
        $month = now()->month;

        // ── Stat cards ────────────────────────────────────────────────────────

        // Use 'status' = 'active' (not is_active boolean — matches your schema)
        $totalEmployees = Employee::where('status', 'active')->count();

        $presentToday = Attendance::where('date', $today)
            ->whereIn('status', ['Present', 'Late'])
            ->count();

        $absentToday = Attendance::where('date', $today)
            ->where('status', 'Absent')
            ->count();

        $pendingLeaves = LeaveRequest::where('status', 'pending')->count();

        // Payroll: use payrolls table if payslips table doesn't exist
        $payrollThisMonth = 0;
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('payslips')) {
                $payrollThisMonth = \App\Models\Payslip::whereYear('created_at', $year)
                    ->whereMonth('created_at', $month)
                    ->whereIn('status', ['approved', 'paid'])
                    ->sum('net_pay');
            } elseif (\Illuminate\Support\Facades\Schema::hasTable('payrolls')) {
                $payrollThisMonth = Payroll::whereYear('created_at', $year)
                    ->whereMonth('created_at', $month)
                    ->whereIn('status', ['approved', 'paid'])
                    ->sum('net_salary');
            }
        } catch (\Throwable $e) {
            $payrollThisMonth = 0;
        }

        $openJobs = 0;
        try {
            $openJobs = JobPosting::where('status', 'open')->count();
        } catch (\Throwable $e) {}

        // ── Attendance today breakdown ────────────────────────────────────────

        $attendanceTodayRaw = Attendance::where('date', $today)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn($r) => [strtolower($r->status) => (int) $r->count]);

        $attendanceSummary = [
            ['status' => 'present',  'count' => $attendanceTodayRaw['present']  ?? 0],
            ['status' => 'absent',   'count' => $attendanceTodayRaw['absent']   ?? 0],
            ['status' => 'late',     'count' => $attendanceTodayRaw['late']     ?? 0],
            ['status' => 'on_leave', 'count' => $attendanceTodayRaw['on leave'] ?? $attendanceTodayRaw['on_leave'] ?? 0],
        ];

        // ── Upcoming birthdays (next 30 days) ─────────────────────────────────

        $todayMd  = now()->format('m-d');
        $thirtyMd = now()->addDays(30)->format('m-d');

        // SQLite-compatible birthday query using strftime
        $upcomingBirthdays = Employee::where('status', 'active')
            ->whereNotNull('date_of_birth')
            ->get()
            ->filter(function ($emp) {
                $bday = Carbon::parse($emp->date_of_birth);
                $thisYear = $bday->copy()->year(now()->year);
                // If birthday already passed this year, check next year
                if ($thisYear->isPast() && !$thisYear->isToday()) {
                    $thisYear->addYear();
                }
                return $thisYear->between(now(), now()->addDays(30));
            })
            ->map(fn($emp) => [
                'id'         => $emp->id,
                'full_name'  => $emp->full_name ?? "{$emp->first_name} {$emp->last_name}",
                'department' => $emp->department,
                'birthday'   => Carbon::parse($emp->date_of_birth)->format('M d'),
                'days_until' => (int) now()->diffInDays(
                    Carbon::parse($emp->date_of_birth)->year(now()->year)->isPast()
                        ? Carbon::parse($emp->date_of_birth)->year(now()->year + 1)
                        : Carbon::parse($emp->date_of_birth)->year(now()->year),
                    false
                ),
            ])
            ->sortBy('days_until')
            ->take(5)
            ->values();

        // ── Recent hires (last 30 days) ───────────────────────────────────────

        $recentHires = Employee::where('status', 'active')
            ->whereNotNull('start_date')
            ->where('start_date', '>=', now()->subDays(30)->toDateString())
            ->orderByDesc('start_date')
            ->take(5)
            ->get()
            ->map(fn($emp) => [
                'id'           => $emp->id,
                'full_name'    => $emp->full_name ?? "{$emp->first_name} {$emp->last_name}",
                'department'   => $emp->department,
                'job_category' => $emp->job_category,
                'start_date'   => $emp->start_date,
            ]);

        // ── Pending leave requests (for quick action) ─────────────────────────

        $pendingLeaveList = LeaveRequest::with('employee')
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->take(5)
            ->get()
            ->map(fn($lr) => [
                'id'         => $lr->id,
                'employee'   => $lr->employee ? "{$lr->employee->first_name} {$lr->employee->last_name}" : "Unknown",
                'leave_type' => $lr->leave_type,
                'start_date' => $lr->start_date,
                'end_date'   => $lr->end_date,
                'reason'     => $lr->reason,
            ]);

        // ── Payroll trend (last 6 months) ─────────────────────────────────────

        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $date  = now()->subMonths($i);
            $gross = 0; $net = 0;
            try {
                if (\Illuminate\Support\Facades\Schema::hasTable('payslips')) {
                    $row = \App\Models\Payslip::whereYear('created_at', $date->year)
                        ->whereMonth('created_at', $date->month)
                        ->selectRaw('SUM(gross_pay) as gross, SUM(net_pay) as net')
                        ->first();
                    $gross = round((float) ($row->gross ?? 0));
                    $net   = round((float) ($row->net   ?? 0));
                } elseif (\Illuminate\Support\Facades\Schema::hasTable('payrolls')) {
                    $row = Payroll::whereYear('created_at', $date->year)
                        ->whereMonth('created_at', $date->month)
                        ->selectRaw('SUM(gross_salary) as gross, SUM(net_salary) as net')
                        ->first();
                    $gross = round((float) ($row->gross ?? 0));
                    $net   = round((float) ($row->net   ?? 0));
                }
            } catch (\Throwable $e) {}

            $trend[] = ['month' => $date->format('M Y'), 'gross' => $gross, 'net' => $net];
        }

        // ── Headcount by department ───────────────────────────────────────────

        $deptHeadcount = Employee::where('status', 'active')
            ->selectRaw('department, COUNT(*) as count')
            ->groupBy('department')
            ->orderByDesc('count')
            ->get()
            ->map(fn($r) => [
                'department' => $r->department ?: 'Unassigned',
                'count'      => (int) $r->count,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'total_employees'          => $totalEmployees,
                'present_today'            => $presentToday,
                'absent_today'             => $absentToday,
                'pending_leaves'           => $pendingLeaves,
                'total_payroll_this_month' => round((float) $payrollThisMonth),
                'open_jobs'                => $openJobs,
                'payroll_trend'            => $trend,
                'attendance_today'         => $attendanceSummary,
                'dept_headcount'           => $deptHeadcount,
                'upcoming_birthdays'       => $upcomingBirthdays,
                'recent_hires'             => $recentHires,
                'pending_leave_list'       => $pendingLeaveList,
            ],
        ]);
    }
}