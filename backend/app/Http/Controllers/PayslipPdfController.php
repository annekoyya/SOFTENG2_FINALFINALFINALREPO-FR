<?php

namespace App\Http\Controllers;

use App\Mail\PayslipMail;
use App\Models\Payslip;
use App\Models\PayrollAuditLog;
use App\Models\PayrollPeriod;
use App\Services\PayslipPDF;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

class PayslipPdfController extends Controller
{
    /**
     * Stream / download a single payslip PDF.
     * GET /api/payslips/{payslip}/pdf
     */
    public function download(Payslip $payslip): Response
    {
        $payslip->loadMissing(['employee', 'period', 'earnings', 'deductions', 'approvedBy']);

        $pdf      = PayslipPDF::generate($payslip);
        $filename = PayslipPDF::getFilename($payslip);

        PayrollAuditLog::record(
            entityType:  'payslip',
            entityId:    $payslip->id,
            action:      'pdf_generated',
            performedBy: Auth::id(),
            description: "PDF downloaded: {$filename}",
            ipAddress:   request()->ip(),
        );

        return $pdf->download($filename);
    }

    /**
     * Send payslip email to the employee.
     * POST /api/payslips/{payslip}/send-email
     */
    public function sendEmail(Payslip $payslip): JsonResponse
    {
        $payslip->loadMissing(['employee', 'period', 'earnings', 'deductions']);

        $email = $payslip->employee->email;

        if (!$email) {
            return $this->error('Employee has no email address on file.');
        }

        // Send the email (queued if queue driver configured)
        Mail::to($email)->send(new PayslipMail($payslip));

        // Mark email as sent
        $payslip->update([
            'email_sent'    => true,
            'email_sent_at' => now(),
        ]);

        PayrollAuditLog::record(
            entityType:  'payslip',
            entityId:    $payslip->id,
            action:      'email_sent',
            performedBy: Auth::id(),
            afterValues: ['email' => $email, 'sent_at' => now()->toIso8601String()],
            description: "Payslip emailed to {$email}",
            ipAddress:   request()->ip(),
        );

        return $this->success(null, "Payslip sent to {$email}");
    }

    /**
     * Bulk send payslips for an entire period.
     * POST /api/payslips/bulk-send-email
     */
    public function bulkSendEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payroll_period_id' => 'required|exists:payroll_periods,id',
        ]);

        $payslips = Payslip::where('payroll_period_id', $validated['payroll_period_id'])
            ->whereIn('status', ['approved', 'paid'])
            ->with(['employee', 'period', 'earnings', 'deductions'])
            ->get();

        if ($payslips->isEmpty()) {
            return $this->error('No approved payslips found for this period.');
        }

        $sent   = [];
        $failed = [];

        foreach ($payslips as $payslip) {
            // Ensure payslip is a model instance, not stdClass
            if (!($payslip instanceof Payslip)) continue;
            $email = $payslip->employee->email ?? null;
            if (!$email) {
                $failed[] = ['name' => $payslip->employee->full_name, 'reason' => 'No email on file'];
                continue;
            }

            try {
                Mail::to($email)->send(new PayslipMail($payslip));
                $payslip->update(['email_sent' => true, 'email_sent_at' => now()]);
                $sent[] = ['name' => $payslip->employee->full_name, 'email' => $email];
            } catch (\Throwable $e) {
                $failed[] = ['name' => $payslip->employee->full_name, 'reason' => $e->getMessage()];
            }
        }

        PayrollAuditLog::record(
            entityType:  'payroll_period',
            entityId:    (int) $validated['payroll_period_id'],
            action:      'email_sent',
            performedBy: Auth::id(),
            afterValues: ['sent' => count($sent), 'failed' => count($failed)],
            description: "Bulk payslip emails sent: " . count($sent) . " success, " . count($failed) . " failed.",
        );

        return $this->success([
            'sent_count'   => count($sent),
            'failed_count' => count($failed),
            'sent'         => $sent,
            'failed'       => $failed,
        ], count($sent) . " payslips emailed successfully.");
    }

    /**
     * Generate payroll summary PDF for a period (audit-ready).
     * GET /api/payroll-periods/{period}/summary-pdf
     */
    public function summaryPdf(PayrollPeriod $period): Response
    {
        $period->load(['payslips.employee', 'approver', 'processor']);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('payslips.summary', [
            'period'   => $period,
            'payslips' => $period->payslips->sortBy('employee.last_name'),
            'summary'  => [
                'total_employees'   => $period->payslips->count(),
                'total_gross'       => $period->payslips->sum('gross_pay'),
                'total_deductions'  => $period->payslips->sum('total_deductions'),
                'total_net'         => $period->payslips->sum('net_pay'),
                'total_sss'         => $period->payslips->sum('sss_employee'),
                'total_philhealth'  => $period->payslips->sum('philhealth_employee'),
                'total_pagibig'     => $period->payslips->sum('pagibig_employee'),
                'total_bir'         => $period->payslips->sum('bir_withholding_tax'),
            ],
        ])->setPaper('a4', 'landscape');

        $periodStart = is_string($period->period_start) ? \Carbon\Carbon::parse($period->period_start) : $period->period_start;
        $periodEnd = is_string($period->period_end) ? \Carbon\Carbon::parse($period->period_end) : $period->period_end;
        $filename = "payroll_summary_{$periodStart->format('Y-m-d')}_{$periodEnd->format('Y-m-d')}.pdf";

        PayrollAuditLog::record(
            entityType:  'payroll_period',
            entityId:    $period->id,
            action:      'pdf_generated',
            performedBy: Auth::id(),
            description: "Payroll summary PDF downloaded: {$filename}",
        );

        return $pdf->download($filename);
    }
}