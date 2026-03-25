<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
 
class OvertimeRequest extends Model
{
    protected $fillable = [
        'employee_id','date','overtime_type',
        'hours_requested','hours_approved',
        'reason','status','approved_by',
        'rejected_reason','computed_amount','payslip_id',
    ];
 
    protected $casts = [
        'date'             => 'date',
        'hours_requested'  => 'decimal:1',
        'hours_approved'   => 'decimal:1',
        'computed_amount'  => 'decimal:2',
    ];
 
    public function employee()   { return $this->belongsTo(Employee::class); }
    public function approvedBy() { return $this->belongsTo(User::class, 'approved_by'); }
    public function payslip()    { return $this->belongsTo(Payslip::class); }
 
    /** PH DOLE overtime multipliers */
    public static function multiplier(string $type): float
    {
        return match($type) {
            'rest_day','special_holiday' => 1.30,
            'regular_holiday'            => 2.00,
            default                      => 1.25,
        };
    }
}
 
 
