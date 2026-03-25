<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int     $id
 * @property int     $payroll_period_id
 * @property int     $employee_id
 * @property int     $working_days_in_period
 * @property float   $days_worked
 * @property float   $days_absent
 * @property float   $days_on_leave
 * @property float   $days_unpaid_leave
 * @property int     $minutes_late
 * @property float   $overtime_hours
 * @property float   $basic_pay
 * @property float   $overtime_pay
 * @property float   $transport_allowance
 * @property float   $meal_allowance
 * @property float   $other_allowances
 * @property float   $bonuses
 * @property float   $thirteenth_month_pay
 * @property float   $gross_pay
 * @property float   $late_deduction
 * @property float   $absent_deduction
 * @property float   $unpaid_leave_deduction
 * @property float   $sss_employee
 * @property float   $philhealth_employee
 * @property float   $pagibig_employee
 * @property float   $bir_withholding_tax
 * @property float   $sss_loan_deduction
 * @property float   $pagibig_loan_deduction
 * @property float   $company_loan_deduction
 * @property float   $other_deductions
 * @property float   $total_deductions
 * @property float   $sss_employer
 * @property float   $philhealth_employer
 * @property float   $pagibig_employer
 * @property float   $net_pay
 * @property string  $status
 * @property string  $adjustments_note
 * @property string  $pdf_path
 * @property bool    $email_sent
 * @property \Carbon\Carbon $email_sent_at
 * @property int     $computed_by
 * @property \Carbon\Carbon $computed_at
 * @property int     $approved_by
 * @property \Carbon\Carbon $approved_at
 */
class Payslip extends Model
{
    protected $fillable = [
        'payroll_period_id', 'employee_id',
        'working_days_in_period', 'days_worked', 'days_absent',
        'days_on_leave', 'days_unpaid_leave', 'minutes_late', 'overtime_hours',
        'basic_pay', 'overtime_pay', 'transport_allowance', 'meal_allowance',
        'other_allowances', 'bonuses', 'thirteenth_month_pay', 'gross_pay',
        'late_deduction', 'absent_deduction', 'unpaid_leave_deduction',
        'sss_employee', 'philhealth_employee', 'pagibig_employee',
        'bir_withholding_tax', 'sss_loan_deduction', 'pagibig_loan_deduction',
        'company_loan_deduction', 'other_deductions', 'total_deductions',
        'sss_employer', 'philhealth_employer', 'pagibig_employer',
        'net_pay', 'status', 'adjustments_note',
        'pdf_path', 'email_sent', 'email_sent_at',
        'computed_by', 'computed_at', 'approved_by', 'approved_at',
    ];

    protected $casts = [
        'working_days_in_period' => 'float',
        'days_worked'            => 'float',
        'days_absent'            => 'float',
        'days_on_leave'          => 'float',
        'days_unpaid_leave'      => 'float',
        'minutes_late'           => 'integer',
        'overtime_hours'         => 'float',
        'basic_pay'              => 'float',
        'overtime_pay'           => 'float',
        'transport_allowance'    => 'float',
        'meal_allowance'         => 'float',
        'other_allowances'       => 'float',
        'bonuses'                => 'float',
        'thirteenth_month_pay'   => 'float',
        'gross_pay'              => 'float',
        'late_deduction'         => 'float',
        'absent_deduction'       => 'float',
        'unpaid_leave_deduction' => 'float',
        'sss_employee'           => 'float',
        'philhealth_employee'    => 'float',
        'pagibig_employee'       => 'float',
        'bir_withholding_tax'    => 'float',
        'sss_loan_deduction'     => 'float',
        'pagibig_loan_deduction' => 'float',
        'company_loan_deduction' => 'float',
        'other_deductions'       => 'float',
        'total_deductions'       => 'float',
        'sss_employer'           => 'float',
        'philhealth_employer'    => 'float',
        'pagibig_employer'       => 'float',
        'net_pay'                => 'float',
        'email_sent'             => 'boolean',
        'email_sent_at'          => 'datetime',
        'computed_at'            => 'datetime',
        'approved_at'            => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function period(): BelongsTo
    {
        return $this->belongsTo(\App\Models\PayrollPeriod::class, 'payroll_period_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Employee::class);
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(\App\Models\PayslipLineItem::class)->orderBy('order');
    }

    public function earnings(): HasMany
    {
        return $this->hasMany(\App\Models\PayslipLineItem::class)
                    ->where('category', 'earning')
                    ->orderBy('order');
    }

    public function deductions(): HasMany
    {
        return $this->hasMany(\App\Models\PayslipLineItem::class)
                    ->where('category', 'deduction')
                    ->orderBy('order');
    }

    public function computedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'computed_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeForEmployee(Builder $query, int $employeeId): Builder
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    // ─── State helpers ────────────────────────────────────────────────────────

    public function canApprove(): bool { return $this->status === 'computed'; }
    public function canPay(): bool     { return $this->status === 'approved'; }
    public function isPaid(): bool     { return $this->status === 'paid'; }

    // ─── Computed helpers ─────────────────────────────────────────────────────

    /**
     * Daily rate based on 26 working days.
     */
    public function getDailyRate(): float
    {
        $monthlySalary = (float) $this->employee->basic_salary;
        return round($monthlySalary / 26, 4);
    }

    /**
     * Hourly rate based on 8-hour workday.
     */
    public function getHourlyRate(): float
    {
        return round($this->getDailyRate() / 8, 4);
    }

    /**
     * Re-compute gross and net from stored components.
     */
    public function recompute(): void
    {
        $gross = $this->basic_pay
            + $this->overtime_pay
            + $this->transport_allowance
            + $this->meal_allowance
            + $this->other_allowances
            + $this->bonuses
            + $this->thirteenth_month_pay;

        $deductions = $this->late_deduction
            + $this->absent_deduction
            + $this->unpaid_leave_deduction
            + $this->sss_employee
            + $this->philhealth_employee
            + $this->pagibig_employee
            + $this->bir_withholding_tax
            + $this->sss_loan_deduction
            + $this->pagibig_loan_deduction
            + $this->company_loan_deduction
            + $this->other_deductions;

        $this->update([
            'gross_pay'        => round($gross, 2),
            'total_deductions' => round($deductions, 2),
            'net_pay'          => round($gross - $deductions, 2),
        ]);
    }
}