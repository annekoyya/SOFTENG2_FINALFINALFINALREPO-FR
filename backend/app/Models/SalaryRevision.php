<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
 
class SalaryRevision extends Model
{
    protected $fillable = [
        'employee_id','previous_salary','new_salary',
        'change_amount','change_pct','reason',
        'notes','effective_date','approved_by',
    ];
    protected $casts = [
        'previous_salary' => 'decimal:2',
        'new_salary'      => 'decimal:2',
        'change_amount'   => 'decimal:2',
        'change_pct'      => 'decimal:2',
        'effective_date'  => 'date',
    ];
 
    public function employee()   { return $this->belongsTo(Employee::class); }
    public function approvedBy() { return $this->belongsTo(User::class, 'approved_by'); }
}
 