<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int         $id
 * @property int         $employee_id
 * @property int         $evaluation_template_id
 * @property int         $evaluator_id
 * @property string      $period_start
 * @property string      $period_end
 * @property string|null $period_label
 * @property string      $status
 * @property float|null  $total_score
 * @property float|null  $max_possible_score
 * @property float|null  $percentage_score
 * @property string|null $overall_rating
 * @property int|null    $reviewed_by
 * @property string|null $manager_comments
 * @property string|null $employee_comments
 * @property string|null $notes
 */
class Evaluation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'employee_id', 'evaluation_template_id', 'evaluator_id',
        'period_start', 'period_end', 'period_label', 'status',
        'total_score', 'max_possible_score', 'percentage_score', 'overall_rating',
        'reviewed_by', 'reviewed_at', 'manager_comments',
        'acknowledged_at', 'employee_comments', 'notes',
    ];

    protected $casts = [
        'period_start'       => 'date',
        'period_end'         => 'date',
        'reviewed_at'        => 'datetime',
        'acknowledged_at'    => 'datetime',
        'total_score'        => 'float',
        'max_possible_score' => 'float',
        'percentage_score'   => 'float',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    // Fix: EvaluationTemplate is in the same namespace — reference directly
    public function template(): BelongsTo
    {
        return $this->belongsTo(EvaluationTemplate::class, 'evaluation_template_id');
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    // Fix: EvaluationResponse is in the same namespace — reference directly
    public function responses(): HasMany
    {
        return $this->hasMany(EvaluationResponse::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeForEmployee(Builder $query, int $employeeId): Builder
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->whereIn('status', ['draft', 'submitted']);
    }

    // ─── State Checks ─────────────────────────────────────────────────────────

    public function canSubmit(): bool      { return $this->status === 'draft'; }
    public function canReview(): bool      { return $this->status === 'submitted'; }
    public function canAcknowledge(): bool { return $this->status === 'reviewed'; }
    public function isCompleted(): bool    { return $this->status === 'completed'; }

    // ─── Actions ──────────────────────────────────────────────────────────────

    public function submit(): void
    {
        if (!$this->canSubmit()) throw new \Exception('Evaluation cannot be submitted.');
        $this->computeScores();
        $this->update(['status' => 'submitted']);
    }

    public function review(int $reviewerId, string $comments = ''): void
    {
        if (!$this->canReview()) throw new \Exception('Evaluation cannot be reviewed.');
        $this->update([
            'status'           => 'reviewed',
            'reviewed_by'      => $reviewerId,
            'reviewed_at'      => now(),
            'manager_comments' => $comments,
        ]);
    }

    public function acknowledge(string $comments = ''): void
    {
        if (!$this->canAcknowledge()) throw new \Exception('Evaluation cannot be acknowledged.');
        $this->update([
            'status'            => 'completed',
            'acknowledged_at'   => now(),
            'employee_comments' => $comments,
        ]);
    }

    // ─── Score Computation ────────────────────────────────────────────────────

    public function computeScores(): void
    {
        $responses  = $this->responses()->with('question')->get();
        $totalScore = 0.0;
        $maxScore   = $this->template->getMaxScore();

        foreach ($responses as $response) {
            if ($response->question->isRating() && $response->score !== null) {
                $weighted = (float) $response->score * (float) $response->question->weight;
                $response->update(['weighted_score' => $weighted]);
                $totalScore += $weighted;
            }
        }

        $percentage = $maxScore > 0 ? round(($totalScore / $maxScore) * 100, 2) : 0.0;

        $this->update([
            'total_score'        => $totalScore,
            'max_possible_score' => $maxScore,
            'percentage_score'   => $percentage,
            'overall_rating'     => $this->deriveRating($percentage),
        ]);
    }

    private function deriveRating(float $pct): string
    {
        return match (true) {
            $pct >= 90 => 'outstanding',
            $pct >= 75 => 'exceeds_expectations',
            $pct >= 60 => 'meets_expectations',
            $pct >= 40 => 'needs_improvement',
            default    => 'unsatisfactory',
        };
    }

    public function getRatingLabel(): string
    {
        return match ($this->overall_rating) {
            'outstanding'          => 'Outstanding',
            'exceeds_expectations' => 'Exceeds Expectations',
            'meets_expectations'   => 'Meets Expectations',
            'needs_improvement'    => 'Needs Improvement',
            'unsatisfactory'       => 'Unsatisfactory',
            default                => '—',
        };
    }

    public function getRatingColor(): string
    {
        return match ($this->overall_rating) {
            'outstanding'          => 'green',
            'exceeds_expectations' => 'blue',
            'meets_expectations'   => 'yellow',
            'needs_improvement'    => 'orange',
            'unsatisfactory'       => 'red',
            default                => 'gray',
        };
    }
}