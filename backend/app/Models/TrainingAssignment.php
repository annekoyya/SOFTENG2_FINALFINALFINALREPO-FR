<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\TrainingCourse;
use App\Models\Employee;

/**
 * @property int    $id
 * @property int    $employee_id
 * @property int    $course_id
 * @property string $status
 * @property string $assigned_date
 * @property string $due_date
 * @property string|null $completed_date
 * @property string|null $expires_at
 * @property int|null $score
 * @property string|null $notes
 * @property int|null $assigned_by
 */
class TrainingAssignment extends Model
{
    protected $fillable = [
        'employee_id',
        'course_id',
        'status',
        'assigned_date',
        'due_date',
        'completed_date',
        'expires_at',
        'score',
        'notes',
        'assigned_by',
    ];

    protected $casts = [
        'assigned_date'  => 'date',
        'due_date'       => 'date',
        'completed_date' => 'date',
        'expires_at'     => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(TrainingCourse::class, 'course_id');
    }
}
