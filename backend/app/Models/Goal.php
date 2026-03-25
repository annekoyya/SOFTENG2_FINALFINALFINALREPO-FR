<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int         $id
 * @property int         $employee_id
 * @property int         $set_by
 * @property string      $title
 * @property string|null $description
 * @property string      $due_date
 * @property int         $progress
 * @property string      $priority
 * @property string      $status
 * @property string      $category
 * @property int|null    $evaluation_id
 * @property string|null $completion_notes
 * @property string|null $completed_at
 */
class Goal extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'employee_id', 'set_by', 'title', 'description',
        'due_date', 'progress', 'priority', 'status', 'category',
        'evaluation_id', 'completion_notes', 'completed_at',
    ];

    protected $casts = [
        'due_date'     => 'date',
        'completed_at' => 'datetime',
        'progress'     => 'integer',
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

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', ['not_started', 'in_progress']);
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->where('due_date', '<', today())
                     ->whereNotIn('status', ['completed', 'cancelled']);
    }

    public function scopeForEmployee(Builder $query, int $employeeId): Builder
    {
        return $query->where('employee_id', $employeeId);
    }

    // ─── Actions ──────────────────────────────────────────────────────────────

    public function updateProgress(int $progress, string $notes = ''): void
    {
        $status = $this->status;

        if ($progress >= 100) {
            $status = 'completed';
        } elseif ($progress > 0) {
            $status = 'in_progress';
        }

        $this->update([
            'progress'         => min(100, max(0, $progress)),
            'status'           => $status,
            'completion_notes' => $notes ?: $this->completion_notes,
            'completed_at'     => $progress >= 100 ? now() : null,
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Fix: use Carbon::parse() — 'date' cast returns \DateTime to static analyzer,
     * not Carbon, so ->isPast() is flagged. Explicit parse always resolves correctly.
     */
    public function isOverdue(): bool
    {
        return Carbon::parse($this->due_date)->isPast()
            && !in_array($this->status, ['completed', 'cancelled']);
    }

    public function getPriorityColor(): string
    {
        return match ($this->priority) {
            'critical' => 'red',
            'high'     => 'orange',
            'medium'   => 'yellow',
            'low'      => 'green',
            default    => 'gray',
        };
    }

    public function getStatusColor(): string
    {
        return match ($this->status) {
            'completed'   => 'green',
            'in_progress' => 'blue',
            'not_started' => 'gray',
            'overdue'     => 'red',
            'cancelled'   => 'gray',
            default       => 'gray',
        };
    }

    public function getCategoryLabel(): string
    {
        return match ($this->category) {
            'professional_development' => 'Professional Development',
            'performance'              => 'Performance',
            'project'                  => 'Project',
            'behavioral'               => 'Behavioral',
            default                    => 'Other',
        };
    }
}