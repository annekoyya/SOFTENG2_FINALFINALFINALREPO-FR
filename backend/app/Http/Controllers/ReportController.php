<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\LeaveBalance;
use App\Models\OvertimeRequest;
use App\Models\Payslip;
use App\Models\PayrollPeriod;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ReportController extends Controller
{
    // GET /api/reports/generate?report_type=...&...
    public function generate(Request $request): Response
    {
        $type = $request->input('report_type');

        return match ($type) {
            'payroll_register'      => $this->payrollRegister($request),
            'attendance_report'     => $this->attendanceReport($request),
            'leave_balance'         => $this->leaveBalance($request),
            'tax_certificate'       => $this->taxCertificate($request),
            'overtime_summary'      => $this->overtimeSummary($request),
            'government_remittance' => $this->governmentRemittance($request),
            default => abort(422, 'Unknown report type.'),
        };
    }

    // ── 1. Payroll Register ────────────────────────────────────────────────────

    private function payrollRegister(Request $request): Response
    {
        $period = PayrollPeriod::findOrFail($request->payroll_period_id);

        $payslips = Payslip::with('employee:id,first_name,last_name,department,employment_type')
            ->where('payroll_period_id', $period->id)
            ->orderBy('employee_id')
            ->get();

        $totals = [
            'gross'       => $payslips->sum('gross_pay'),
            'net'         => $payslips->sum('net_pay'),
            'sss'         => $payslips->sum('sss_contribution'),
            'philhealth'  => $payslips->sum('philhealth_contribution'),
            'pagibig'     => $payslips->sum('pagibig_contribution'),
            'tax'         => $payslips->sum('withholding_tax'),
            'deductions'  => $payslips->sum('total_deductions'),
        ];

        $pdf = Pdf::loadView('reports.payroll_register', compact('period', 'payslips', 'totals'))
            ->setPaper('a4', 'landscape');

        $filename = "payroll_register_{$period->id}.pdf";
        return $this->download($pdf, $filename);
    }

    // ── 2. Attendance Report ──────────────────────────────────────────────────

    private function attendanceReport(Request $request): Response
    {
        $year  = $request->year  ?? now()->year;
        $month = $request->month ?? now()->month;
        $dept  = $request->department;

        $dateFrom = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
        $dateTo   = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        $q = Attendance::with('employee:id,first_name,last_name,department')
            ->whereBetween('date', [$dateFrom, $dateTo]);

        if ($dept && $dept !== 'All') {
            $q->whereHas('employee', fn ($eq) => $eq->where('department', $dept));
        }

        $records = $q->get();

        // Group by employee
        $byEmployee = $records->groupBy('employee_id')->map(function ($rows) {
            $emp = $rows->first()->employee;
            return [
                'name'       => $emp ? trim("{$emp->first_name} {$emp->last_name}") : '—',
                'department' => $emp?->department ?? '—',
                'present'    => $rows->where('status', 'present')->count(),
                'absent'     => $rows->where('status', 'absent')->count(),
                'late'       => $rows->where('status', 'late')->count(),
                'on_leave'   => $rows->where('status', 'on_leave')->count(),
                'holiday'    => $rows->where('status', 'holiday')->count(),
                'total'      => $rows->count(),
            ];
        })->values();

        $monthLabel = Carbon::create($year, $month)->format('F Y');

        $pdf = Pdf::loadView('reports.attendance_report', compact('byEmployee', 'monthLabel', 'dept'))
            ->setPaper('a4', 'landscape');

        return $this->download($pdf, "attendance_{$year}_{$month}.pdf");
    }

    // ── 3. Leave Balance Report ───────────────────────────────────────────────

    private function leaveBalance(Request $request): Response
    {
        $year = $request->year ?? now()->year;
        $dept = $request->department;

        $q = LeaveBalance::with('employee:id,first_name,last_name,department')
            ->where('year', $year);

        if ($dept && $dept !== 'All') {
            $q->whereHas('employee', fn ($eq) => $eq->where('department', $dept));
        }

        $balances = $q->get()
            ->groupBy('employee_id')
            ->map(function ($rows) {
                $emp = $rows->first()->employee;
                return [
                    'name'       => $emp ? trim("{$emp->first_name} {$emp->last_name}") : '—',
                    'department' => $emp?->department ?? '—',
                    'balances'   => $rows->keyBy('leave_type')->map(fn ($b) => [
                        'entitled'   => (float) $b->entitled_days,
                        'used'       => (float) $b->used_days,
                        'remaining'  => (float) $b->remaining_days,
                        'carried'    => (float) $b->carried_over,
                    ]),
                ];
            })->values();

        $pdf = Pdf::loadView('reports.leave_balance', compact('balances', 'year'))
            ->setPaper('a4', 'landscape');

        return $this->download($pdf, "leave_balance_{$year}.pdf");
    }

    // ── 4. Tax Certificate (BIR 2316) ────────────────────────────────────────

    private function taxCertificate(Request $request): Response
    {
        $year       = $request->year ?? now()->year;
        $employeeId = $request->employee_id;

        $q = Payslip::with('employee')
            ->whereYear('created_at', $year);

        if ($employeeId) $q->where('employee_id', $employeeId);

        $payslips = $q->get()->groupBy('employee_id');

        $certificates = $payslips->map(function ($slips) use ($year) {
            $emp = $slips->first()->employee;
            return [
                'employee'         => $emp,
                'year'             => $year,
                'total_gross'      => $slips->sum('gross_pay'),
                'total_net'        => $slips->sum('net_pay'),
                'total_tax'        => $slips->sum('withholding_tax'),
                'total_sss'        => $slips->sum('sss_contribution'),
                'total_philhealth' => $slips->sum('philhealth_contribution'),
                'total_pagibig'    => $slips->sum('pagibig_contribution'),
                'periods_count'    => $slips->count(),
            ];
        })->values();

        $pdf = Pdf::loadView('reports.tax_certificate', compact('certificates', 'year'))
            ->setPaper('a4', 'portrait');

        $suffix = $employeeId ? "employee_{$employeeId}" : "all";
        return $this->download($pdf, "tax_certificate_{$year}_{$suffix}.pdf");
    }

    // ── 5. Overtime Summary ───────────────────────────────────────────────────

    private function overtimeSummary(Request $request): Response
    {
        $year  = $request->year  ?? now()->year;
        $month = $request->month ?? now()->month;
        $dept  = $request->department;

        $q = OvertimeRequest::with('employee:id,first_name,last_name,department')
            ->where('status', 'approved')
            ->whereYear('date', $year)
            ->whereMonth('date', $month);

        if ($dept && $dept !== 'All') {
            $q->whereHas('employee', fn ($eq) => $eq->where('department', $dept));
        }

        $records    = $q->get();
        $monthLabel = Carbon::create($year, $month)->format('F Y');

        $byEmployee = $records->groupBy('employee_id')->map(function ($rows) {
            $emp = $rows->first()->employee;
            return [
                'name'          => $emp ? trim("{$emp->first_name} {$emp->last_name}") : '—',
                'department'    => $emp?->department ?? '—',
                'total_hours'   => $rows->sum('hours_approved'),
                'total_amount'  => $rows->sum('computed_amount'),
                'regular_ot'    => $rows->where('overtime_type','regular')->sum('hours_approved'),
                'restday_ot'    => $rows->where('overtime_type','rest_day')->sum('hours_approved'),
                'holiday_ot'    => $rows->whereIn('overtime_type',['special_holiday','regular_holiday'])->sum('hours_approved'),
            ];
        })->values();

        $pdf = Pdf::loadView('reports.overtime_summary', compact('byEmployee', 'monthLabel'))
            ->setPaper('a4', 'landscape');

        return $this->download($pdf, "overtime_{$year}_{$month}.pdf");
    }

    // ── 6. Government Remittance ──────────────────────────────────────────────

    private function governmentRemittance(Request $request): Response
    {
        $period = PayrollPeriod::findOrFail($request->payroll_period_id);

        $payslips = Payslip::with('employee:id,first_name,last_name,sss_number,philhealth_number,pagibig_number,tin_number')
            ->where('payroll_period_id', $period->id)
            ->get();

        $summary = [
            'sss_employee'        => $payslips->sum('sss_contribution'),
            'sss_employer'        => $payslips->sum('sss_employer_contribution'),
            'philhealth_employee' => $payslips->sum('philhealth_contribution'),
            'philhealth_employer' => $payslips->sum('philhealth_employer_contribution'),
            'pagibig_employee'    => $payslips->sum('pagibig_contribution'),
            'pagibig_employer'    => $payslips->sum('pagibig_employer_contribution'),
            'bir_tax'             => $payslips->sum('withholding_tax'),
        ];

        $pdf = Pdf::loadView('reports.government_remittance', compact('period', 'payslips', 'summary'))
            ->setPaper('a4', 'portrait');

        return $this->download($pdf, "remittance_{$period->id}.pdf");
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private function download(\Barryvdh\DomPDF\PDF $pdf, string $filename): Response
    {
        return $pdf->download($filename);
    }
}