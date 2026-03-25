<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int         $id
 * @property int         $employee_id
 * @property string      $type
 * @property string|null $reference_number
 * @property float       $principal_amount
 * @property float       $outstanding_balance
 * @property float       $monthly_amortization
 * @property string      $status
 * @property string      $start_date
 * @property string|null $end_date
 */
class EmployeeLoan extends Model
{
    protected $fillable = [
        'employee_id', 'type', 'reference_number',
        'principal_amount', 'outstanding_balance', 'monthly_amortization',
        'status', 'start_date', 'end_date', 'notes', 'created_by',
    ];

    protected $casts = [
        'principal_amount'     => 'float',
        'outstanding_balance'  => 'float',
        'monthly_amortization' => 'float',
        'start_date'           => 'date',
        'end_date'             => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Employee::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeForEmployee(Builder $query, int $employeeId): Builder
    {
        return $query->where('employee_id', $employeeId);
    }

    /**
     * Get the deduction amount for a semi-monthly period.
     * Loans are usually monthly — so half per semi-monthly period.
     */
    public function getDeductionForPeriod(string $periodType): float
    {
        if ($this->status !== 'active') return 0.0;
        $amount = $periodType === 'monthly'
            ? $this->monthly_amortization
            : $this->monthly_amortization / 2;
        // Don't deduct more than remaining balance
        return min($amount, $this->outstanding_balance);
    }

    /**
     * Apply a deduction and reduce the outstanding balance.
     * Returns the actual amount deducted.
     */
    public function applyDeduction(float $amount): float
    {
        $actual = min($amount, $this->outstanding_balance);
        $newBalance = $this->outstanding_balance - $actual;

        $this->update([
            'outstanding_balance' => $newBalance,
            'status' => $newBalance <= 0 ? 'fully_paid' : 'active',
        ]);

        return $actual;
    }

    public function getTypeLabel(): string
    {
        return match ($this->type) {
            'sss'     => 'SSS Loan',
            'pagibig' => 'Pag-IBIG Loan',
            'company' => 'Company Loan',
            default   => ucfirst($this->type),
        };
    }
}