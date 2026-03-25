<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
 

class Holiday extends Model
{
    protected $fillable = [
        'name','date','holiday_type','is_recurring',
        'pay_multiplier','description','created_by',
    ];
    protected $casts = [
        'date'         => 'date',
        'is_recurring' => 'boolean',
        'pay_multiplier' => 'decimal:2',
    ];
 
    public function createdBy() { return $this->belongsTo(User::class, 'created_by'); }
 
    public function scopeForYear($q, int $year) { return $q->whereYear('date', $year); }
 
    /** Check if a given date is a holiday. Returns Holiday or null. */
    public static function findForDate(string $date): ?self
    {
        $d = \Carbon\Carbon::parse($date);
        return static::where('date', $d->toDateString())
            ->orWhere(function ($q) use ($d) {
                $q->where('is_recurring', true)
                  ->whereRaw("strftime('%m-%d', date) = ?", [$d->format('m-d')]);
            })
            ->first();
    }
}