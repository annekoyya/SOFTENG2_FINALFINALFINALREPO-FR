<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int         $id
 * @property string      $title
 * @property string|null $description
 * @property string      $department
 * @property int         $created_by
 * @property string      $status
 * @property string|null $deadline
 * @property string|null $date_start
 * @property string|null $date_end
 */
class EvaluationForm extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title', 'description', 'department',
        'created_by', 'status', 'deadline',
        'date_start', 'date_end',
    ];

    protected $casts = [
        'deadline'   => 'date',
        'date_start' => 'date',
        'date_end'   => 'date',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function sections(): HasMany
    {
        // Explicit string reference avoids PHP Namespace Resolver warning
        return $this->hasMany(\App\Models\EvaluationSection::class)->orderBy('order');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(\App\Models\EvaluationAssignment::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeByDepartment(Builder $query, string $department): Builder
    {
        return $query->where('department', $department);
    }

    public function getResponsesCountAttribute(): int
    {
        return $this->assignments()->where('status', 'submitted')->count();
    }

    public function getPendingCountAttribute(): int
    {
        return $this->assignments()->where('status', 'pending')->count();
    }

    public function getTotalEvaluatorsAttribute(): int
    {
        return $this->assignments()->count();
    }

    public function activate(): void { $this->update(['status' => 'active']); }
    public function close(): void    { $this->update(['status' => 'closed']); }
}