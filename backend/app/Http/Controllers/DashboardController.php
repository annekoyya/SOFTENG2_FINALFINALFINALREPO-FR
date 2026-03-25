<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\OvertimeRequest;
use App\Models\Payslip;
use App\Models\JobPosting;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    // GET /api/dashboard/stats
    public function stats(): JsonResponse
    {
        $today = now()->toDateString();
        $year  = now()->year;
        $month = now()->month;

        // ── Stat cards ─────────────────────────────────────────────────────────

        $totalEmployees = Employee::where('is_active', true)->count();

        $presentToday = Attendance::where('date', $today)
            ->where('status', 'present')
            ->count();

        $pendingLeaves = LeaveRequest::where('status', 'pending')->count();

        $pendingOvertime = OvertimeRequest::where('status', 'pending')->count();

        $payrollThisMonth = Payslip::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->sum('net_pay');

        $openJobs = JobPosting::where('status', 'open')->count();

        // ── Payroll trend (last 6 months) ─────────────────────────────────────

        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $date  = now()->subMonths($i);
            $y     = $date->year;
            $m     = $date->month;
            $label = $date->format('M Y');

            $row = Payslip::whereYear('created_at', $y)
                ->whereMonth('created_at', $m)
                ->selectRaw('SUM(gross_pay) as gross, SUM(net_pay) as net')
                ->first();

            $trend[] = [
                'month' => $label,
                'gross' => round((float) ($row->gross ?? 0)),
                'net'   => round((float) ($row->net   ?? 0)),
            ];
        }

        // ── Attendance today breakdown ────────────────────────────────────────

        $attendanceToday = Attendance::where('date', $today)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->map(fn ($c) => (int) $c);

        // Format as array for Chart.js
        $attendanceSummary = collect(['present','absent','late','on_leave','holiday'])
            ->filter(fn ($s) => $attendanceToday->has($s))
            ->map(fn ($s) => ['status' => $s, 'count' => $attendanceToday[$s]])
            ->values();

        // ── Headcount by department ───────────────────────────────────────────

        $deptHeadcount = Employee::where('is_active', true)
            ->selectRaw('department, COUNT(*) as count')
            ->groupBy('department')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($r) => ['department' => $r->department ?: 'Unassigned', 'count' => (int) $r->count]);

        // ── Response ──────────────────────────────────────────────────────────

        return response()->json([
            'total_employees'          => $totalEmployees,
            'present_today'            => $presentToday,
            'pending_leaves'           => $pendingLeaves,
            'pending_overtime'         => $pendingOvertime,
            'total_payroll_this_month' => round((float) $payrollThisMonth),
            'open_jobs'                => $openJobs,
            'payroll_trend'            => $trend,
            'attendance_today'         => $attendanceSummary,
            'dept_headcount'           => $deptHeadcount,
        ]);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  ROUTE — add to backend/routes/api.php
//
//  Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
//
// ══════════════════════════════════════════════════════════════════════════════