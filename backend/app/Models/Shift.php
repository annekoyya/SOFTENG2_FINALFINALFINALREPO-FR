<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
 
class Shift extends Model
{
    protected $fillable = ['name','start_time','end_time','shift_type','differential_pct','break_minutes'];
    protected $casts    = ['differential_pct' => 'decimal:2'];
    protected $appends  = ['employee_count'];
 
    public function employeeShifts() { return $this->hasMany(EmployeeShift::class); }
 
    public function getEmployeeCountAttribute(): int
    {
        return $this->employeeShifts()->count();
    }
}
 
class EmployeeShift extends Model
{
    protected $fillable = ['employee_id','shift_id','effective_date'];
    protected $casts    = ['effective_date' => 'date'];
 
    public function employee() { return $this->belongsTo(Employee::class); }
    public function shift()    { return $this->belongsTo(Shift::class); }
}