<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\Payslip;
use App\Models\PayslipLineItem;
use App\Models\EmployeeAllowance;
use App\Models\EmployeeLoan;
use App\Models\PayrollAuditLog;
use App\Models\Attendance;
use App\Models\LeaveRequest;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PayslipService
{
    // Working days per month — Philippine standard
    const WORKING_DAYS_PER_MONTH = 26;

    // OT multiplier (regular day OT)
    const OT_MULTIPLIER = 1.25;

    // ─── Main Entry Point ─────────────────────────────────────────────────────

    /**
     * Compute payslip for one employee in a given period.
     * Creates or updates the Payslip record.
     */
    public function compute(Employee $employee, PayrollPeriod $period, int $computedBy): Payslip
    {
        return DB::transaction(function () use ($employee, $period, $computedBy) {

            // ── Step 1: Attendance summary ────────────────────────────────
            $attendance = $this->getAttendanceSummary($employee, $period);

            // ── Step 2: Rates ─────────────────────────────────────────────
            $monthlySalary  = (float) $employee->basic_salary;
            $workingDays    = $period->getWorkingDays(); // 13 or 26
            $dailyRate      = $monthlySalary / self::WORKING_DAYS_PER_MONTH;
            $hourlyRate     = $dailyRate / 8;
            $minuteRate     = $hourlyRate / 60;

            // ── Step 3: Basic pay (pro-rated) ─────────────────────────────
            // Days worked includes paid leave days
            $daysWorked     = $attendance['days_worked'] + $attendance['days_on_leave'];
            $basicPay       = round($daysWorked * $dailyRate, 2);

            // ── Step 4: Overtime ──────────────────────────────────────────
            $overtimePay = round($attendance['overtime_hours'] * $hourlyRate * self::OT_MULTIPLIER, 2);

            // ── Step 5: Allowances ────────────────────────────────────────
            $allowances = $this->getEmployeeAllowances($employee, $period);

            // ── Step 6: Deductions — Absences & Late ─────────────────────
            $absentDeduction      = round($attendance['days_absent'] * $dailyRate, 2);
            $lateDeduction        = round($attendance['minutes_late'] * $minuteRate, 2);
            $unpaidLeaveDeduction = round($attendance['days_unpaid_leave'] * $dailyRate, 2);

            // ── Step 7: Statutory contributions ──────────────────────────
            $statutory = $this->computeStatutory($monthlySalary, $period->type);

            // ── Step 8: Loan deductions ───────────────────────────────────
            $loans = $this->getLoanDeductions($employee, $period->type);

            // ── Step 9: 13th month (accrual basis) ────────────────────────
            $thirteenthMonth = $this->computeThirteenthMonth($employee, $period, $basicPay);

            // ── Step 10: Gross Pay ────────────────────────────────────────
            $grossPay = $basicPay
                + $overtimePay
                + $allowances['transport']
                + $allowances['meal']
                + $allowances['other']
                + $thirteenthMonth;

            // ── Step 11: Total Deductions ─────────────────────────────────
            $totalDeductions = $absentDeduction
                + $lateDeduction
                + $unpaidLeaveDeduction
                + $statutory['sss']['employee']
                + $statutory['philhealth']['employee']
                + $statutory['pagibig']['employee']
                + $statutory['bir']
                + $loans['sss']
                + $loans['pagibig']
                + $loans['company'];

            $netPay = round($grossPay - $totalDeductions, 2);

            // ── Step 12: Upsert payslip record ────────────────────────────
            $before = null;
            $payslip = Payslip::updateOrCreate(
                [
                    'payroll_period_id' => $period->id,
                    'employee_id'       => $employee->id,
                ],
                [
                    // Attendance
                    'working_days_in_period' => $workingDays,
                    'days_worked'            => $attendance['days_worked'],
                    'days_absent'            => $attendance['days_absent'],
                    'days_on_leave'          => $attendance['days_on_leave'],
                    'days_unpaid_leave'      => $attendance['days_unpaid_leave'],
                    'minutes_late'           => $attendance['minutes_late'],
                    'overtime_hours'         => $attendance['overtime_hours'],

                    // Earnings
                    'basic_pay'              => $basicPay,
                    'overtime_pay'           => $overtimePay,
                    'transport_allowance'    => $allowances['transport'],
                    'meal_allowance'         => $allowances['meal'],
                    'other_allowances'       => $allowances['other'],
                    'bonuses'                => 0, // Manually added later
                    'thirteenth_month_pay'   => $thirteenthMonth,
                    'gross_pay'              => round($grossPay, 2),

                    // Deductions
                    'late_deduction'         => $lateDeduction,
                    'absent_deduction'       => $absentDeduction,
                    'unpaid_leave_deduction' => $unpaidLeaveDeduction,
                    'sss_employee'           => $statutory['sss']['employee'],
                    'philhealth_employee'    => $statutory['philhealth']['employee'],
                    'pagibig_employee'       => $statutory['pagibig']['employee'],
                    'bir_withholding_tax'    => $statutory['bir'],
                    'sss_loan_deduction'     => $loans['sss'],
                    'pagibig_loan_deduction' => $loans['pagibig'],
                    'company_loan_deduction' => $loans['company'],
                    'total_deductions'       => round($totalDeductions, 2),

                    // Employer shares (for cost tracking)
                    'sss_employer'           => $statutory['sss']['employer'],
                    'philhealth_employer'    => $statutory['philhealth']['employer'],
                    'pagibig_employer'       => $statutory['pagibig']['employer'],

                    // Net
                    'net_pay'                => $netPay,

                    // Workflow
                    'status'                 => 'computed',
                    'computed_by'            => $computedBy,
                    'computed_at'            => now(),
                ]
            );

            // ── Step 13: Generate line items for PDF display ──────────────
            $this->generateLineItems($payslip, [
                'daily_rate'    => $dailyRate,
                'hourly_rate'   => $hourlyRate,
                'overtime_hours'=> $attendance['overtime_hours'],
                'allowances'    => $allowances['items'],
                'statutory'     => $statutory,
                'loans'         => $loans,
            ]);

            // ── Step 14: Audit log ────────────────────────────────────────
            PayrollAuditLog::record(
                entityType: 'payslip',
                entityId:   $payslip->id,
                action:     'computed',
                performedBy: $computedBy,
                afterValues: [
                    'gross_pay'        => $grossPay,
                    'total_deductions' => $totalDeductions,
                    'net_pay'          => $netPay,
                    'period'           => $period->label,
                ],
                description: "Payslip computed for {$employee->first_name} {$employee->last_name} — {$period->label}. Net pay: ₱" . number_format($netPay, 2),
                ipAddress: request()->ip(),
            );

            return $payslip->fresh(['employee', 'period', 'lineItems']);
        });
    }

    /**
     * Compute payslips for ALL active employees in a period (bulk).
     */
    public function computeAll(PayrollPeriod $period, int $computedBy): array
    {
        $employees = Employee::where('status', 'active')->get();
        $results   = ['success' => [], 'failed' => []];

        foreach ($employees as $employee) {
            try {
                // Ensure employee is properly hydrated as model, not stdClass
                if (!($employee instanceof Employee)) {
                    $employee = Employee::find($employee->id ?? $employee);
                    if (!$employee) continue;
                }
                $payslip = $this->compute($employee, $period, $computedBy);
                $results['success'][] = [
                    'employee_id' => $employee->id,
                    'name'        => $employee->first_name . ' ' . $employee->last_name,
                    'net_pay'     => $payslip->net_pay,
                ];
            } catch (\Throwable $e) {
                $results['failed'][] = [
                    'employee_id' => $employee->id ?? null,
                    'name'        => ($employee->first_name ?? 'Unknown') . ' ' . ($employee->last_name ?? ''),
                    'error'       => $e->getMessage(),
                ];
            }
        }

        // Update period status
        $period->update([
            'status'       => 'computed',
            'processed_by' => $computedBy,
            'processed_at' => now(),
        ]);

        PayrollAuditLog::record(
            entityType:  'payroll_period',
            entityId:    $period->id,
            action:      'computed',
            performedBy: $computedBy,
            afterValues: [
                'success_count' => count($results['success']),
                'failed_count'  => count($results['failed']),
                'total_net'     => collect($results['success'])->sum('net_pay'),
            ],
            description: "Bulk payroll computed for {$period->label}. " . count($results['success']) . " payslips generated.",
        );

        return $results;
    }

    // ─── Attendance Summary ───────────────────────────────────────────────────

    private function getAttendanceSummary(Employee $employee, PayrollPeriod $period): array
    {
        $start = $period->period_start;
        $end   = $period->period_end;

        // Get all attendance records for this employee in the period
        $attendances = Attendance::where('employee_id', $employee->id)
            ->whereBetween('date', [$start, $end])
            ->get();

        // Count working days in period (Mon-Fri only)
        $workingDaysInPeriod = $this->countWorkingDays($start, $end);

        $daysWorked      = 0;
        $minutesLate     = 0;
        $overtimeHours   = 0.0;
        $daysAbsent      = 0;

        foreach ($attendances as $att) {
            if ($att->time_in) {
                $daysWorked++;
                $minutesLate   += max(0, $att->minutes_late ?? 0);
                $overtimeHours += max(0, $att->overtime_hours ?? 0);
            }
        }

        // Absences = working days - days with attendance record
        $daysAbsent = max(0, $workingDaysInPeriod - $daysWorked);

        // Approved paid leave days
        $paidLeave = LeaveRequest::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->where('leave_type', '!=', 'without_pay')
            ->whereBetween('start_date', [$start, $end])
            ->sum(DB::raw('DATEDIFF(end_date, start_date) + 1'));

        // Unpaid leave days
        $unpaidLeave = LeaveRequest::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->where('leave_type', 'without_pay')
            ->whereBetween('start_date', [$start, $end])
            ->sum(DB::raw('DATEDIFF(end_date, start_date) + 1'));

        // Reduce absences by approved leave days (leave days aren't absent)
        $daysAbsent = max(0, $daysAbsent - $paidLeave - $unpaidLeave);

        return [
            'days_worked'      => (float) $daysWorked,
            'days_absent'      => (float) $daysAbsent,
            'days_on_leave'    => (float) $paidLeave,
            'days_unpaid_leave'=> (float) $unpaidLeave,
            'minutes_late'     => (int) $minutesLate,
            'overtime_hours'   => round($overtimeHours, 2),
        ];
    }

    private function countWorkingDays(string $start, string $end): int
    {
        $current = Carbon::parse($start);
        $endDate = Carbon::parse($end);
        $count   = 0;

        while ($current->lte($endDate)) {
            if ($current->isWeekday()) $count++;
            $current->addDay();
        }

        return $count;
    }

    // ─── Allowances ───────────────────────────────────────────────────────────

    private function getEmployeeAllowances(Employee $employee, PayrollPeriod $period): array
    {
        $allowances = EmployeeAllowance::where('employee_id', $employee->id)
            ->active()
            ->get();

        $transport = 0.0;
        $meal      = 0.0;
        $other     = 0.0;
        $items     = [];

        foreach ($allowances as $allowance) {
            // Check if effective during this period  
            if (!is_object($allowance) || !method_exists($allowance, 'isEffectiveOn')) continue;
            if (!$allowance->isEffectiveOn($period->period_start)) continue;

            // For semi-monthly, halve the monthly allowance amount
            $amount = $period->type === 'monthly'
                ? $allowance->amount
                : $allowance->amount / 2;

            $items[] = ['label' => $allowance->name, 'amount' => $amount, 'type' => $allowance->type];

            match ($allowance->type) {
                'transport' => $transport += $amount,
                'meal'      => $meal      += $amount,
                default     => $other     += $amount,
            };
        }

        return [
            'transport' => round($transport, 2),
            'meal'      => round($meal, 2),
            'other'     => round($other, 2),
            'items'     => $items,
        ];
    }

    // ─── Statutory ────────────────────────────────────────────────────────────

    private function computeStatutory(float $monthlySalary, string $periodType): array
    {
        // Statutory always computed on monthly basis, then halved for semi-monthly
        $sss        = PhStatutoryTables::computeSSS($monthlySalary);
        $philhealth = PhStatutoryTables::computePhilHealth($monthlySalary);
        $pagibig    = PhStatutoryTables::computePagIBIG($monthlySalary);

        if ($periodType === 'semi_monthly') {
            // Split contributions across two payroll periods
            $sss['employee']        = round($sss['employee'] / 2, 2);
            $sss['employer']        = round($sss['employer'] / 2, 2);
            $philhealth['employee'] = round($philhealth['employee'] / 2, 2);
            $philhealth['employer'] = round($philhealth['employer'] / 2, 2);
            $pagibig['employee']    = round($pagibig['employee'] / 2, 2);
            $pagibig['employer']    = round($pagibig['employer'] / 2, 2);
        }

        // BIR is always computed on monthly taxable income
        $bir = PhStatutoryTables::computeBIR(
            monthlyTaxableIncome: $monthlySalary,
            sssEmployee:          $sss['employee'] * ($periodType === 'semi_monthly' ? 2 : 1),
            philhealthEmployee:   $philhealth['employee'] * ($periodType === 'semi_monthly' ? 2 : 1),
            pagibigEmployee:      $pagibig['employee'] * ($periodType === 'semi_monthly' ? 2 : 1),
        );

        // Split BIR for semi-monthly
        if ($periodType === 'semi_monthly') {
            $bir = round($bir / 2, 2);
        }

        return [
            'sss'        => $sss,
            'philhealth' => $philhealth,
            'pagibig'    => $pagibig,
            'bir'        => $bir,
        ];
    }

    // ─── Loans ────────────────────────────────────────────────────────────────

    private function getLoanDeductions(Employee $employee, string $periodType): array
    {
        $loans = EmployeeLoan::where('employee_id', $employee->id)
            ->active()
            ->get();

        $sss     = 0.0;
        $pagibig = 0.0;
        $company = 0.0;

        foreach ($loans as $loan) {
            $deduction = method_exists($loan, 'getDeductionForPeriod') ? $loan->getDeductionForPeriod($periodType) : 0;
            match ($loan->type) {
                'sss'     => $sss     += $deduction,
                'pagibig' => $pagibig += $deduction,
                default   => $company += $deduction,
            };
        }

        return [
            'sss'     => round($sss, 2),
            'pagibig' => round($pagibig, 2),
            'company' => round($company, 2),
        ];
    }

    // ─── 13th Month Pay ───────────────────────────────────────────────────────

    private function computeThirteenthMonth(
        Employee      $employee,
        PayrollPeriod $period,
        float         $basicPayThisPeriod
    ): float {
        // 13th month = total basic pay for the year / 12
        // Accrual: set aside 1/12 of basic pay per month
        // Only include in December payroll (or as monthly accrual)

        $periodEnd  = Carbon::parse($period->period_end);
        $isDecember = $periodEnd->month === 12;
        $isMonthEnd = $periodEnd->day >= 28; // End of month

        if (!($isDecember && $isMonthEnd)) {
            return 0.0; // Only pay in December
        }

        // Sum all basic pay for the calendar year
        $yearStart = $periodEnd->copy()->startOfYear()->toDateString();

        $totalBasicYTD = Payslip::where('employee_id', $employee->id)
            ->whereHas('period', function ($q) use ($yearStart, $period) {
                $q->where('period_start', '>=', $yearStart)
                  ->where('id', '!=', $period->id);
            })
            ->sum('basic_pay');

        // Add current period's basic pay
        $totalBasicYTD += $basicPayThisPeriod;

        // 13th month = total basic / 12
        $thirteenth = round($totalBasicYTD / 12, 2);

        // Exempt from tax up to ₱90,000 (covered in BIR calculation)
        return $thirteenth;
    }

    // ─── Line Items ───────────────────────────────────────────────────────────

    private function generateLineItems(Payslip $payslip, array $data): void
    {
        // Delete existing line items (re-generate fresh)
        $payslip->lineItems()->delete();

        $order = 0;

        // ── Earnings ──────────────────────────────────────────────────────
        $this->addLineItem($payslip, 'earning', 'Basic Pay',
            $payslip->basic_pay,
            "₱" . number_format($data['daily_rate'], 2) . "/day × " . $payslip->days_worked . " days",
            $order++);

        if ($payslip->overtime_pay > 0) {
            $this->addLineItem($payslip, 'earning', 'Overtime Pay',
                $payslip->overtime_pay,
                "₱" . number_format($data['hourly_rate'], 2) . "/hr × " . $data['overtime_hours'] . " hrs × " . self::OT_MULTIPLIER,
                $order++);
        }

        if ($payslip->transport_allowance > 0) {
            $this->addLineItem($payslip, 'earning', 'Transport Allowance', $payslip->transport_allowance, null, $order++);
        }
        if ($payslip->meal_allowance > 0) {
            $this->addLineItem($payslip, 'earning', 'Meal Allowance', $payslip->meal_allowance, null, $order++);
        }
        if ($payslip->other_allowances > 0) {
            // Break down individual custom allowances
            foreach ($data['allowances'] as $item) {
                if ($item['type'] === 'custom') {
                    $this->addLineItem($payslip, 'earning', $item['label'], $item['amount'], null, $order++);
                }
            }
        }
        if ($payslip->bonuses > 0) {
            $this->addLineItem($payslip, 'earning', 'Bonus / Incentive', $payslip->bonuses, null, $order++, true);
        }
        if ($payslip->thirteenth_month_pay > 0) {
            $this->addLineItem($payslip, 'earning', '13th Month Pay', $payslip->thirteenth_month_pay, 'Tax-exempt up to ₱90,000', $order++);
        }

        $order = 0;

        // ── Deductions ────────────────────────────────────────────────────
        if ($payslip->late_deduction > 0) {
            $this->addLineItem($payslip, 'deduction', 'Late / Undertime',
                $payslip->late_deduction,
                "{$payslip->minutes_late} mins",
                $order++);
        }
        if ($payslip->absent_deduction > 0) {
            $this->addLineItem($payslip, 'deduction', 'Absent Deduction',
                $payslip->absent_deduction,
                "{$payslip->days_absent} day(s)",
                $order++);
        }
        if ($payslip->unpaid_leave_deduction > 0) {
            $this->addLineItem($payslip, 'deduction', 'Unpaid Leave',
                $payslip->unpaid_leave_deduction,
                "{$payslip->days_unpaid_leave} day(s)",
                $order++);
        }

        // Statutory
        $this->addLineItem($payslip, 'deduction', 'SSS Contribution',
            $payslip->sss_employee,
            "MSC: ₱" . number_format($data['statutory']['sss']['msc'], 2),
            $order++);

        $this->addLineItem($payslip, 'deduction', 'PhilHealth Contribution',
            $payslip->philhealth_employee,
            "MSC: ₱" . number_format($data['statutory']['philhealth']['msc'], 2),
            $order++);

        $this->addLineItem($payslip, 'deduction', 'Pag-IBIG Contribution',
            $payslip->pagibig_employee, null, $order++);

        if ($payslip->bir_withholding_tax > 0) {
            $this->addLineItem($payslip, 'deduction', 'Withholding Tax (BIR)',
                $payslip->bir_withholding_tax,
                PhStatutoryTables::getBIRBracket($payslip->employee->basic_salary * 12),
                $order++);
        }

        // Loans
        if ($payslip->sss_loan_deduction > 0) {
            $this->addLineItem($payslip, 'deduction', 'SSS Loan', $payslip->sss_loan_deduction, null, $order++);
        }
        if ($payslip->pagibig_loan_deduction > 0) {
            $this->addLineItem($payslip, 'deduction', 'Pag-IBIG Loan', $payslip->pagibig_loan_deduction, null, $order++);
        }
        if ($payslip->company_loan_deduction > 0) {
            $this->addLineItem($payslip, 'deduction', 'Company Loan', $payslip->company_loan_deduction, null, $order++);
        }
    }

    private function addLineItem(
        Payslip $payslip,
        string  $category,
        string  $label,
        float   $amount,
        ?string $description = null,
        int     $order       = 0,
        bool    $isManual    = false
    ): void {
        if ($amount == 0) return; // Skip zero-value items

        PayslipLineItem::create([
            'payslip_id'  => $payslip->id,
            'category'    => $category,
            'label'       => $label,
            'amount'      => $amount,
            'description' => $description,
            'order'       => $order,
            'is_manual'   => $isManual,
        ]);
    }

    // ─── Manual Adjustment ────────────────────────────────────────────────────

    /**
     * Add a manual bonus or deduction to an existing payslip.
     */
    public function addManualAdjustment(
        Payslip $payslip,
        string  $category,
        string  $label,
        float   $amount,
        string  $note,
        int     $adjustedBy
    ): Payslip {
        $before = $payslip->only(['gross_pay', 'total_deductions', 'net_pay', 'bonuses', 'other_deductions']);

        if ($category === 'earning') {
            $payslip->increment('bonuses', $amount);
        } else {
            $payslip->increment('other_deductions', $amount);
        }

        // Add line item
        $this->addLineItem(
            $payslip, $category, $label, $amount,
            $note, $payslip->lineItems()->count(), true
        );

        // Update note
        $payslip->update([
            'adjustments_note' => trim(($payslip->adjustments_note ?? '') . "\n{$label}: ₱" . number_format($amount, 2)),
        ]);

        $payslip->recompute();

        PayrollAuditLog::record(
            entityType:  'payslip',
            entityId:    $payslip->id,
            action:      'adjusted',
            performedBy: $adjustedBy,
            beforeValues: $before,
            afterValues:  $payslip->fresh()->only(['gross_pay', 'total_deductions', 'net_pay']),
            description: "Manual {$category} added: {$label} ₱" . number_format($amount, 2) . ". Reason: {$note}",
        );

        return $payslip->fresh(['employee', 'lineItems']);
    }

    // Add these methods to your PayslipService class

/**
 * Generate payslips for all employees in a period
 * Alias for computeAll() to match controller expectations
 */
    /**
     * Generate payslips for all employees in a period
     * Alias for computeAll() to match controller expectations
     */
    public function generatePayslipsForPeriod(PayrollPeriod $period): array
    {
        // Use the existing computeAll method
        $results = $this->computeAll($period, auth()->user()?->id ?? 1);
        
        // Return the payslip objects from the success results
        $payslips = [];
        foreach ($results['success'] as $success) {
            $payslip = Payslip::where('payroll_period_id', $period->id)
                ->where('employee_id', $success['employee_id'])
                ->first();
            if ($payslip) {
                $payslips[] = $payslip;
            }
        }
        
        return $payslips;
    }

    /**
     * Approve a single payslip
     */
    public function approvePayslip(Payslip $payslip): Payslip
    {
        if ($payslip->status !== 'computed' && $payslip->status !== 'draft') {
            throw new \Exception('Payslip must be in computed or draft status to approve');
        }
        
        $payslip->update([
            'status' => 'approved',
            'approved_by' => auth()->user()?->id ?? 1,
            'approved_at' => now(),
        ]);
        
        PayrollAuditLog::record(
            entityType: 'payslip',
            entityId: $payslip->id,
            action: 'approved',
            performedBy: auth()->user()?->id ?? 1,
            afterValues: ['status' => 'approved'],
            description: "Payslip approved for period {$payslip->payrollPeriod->label}",
            ipAddress: request()->ip(),
        );
        
        return $payslip->fresh();
    }

    /**
     * Get summary for a payroll period
     */
    public function getSummary(PayrollPeriod $period): array
    {
        $payslips = Payslip::where('payroll_period_id', $period->id)->get();
        
        $summary = [
            'total_employees' => $payslips->count(),
            'total_gross_pay' => round($payslips->sum('gross_pay'), 2),
            'total_deductions' => round($payslips->sum('total_deductions'), 2),
            'total_net_pay' => round($payslips->sum('net_pay'), 2),
            'breakdown' => [
                'basic_pay' => round($payslips->sum('basic_pay'), 2),
                'overtime_pay' => round($payslips->sum('overtime_pay'), 2),
                'allowances' => round(
                    $payslips->sum('transport_allowance') + 
                    $payslips->sum('meal_allowance') + 
                    $payslips->sum('other_allowances'), 2
                ),
                'bonuses' => round($payslips->sum('bonuses'), 2),
                'thirteenth_month' => round($payslips->sum('thirteenth_month_pay'), 2),
                'deductions' => [
                    'sss' => round($payslips->sum('sss_employee'), 2),
                    'philhealth' => round($payslips->sum('philhealth_employee'), 2),
                    'pagibig' => round($payslips->sum('pagibig_employee'), 2),
                    'tax' => round($payslips->sum('bir_withholding_tax'), 2),
                    'absences' => round($payslips->sum('absent_deduction'), 2),
                    'lates' => round($payslips->sum('late_deduction'), 2),
                    'loans' => round(
                        $payslips->sum('sss_loan_deduction') +
                        $payslips->sum('pagibig_loan_deduction') +
                        $payslips->sum('company_loan_deduction'), 2
                    ),
                ],
            ],
            'status_breakdown' => [
                'computed' => $payslips->where('status', 'computed')->count(),
                'approved' => $payslips->where('status', 'approved')->count(),
                'paid' => $payslips->where('status', 'paid')->count(),
            ],
        ];
        
        return $summary;
    }

    /**
     * Mark a payslip as paid
     */
    public function markAsPaid(Payslip $payslip): Payslip
    {
        if ($payslip->status !== 'approved') {
            throw new \Exception('Payslip must be approved before marking as paid');
        }
        
        $payslip->update([
            'status' => 'paid',
            'paid_by' => auth()->user()?->id ?? 1,
            'paid_at' => now(),
        ]);
        
        PayrollAuditLog::record(
            entityType: 'payslip',
            entityId: $payslip->id,
            action: 'paid',
            performedBy: auth()->user()?->id ?? 1,
            afterValues: ['status' => 'paid'],
            description: "Payslip marked as paid for period {$payslip->payrollPeriod->label}",
            ipAddress: request()->ip(),
        );
        
        return $payslip->fresh();
    }

    /**
     * Recompute a payslip (useful after manual adjustments)
     */
    public function recompute(Payslip $payslip): Payslip
    {
        // Fetch the period and employee using the relationship methods
        $period = $payslip->payrollPeriod;
        $employee = $payslip->employee;
        
        if (!$period || !$employee) {
            throw new \Exception('Cannot recompute: Missing period or employee');
        }
        
        // Make sure we have valid IDs
        if (!$period->id || !$employee->id) {
            throw new \Exception('Cannot recompute: Invalid period or employee ID');
        }
        
        // Recompute using the existing compute method
        return $this->compute($employee, $period, auth()->user()?->id ?? 1);
    }
}