<?php
// backend/app/Http/Controllers/PayslipController.php
// REPLACE ENTIRE FILE — unified controller covering periods, payslips, email, PDF, audit

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\Payslip;
use App\Models\PayrollAuditLog;
use App\Services\PayslipService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Barryvdh\DomPDF\Facade\Pdf;

class PayslipController extends Controller
{
    public function __construct(private PayslipService $payslipService) {}

    // ─── Helper — consistent JSON responses ──────────────────────────────────

    private function ok(mixed $data, string $message = ''): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $data, 'message' => $message]);
    }

    private function fail(string $message, int $status = 422): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message], $status);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAYROLL PERIODS
    // ═══════════════════════════════════════════════════════════════════════

    // GET /api/payroll-periods
    public function listPeriods(): JsonResponse
    {
        $periods = PayrollPeriod::withCount('payslips')
            ->orderBy('period_start', 'desc')
            ->paginate(20);
        return $this->ok($periods);
    }

    // POST /api/payroll-periods
    public function createPeriod(Request $request): JsonResponse
    {
        $v = $request->validate([
            'type'         => 'required|in:semi_monthly,monthly',
            'period_start' => 'required|date',
            'period_end'   => 'required|date|after:period_start',
            'label'        => 'required|string|max:100',
        ]);
        $period = PayrollPeriod::create([...$v, 'status' => 'open']);
        return $this->ok($period, 'Payroll period created');
    }

    // POST /api/payroll-periods/generate-next
    public function generateNextPeriod(Request $request): JsonResponse
    {
        $type   = $request->input('type', 'semi_monthly');
        $period = PayrollPeriod::generateNext($type);
        return $this->ok($period, 'Next period generated');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COMPUTE
    // ═══════════════════════════════════════════════════════════════════════

    // POST /api/payslips/compute
    public function computeSingle(Request $request): JsonResponse
    {
        $v = $request->validate([
            'employee_id'       => 'required|exists:employees,id',
            'payroll_period_id' => 'required|exists:payroll_periods,id',
        ]);
        $payslip = $this->payslipService->compute(
            Employee::findOrFail($v['employee_id']),
            PayrollPeriod::findOrFail($v['payroll_period_id']),
            Auth::id()
        );
        return $this->ok($payslip, 'Payslip computed');
    }

    // POST /api/payslips/compute-all
    public function computeAll(Request $request): JsonResponse
    {
        $v      = $request->validate(['payroll_period_id' => 'required|exists:payroll_periods,id']);
        $period = PayrollPeriod::findOrFail($v['payroll_period_id']);

        if (!$period->canProcess()) {
            return $this->fail("Period is in '{$period->status}' and cannot be processed.");
        }

        return $this->ok($this->payslipService->computeAll($period, Auth::id()), 'Bulk computation complete');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAYSLIPS CRUD
    // ═══════════════════════════════════════════════════════════════════════

    // GET /api/payslips
    public function index(Request $request): JsonResponse
    {
        $q = Payslip::with(['employee', 'period'])->latest();

        if ($request->filled('payroll_period_id')) $q->where('payroll_period_id', $request->payroll_period_id);
        if ($request->filled('employee_id'))        $q->where('employee_id',       $request->employee_id);
        if ($request->filled('status'))             $q->where('status',            $request->status);

        return $this->ok($q->paginate(50));
    }

    // GET /api/payslips/{payslip}
    public function show(Payslip $payslip): JsonResponse
    {
        return $this->ok(
            $payslip->load(['employee', 'period', 'earnings', 'deductions', 'computedBy', 'approvedBy'])
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WORKFLOW
    // ═══════════════════════════════════════════════════════════════════════

    // POST /api/payslips/{payslip}/adjust
    public function adjust(Request $request, Payslip $payslip): JsonResponse
    {
        $v = $request->validate([
            'category' => 'required|in:earning,deduction',
            'label'    => 'required|string|max:100',
            'amount'   => 'required|numeric|min:0.01',
            'note'     => 'required|string|max:500',
        ]);
        return $this->ok(
            $this->payslipService->addManualAdjustment($payslip, $v['category'], $v['label'], $v['amount'], $v['note'], Auth::id()),
            'Adjustment applied'
        );
    }

    // POST /api/payslips/{payslip}/approve
    public function approve(Payslip $payslip): JsonResponse
    {
        if (!$payslip->canApprove()) {
            return $this->fail("Only computed payslips can be approved. Current: {$payslip->status}");
        }

        $payslip->update(['status' => 'approved', 'approved_by' => Auth::id(), 'approved_at' => now()]);

        PayrollAuditLog::record('payslip', $payslip->id, 'approved', Auth::id(),
            ['status' => 'computed'], ['status' => 'approved'],
            "Payslip approved for {$payslip->employee->full_name}");

        return $this->ok($payslip->fresh(), 'Payslip approved');
    }

    // POST /api/payslips/{payslip}/pay
    public function markPaid(Payslip $payslip): JsonResponse
    {
        if (!$payslip->canPay()) {
            return $this->fail('Only approved payslips can be marked as paid.');
        }

        $payslip->update(['status' => 'paid']);
        $this->applyLoanDeductions($payslip);

        PayrollAuditLog::record('payslip', $payslip->id, 'paid', Auth::id(),
            [], ['net_pay' => $payslip->net_pay],
            '₱' . number_format($payslip->net_pay, 2) . " disbursed to {$payslip->employee->full_name}");

        return $this->ok($payslip->fresh(), 'Marked as paid');
    }

    // POST /api/payslips/approve-all/{period}
    public function approveAll(int $periodId): JsonResponse
    {
        $period = PayrollPeriod::findOrFail($periodId);

        $count = Payslip::where('payroll_period_id', $periodId)
            ->where('status', 'computed')
            ->update(['status' => 'approved', 'approved_by' => Auth::id(), 'approved_at' => now()]);

        PayrollAuditLog::record('payroll_period', $periodId, 'approved', Auth::id(),
            [], ['approved_count' => $count],
            "Bulk approved {$count} payslips for {$period->label}");

        $period->update(['status' => 'approved']);

        return $this->ok(['count' => $count], "Approved {$count} payslips");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PDF & EMAIL
    // ═══════════════════════════════════════════════════════════════════════

    // GET /api/payslips/{payslip}/pdf
    public function downloadPdf(Payslip $payslip): \Symfony\Component\HttpFoundation\Response
    {
        $payslip->load(['employee', 'period', 'earnings', 'deductions']);

        try {
            $pdf = Pdf::loadView('payslips.template', ['payslip' => $payslip])
                ->setPaper('a4', 'portrait');

            $filename = "payslip_{$payslip->employee->id}_{$payslip->period->label}.pdf";
            $filename = preg_replace('/[^a-zA-Z0-9_\-.]/', '_', $filename);

            PayrollAuditLog::record('payslip', $payslip->id, 'pdf_generated', Auth::id(),
                [], [], "PDF generated for {$payslip->employee->full_name}");

            return $pdf->download($filename);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'PDF generation failed: ' . $e->getMessage()], 500);
        }
    }

    // POST /api/payslips/{payslip}/send-email
    public function sendEmail(Payslip $payslip): JsonResponse
    {
        $payslip->load(['employee', 'period', 'earnings', 'deductions']);

        if (!$payslip->employee->email) {
            return $this->fail('Employee has no email address.');
        }

        try {
            $pdf = null;
            try {
                $pdf = Pdf::loadView('payslips.template', ['payslip' => $payslip]);
            } catch (\Throwable) { /* DomPDF not installed — send without attachment */ }

            Mail::send('payslips.email', ['payslip' => $payslip], function ($mail) use ($payslip, $pdf) {
                $mail->to($payslip->employee->email, $payslip->employee->full_name)
                     ->subject("Your Payslip — {$payslip->period->label}");
                if ($pdf) {
                    $filename = "payslip_{$payslip->period->label}.pdf";
                    $mail->attachData($pdf->output(), $filename, ['mime' => 'application/pdf']);
                }
            });

            $payslip->update(['email_sent' => true, 'email_sent_at' => now()]);

            PayrollAuditLog::record('payslip', $payslip->id, 'email_sent', Auth::id(),
                [], ['email' => $payslip->employee->email],
                "Payslip emailed to {$payslip->employee->email}");

            return $this->ok(null, 'Email sent');
        } catch (\Throwable $e) {
            return $this->fail('Email failed: ' . $e->getMessage());
        }
    }

    // POST /api/payslips/bulk-send-email
    public function bulkSendEmail(Request $request): JsonResponse
    {
        $v      = $request->validate(['payroll_period_id' => 'required|exists:payroll_periods,id']);
        $period = PayrollPeriod::findOrFail($v['payroll_period_id']);

        $payslips = Payslip::where('payroll_period_id', $period->id)
            ->where('status', 'approved')
            ->with(['employee', 'period', 'earnings', 'deductions'])
            ->get();

        $sent = 0; $failed = 0;

        foreach ($payslips as $payslip) {
            try {
                if (!$payslip->employee->email) { $failed++; continue; }

                Mail::send('payslips.email', ['payslip' => $payslip], function ($mail) use ($payslip) {
                    $mail->to($payslip->employee->email, $payslip->employee->full_name)
                         ->subject("Your Payslip — {$payslip->period->label}");
                });

                $payslip->update(['email_sent' => true, 'email_sent_at' => now()]);
                $sent++;
            } catch (\Throwable) { $failed++; }
        }

        PayrollAuditLog::record('payroll_period', $period->id, 'email_sent', Auth::id(),
            [], ['sent' => $sent, 'failed' => $failed],
            "Bulk email: {$sent} sent, {$failed} failed for {$period->label}");

        return $this->ok(['sent_count' => $sent, 'failed_count' => $failed],
            "{$sent} payslips emailed, {$failed} failed");
    }

    // GET /api/payroll-periods/{period}/summary-pdf
    public function summaryPdf(int $periodId): \Symfony\Component\HttpFoundation\Response
    {
        $period   = PayrollPeriod::with('payslips.employee')->findOrFail($periodId);
        $payslips = $period->payslips;

        $data = [
            'period'            => $period,
            'total_employees'   => $payslips->count(),
            'total_gross'       => round($payslips->sum('gross_pay'), 2),
            'total_deductions'  => round($payslips->sum('total_deductions'), 2),
            'total_net'         => round($payslips->sum('net_pay'), 2),
            'total_bir'         => round($payslips->sum('bir_withholding_tax'), 2),
            'by_department'     => $payslips->groupBy(fn($p) => $p->employee->department ?? 'Unknown')
                ->map(fn($g) => ['count' => $g->count(), 'gross' => round($g->sum('gross_pay'), 2), 'net' => round($g->sum('net_pay'), 2)]),
            'payslips'          => $payslips,
        ];

        try {
            return Pdf::loadView('payslips.summary', $data)
                ->setPaper('a4', 'landscape')
                ->download("payroll_summary_{$period->label}.pdf");
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'PDF error: ' . $e->getMessage()], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUMMARY & AUDIT
    // ═══════════════════════════════════════════════════════════════════════

    // GET /api/payslips/summary?payroll_period_id=X
    public function summary(Request $request): JsonResponse
    {
        $v        = $request->validate(['payroll_period_id' => 'required|exists:payroll_periods,id']);
        $period   = PayrollPeriod::with('payslips.employee')->findOrFail($v['payroll_period_id']);
        $payslips = $period->payslips;

        return $this->ok([
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

    // GET /api/payslips/audit-trail
    public function auditTrail(Request $request): JsonResponse
    {
        $q = PayrollAuditLog::with('performer')->orderBy('created_at', 'desc');

        if ($request->filled('entity_type'))       $q->where('entity_type', $request->entity_type);
        if ($request->filled('entity_id'))         $q->where('entity_id',   $request->entity_id);
        if ($request->filled('payroll_period_id')) {
            $ids = Payslip::where('payroll_period_id', $request->payroll_period_id)->pluck('id');
            $pid = $request->payroll_period_id;
            $q->where(fn($x) =>
                $x->where(fn($a) => $a->where('entity_type', 'payslip')->whereIn('entity_id', $ids))
                  ->orWhere(fn($b) => $b->where('entity_type', 'payroll_period')->where('entity_id', $pid))
            );
        }

        return $this->ok($q->paginate(50));
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function applyLoanDeductions(Payslip $payslip): void
    {
        $types = ['sss' => 'sss_loan_deduction', 'pagibig' => 'pagibig_loan_deduction', 'company' => 'company_loan_deduction'];
        foreach ($types as $type => $field) {
            if ($payslip->{$field} > 0) {
                \App\Models\EmployeeLoan::where('employee_id', $payslip->employee_id)
                    ->where('type', $type)->active()->first()?->applyDeduction($payslip->{$field});
            }
        }
    }
}