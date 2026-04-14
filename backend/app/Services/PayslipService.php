<?php
// backend/app/Services/PayslipService.php

namespace App\Services;

use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\Payslip;
use App\Models\PayrollAuditLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PayslipService
{
    const WORKING_DAYS_PER_MONTH = 26;

    /**
     * Compute payslip for a single employee
     */
    public function compute(Employee $employee, PayrollPeriod $period, int $computedBy): Payslip
    {
        Log::info("Computing payslip for: {$employee->first_name} {$employee->last_name}");
        
        return DB::transaction(function () use ($employee, $period, $computedBy) {
            // Get working days in period
            $workingDays = $this->getWorkingDaysInPeriod($period);
            
            // Calculate basic pay (pro-rated)
            $dailyRate = (float) $employee->basic_salary / self::WORKING_DAYS_PER_MONTH;
            $basicPay = $dailyRate * $workingDays;
            
            // Simple statutory deductions (Philippines)
            $monthlySalary = (float) $employee->basic_salary;
            
            // SSS (simplified - 4.5% of monthly salary, max 1,800)
            $sssEmployee = min($monthlySalary * 0.045, 1800);
            
            // PhilHealth (simplified - 2.5% of monthly salary)
            $philhealthEmployee = min($monthlySalary * 0.025, 875);
            
            // Pag-IBIG (fixed 100 for salary above 1,500)
            $pagibigEmployee = $monthlySalary > 1500 ? 100 : 50;
            
            // Withholding Tax (simplified - 15% on amount over 20,833)
            $taxableIncome = $monthlySalary - $sssEmployee - $philhealthEmployee - $pagibigEmployee;
            $birTax = $taxableIncome > 20833 ? ($taxableIncome - 20833) * 0.15 : 0;
            
            // For semi-monthly, halve the amounts
            if ($period->type === 'semi_monthly') {
                $basicPay = $basicPay / 2;
                $sssEmployee = $sssEmployee / 2;
                $philhealthEmployee = $philhealthEmployee / 2;
                $pagibigEmployee = $pagibigEmployee / 2;
                $birTax = $birTax / 2;
            }
            
            $grossPay = $basicPay;
            $totalDeductions = $sssEmployee + $philhealthEmployee + $pagibigEmployee + $birTax;
            $netPay = $grossPay - $totalDeductions;
            
            // Create or update payslip
            $payslip = Payslip::updateOrCreate(
                [
                    'payroll_period_id' => $period->id,
                    'employee_id' => $employee->id,
                ],
                [
                    'working_days_in_period' => $workingDays,
                    'days_worked' => $workingDays,
                    'days_absent' => 0,
                    'days_on_leave' => 0,
                    'days_unpaid_leave' => 0,
                    'minutes_late' => 0,
                    'overtime_hours' => 0,
                    'basic_pay' => round($basicPay, 2),
                    'overtime_pay' => 0,
                    'transport_allowance' => 0,
                    'meal_allowance' => 0,
                    'other_allowances' => 0,
                    'bonuses' => 0,
                    'thirteenth_month_pay' => 0,
                    'gross_pay' => round($grossPay, 2),
                    'late_deduction' => 0,
                    'absent_deduction' => 0,
                    'unpaid_leave_deduction' => 0,
                    'sss_employee' => round($sssEmployee, 2),
                    'philhealth_employee' => round($philhealthEmployee, 2),
                    'pagibig_employee' => round($pagibigEmployee, 2),
                    'bir_withholding_tax' => round($birTax, 2),
                    'sss_loan_deduction' => 0,
                    'pagibig_loan_deduction' => 0,
                    'company_loan_deduction' => 0,
                    'other_deductions' => 0,
                    'total_deductions' => round($totalDeductions, 2),
                    'sss_employer' => round($sssEmployee, 2),
                    'philhealth_employer' => round($philhealthEmployee, 2),
                    'pagibig_employer' => round($pagibigEmployee / 2, 2),
                    'net_pay' => round($netPay, 2),
                    'status' => 'computed',
                    'computed_by' => $computedBy,
                    'computed_at' => now(),
                ]
            );
            
            // Log the computation
            PayrollAuditLog::record(
                'payslip',
                $payslip->id,
                'computed',
                $computedBy,
                [],
                ['gross_pay' => $grossPay, 'net_pay' => $netPay],
                "Payslip computed for {$employee->full_name} - Net pay: ₱" . number_format($netPay, 2)
            );
            
            return $payslip;
        });
    }
    
    /**
     * Compute payslips for all active employees
     */
    public function computeAll(PayrollPeriod $period, int $computedBy): array
    {
        $employees = Employee::where('status', 'active')->get();
        $results = ['success' => [], 'failed' => []];
        
        Log::info("Starting bulk payroll computation for period: {$period->label}");
        
        foreach ($employees as $employee) {
            try {
                $payslip = $this->compute($employee, $period, $computedBy);
                $results['success'][] = [
                    'employee_id' => $employee->id,
                    'name' => $employee->full_name,
                    'net_pay' => $payslip->net_pay,
                ];
            } catch (\Throwable $e) {
                Log::error("Failed to compute for {$employee->first_name} {$employee->last_name}: " . $e->getMessage());
                $results['failed'][] = [
                    'employee_id' => $employee->id,
                    'name' => $employee->full_name,
                    'error' => $e->getMessage(),
                ];
            }
        }
        
        Log::info("Bulk payroll completed: " . count($results['success']) . " success, " . count($results['failed']) . " failed");
        
        return $results;
    }
    
    /**
     * Add manual adjustment to payslip
     */
    public function addManualAdjustment(Payslip $payslip, string $category, string $label, float $amount, string $note, int $adjustedBy): Payslip
    {
        $beforeGross = $payslip->gross_pay;
        $beforeNet = $payslip->net_pay;
        
        if ($category === 'earning') {
            $payslip->increment('bonuses', $amount);
            $payslip->increment('gross_pay', $amount);
        } else {
            $payslip->increment('other_deductions', $amount);
            $payslip->increment('total_deductions', $amount);
        }
        
        $payslip->net_pay = $payslip->gross_pay - $payslip->total_deductions;
        $payslip->save();
        
        PayrollAuditLog::record(
            'payslip',
            $payslip->id,
            'adjusted',
            $adjustedBy,
            ['gross_pay' => $beforeGross, 'net_pay' => $beforeNet],
            ['gross_pay' => $payslip->gross_pay, 'net_pay' => $payslip->net_pay],
            $note
        );
        
        return $payslip->fresh();
    }
    
    /**
     * Get number of working days in a period
     */
    private function getWorkingDaysInPeriod(PayrollPeriod $period): int
    {
        $start = Carbon::parse($period->period_start);
        $end = Carbon::parse($period->period_end);
        $workingDays = 0;
        
        while ($start->lte($end)) {
            if ($start->isWeekday()) {
                $workingDays++;
            }
            $start->addDay();
        }
        
        return $workingDays;
    }
}