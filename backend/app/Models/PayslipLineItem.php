<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int    $id
 * @property int    $payslip_id
 * @property string $category
 * @property string $label
 * @property float  $amount
 * @property bool   $is_manual
 */
class PayslipLineItem extends Model
{
    protected $fillable = [
        'payslip_id', 'category', 'label',
        'amount', 'description', 'order', 'is_manual',
    ];

    protected $casts = [
        'amount'    => 'float',
        'order'     => 'integer',
        'is_manual' => 'boolean',
    ];

    public function payslip(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Payslip::class);
    }

    public function isEarning(): bool   { return $this->category === 'earning'; }
    public function isDeduction(): bool { return $this->category === 'deduction'; }

  
    public function applyDeductionGuard(Employee $employee, array $deductions): array
    {
        $categories = DeductionCategory::where('is_mandatory', true)
            ->whereNot('required_id', 'none')
            ->get();

        $warnings = [];

        // Map of required_id field → deduction key in $deductions array
        // Adjust keys to match whatever keys your PayslipService uses
        $idToDeductionKey = [
            'sss_number'         => 'sss',
            'philhealth_number'  => 'philhealth',
            'pagibig_number'     => 'pagibig',
            'tin_number'         => 'tax',
        ];

        foreach ($categories as $cat) {
            $idField      = $cat->required_id;
            $deductionKey = $idToDeductionKey[$idField] ?? null;

            if (!$deductionKey) {
                continue;
            }

            // Check if the employee has this ID populated
            $hasId = !empty($employee->{$idField});

            if (!$hasId && isset($deductions[$deductionKey])) {
                $skippedAmount          = $deductions[$deductionKey];
                $deductions[$deductionKey] = 0;

                $idLabel = match ($idField) {
                    'sss_number'        => 'SSS number',
                    'philhealth_number' => 'PhilHealth ID',
                    'pagibig_number'    => 'Pag-IBIG MID',
                    'tin_number'        => 'TIN',
                    default             => $idField,
                };

                $warnings[] = "Missing {$idLabel} — {$cat->name} deduction of ₱{$skippedAmount} was skipped.";
            }
        }

        return [$deductions, $warnings];
    }

    /**
     * Pull all approved bonuses for this employee + period,
     * attach them to the payslip as line items, and return the total.
     *
     * Call this BEFORE finalising gross_pay and net_pay.
     *
     * @param  Employee      $employee
     * @param  PayrollPeriod $period
     * @param  Payslip       $payslip  Already created/saved payslip record
     * @return float  Total bonus amount added
     */
    public function applyApprovedBonuses(
        Employee $employee,
        PayrollPeriod $period,
        Payslip $payslip
    ): float {
        $bonuses = PayrollBonus::where('employee_id', $employee->id)
            ->where('payroll_period_id', $period->id)
            ->where('status', 'approved')
            ->whereNull('payslip_id')   // not yet attached to a payslip
            ->get();

        $total = 0.0;

        foreach ($bonuses as $bonus) {
            // Insert as a line item (earnings side)
            $payslip->lineItems()->create([
                'type'        => 'earning',
                'description' => $bonus->bonus_type,
                'amount'      => $bonus->amount,
                'note'        => $bonus->note,
                'source'      => 'bonus',
                'source_id'   => $bonus->id,
            ]);

            // Mark bonus as attached so it isn't double-counted on re-compute
            if (method_exists($bonus, 'update')) {
                $bonus->update(['payslip_id' => $payslip->id]);
            } else if (isset($bonus->id)) {
                PayrollBonus::where('id', $bonus->id)->update(['payslip_id' => $payslip->id]);
            }

            $total += (float) $bonus->amount;
        }

        return $total;
    
}


/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HOW TO WIRE INTO compute() METHOD
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Inside your existing PayslipService::compute($employee, $period):
 *
 *  // 1. Build deductions as you normally do:
 *  $deductions = [
 *      'sss'        => $this->computeSSS($employee->basic_salary),
 *      'philhealth' => $this->computePhilHealth($employee->basic_salary),
 *      'pagibig'    => $this->computePagIbig($employee->basic_salary),
 *      'tax'        => $this->computeTax($grossPay),
 *      // ... loans, etc.
 *  ];
 *
 *  // 2. Apply gov ID guard — zeros out deductions for missing IDs, returns warnings:
 *  [$deductions, $deductionWarnings] = $this->applyDeductionGuard($employee, $deductions);
 *
 *  // 3. Create the payslip record:
 *  $payslip = Payslip::create([...]);
 *
 *  // 4. Apply approved bonuses — adds line items and returns bonus total:
 *  $bonusTotal = $this->applyApprovedBonuses($employee, $period, $payslip);
 *
 *  // 5. Adjust gross + net with bonus total and warnings:
 *  $payslip->update([
 *      'total_bonuses'       => $bonusTotal,
 *      'gross_pay'           => $payslip->gross_pay + $bonusTotal,
 *      'net_pay'             => $payslip->net_pay + $bonusTotal,
 *      'deduction_warnings'  => !empty($deductionWarnings)
 *                                  ? json_encode($deductionWarnings)
 *                                  : null,
 *      'has_warnings'        => !empty($deductionWarnings),
 *  ]);
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Also add these two columns to your payslips migration (or a new migration):
 *
 *  $table->float('total_bonuses')->default(0);
 *  $table->boolean('has_warnings')->default(false);
 *  $table->json('deduction_warnings')->nullable();
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

}