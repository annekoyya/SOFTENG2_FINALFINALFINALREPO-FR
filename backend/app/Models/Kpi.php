<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int            $id
 * @property int            $employee_id
 * @property int            $set_by
 * @property string         $title
 * @property string|null    $description
 * @property string|null    $unit
 * @property float          $target_value
 * @property float          $current_value
 * @property float          $weight
 * @property string         $start_date
 * @property string         $end_date
 * @property string         $status
 * @property string         $category
 */
class Kpi extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'employee_id', 'set_by', 'title', 'description',
        'unit', 'target_value', 'current_value', 'weight',
        'start_date', 'end_date', 'status', 'category',
    ];

    protected $casts = [
        'target_value'  => 'decimal:2',
        'current_value' => 'decimal:2',
        'weight'        => 'decimal:2',
        'start_date'    => 'date',
        'end_date'      => 'date',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function setter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'set_by');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeAchieved(Builder $query): Builder
    {
        return $query->where('status', 'achieved');
    }

    public function scopeForEmployee(Builder $query, int $employeeId): Builder
    {
        return $query->where('employee_id', $employeeId);
    }

    // ─── Actions ──────────────────────────────────────────────────────────────

    public function updateProgress(float $value, string $notes = ''): void
    {
        $this->update(['current_value' => min($value, $this->target_value)]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function getProgressPercentage(): float
    {
        if ($this->target_value == 0) {
            return 0;
        }
        return min(100, ($this->current_value / $this->target_value) * 100);
    }

    public function isAchieved(): bool
    {
        return $this->current_value >= $this->target_value;
    }

    public function getCategoryLabel(): string
    {
        return match ($this->category) {
            'productivity'       => 'Productivity',
            'quality'            => 'Quality',
            'attendance'         => 'Attendance',
            'customer_service'   => 'Customer Service',
            'teamwork'           => 'Teamwork',
            default              => 'Other',
        };
    }
}