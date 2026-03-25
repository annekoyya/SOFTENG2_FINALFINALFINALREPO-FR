<?php

namespace App\Services;

use App\Models\Payslip;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class PayslipPDF
{
    /**
     * Generate a PDF payslip and return the PDF instance.
     * Use ->download() or ->stream() or ->save() on the result.
     */
    public static function generate(Payslip $payslip): \Barryvdh\DomPDF\PDF
    {
        $payslip->loadMissing([
            'employee',
            'period',
            'earnings',
            'deductions',
        ]);

        return Pdf::loadView('payslips.template', [
            'payslip'  => $payslip,
            'employee' => $payslip->employee,
            'period'   => $payslip->period,
            'earnings' => $payslip->earnings,
            'deductions' => $payslip->deductions,
        ])->setPaper('a4', 'portrait');
    }

    /**
     * Generate PDF, save to storage, update payslip record with path.
     * Returns the storage path.
     */
    public static function generateAndStore(Payslip $payslip): string
    {
        $pdf      = self::generate($payslip);
        $filename = self::getFilename($payslip);
        $path     = "payslips/{$filename}";

        Storage::put($path, $pdf->output());

        // Update payslip record with PDF path
        $payslip->update(['pdf_path' => $path]);

        \App\Models\PayrollAuditLog::record(
            entityType:  'payslip',
            entityId:    (int) $payslip->id,
            action:      'pdf_generated',
            performedBy: (int) (\Illuminate\Support\Facades\Auth::id() ?? 1),
            afterValues: ['pdf_path' => $path],
            description: "PDF payslip generated: {$filename}",
        );

        return $path;
    }

    /**
     * Generate a consistent filename.
     * e.g. payslip_juan-dela-cruz_2026-03-01_2026-03-15.pdf
     */
    public static function getFilename(Payslip $payslip): string
    {
        $name   = strtolower(str_replace(' ', '-', $payslip->employee->full_name ?? 'employee'));
        $start  = $payslip->period->period_start->format('Y-m-d');
        $end    = $payslip->period->period_end->format('Y-m-d');
        return "payslip_{$name}_{$start}_{$end}.pdf";
    }
}