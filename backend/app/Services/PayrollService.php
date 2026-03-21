<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Payroll;
use App\Models\Attendance;
use Carbon\Carbon;

class PayrollService
{
    /**
     * Calculate payroll for an employee for a specific period.
     */
    public function calculatePayroll(Employee $employee, Carbon $periodStart, Carbon $periodEnd): array
    {
        $attendanceData  = $this->getAttendanceData($employee, $periodStart, $periodEnd);
        $baseSalary      = $this->getBaseSalary($employee);
        $overtimePay     = $this->calculateOvertimePay($attendanceData, $employee);
        $bonuses         = 0.0;
        $allowances      = $this->calculateAllowances($employee);
        $grossSalary     = $baseSalary + $overtimePay + $bonuses + $allowances;
        $deductions      = $this->calculateDeductions($grossSalary);
        $totalDeductions = array_sum($deductions);
        $netSalary       = max(0.0, $grossSalary - $totalDeductions);

        return [
            'base_salary'           => $baseSalary,
            'overtime_pay'          => $overtimePay,
            'bonuses'               => $bonuses,
            'allowances'            => $allowances,
            'gross_salary'          => $grossSalary,
            'deductions'            => $deductions,
            'total_deductions'      => $totalDeductions,
            'net_salary'            => $netSalary,
            'calculation_breakdown' => $this->buildCalculationBreakdown(
                $baseSalary, $overtimePay, $bonuses, $allowances, $deductions
            ),
        ];
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private function getAttendanceData(Employee $employee, Carbon $periodStart, Carbon $periodEnd): array
    {
        // Fix: getKey() is always typed as mixed/int — avoids "Undefined property ::$id"
        $attendances = Attendance::where('employee_id', $employee->getKey())
            ->whereBetween('date', [$periodStart->toDateString(), $periodEnd->toDateString()])
            ->get();

        return [
            'total_hours' => (float) $attendances->sum('hours_worked'),
            'total_days'  => $attendances->count(),
            'absent_days' => $attendances->where('status', 'absent')->count(),
            'leave_days'  => $attendances->where('status', 'on_leave')->count(),
            'records'     => $attendances,
        ];
    }

    /**
     * Get base salary — uses employee's actual basic_salary field first,
     * falls back to category defaults if 0.
     *
     * Fix: $employee->job_category is defined via @property on Employee model.
     * Using getAttribute() here as an extra safety net for the static analyzer.
     */
    private function getBaseSalary(Employee $employee): float
    {
        $salary = (float) $employee->getAttribute('basic_salary');
        if ($salary > 0.0) {
            return $salary;
        }

        $defaults = [
            'manager'    => 35000.0,
            'supervisor' => 25000.0,
            'staff'      => 15000.0,
            'intern'     => 8000.0,
        ];

        $category = strtolower((string) $employee->getAttribute('job_category'));
        return $defaults[$category] ?? 15000.0;
    }

    private function calculateOvertimePay(array $attendanceData, Employee $employee): float
    {
        $totalHours    = $attendanceData['total_hours'];
        $standardHours = 160.0;

        if ($totalHours <= $standardHours) {
            return 0.0;
        }

        $hourlyRate    = $this->getBaseSalary($employee) / $standardHours;
        $overtimeHours = $totalHours - $standardHours;

        return $overtimeHours * ($hourlyRate * 1.5);
    }

    private function calculateAllowances(Employee $employee): float
    {
        $defaults = [
            'manager'    => 3000.0,
            'supervisor' => 2000.0,
            'staff'      => 1000.0,
            'intern'     => 500.0,
        ];

        $category = strtolower((string) $employee->getAttribute('job_category'));
        return $defaults[$category] ?? 1000.0;
    }

    private function calculateDeductions(float $grossSalary): array
    {
        return [
            'sss_contribution'        => $this->calculateSSS($grossSalary),
            'philhealth_contribution' => $this->calculatePhilHealth($grossSalary),
            'pagibig_contribution'    => $this->calculatePagIbig($grossSalary),
            'tax_withholding'         => $this->calculateTax($grossSalary),
            'other_deductions'        => 0.0,
        ];
    }

    /** SSS: 11.45% employee share, capped at ₱1,755 */
    private function calculateSSS(float $grossSalary): float
    {
        return min($grossSalary * 0.1145, 1755.0);
    }

    /** PhilHealth: 2.75% employee share, minimum ₱150 */
    private function calculatePhilHealth(float $grossSalary): float
    {
        return max($grossSalary * 0.0275, 150.0);
    }

    /** Pag-IBIG: 1.5% employee share, capped at ₱100 */
    private function calculatePagIbig(float $grossSalary): float
    {
        return min($grossSalary * 0.015, 100.0);
    }

    /**
     * Simplified BIR withholding tax.
     * ≤ ₱20,833/month = exempt. > ₱20,833 = 15% on excess.
     */
    private function calculateTax(float $grossSalary): float
    {
        if ($grossSalary <= 20833.0) {
            return 0.0;
        }
        return ($grossSalary - 20833.0) * 0.15;
    }

    private function buildCalculationBreakdown(
        float $baseSalary,
        float $overtimePay,
        float $bonuses,
        float $allowances,
        array $deductions
    ): array {
        return [
            'earnings' => [
                'base_salary'  => ['label' => 'Base Salary',  'amount' => $baseSalary],
                'overtime_pay' => ['label' => 'Overtime Pay', 'amount' => $overtimePay],
                'bonuses'      => ['label' => 'Bonuses',      'amount' => $bonuses],
                'allowances'   => ['label' => 'Allowances',   'amount' => $allowances],
            ],
            'deductions' => [
                'sss_contribution'        => ['label' => 'SSS Contribution',        'amount' => $deductions['sss_contribution']],
                'philhealth_contribution' => ['label' => 'PhilHealth Contribution', 'amount' => $deductions['philhealth_contribution']],
                'pagibig_contribution'    => ['label' => 'Pag-IBIG Contribution',   'amount' => $deductions['pagibig_contribution']],
                'tax_withholding'         => ['label' => 'Tax Withholding',         'amount' => $deductions['tax_withholding']],
                'other_deductions'        => ['label' => 'Other Deductions',        'amount' => $deductions['other_deductions']],
            ],
        ];
    }

    // ─── Summary ──────────────────────────────────────────────────────────────

    public function getMonthlyPayrollSummary(int $year, int $month): array
    {
        $payrolls = Payroll::forMonth($year, $month)->get();

        return [
            'total_cost'       => (float) $payrolls->sum('gross_salary'),
            'total_net'        => (float) $payrolls->sum('net_salary'),
            'total_deductions' => (float) $payrolls->sum('total_deductions'),
            'count'            => $payrolls->count(),
            'statuses'         => $payrolls->groupBy('status')->map->count(),
            'pending_approval' => $payrolls->where('status', 'pending_approval')->count(),
            'paid'             => $payrolls->where('status', 'paid')->count(),
        ];
    }
}