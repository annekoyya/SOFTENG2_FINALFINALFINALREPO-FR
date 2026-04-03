<?php

namespace Database\Seeders;

use App\Models\PayrollPeriod;
use App\Models\Payslip;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class PayrollSeeder extends Seeder
{
    /**
     * Seed payroll periods and payslips.
     */
    public function run(): void
    {
        $accountant = User::where('role', 'Accountant')->first();
        $admin = User::where('role', 'Admin')->first();

        // Create payroll periods for the last 3 months
        $periods = [];
        for ($i = 0; $i < 3; $i++) {
            $startDate = Carbon::now()->subMonths($i + 1)->startOfMonth();
            $endDate = $startDate->copy()->endOfMonth();

            $period = PayrollPeriod::create([
                'label' => $startDate->format('M Y'),
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'status' => $i === 0 ? 'completed' : 'completed',
                'processed_by' => $accountant?->id ?? 1,
                'approved_by' => $admin?->id ?? 1,
                'processed_at' => Carbon::now()->subDays(rand(1, 30)),
                'approved_at' => Carbon::now()->subDays(rand(1, 30)),
            ]);

            $periods[] = $period;
        }

        // Create payslips for each period
        foreach ($periods as $period) {
            $employees = Employee::all();

            foreach ($employees as $employee) {
                // Calculate basic salary (from employee record)
                $basicSalary = (float) $employee->basic_salary;

                // Calculate statutory deductions
                $sss = $this->calculateSSS($basicSalary);
                $philhealth = $this->calculatePhilHealth($basicSalary);
                $pagibig = $this->calculatePagIBIG($basicSalary);
                $tax = $this->calculateTax($basicSalary);

                $grossSalary = $basicSalary;
                $totalDeductions = $sss + $philhealth + $pagibig + $tax;
                $netSalary = $grossSalary - $totalDeductions;

                Payslip::create([
                    'payroll_period_id' => $period->id,
                    'employee_id' => $employee->id,
                    'status' => 'paid',
                    'base_salary' => number_format($basicSalary, 2),
                    'gross_salary' => number_format($grossSalary, 2),
                    'sss_contribution' => number_format($sss, 2),
                    'philhealth_contribution' => number_format($philhealth, 2),
                    'pagibig_contribution' => number_format($pagibig, 2),
                    'tax_withholding' => number_format($tax, 2),
                    'total_deductions' => number_format($totalDeductions, 2),
                    'net_salary' => number_format($netSalary, 2),
                    'paid_by' => $accountant?->id ?? 1,
                    'paid_at' => Carbon::now()->subDays(rand(1, 30)),
                    'calculation_breakdown' => [
                        'earnings' => [
                            'base_salary' => [
                                'amount' => $basicSalary,
                                'label' => 'Basic Salary'
                            ]
                        ],
                        'deductions' => [
                            'sss_contribution' => [
                                'amount' => $sss,
                                'label' => 'SSS Contribution'
                            ],
                            'philhealth_contribution' => [
                                'amount' => $philhealth,
                                'label' => 'PhilHealth Contribution'
                            ],
                            'pagibig_contribution' => [
                                'amount' => $pagibig,
                                'label' => 'Pag-IBIG Contribution'
                            ],
                            'tax_withholding' => [
                                'amount' => $tax,
                                'label' => 'Withholding Tax'
                            ]
                        ]
                    ]
                ]);
            }
        }
    }

    private function calculateSSS(float $salary): float
    {
        // Simplified SSS calculation (4.5% employee contribution)
        return $salary * 0.045;
    }

    private function calculatePhilHealth(float $salary): float
    {
        // PhilHealth contribution (2.75% employee)
        return min($salary * 0.0275, 2000); // Cap at ₱2,000
    }

    private function calculatePagIBIG(float $salary): float
    {
        // Pag-IBIG contribution (1% employee, max ₱100)
        return min($salary * 0.01, 100);
    }

    private function calculateTax(float $salary): float
    {
        // Simplified tax calculation (monthly equivalent of TRAIN Law)
        $annualSalary = $salary * 12;

        if ($annualSalary <= 250000) {
            return 0;
        } elseif ($annualSalary <= 400000) {
            return (($annualSalary - 250000) * 0.15) / 12;
        } elseif ($annualSalary <= 800000) {
            return ((150000 * 0.15) + (($annualSalary - 400000) * 0.20)) / 12;
        } elseif ($annualSalary <= 2000000) {
            return ((150000 * 0.15) + (400000 * 0.20) + (($annualSalary - 800000) * 0.25)) / 12;
        } else {
            return ((150000 * 0.15) + (400000 * 0.20) + (1200000 * 0.25) + (($annualSalary - 2000000) * 0.30)) / 12;
        }
    }
}
