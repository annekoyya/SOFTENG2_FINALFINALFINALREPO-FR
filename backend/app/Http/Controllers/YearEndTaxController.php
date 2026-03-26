<?php
// ══════════════════════════════════════════════════════════════════════════════
//  FILE: app/Http/Controllers/YearEndTaxController.php
// ══════════════════════════════════════════════════════════════════════════════
 
namespace App\Http\Controllers;
 
use App\Models\Employee;
use App\Models\Payslip;
use App\Models\PayrollAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
 
class YearEndTaxController extends Controller
{
    // GET /api/year-end-tax?year=2026
    public function index(Request $request): JsonResponse
    {
        $year = $request->year ?? now()->year;
 
        $employees = Employee::where('is_active', true)->get();
        $summaries = [];
 
        foreach ($employees as $emp) {
            $payslips = Payslip::where('employee_id', $emp->id)
                ->whereYear('created_at', $year)
                ->get();
 
            if ($payslips->isEmpty()) continue;
 
            $totalGross     = $payslips->sum('gross_pay');
            $totalBasic     = $payslips->sum('basic_salary');
            $totalOT        = $payslips->sum('overtime_amount');
            $totalAllowances= $payslips->sum('total_allowances');
            $totalDeductions= $payslips->sum('total_deductions');
            $totalTaxWithheld=$payslips->sum('withholding_tax');
            $totalSSS       = $payslips->sum('sss_contribution');
            $totalPhilHealth= $payslips->sum('philhealth_contribution');
            $totalPagIBIG   = $payslips->sum('pagibig_contribution');
 
            // 13th month = total basic salary / 12
            $thirteenthMonth = $totalBasic / 12;
 
            // Taxable compensation = gross - non-taxable (SSS + PhilHealth + PagIBIG + 13th month up to 90k)
            $nonTaxable13th = min($thirteenthMonth, 90000); // BIR: 13th month exempt up to 90k
            $taxableComp    = $totalGross - $totalSSS - $totalPhilHealth - $totalPagIBIG - $nonTaxable13th;
 
            // Compute annual tax using 2024 BIR graduated rates
            $annualTaxDue = $this->computeAnnualTax($taxableComp);
 
            $summaries[] = [
                'employee_id'          => $emp->id,
                'employee_name'        => trim("{$emp->first_name} {$emp->last_name}"),
                'department'           => $emp->department ?? '—',
                'tin'                  => $emp->tin_number,
                'total_gross'          => round((float) $totalGross, 2),
                'total_basic'          => round((float) $totalBasic, 2),
                'total_ot'             => round((float) $totalOT, 2),
                'total_allowances'     => round((float) $totalAllowances, 2),
                'thirteenth_month'     => round($thirteenthMonth, 2),
                'total_deductions'     => round((float) $totalDeductions, 2),
                'total_tax_withheld'   => round((float) $totalTaxWithheld, 2),
                'total_sss'            => round((float) $totalSSS, 2),
                'total_philhealth'     => round((float) $totalPhilHealth, 2),
                'total_pagibig'        => round((float) $totalPagIBIG, 2),
                'taxable_compensation' => round($taxableComp, 2),
                'annual_tax_due'       => round($annualTaxDue, 2),
                'tax_balance'          => round($annualTaxDue - (float) $totalTaxWithheld, 2),
                'certificate_generated'=> false,
            ];
        }
 
        return response()->json($summaries);
    }
 
    // POST /api/year-end-tax/process-13th-month
    public function process13thMonth(Request $request): JsonResponse
    {
        $year      = $request->year ?? now()->year;
        $employees = Employee::where('is_active', true)->get();
        $count     = 0;
 
        DB::transaction(function () use ($employees, $year, &$count) {
            foreach ($employees as $emp) {
                $totalBasic = Payslip::where('employee_id', $emp->id)
                    ->whereYear('created_at', $year)
                    ->sum('basic_salary');
 
                if ($totalBasic <= 0) continue;
 
                $thirteenthMonth = $totalBasic / 12;
 
                // Record as a bonus entry for the December payslip
                PayrollAuditLog::create([
                    'action'      => '13th_month_computed',
                    'entity_type' => 'Employee',
                    'entity_id'   => $emp->id,
                    'user_id'     => Auth::id(),
                    'description' => "13th month pay computed for {$emp->first_name}: ₱" . number_format($thirteenthMonth, 2),
                ]);
 
                $count++;
            }
        });
 
        return response()->json(['message' => '13th month processed.', 'count' => $count]);
    }
 
    // ── BIR 2024 Graduated Tax Rates ─────────────────────────────────────────
    // https://www.bir.gov.ph/index.php/tax-information/income-tax.html
 
    private function computeAnnualTax(float $taxableIncome): float
    {
        if ($taxableIncome <= 250000)          return 0;
        if ($taxableIncome <= 400000)          return ($taxableIncome - 250000) * 0.15;
        if ($taxableIncome <= 800000)          return 22500 + ($taxableIncome - 400000) * 0.20;
        if ($taxableIncome <= 2000000)         return 102500 + ($taxableIncome - 800000) * 0.25;
        if ($taxableIncome <= 8000000)         return 402500 + ($taxableIncome - 2000000) * 0.30;
        return 2202500 + ($taxableIncome - 8000000) * 0.35;
    }
}
 