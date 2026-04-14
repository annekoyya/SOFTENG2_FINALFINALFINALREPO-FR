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
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class PayslipController extends Controller
{
    public function __construct(private PayslipService $payslipService) {}

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

    public function listPeriods(): JsonResponse
    {
        $periods = PayrollPeriod::withCount('payslips')
            ->orderBy('period_start', 'desc')
            ->paginate(20);
        return $this->ok($periods);
    }

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

    public function generateNextPeriod(Request $request): JsonResponse
    {
        $type   = $request->input('type', 'semi_monthly');
        $period = PayrollPeriod::generateNext($type);
        return $this->ok($period, 'Next period generated');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COMPUTE
    // ═══════════════════════════════════════════════════════════════════════

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

    public function computeAll(Request $request): JsonResponse
    {
        $v      = $request->validate(['payroll_period_id' => 'required|exists:payroll_periods,id']);
        $period = PayrollPeriod::findOrFail($v['payroll_period_id']);

        if (!in_array($period->status, ['open', 'computed'])) {
            return $this->fail("Period is in '{$period->status}' status and cannot be processed.");
        }

        Log::info("Starting payroll computation for period: {$period->label}");
        $period->update(['status' => 'processing']);

        $results = $this->payslipService->computeAll($period, Auth::id());
        $period->update(['status' => 'computed']);

        Log::info("Computation done: " . count($results['success']) . " success, " . count($results['failed']) . " failed");

        return $this->ok($results, 'Bulk computation complete');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAYSLIPS CRUD
    // ═══════════════════════════════════════════════════════════════════════

    public function index(Request $request): JsonResponse
    {
        $q = Payslip::with(['employee', 'period'])->latest();

        if ($request->filled('payroll_period_id')) $q->where('payroll_period_id', $request->payroll_period_id);
        if ($request->filled('employee_id'))        $q->where('employee_id',       $request->employee_id);
        if ($request->filled('status'))             $q->where('status',            $request->status);

        return $this->ok($q->paginate(50));
    }

    public function show(Payslip $payslip): JsonResponse
    {
        return $this->ok(
            $payslip->load(['employee', 'period', 'earnings', 'deductions', 'computedBy', 'approvedBy'])
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WORKFLOW
    // ═══════════════════════════════════════════════════════════════════════

    public function adjust(Request $request, Payslip $payslip): JsonResponse
    {
        $v = $request->validate([
            'category' => 'required|in:earning,deduction',
            'label'    => 'required|string|max:100',
            'amount'   => 'required|numeric|min:0.01',
            'note'     => 'required|string|max:500',
        ]);
        return $this->ok(
            $this->payslipService->addManualAdjustment(
                $payslip, $v['category'], $v['label'], $v['amount'], $v['note'], Auth::id()
            ),
            'Adjustment applied'
        );
    }

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

    public function approveAll(int $periodId): JsonResponse
    {
        $period = PayrollPeriod::findOrFail($periodId);

        if ($period->status !== 'computed') {
            return $this->fail("Period must be in 'computed' status to approve all. Current: {$period->status}");
        }

        $count = Payslip::where('payroll_period_id', $periodId)
            ->where('status', 'computed')
            ->update(['status' => 'approved', 'approved_by' => Auth::id(), 'approved_at' => now()]);

        if ($count > 0) {
            $period->update(['status' => 'approved']);
        }

        PayrollAuditLog::record('payroll_period', $periodId, 'approved', Auth::id(),
            [], ['approved_count' => $count],
            "Bulk approved {$count} payslips for {$period->label}");

        return $this->ok(['count' => $count], "{$count} payslips approved");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PDF & EMAIL
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Download a single payslip as PDF.
     * GET /api/payslips/{payslip}/pdf
     */
    public function downloadPdf(Payslip $payslip): \Symfony\Component\HttpFoundation\Response
    {
        $payslip->load(['employee', 'period', 'earnings', 'deductions']);

        try {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('payslips.template', ['payslip' => $payslip])
                ->setPaper('a4', 'portrait');

            $filename = 'payslip_' . $payslip->employee->id . '_' . preg_replace('/[^a-zA-Z0-9_\-]/', '_', $payslip->period->label) . '.pdf';

            PayrollAuditLog::record('payslip', $payslip->id, 'pdf_generated', Auth::id(),
                [], [], "PDF generated for {$payslip->employee->full_name}");

            return $pdf->download($filename);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'PDF generation failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Payroll Summary PDF download.
     * GET /api/payroll-periods/{periodId}/summary-pdf
     *
     * ✅ FIXED:
     * - Route is now inside auth:sanctum — no manual token hacks needed
     * - Returns a real downloadable PDF (DomPDF) with HTML fallback
     * - No CORS headers needed (same-origin fetch from frontend)
     * - Frontend uses authFetch + blob download (not window.open)
     */
    public function summaryPdf(int $periodId): \Symfony\Component\HttpFoundation\Response
    {
        $period   = PayrollPeriod::with('payslips.employee')->findOrFail($periodId);
        $payslips = $period->payslips;

        $totalGross      = round($payslips->sum('gross_pay'), 2);
        $totalDeductions = round($payslips->sum('total_deductions'), 2);
        $totalNet        = round($payslips->sum('net_pay'), 2);
        $totalSSS        = round($payslips->sum('sss_employee') + $payslips->sum('sss_employer'), 2);
        $totalPH         = round($payslips->sum('philhealth_employee') + $payslips->sum('philhealth_employer'), 2);
        $totalPIBIG      = round($payslips->sum('pagibig_employee') + $payslips->sum('pagibig_employer'), 2);
        $totalBIR        = round($payslips->sum('bir_withholding_tax'), 2);

        $html = $this->buildSummaryHtml($period, $payslips, [
            'total_gross'      => $totalGross,
            'total_deductions' => $totalDeductions,
            'total_net'        => $totalNet,
            'total_sss'        => $totalSSS,
            'total_philhealth' => $totalPH,
            'total_pagibig'    => $totalPIBIG,
            'total_bir'        => $totalBIR,
        ]);

        $filename = 'payroll_summary_' . preg_replace('/[^a-zA-Z0-9_\-]/', '_', $period->label) . '.pdf';

        // Try DomPDF first; fall back to an inline HTML download if not installed
        try {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('a4', 'landscape');
            return $pdf->download($filename);
        } catch (\Throwable) {
            // DomPDF not installed — stream HTML as a downloadable file
            // The browser will prompt "open with" or save; works as a printable report
            return response($html, 200, [
                'Content-Type'        => 'text/html; charset=utf-8',
                'Content-Disposition' => 'attachment; filename="' . str_replace('.pdf', '.html', $filename) . '"',
            ]);
        }
    }

    /**
     * Build the full HTML for the payroll summary report.
     * Used by summaryPdf() — extracted so it stays readable.
     */
    private function buildSummaryHtml(PayrollPeriod $period, $payslips, array $totals): string
    {
        $fmt = fn($n) => '&#8369;' . number_format($n, 2);
        $rows = '';

        foreach ($payslips as $ps) {
            $name = htmlspecialchars($ps->employee->first_name . ' ' . $ps->employee->last_name);
            $dept = htmlspecialchars($ps->employee->department ?? '—');
            $rows .= "<tr>
                <td>{$name}</td>
                <td>{$dept}</td>
                <td class='r'>{$fmt($ps->basic_pay)}</td>
                <td class='r'>{$fmt($ps->overtime_pay)}</td>
                <td class='r'>{$fmt($ps->gross_pay)}</td>
                <td class='r'>{$fmt($ps->total_deductions)}</td>
                <td class='r bold'>{$fmt($ps->net_pay)}</td>
                <td class='c'>" . ucfirst($ps->status) . "</td>
            </tr>";
        }

        $label  = htmlspecialchars($period->label);
        $genAt  = now()->format('F d, Y  H:i');
        $count  = $payslips->count();

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Payroll Summary — {$label}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; padding: 20px; }
  .header { margin-bottom: 16px; }
  .header h1 { font-size: 16px; color: #1a2e52; }
  .header p  { font-size: 10px; color: #555; margin-top: 2px; }
  .kpi-row { display: flex; gap: 12px; margin-bottom: 16px; }
  .kpi { background: #f0f4ff; border: 1px solid #c8d5f5; border-radius: 6px;
         padding: 8px 14px; flex: 1; }
  .kpi .val { font-size: 15px; font-weight: bold; color: #1a2e52; margin-top: 2px; }
  .kpi .lbl { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: .5px; }
  .kpi.green .val { color: #166534; }
  .kpi.red   .val { color: #991b1b; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead th { background: #1a2e52; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; }
  thead th.r { text-align: right; }
  thead th.c { text-align: center; }
  tbody tr:nth-child(even) { background: #f7f9ff; }
  tbody td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
  .r    { text-align: right; }
  .c    { text-align: center; }
  .bold { font-weight: bold; }
  .remit { border: 1px solid #c8d5f5; border-radius: 6px; padding: 10px 14px; background: #f0f4ff; margin-bottom: 16px; }
  .remit h3 { font-size: 11px; color: #1a2e52; margin-bottom: 6px; }
  .remit table { margin: 0; }
  .remit thead th { background: #2e4a7a; font-size: 9px; }
  .footer { font-size: 9px; color: #888; border-top: 1px solid #ddd; padding-top: 6px; }
</style>
</head>
<body>
<div class="header">
  <h1>Payroll Summary Report — {$label}</h1>
  <p>Blue Lotus Hotel &nbsp;|&nbsp; HR Harmony Suite &nbsp;|&nbsp; Generated: {$genAt} &nbsp;|&nbsp; Total employees: {$count}</p>
</div>

<div class="kpi-row">
  <div class="kpi">
    <div class="lbl">Employees</div>
    <div class="val">{$count}</div>
  </div>
  <div class="kpi green">
    <div class="lbl">Total Gross Pay</div>
    <div class="val">{$fmt($totals['total_gross'])}</div>
  </div>
  <div class="kpi red">
    <div class="lbl">Total Deductions</div>
    <div class="val">{$fmt($totals['total_deductions'])}</div>
  </div>
  <div class="kpi">
    <div class="lbl">Total Net Pay</div>
    <div class="val">{$fmt($totals['total_net'])}</div>
  </div>
</div>

<div class="remit">
  <h3>Government Remittance Summary</h3>
  <table>
    <thead><tr>
      <th>Contribution</th>
      <th class="r">Amount</th>
    </tr></thead>
    <tbody>
      <tr><td>SSS (Employee + Employer)</td><td class="r bold">{$fmt($totals['total_sss'])}</td></tr>
      <tr><td>PhilHealth (Employee + Employer)</td><td class="r bold">{$fmt($totals['total_philhealth'])}</td></tr>
      <tr><td>Pag-IBIG (Employee + Employer)</td><td class="r bold">{$fmt($totals['total_pagibig'])}</td></tr>
      <tr><td>BIR Withholding Tax</td><td class="r bold">{$fmt($totals['total_bir'])}</td></tr>
    </tbody>
  </table>
</div>

<table>
  <thead>
    <tr>
      <th>Employee</th>
      <th>Department</th>
      <th class="r">Basic Pay</th>
      <th class="r">Overtime</th>
      <th class="r">Gross Pay</th>
      <th class="r">Deductions</th>
      <th class="r">Net Pay</th>
      <th class="c">Status</th>
    </tr>
  </thead>
  <tbody>
    {$rows}
  </tbody>
</table>

<div class="footer">
  This report is system-generated by HR Harmony Suite. For discrepancies, contact your HR department.
</div>
</body>
</html>
HTML;
    }

    /**
     * Send a single payslip email.
     * POST /api/payslips/{payslip}/send-email
     */
    public function sendEmail(Payslip $payslip): JsonResponse
    {
        $payslip->load(['employee', 'period']);

        if (!$payslip->employee->email) {
            return $this->fail('Employee has no email address.');
        }

        try {
            Mail::raw(
                "Dear {$payslip->employee->first_name} {$payslip->employee->last_name},\n\n" .
                "Your payslip for {$payslip->period->label} is ready.\n\n" .
                "Gross Pay:    ₱" . number_format($payslip->gross_pay, 2)       . "\n" .
                "Deductions:   ₱" . number_format($payslip->total_deductions, 2) . "\n" .
                "Net Pay:      ₱" . number_format($payslip->net_pay, 2)          . "\n\n" .
                "Thank you,\nBlue Lotus HR Team",
                fn($m) => $m->to($payslip->employee->email, $payslip->employee->full_name)
                            ->subject("Your Payslip — {$payslip->period->label}")
            );

            $payslip->update(['email_sent' => true, 'email_sent_at' => now()]);

            PayrollAuditLog::record('payslip', $payslip->id, 'email_sent', Auth::id(),
                [], ['email' => $payslip->employee->email],
                "Payslip emailed to {$payslip->employee->email}");

            return $this->ok(null, 'Email sent successfully');
        } catch (\Throwable $e) {
            return $this->fail('Email failed: ' . $e->getMessage());
        }
    }

    /**
     * Bulk email all approved payslips in a period.
     * POST /api/payslips/bulk-send-email
     */
    public function bulkSendEmail(Request $request): JsonResponse
    {
        $v      = $request->validate(['payroll_period_id' => 'required|exists:payroll_periods,id']);
        $period = PayrollPeriod::findOrFail($v['payroll_period_id']);

        $payslips = Payslip::where('payroll_period_id', $period->id)
            ->where('status', 'approved')
            ->with(['employee', 'period'])
            ->get();

        $sent = 0; $failed = 0; $errors = [];

        foreach ($payslips as $payslip) {
            try {
                if (!$payslip->employee->email) {
                    $failed++;
                    $errors[] = "No email: {$payslip->employee->first_name} {$payslip->employee->last_name}";
                    continue;
                }
                Mail::raw(
                    "Dear {$payslip->employee->first_name},\n\n" .
                    "Your payslip for {$payslip->period->label} is ready.\n" .
                    "Net Pay: ₱" . number_format($payslip->net_pay, 2) . "\n\nBlue Lotus HR",
                    fn($m) => $m->to($payslip->employee->email, $payslip->employee->full_name)
                                ->subject("Your Payslip — {$payslip->period->label}")
                );
                $payslip->update(['email_sent' => true, 'email_sent_at' => now()]);
                $sent++;
            } catch (\Throwable $e) {
                $failed++;
                $errors[] = "Failed ({$payslip->employee->first_name}): " . $e->getMessage();
            }
        }

        return $this->ok(
            ['sent_count' => $sent, 'failed_count' => $failed, 'errors' => $errors],
            "{$sent} emails sent, {$failed} failed"
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUMMARY & AUDIT
    // ═══════════════════════════════════════════════════════════════════════

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

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function applyLoanDeductions(Payslip $payslip): void
    {
        $map = ['sss' => 'sss_loan_deduction', 'pagibig' => 'pagibig_loan_deduction', 'company' => 'company_loan_deduction'];
        foreach ($map as $type => $field) {
            if ($payslip->{$field} > 0) {
                \App\Models\EmployeeLoan::where('employee_id', $payslip->employee_id)
                    ->where('type', $type)->active()->first()?->applyDeduction($payslip->{$field});
            }
        }
    }
}