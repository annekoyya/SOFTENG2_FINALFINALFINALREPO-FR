<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\TrainingAssignment;

/**
 * @property int    $id
 * @property string $title
 * @property string $category
 * @property string|null $description
 * @property int $duration_hours
 * @property int $validity_months
 * @property bool $is_mandatory
 */
class TrainingCourse extends Model
{
    protected $fillable = [
        'title',
        'category',
        'description',
        'duration_hours',
        'validity_months',
        'is_mandatory',
    ];

    protected $casts = [
        'is_mandatory' => 'boolean',
    ];

    public function assignments(): HasMany
    {
        return $this->hasMany(TrainingAssignment::class, 'course_id');
    }
}
