<?php
// ══════════════════════════════════════════════════════════════════════════════
//  App\Models\JobPosting
// ══════════════════════════════════════════════════════════════════════════════
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class JobPosting extends Model
{
    protected $fillable = [
        'title','department','employment_type','location',
        'salary_min','salary_max','description','requirements',
        'slots','status','posted_by','closes_at',
    ];

    protected $casts = [
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
        'closes_at'  => 'datetime',
    ];

    protected $appends = ['applications_count'];

    public function postedBy() { return $this->belongsTo(User::class, 'posted_by'); }
    public function applicants() { return $this->hasMany(Applicant::class); }
    public function offers() { return $this->hasMany(JobOffer::class); }

    public function getApplicationsCountAttribute(): int
    {
        return $this->applicants()->count();
    }

    public function scopeOpen($q) { return $q->where('status', 'open'); }
}

// ══════════════════════════════════════════════════════════════════════════════
//  App\Models\Applicant
// ══════════════════════════════════════════════════════════════════════════════
class Applicant extends Model
{
    protected $fillable = [
        'job_posting_id','first_name','last_name','email','phone',
        'address','resume_path','cover_letter','source',
        'status','rating','notes','applied_at',
    ];

    protected $casts = ['applied_at' => 'datetime'];

    protected $appends = ['full_name'];

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function jobPosting() { return $this->belongsTo(JobPosting::class); }
    public function interviews() { return $this->hasMany(Interview::class); }
    public function offer()      { return $this->hasOne(JobOffer::class); }
}

// ══════════════════════════════════════════════════════════════════════════════
//  App\Models\Interview
// ══════════════════════════════════════════════════════════════════════════════
class Interview extends Model
{
    protected $fillable = [
        'applicant_id','interview_type','scheduled_at',
        'location','interviewer_id','result','feedback',
    ];

    protected $casts = ['scheduled_at' => 'datetime'];

    public function applicant()    { return $this->belongsTo(Applicant::class); }
    public function interviewer()  { return $this->belongsTo(User::class, 'interviewer_id'); }
}

// ══════════════════════════════════════════════════════════════════════════════
//  App\Models\JobOffer
// ══════════════════════════════════════════════════════════════════════════════
class JobOffer extends Model
{
    protected $fillable = [
        'applicant_id','job_posting_id','offered_salary','start_date',
        'status','notes','offered_by','expires_at','responded_at','new_hire_id',
    ];

    protected $casts = [
        'offered_salary' => 'decimal:2',
        'start_date'     => 'date',
        'expires_at'     => 'datetime',
        'responded_at'   => 'datetime',
    ];

    public function applicant()   { return $this->belongsTo(Applicant::class); }
    public function jobPosting()  { return $this->belongsTo(JobPosting::class); }
    public function offeredBy()   { return $this->belongsTo(User::class, 'offered_by'); }
    public function newHire()     { return $this->belongsTo(NewHire::class); }
}