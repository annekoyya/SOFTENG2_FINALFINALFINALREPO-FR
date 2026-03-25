<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int         $id
 * @property string      $type
 * @property string      $period_start
 * @property string      $period_end
 * @property string      $label
 * @property string      $status
 * @property int|null    $approved_by
 * @property string|null $approved_at
 * @property int|null    $processed_by
 * @property string|null $processed_at
 */
class PayrollPeriod extends Model
{
    protected $fillable = [
        'type', 'period_start', 'period_end', 'label', 'status',
        'approved_by', 'approved_at', 'processed_by', 'processed_at', 'notes',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end'   => 'date',
        'approved_at'  => 'datetime',
        'processed_at' => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function payslips(): HasMany
    {
        return $this->hasMany(\App\Models\Payslip::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', 'open');
    }

    public function scopeLatest(Builder $query): Builder
    {
        return $query->orderBy('period_start', 'desc');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Get number of working days in this period (26/month basis).
     * Semi-monthly = ~13 days, Monthly = 26 days.
     */
    public function getWorkingDays(): float
    {
        return $this->type === 'monthly' ? 26.0 : 13.0;
    }

    /**
     * Auto-generate the next payroll period after this one.
     */
    public static function generateNext(string $type = 'semi_monthly'): self
    {
        $last = self::where('type', $type)->orderBy('period_end', 'desc')->first();

        if (!$last) {
            // First period ever — start from current month
            $start = Carbon::now()->startOfMonth();
        } else {
            $start = Carbon::parse($last->period_end)->addDay();
        }

        if ($type === 'monthly') {
            $end   = $start->copy()->endOfMonth();
            $label = $start->format('F Y');
        } else {
            // Semi-monthly: 1st-15th or 16th-end
            if ($start->day <= 15) {
                $end   = $start->copy()->setDay(15);
                $label = $start->format('F 1-15, Y');
            } else {
                $end   = $start->copy()->endOfMonth();
                $label = $start->format('F 16-') . $end->day . ', ' . $start->year;
            }
        }

        return self::create([
            'type'         => $type,
            'period_start' => $start->toDateString(),
            'period_end'   => $end->toDateString(),
            'label'        => $label,
            'status'       => 'open',
        ]);
    }

    public function canProcess(): bool  { return in_array($this->status, ['open', 'processing']); }
    public function canApprove(): bool  { return $this->status === 'computed'; }
    public function canPay(): bool      { return $this->status === 'approved'; }

    // ─── Summary ──────────────────────────────────────────────────────────────

    public function getTotalGross(): float
    {
        return (float) $this->payslips()->sum('gross_pay');
    }

    public function getTotalDeductions(): float
    {
        return (float) $this->payslips()->sum('total_deductions');
    }

    public function getTotalNetPay(): float
    {
        return (float) $this->payslips()->sum('net_pay');
    }

    public function getTotalEmployeeCount(): int
    {
        return $this->payslips()->count();
    }
}