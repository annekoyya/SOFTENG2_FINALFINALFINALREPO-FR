<?php

namespace App\Http\Controllers;

use App\Models\Applicant;
use App\Models\Interview;
use App\Models\JobOffer;
use App\Models\JobPosting;
use App\Models\NewHire;
use App\Models\PayrollAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

// ══════════════════════════════════════════════════════════════════════════════
//  JobPostingController
// ══════════════════════════════════════════════════════════════════════════════

class JobPostingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = JobPosting::with('postedBy:id,name')
            ->withCount('applicants as applications_count');

        if ($request->status) {
            $q->where('status', $request->status);
        }

        return response()->json($q->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'           => 'required|string|max:200',
            'department'      => 'required|string|max:100',
            'employment_type' => 'required|in:full_time,part_time,contractual,probationary',
            'location'        => 'nullable|string|max:200',
            'salary_min'      => 'nullable|numeric|min:0',
            'salary_max'      => 'nullable|numeric|min:0',
            'description'     => 'required|string',
            'requirements'    => 'nullable|string',
            'slots'           => 'nullable|integer|min:1',
            'status'          => 'nullable|in:draft,open',
            'closes_at'       => 'nullable|date',
        ]);

        $job = JobPosting::create([
            ...$data,
            'posted_by' => Auth::id(),
            'status'    => $data['status'] ?? 'open',
        ]);

        return response()->json($job, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $job  = JobPosting::findOrFail($id);
        $data = $request->validate([
            'title'           => 'sometimes|string|max:200',
            'department'      => 'sometimes|string|max:100',
            'employment_type' => 'sometimes|in:full_time,part_time,contractual,probationary',
            'location'        => 'nullable|string|max:200',
            'salary_min'      => 'nullable|numeric|min:0',
            'salary_max'      => 'nullable|numeric|min:0',
            'description'     => 'sometimes|string',
            'requirements'    => 'nullable|string',
            'slots'           => 'nullable|integer|min:1',
            'status'          => 'nullable|in:draft,open,closed,cancelled',
            'closes_at'       => 'nullable|date',
        ]);

        $job->update($data);
        return response()->json($job);
    }

    public function close(int $id): JsonResponse
    {
        $job = JobPosting::findOrFail($id);
        $job->update(['status' => 'closed']);
        return response()->json(['message' => 'Job posting closed.']);
    }

    // GET /api/recruitment/stats
    public function stats(): JsonResponse
    {
        $weekStart = now()->startOfWeek();
        $weekEnd   = now()->endOfWeek();

        return response()->json([
            'open_jobs'            => JobPosting::where('status', 'open')->count(),
            'total_applicants'     => Applicant::count(),
            'interviews_this_week' => Interview::whereBetween('scheduled_at', [$weekStart, $weekEnd])->count(),
            'pending_offers'       => JobOffer::where('status', 'pending')->count(),
        ]);
    }

    // GET /api/recruitment/pipeline
    public function pipeline(Request $request): JsonResponse
    {
        $q = Applicant::query();
        if ($request->job_posting_id) {
            $q->where('job_posting_id', $request->job_posting_id);
        }

        $counts = $q->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $stages = ['applied','screening','interview','offer','hired','rejected'];
        $result = [];
        foreach ($stages as $s) {
            $result[$s] = $counts[$s] ?? 0;
        }

        return response()->json($result);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  ApplicantController
// ══════════════════════════════════════════════════════════════════════════════

class ApplicantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Applicant::query();

        if ($request->job_posting_id) {
            $q->where('job_posting_id', $request->job_posting_id);
        }
        if ($request->status) {
            $q->where('status', $request->status);
        }

        return response()->json($q->latest('applied_at')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'job_posting_id' => 'required|exists:job_postings,id',
            'first_name'     => 'required|string|max:100',
            'last_name'      => 'required|string|max:100',
            'email'          => 'required|email|max:200',
            'phone'          => 'nullable|string|max:30',
            'address'        => 'nullable|string',
            'cover_letter'   => 'nullable|string',
            'source'         => 'required|in:referral,walk_in,online,agency,other',
            'status'         => 'nullable|in:applied,screening,interview,offer,hired,rejected,withdrawn',
        ]);

        $applicant = Applicant::create([
            ...$data,
            'status'     => $data['status'] ?? 'applied',
            'applied_at' => now(),
        ]);

        return response()->json($applicant, 201);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $applicant = Applicant::findOrFail($id);
        $data      = $request->validate([
            'status' => 'required|in:applied,screening,interview,offer,hired,rejected,withdrawn',
            'notes'  => 'nullable|string|max:500',
        ]);

        $applicant->update([
            'status' => $data['status'],
            'notes'  => $data['notes'] ?? $applicant->notes,
        ]);

        return response()->json(['message' => 'Status updated.', 'status' => $applicant->status]);
    }

    public function rate(Request $request, int $id): JsonResponse
    {
        $applicant = Applicant::findOrFail($id);
        $data      = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'notes'  => 'nullable|string|max:500',
        ]);

        $applicant->update([
            'rating' => $data['rating'],
            'notes'  => $data['notes'] ?? $applicant->notes,
        ]);

        return response()->json(['message' => 'Rating saved.']);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  InterviewController
// ══════════════════════════════════════════════════════════════════════════════

class InterviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Interview::with([
            'applicant:id,first_name,last_name,job_posting_id',
            'interviewer:id,name',
        ]);

        if ($request->applicant_id) {
            $q->where('applicant_id', $request->applicant_id);
        }

        return response()->json(
            $q->orderBy('scheduled_at')->get()->map(fn ($i) => [
                'id'             => $i->id,
                'applicant_id'   => $i->applicant_id,
                'applicant_name' => $i->applicant?->full_name,
                'interview_type' => $i->interview_type,
                'scheduled_at'   => $i->scheduled_at?->toDateTimeString(),
                'location'       => $i->location,
                'interviewer_id' => $i->interviewer_id,
                'interviewer_name' => $i->interviewer?->name,
                'result'         => $i->result,
                'feedback'       => $i->feedback,
                'created_at'     => $i->created_at?->toDateTimeString(),
            ])
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'applicant_id'   => 'required|exists:applicants,id',
            'interview_type' => 'required|in:phone,video,onsite,technical',
            'scheduled_at'   => 'required|date',
            'location'       => 'nullable|string|max:300',
            'interviewer_id' => 'required|exists:users,id',
        ]);

        $interview = Interview::create([...$data, 'result' => 'pending']);
        return response()->json($interview, 201);
    }

    public function updateResult(Request $request, int $id): JsonResponse
    {
        $interview = Interview::findOrFail($id);
        $data      = $request->validate([
            'result'   => 'required|in:passed,failed,no_show,pending',
            'feedback' => 'nullable|string|max:1000',
        ]);

        $interview->update($data);
        return response()->json(['message' => 'Interview result updated.']);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  JobOfferController
// ══════════════════════════════════════════════════════════════════════════════

class JobOfferController extends Controller
{
    public function index(): JsonResponse
    {
        $offers = JobOffer::with([
            'applicant:id,first_name,last_name',
            'jobPosting:id,title',
            'offeredBy:id,name',
        ])->latest()->get()->map(fn ($o) => [
            'id'              => $o->id,
            'applicant_id'    => $o->applicant_id,
            'applicant_name'  => $o->applicant?->full_name,
            'job_posting_id'  => $o->job_posting_id,
            'job_title'       => $o->jobPosting?->title,
            'offered_salary'  => (float) $o->offered_salary,
            'start_date'      => $o->start_date?->toDateString(),
            'status'          => $o->status,
            'notes'           => $o->notes,
            'offered_by'      => $o->offered_by,
            'offered_by_name' => $o->offeredBy?->name,
            'expires_at'      => $o->expires_at?->toDateTimeString(),
            'responded_at'    => $o->responded_at?->toDateTimeString(),
            'created_at'      => $o->created_at?->toDateTimeString(),
        ]);

        return response()->json($offers);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'applicant_id'    => 'required|exists:applicants,id',
            'job_posting_id'  => 'required|exists:job_postings,id',
            'offered_salary'  => 'required|numeric|min:0',
            'start_date'      => 'required|date',
            'notes'           => 'nullable|string|max:500',
            'expires_at'      => 'nullable|date',
        ]);

        $offer = JobOffer::create([
            ...$data,
            'offered_by' => Auth::id(),
            'status'     => 'pending',
        ]);

        return response()->json($offer, 201);
    }

    public function respond(Request $request, int $id): JsonResponse
    {
        $offer = JobOffer::findOrFail($id);
        $data  = $request->validate([
            'status' => 'required|in:accepted,declined',
        ]);

        $offer->update([
            'status'       => $data['status'],
            'responded_at' => now(),
        ]);

        return response()->json(['message' => "Offer {$data['status']}."]);
    }

    /**
     * POST /api/job-offers/{id}/convert
     *
     * Converts an accepted offer into a NewHire record,
     * marks the applicant as hired, closes the job if slots filled,
     * and logs the action.
     */
    public function convert(int $id): JsonResponse
    {
        $offer = JobOffer::with(['applicant', 'jobPosting'])->findOrFail($id);

        if ($offer->status !== 'accepted') {
            return response()->json(['message' => 'Offer must be accepted before converting.'], 422);
        }

        if ($offer->new_hire_id) {
            return response()->json(['message' => 'Already converted to a new hire.'], 422);
        }

        DB::transaction(function () use ($offer) {
            $applicant = $offer->applicant;
            $job       = $offer->jobPosting;

            // 1. Create NewHire record pre-filled from applicant + offer data
            $newHire = NewHire::create([
                'first_name'       => $applicant->first_name,
                'last_name'        => $applicant->last_name,
                'email'            => $applicant->email,
                'phone_number'     => $applicant->phone,
                'home_address'     => $applicant->address,
                'department'       => $job->department,
                'employment_type'  => $job->employment_type,
                'basic_salary'     => $offer->offered_salary,
                'start_date'       => $offer->start_date,
                'status'           => 'pending',
                'created_by'       => Auth::id(),
                'source'           => 'recruitment', // track origin
                'job_posting_id'   => $job->id,
            ]);

            // 2. Mark applicant as hired
            $applicant->update(['status' => 'hired']);

            // 3. Link offer → new hire
            $offer->update(['new_hire_id' => $newHire->id]);

            // 4. Check if all slots filled — close job if so
            $hiredCount = $job->applicants()->where('status', 'hired')->count();
            if ($hiredCount >= $job->slots) {
                $job->update(['status' => 'closed']);
            }

            // 5. Audit log
            PayrollAuditLog::create([
                'action'      => 'hire_converted',
                'entity_type' => 'NewHire',
                'entity_id'   => $newHire->id,
                'user_id'     => Auth::id(),
                'description' => "Applicant #{$applicant->id} ({$applicant->full_name}) converted to new hire from job '{$job->title}'.",
            ]);
        });

        return response()->json(['message' => 'Converted to new hire. Check the onboarding queue.'], 201);
    }
}