<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\Payslip;
use App\Models\PayrollAuditLog;
use App\Services\PayslipService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class PayslipController extends Controller
{
    public function __construct(private PayslipService $payslipService) {}

    // ─── Periods ──────────────────────────────────────────────────────────────

    public function listPeriods(Request $request): JsonResponse
    {
        $periods = PayrollPeriod::withCount('payslips')
            ->orderBy('period_start', 'desc')
            ->paginate(20);
        return $this->success($periods);
    }

    public function createPeriod(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type'         => 'required|in:semi_monthly,monthly',
            'period_start' => 'required|date',
            'period_end'   => 'required|date|after:period_start',
            'label'        => 'required|string|max:100',
        ]);
        $period = PayrollPeriod::create([...$validated, 'status' => 'open']);
        return $this->created($period, 'Payroll period created');
    }

    public function generateNextPeriod(Request $request): JsonResponse
    {
        $type   = $request->input('type', 'semi_monthly');
        $period = PayrollPeriod::generateNext($type);
        return $this->created($period, 'Next period generated');
    }

    // ─── Compute ──────────────────────────────────────────────────────────────

    public function computeSingle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id'       => 'required|exists:employees,id',
            'payroll_period_id' => 'required|exists:payroll_periods,id',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        $period   = PayrollPeriod::findOrFail($validated['payroll_period_id']);
        $payslip  = $this->payslipService->compute($employee, $period, Auth::id());

        return $this->success($payslip, 'Payslip computed successfully');
    }

    public function computeAll(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payroll_period_id' => 'required|exists:payroll_periods,id',
        ]);

        $period = PayrollPeriod::findOrFail($validated['payroll_period_id']);

        if (!$period->canProcess()) {
            return $this->error("Period is in '{$period->status}' status and cannot be processed.");
        }

        $results = $this->payslipService->computeAll($period, Auth::id());
        return $this->success($results, 'Bulk payroll computation complete');
    }

    // ─── Payslips ─────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = Payslip::with(['employee', 'period'])->latest();

        if ($request->filled('payroll_period_id')) $query->where('payroll_period_id', $request->query('payroll_period_id'));
        if ($request->filled('employee_id'))        $query->forEmployee($request->query('employee_id'));
        if ($request->filled('status'))             $query->byStatus($request->query('status'));

        return $this->success($query->paginate(20));
    }

    public function show(Payslip $payslip): JsonResponse
    {
        return $this->success(
            $payslip->load(['employee', 'period', 'earnings', 'deductions', 'computedBy', 'approvedBy'])
        );
    }

    public function adjust(Request $request, Payslip $payslip): JsonResponse
    {
        $validated = $request->validate([
            'category' => 'required|in:earning,deduction',
            'label'    => 'required|string|max:100',
            'amount'   => 'required|numeric|min:0.01',
            'note'     => 'required|string|max:500',
        ]);

        $payslip = $this->payslipService->addManualAdjustment(
            $payslip, $validated['category'], $validated['label'],
            $validated['amount'], $validated['note'], Auth::id()
        );

        return $this->success($payslip, 'Adjustment applied');
    }

    public function approve(Payslip $payslip): JsonResponse
    {
        if (!$payslip->canApprove()) {
            return $this->error("Only computed payslips can be approved.");
        }

        $payslip->update([
            'status'      => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        PayrollAuditLog::record('payslip', $payslip->id, 'approved', Auth::id(),
            [], ['status' => 'approved'],
            "Payslip approved for {$payslip->employee->full_name}");

        return $this->success($payslip->fresh(), 'Payslip approved');
    }

    public function markPaid(Payslip $payslip): JsonResponse
    {
        if (!$payslip->canPay()) {
            return $this->error("Only approved payslips can be marked as paid.");
        }

        $payslip->update(['status' => 'paid']);
        $this->applyLoanDeductions($payslip);

        PayrollAuditLog::record('payslip', $payslip->id, 'paid', Auth::id(),
            [], ['net_pay' => $payslip->net_pay],
            "Payslip paid — ₱" . number_format($payslip->net_pay, 2) . " to {$payslip->employee->full_name}");

        return $this->success($payslip->fresh(), 'Marked as paid');
    }

    // ─── Summary + Audit ──────────────────────────────────────────────────────

    public function summary(Request $request): JsonResponse
    {
        $validated = $request->validate(['payroll_period_id' => 'required|exists:payroll_periods,id']);
        $period    = PayrollPeriod::with('payslips.employee')->findOrFail($validated['payroll_period_id']);
        $payslips  = $period->payslips;

        return $this->success([
            'period'                    => $period,
            'total_employees'           => $payslips->count(),
            'total_gross'               => round($payslips->sum('gross_pay'), 2),
            'total_deductions'          => round($payslips->sum('total_deductions'), 2),
            'total_net'                 => round($payslips->sum('net_pay'), 2),
            'total_sss_employee'        => round($payslips->sum('sss_employee'), 2),
            'total_sss_employer'        => round($payslips->sum('sss_employer'), 2),
            'total_philhealth_employee' => round($payslips->sum('philhealth_employee'), 2),
            'total_philhealth_employer' => round($payslips->sum('philhealth_employer'), 2),
            'total_pagibig_employee'    => round($payslips->sum('pagibig_employee'), 2),
            'total_pagibig_employer'    => round($payslips->sum('pagibig_employer'), 2),
            'total_bir'                 => round($payslips->sum('bir_withholding_tax'), 2),
            'by_department'             => $payslips->groupBy(fn($p) => $p->employee->department ?? 'Unknown')
                ->map(fn($g) => ['count' => $g->count(), 'gross' => round($g->sum('gross_pay'), 2), 'net' => round($g->sum('net_pay'), 2)]),
        ]);
    }

    public function auditTrail(Request $request): JsonResponse
    {
        $query = PayrollAuditLog::with('performer')->orderBy('created_at', 'desc');

        if ($request->filled('entity_type')) $query->where('entity_type', $request->query('entity_type'));
        if ($request->filled('entity_id'))   $query->where('entity_id', $request->query('entity_id'));
        if ($request->filled('payroll_period_id')) {
            $payslipIds = Payslip::where('payroll_period_id', $request->query('payroll_period_id'))->pluck('id');
            $query->where(fn($q) =>
                $q->where(fn($q2) => $q2->where('entity_type', 'payslip')->whereIn('entity_id', $payslipIds))
                  ->orWhere(fn($q2) => $q2->where('entity_type', 'payroll_period')->where('entity_id', $request->query('payroll_period_id')))
            );
        }

        return $this->success($query->paginate(50));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function applyLoanDeductions(Payslip $payslip): void
    {
        if ($payslip->sss_loan_deduction > 0) {
            \App\Models\EmployeeLoan::where('employee_id', $payslip->employee_id)->where('type', 'sss')->active()->first()?->applyDeduction($payslip->sss_loan_deduction);
        }
        if ($payslip->pagibig_loan_deduction > 0) {
            \App\Models\EmployeeLoan::where('employee_id', $payslip->employee_id)->where('type', 'pagibig')->active()->first()?->applyDeduction($payslip->pagibig_loan_deduction);
        }
        if ($payslip->company_loan_deduction > 0) {
            \App\Models\EmployeeLoan::where('employee_id', $payslip->employee_id)->where('type', 'company')->active()->first()?->applyDeduction($payslip->company_loan_deduction);
        }
    }

    public function approveAll(int $periodId): JsonResponse
{
    $period = PayrollPeriod::findOrFail($periodId);
 
    $count = Payslip::where('payroll_period_id', $periodId)
        ->where('status', 'computed')
        ->update([
            'status'      => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);
 
    PayrollAuditLog::create([
        'action'      => 'bulk_approved',
        'entity_type' => 'PayrollPeriod',
        'entity_id'   => $periodId,
        'user_id'     => Auth::id(),
        'description' => "Bulk approved {$count} payslips for period #{$periodId}",
    ]);
 
    $period->update(['status' => 'approved']);
 
    return response()->json(['message' => "Approved {$count} payslips.", 'count' => $count]);
}
}