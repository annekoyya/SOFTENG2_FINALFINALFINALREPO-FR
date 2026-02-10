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
        'pay_period_start' => 'date',
        'pay_period_end' => 'date',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
        'calculation_breakdown' => 'array',
        'base_salary' => 'decimal:2',
        'gross_salary' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_salary' => 'decimal:2',
    ];

    /**
     * Get the employee associated with this payroll record.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the user who created this payroll record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who approved this payroll record.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scope to get payrolls for a specific month.
     */
    public function scopeForMonth($query, $year, $month)
    {
        return $query->whereYear('pay_period_start', $year)
                     ->whereMonth('pay_period_start', $month);
    }

    /**
     * Scope to get payrolls by status.
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Check if payroll can be edited.
     */
    public function canEdit(): bool
    {
        return in_array($this->status, ['draft', 'pending_approval']);
    }

    /**
     * Check if payroll can be approved.
     */
    public function canApprove(): bool
    {
        return $this->status === 'pending_approval';
    }

    /**
     * Check if payroll can be processed.
     */
    public function canProcess(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Calculate net salary from gross and deductions.
     */
    public function recalculateNetSalary(): void
    {
        $this->net_salary = $this->gross_salary - $this->total_deductions;
    }
}
