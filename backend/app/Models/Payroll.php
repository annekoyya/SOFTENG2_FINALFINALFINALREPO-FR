<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payroll extends Model
{
    protected $fillable = [
        'employee_id',
        'pay_period_start',
        'pay_period_end',
        'base_salary',
        'overtime_pay',
        'bonuses',
        'allowances',
        'gross_salary',
        'sss_contribution',
        'philhealth_contribution',
        'pagibig_contribution',
        'tax_withholding',
        'other_deductions',
        'total_deductions',
        'net_salary',
        'status',
        'notes',
        'calculation_breakdown',
        'created_by',
        'approved_by',
        'approved_at',
        'paid_at',
    ];

    protected $casts = [
        'pay_period_start'        => 'date',
        'pay_period_end'          => 'date',
        'approved_at'             => 'datetime',
        'paid_at'                 => 'datetime',
        'calculation_breakdown'   => 'array',
        'base_salary'             => 'decimal:2',
        'overtime_pay'            => 'decimal:2',
        'bonuses'                 => 'decimal:2',
        'allowances'              => 'decimal:2',
        'gross_salary'            => 'decimal:2',
        'sss_contribution'        => 'decimal:2',
        'philhealth_contribution' => 'decimal:2',
        'pagibig_contribution'    => 'decimal:2',
        'tax_withholding'         => 'decimal:2',
        'other_deductions'        => 'decimal:2',
        'total_deductions'        => 'decimal:2',
        'net_salary'              => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function scopeForMonth($query, $year, $month)
    {
        return $query->whereYear('pay_period_start', $year)
                     ->whereMonth('pay_period_start', $month);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function canEdit(): bool
    {
        return in_array($this->status, ['draft', 'pending_approval']);
    }

    public function canSubmit(): bool
    {
        return $this->status === 'draft';
    }

    public function canApprove(): bool
    {
        return $this->status === 'pending_approval';
    }

    public function canProcess(): bool
    {
        return $this->status === 'approved';
    }

    public function canMarkPaid(): bool
    {
        return $this->status === 'processed';
    }

    /**
     * Recalculate gross = base + overtime + bonuses + allowances.
     * Store as string to match decimal:2 cast expectation.
     */
    public function recalculateGross(): void
    {
        $gross = (float) $this->base_salary
            + (float) $this->overtime_pay
            + (float) $this->bonuses
            + (float) $this->allowances;
        $this->gross_salary = number_format($gross, 2, '.', '');
    }

    public function recalculateNet(): void
    {
        $totalDeductions = (float) $this->sss_contribution
            + (float) $this->philhealth_contribution
            + (float) $this->pagibig_contribution
            + (float) $this->tax_withholding
            + (float) $this->other_deductions;

        $this->total_deductions = number_format($totalDeductions, 2, '.', '');
        $net = (float) $this->gross_salary - $totalDeductions;
        $this->net_salary = number_format($net, 2, '.', '');
    }

    public function recalculate(): void
    {
        $this->recalculateGross();
        $this->recalculateNet();
    }
}