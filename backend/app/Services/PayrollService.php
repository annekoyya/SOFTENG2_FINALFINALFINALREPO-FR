<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Payroll;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class PayrollService
{
    /**
     * Calculate payroll for an employee for a specific period.
     */
    // public function calculatePayroll(Employee $employee, Carbon $periodStart, Carbon $periodEnd): array
    // {
    //     $attendanceData = $this->getAttendanceData($employee, $periodStart, $periodEnd);
    //     $baseSalary = $this->getBaseSalary($employee);
        
    //     // Calculate gross salary components
    //     $overtimePay = $this->calculateOvertimePay($attendanceData, $employee);
    //     $bonuses = 0; // Can be customized
    //     $allowances = $this->calculateAllowances($employee);
        
    //     $grossSalary = $baseSalary + $overtimePay + $bonuses + $allowances;
        
    //     // Calculate deductions
    //     $deductions = $this->calculateDeductions($grossSalary, $employee);
    //     $totalDeductions = array_sum($deductions);
        
    //     // Calculate net salary
    //     $netSalary = $grossSalary - $totalDeductions;
        
    //     return [
    //         'base_salary' => $baseSalary,
    //         'overtime_pay' => $overtimePay,
    //         'bonuses' => $bonuses,
    //         'allowances' => $allowances,
    //         'gross_salary' => $grossSalary,
    //         'deductions' => $deductions,
    //         'total_deductions' => $totalDeductions,
    //         'net_salary' => max(0, $netSalary), // Ensure no negative net salary
    //         'calculation_breakdown' => $this->buildCalculationBreakdown(
    //             $baseSalary,
    //             $overtimePay,
    //             $bonuses,
    //             $allowances,
    //             $deductions
    //         ),
    //     ];
    // }

    /**
     * Get attendance data for the payroll period.
     */
    // private function getAttendanceData(Employee $employee, Carbon $periodStart, Carbon $periodEnd): array
    // {
    //     $attendances = Attendance::where('employee_id', $employee->id)
    //         ->whereBetween('date', [$periodStart, $periodEnd])
    //         ->get();

    //     return [
    //         'total_hours' => $attendances->sum('hours_worked'),
    //         'total_days' => $attendances->count(),
    //         'absent_days' => $attendances->where('status', 'absent')->count(),
    //         'leave_days' => $attendances->where('status', 'leave')->count(),
    //         'records' => $attendances,
    //     ];
    // }

    /**
     * Get the base salary for an employee.
     * In a real system, this might come from a salary structure table.
     */
    private function getBaseSalary(Employee $employee): float
    {
        // Placeholder: In production, fetch from salary_structures table
        // For now, assume a default salary based on job category
        $salaryByCategory = [
            'manager' => 35000,
            'supervisor' => 25000,
            'staff' => 15000,
            'intern' => 8000,
        ];

        return $salaryByCategory[strtolower($employee->job_category)] ?? 15000;
    }

    /**
     * Calculate overtime pay (1.5x for hours beyond 40 per week).
     */
    private function calculateOvertimePay(array $attendanceData, Employee $employee): float
    {
        $hourlyRate = $this->getBaseSalary($employee) / 160; // Assuming 160 hours per month
        $totalHours = $attendanceData['total_hours'];
        $standardHours = 160; // Standard hours per month

        if ($totalHours > $standardHours) {
            $overtimeHours = $totalHours - $standardHours;
            return $overtimeHours * ($hourlyRate * 1.5);
        }

        return 0;
    }

    /**
     * Calculate allowances (cola, transportation, etc.).
     */
    private function calculateAllowances(Employee $employee): float
    {
        // Placeholder: Can be customized based on employee grade
        $allowancesByType = [
            'manager' => 3000,
            'supervisor' => 2000,
            'staff' => 1000,
            'intern' => 500,
        ];

        return $allowancesByType[strtolower($employee->job_category)] ?? 1000;
    }

    /**
     * Calculate all deductions based on Philippine law.
     */
    private function calculateDeductions(float $grossSalary, Employee $employee): array
    {
        return [
            'sss_contribution' => $this->calculateSSS($grossSalary),
            'philhealth_contribution' => $this->calculatePhilHealth($grossSalary),
            'pagibig_contribution' => $this->calculatePagIbig($grossSalary),
            'tax_withholding' => $this->calculateTax($grossSalary),
            'other_deductions' => 0, // Placeholder for other deductions
        ];
    }

    /**
     * Calculate SSS contribution based on 2024 rates.
     * Employee share: 11.45% of gross salary
     * Monthly salary range bracket system applies
     */
    private function calculateSSS(float $grossSalary): float
    {
        // Simplified calculation (in production, use bracket system)
        $sssRate = 0.1145; // 11.45% employee contribution
        $maxContribution = 1755; // Max SSS contribution for 2024

        $contribution = $grossSalary * $sssRate;
        return min($contribution, $maxContribution);
    }

    /**
     * Calculate PhilHealth contribution based on 2024 rates.
     * Employee share: 2.75% of gross salary
     */
    private function calculatePhilHealth(float $grossSalary): float
    {
        $philhealthRate = 0.0275; // 2.75% employee contribution
        $minContribution = 150; // Minimum monthly contribution

        $contribution = $grossSalary * $philhealthRate;
        return max($contribution, $minContribution);
    }

    /**
     * Calculate Pag-IBIG contribution.
     * Employee share: 1.5% of gross salary
     * Maximum monthly contribution: ₱100
     */
    private function calculatePagIbig(float $grossSalary): float
    {
        $pagibigRate = 0.015; // 1.5% employee contribution
        $maxContribution = 100; // Max Pag-IBIG contribution

        $contribution = $grossSalary * $pagibigRate;
        return min($contribution, $maxContribution);
    }

    /**
     * Calculate income tax withholding (Simplified BIR calculation).
     * In production, use proper tax brackets and exemptions.
     */
    private function calculateTax(float $grossSalary): float
    {
        // Simplified tax calculation (actual should use BIR tables)
        // For salary > ₱20,833/month, apply progressive rates
        
        if ($grossSalary <= 20833) {
            return 0; // Below taxable threshold
        }

        $taxableIncome = $grossSalary - 20833;
        
        // Simplified bracket: 15% on amount above threshold
        return $taxableIncome * 0.15;
    }

    /**
     * Build a detailed breakdown of calculations for display.
     */
    private function buildCalculationBreakdown(
        float $baseSalary,
        float $overtimePay,
        float $bonuses,
        float $allowances,
        array $deductions
    ): array
    {
        return [
            'earnings' => [
                'base_salary' => [
                    'label' => 'Base Salary',
                    'amount' => $baseSalary,
                ],
                'overtime_pay' => [
                    'label' => 'Overtime Pay',
                    'amount' => $overtimePay,
                ],
                'bonuses' => [
                    'label' => 'Bonuses',
                    'amount' => $bonuses,
                ],
                'allowances' => [
                    'label' => 'Allowances',
                    'amount' => $allowances,
                ],
            ],
            'deductions' => [
                'sss_contribution' => [
                    'label' => 'SSS Contribution',
                    'amount' => $deductions['sss_contribution'],
                ],
                'philhealth_contribution' => [
                    'label' => 'PhilHealth Contribution',
                    'amount' => $deductions['philhealth_contribution'],
                ],
                'pagibig_contribution' => [
                    'label' => 'Pag-IBIG Contribution',
                    'amount' => $deductions['pagibig_contribution'],
                ],
                'tax_withholding' => [
                    'label' => 'Tax Withholding',
                    'amount' => $deductions['tax_withholding'],
                ],
                'other_deductions' => [
                    'label' => 'Other Deductions',
                    'amount' => $deductions['other_deductions'],
                ],
            ],
        ];
    }

    /**
     * Get payroll summary for a specific month.
     */
    public function getMonthlyPayrollSummary(int $year, int $month): array
    {
        $payrolls = Payroll::forMonth($year, $month)->get();

        return [
            'total_cost' => $payrolls->sum('gross_salary'),
            'total_net' => $payrolls->sum('net_salary'),
            'total_deductions' => $payrolls->sum('total_deductions'),
            'count' => $payrolls->count(),
            'statuses' => $payrolls->groupBy('status')->map->count(),
            'pending_approval' => $payrolls->where('status', 'pending_approval')->count(),
            'payrolls' => $payrolls,
        ];
    }
}
