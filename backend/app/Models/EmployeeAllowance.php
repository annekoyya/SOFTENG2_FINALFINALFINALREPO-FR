<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int         $id
 * @property int         $employee_id
 * @property string      $type
 * @property string      $name
 * @property float       $amount
 * @property bool        $is_taxable
 * @property bool        $is_active
 * @property string|null $effective_from
 * @property string|null $effective_to
 */
class EmployeeAllowance extends Model
{
    protected $fillable = [
        'employee_id', 'type', 'name', 'amount',
        'is_taxable', 'is_active',
        'effective_from', 'effective_to', 'notes', 'created_by',
    ];

    protected $casts = [
        'amount'         => 'float',
        'is_taxable'     => 'boolean',
        'is_active'      => 'boolean',
        'effective_from' => 'date',
        'effective_to'   => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Employee::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeForEmployee(Builder $query, int $employeeId): Builder
    {
        return $query->where('employee_id', $employeeId);
    }

    /**
     * Check if this allowance is effective on a given date.
     */
    public function isEffectiveOn(\DateTime|string|null $date): bool
    {
        if (!$this->is_active) return false;
        if (!$date) return false;
        $dateCarbon = $date instanceof \DateTime ? \Carbon\Carbon::instance($date) : (\is_string($date) ? \Carbon\Carbon::parse($date) : $date);
        if ($this->effective_from && $this->effective_from instanceof \Carbon\Carbon && $this->effective_from->gt($dateCarbon)) return false;
        if ($this->effective_to && $this->effective_to instanceof \Carbon\Carbon && $this->effective_to->lt($dateCarbon)) return false;
        return true;
    }
}