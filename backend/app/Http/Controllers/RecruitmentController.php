<?php

namespace App\Http\Controllers;

use App\Models\JobPosting;
use App\Models\Applicant;
use App\Models\Interview;
use App\Models\Training;
use App\Models\TrainingAssignment;
use App\Models\NewHire;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RecruitmentController extends Controller
{
    // ══════════════════════════════════════════════════════════════════════
    // JOB POSTINGS
    // ══════════════════════════════════════════════════════════════════════

    public function getJobPostings(): JsonResponse
    {
        $postings = JobPosting::with(['creator', 'applicants'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($p) {
                $p->applicants_count = $p->applicants->count();
                $p->hired_count      = $p->applicants->where('pipeline_stage', 'hired')->count();
                $p->slots_remaining  = max(0, ($p->slots ?? 0) - $p->hired_count);
                return $p;
            });

        return response()->json(['success' => true, 'data' => $postings]);
    }

    public function createJobPosting(Request $request): JsonResponse
    {
        $v = $request->validate([
            'title'        => 'required|string|max:255',
            'department'   => 'required|string|max:255',
            'job_category' => 'required|string|max:255',
            'description'  => 'required|string',
            'slots'        => 'required|integer|min:1',
            'posted_date'  => 'nullable|date',
            'deadline'     => 'nullable|date',
        ]);

        $posting = JobPosting::create([
            ...$v,
            'created_by' => Auth::id(),
            'status'     => 'open',
        ]);

        return response()->json(['success' => true, 'data' => $posting], 201);
    }

    public function updateJobPosting(Request $request, int $id): JsonResponse
    {
        $posting = JobPosting::findOrFail($id);
        $posting->update($request->all());
        return response()->json(['success' => true, 'data' => $posting]);
    }

    public function deleteJobPosting(int $id): JsonResponse
    {
        JobPosting::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    // ══════════════════════════════════════════════════════════════════════
    // APPLICANTS
    // ══════════════════════════════════════════════════════════════════════

    public function getApplicants(Request $request): JsonResponse
    {
        $query = Applicant::with(['jobPosting', 'interview']);

        if ($request->filled('job_posting_id')) {
            $query->where('job_posting_id', $request->job_posting_id);
        }
        if ($request->filled('pipeline_stage')) {
            $query->where('pipeline_stage', $request->pipeline_stage);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->orderBy('created_at', 'desc')->get(),
        ]);
    }

    public function createApplicant(Request $request): JsonResponse
    {
        $v = $request->validate([
            'first_name'     => 'required|string|max:255',
            'last_name'      => 'required|string|max:255',
            'email'          => 'required|email|unique:applicants,email',
            'phone'          => 'nullable|string|max:20',
            'job_posting_id' => 'required|exists:job_postings,id',
            'resume'         => 'nullable|file|mimes:pdf,doc,docx|max:2048',
        ]);

        $resumePath = null;
        if ($request->hasFile('resume')) {
            $resumePath = $request->file('resume')->store('resumes', 'public');
        }

        $applicant = Applicant::create([
            'first_name'     => $v['first_name'],
            'last_name'      => $v['last_name'],
            'email'          => $v['email'],
            'phone'          => $v['phone'] ?? null,
            'job_posting_id' => $v['job_posting_id'],
            'resume_path'    => $resumePath,
            'pipeline_stage' => 'applied',
        ]);

        return response()->json(['success' => true, 'data' => $applicant], 201);
    }

    public function updateApplicantStage(Request $request, int $id): JsonResponse
    {
        $v = $request->validate([
            'pipeline_stage' => 'required|in:applied,reviewed,interview_scheduled,interviewed,hired,rejected',
        ]);

        $applicant = Applicant::findOrFail($id);
        $applicant->update($v);

        return response()->json(['success' => true, 'data' => $applicant]);
    }

    // ── FIX #16 & #19: only Admin can hire, enforce slot limit ───────────

    public function hireApplicant(Request $request, int $id): JsonResponse
    {
        // FIX #19: only Admin can hire
        if (Auth::user()->role !== 'Admin') {
            return response()->json(['success' => false, 'message' => 'Only Admin can hire applicants.'], 403);
        }

        $applicant = Applicant::with('jobPosting')->findOrFail($id);

        // FIX #16: enforce slot limit
        $posting     = $applicant->jobPosting;
        $hiredCount  = Applicant::where('job_posting_id', $posting->id)
                                 ->where('pipeline_stage', 'hired')
                                 ->count();

        if ($hiredCount >= ($posting->slots ?? PHP_INT_MAX)) {
            return response()->json([
                'success' => false,
                'message' => "No slots remaining for \"{$posting->title}\". All {$posting->slots} positions are filled.",
            ], 422);
        }

        DB::beginTransaction();
        try {
            $applicant->update(['pipeline_stage' => 'hired', 'hired_at' => now()]);

            // Close posting if all slots are now filled
            if (($hiredCount + 1) >= ($posting->slots ?? PHP_INT_MAX)) {
                $posting->update(['status' => 'closed']);
            }

            // Create a placeholder Employee (details filled in via NewHireDetailsModal)
            $employee = Employee::create([
                'first_name'               => $applicant->first_name,
                'last_name'                => $applicant->last_name,
                'email'                    => $applicant->email,
                'phone_number'             => $applicant->phone ?? 'TBD',
                'department'               => $posting->department,
                'job_category'             => $posting->job_category,
                'start_date'               => now()->addDays(7)->toDateString(),
                'date_of_birth'            => '1990-01-01',
                'home_address'             => 'TBD',
                'emergency_contact_name'   => 'TBD',
                'emergency_contact_number' => 'TBD',
                'relationship'             => 'TBD',
                'status'                   => 'onboarding',
                'employment_type'          => 'probationary',
                'basic_salary'             => 25000,
                'role'                     => 'Employee',
                'shift_sched'              => 'morning',
            ]);

            // Create training record
            $training = Training::create([
                'title'        => "Onboarding: {$posting->title}",
                'description'  => "Training for {$applicant->first_name} {$applicant->last_name}",
                'applicant_id' => $applicant->id,
                'created_by'   => Auth::id(),
            ]);

            TrainingAssignment::create([
                'training_id' => $training->id,
                'applicant_id'=> $applicant->id,
                'employee_id' => $employee->id,
                'status'      => 'pending',
            ]);

            DB::commit();
            return response()->json([
                'success' => true,
                'data'    => $applicant->fresh(),
                'message' => 'Applicant hired! Training assignment created.',
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // FIX #19: only Admin can reject
    public function rejectApplicant(int $id): JsonResponse
    {
        if (Auth::user()->role !== 'Admin') {
            return response()->json(['success' => false, 'message' => 'Only Admin can reject applicants.'], 403);
        }

        $applicant = Applicant::findOrFail($id);
        $applicant->update(['pipeline_stage' => 'rejected']);
        return response()->json(['success' => true]);
    }

    // ══════════════════════════════════════════════════════════════════════
    // INTERVIEWS  (FIX #19: visible to Admin only in UI, but API still works for HR)
    // ══════════════════════════════════════════════════════════════════════

    public function getInterviews(): JsonResponse
    {
        $interviews = Interview::with(['applicant', 'applicant.jobPosting', 'interviewer'])
            ->orderBy('scheduled_at', 'desc')
            ->get();
        return response()->json(['success' => true, 'data' => $interviews]);
    }

    // FIX #17: interviewer selection — only HR users (no department filter since
    // employees & users don't share department easily; front-end filters by role)
    public function getInterviewers(): JsonResponse
    {
        $hrs = User::where('role', 'HR')->get(['id', 'name', 'email', 'role']);
        return response()->json(['success' => true, 'data' => $hrs]);
    }

    public function scheduleInterview(Request $request): JsonResponse
    {
        $v = $request->validate([
            'applicant_id'   => 'required|exists:applicants,id',
            'interviewer_id' => 'required|exists:users,id',
            'scheduled_at'   => 'required|date',
        ]);

        // FIX #17: ensure interviewer is HR
        $interviewer = User::findOrFail($v['interviewer_id']);
        if ($interviewer->role !== 'HR') {
            return response()->json(['success' => false, 'message' => 'Interviewer must be an HR user.'], 422);
        }

        DB::beginTransaction();
        try {
            $interview = Interview::create([...$v, 'status' => 'scheduled']);
            Applicant::find($v['applicant_id'])->update(['pipeline_stage' => 'interview_scheduled']);
            DB::commit();
            return response()->json(['success' => true, 'data' => $interview]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function updateInterviewStatus(Request $request, int $id): JsonResponse
    {
        $v         = $request->validate(['status' => 'required|in:scheduled,completed,cancelled']);
        $interview = Interview::findOrFail($id);
        $interview->update($v);
        return response()->json(['success' => true, 'data' => $interview]);
    }

    public function completeInterview(int $id): JsonResponse
    {
        DB::beginTransaction();
        try {
            $interview = Interview::with('applicant')->findOrFail($id);
            $interview->update(['status' => 'completed']);
            $interview->applicant->update(['pipeline_stage' => 'interviewed']);
            DB::commit();
            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // TRAININGS
    // ══════════════════════════════════════════════════════════════════════

    public function getTrainings(): JsonResponse
    {
        $trainings = Training::with(['applicant', 'applicant.jobPosting', 'assignments', 'assignments.trainer'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['success' => true, 'data' => $trainings]);
    }

    public function createTraining(Request $request): JsonResponse
    {
        $v = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        $training = Training::create([...$v, 'created_by' => Auth::id()]);
        return response()->json(['success' => true, 'data' => $training], 201);
    }

    public function deleteTraining(int $id): JsonResponse
    {
        Training::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    public function assignTraining(Request $request): JsonResponse
    {
        $v = $request->validate([
            'training_id' => 'required|exists:trainings,id',
            'employee_id' => 'required|exists:employees,id',
        ]);
        $assignment = TrainingAssignment::create([...$v, 'status' => 'pending']);
        return response()->json(['success' => true, 'data' => $assignment], 201);
    }

    public function getTrainingAssignments(): JsonResponse
    {
        $assignments = TrainingAssignment::with(['training', 'employee', 'trainer'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['success' => true, 'data' => $assignments]);
    }

    public function updateTrainingStatus(Request $request, int $id): JsonResponse
    {
        $v          = $request->validate(['status' => 'required|in:pending,in_progress,completed']);
        $assignment = TrainingAssignment::findOrFail($id);
        $assignment->update($v);
        return response()->json(['success' => true, 'data' => $assignment]);
    }

    public function assignTrainer(Request $request, int $assignmentId): JsonResponse
    {
        $v          = $request->validate(['trainer_id' => 'required|exists:employees,id']);
        $assignment = TrainingAssignment::findOrFail($assignmentId);
        $assignment->update(['trainer_id' => $v['trainer_id'], 'status' => 'in_progress']);
        return response()->json(['success' => true, 'data' => $assignment]);
    }

    // FIX #18: complete training → create new_hire without NOT NULL constraint violation
    public function completeTraining(int $assignmentId): JsonResponse
    {
        $assignment = TrainingAssignment::with('employee')->findOrFail($assignmentId);

        DB::beginTransaction();
        try {
            $assignment->update(['status' => 'completed', 'completed_at' => now()]);

            $employee = $assignment->employee;

            if ($employee) {
                // Only create new_hire if one doesn't already exist for this employee
                $existing = NewHire::where('employee_id', $employee->id)->first();

                if (!$existing) {
                    NewHire::create([
                        // Required non-nullable fields with sensible defaults
                        'first_name'               => $employee->first_name,
                        'last_name'                => $employee->last_name,
                        'email'                    => $employee->email,
                        'phone_number'             => $employee->phone_number !== 'TBD' ? $employee->phone_number : null,
                        'department'               => $employee->department,
                        'job_category'             => $employee->job_category,
                        'start_date'               => $employee->start_date,
                        'employment_type'          => $employee->employment_type,
                        'role'                     => $employee->role,
                        'basic_salary'             => $employee->basic_salary,
                        'employee_id'              => $employee->id,
                        'training_id'              => $assignment->training_id,
                        'applicant_id'             => $assignment->applicant_id ?? null,
                        'onboarding_status'        => 'pending',
                        'created_by'               => Auth::id(),
                        // Optional fields — null is fine
                        'middle_name'              => $employee->middle_name ?? null,
                        'name_extension'           => null,
                        'date_of_birth'            => $employee->date_of_birth?->format('Y-m-d') ?? null,
                        'home_address'             => !in_array($employee->home_address, ['TBD', 'To be updated']) ? $employee->home_address : null,
                        'emergency_contact_name'   => !in_array($employee->emergency_contact_name, ['TBD', 'To be updated']) ? $employee->emergency_contact_name : null,
                        'emergency_contact_number' => !in_array($employee->emergency_contact_number, ['TBD', 'To be updated']) ? $employee->emergency_contact_number : null,
                        'relationship'             => !in_array($employee->relationship, ['TBD', 'To be updated']) ? $employee->relationship : null,
                        'reporting_manager'        => $employee->reporting_manager ?? null,
                    ]);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Training completed! New hire record created.']);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // NEW HIRES
    // ══════════════════════════════════════════════════════════════════════

    public function getNewHires(): JsonResponse
    {
        $newHires = NewHire::with(['employee', 'training'])
            ->whereIn('onboarding_status', ['pending', 'complete'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['success' => true, 'data' => $newHires]);
    }

    // FIX #1: Save all employee details before transfer
    public function completeNewHireDetails(Request $request, int $id): JsonResponse
    {
        $newHire = NewHire::findOrFail($id);

        $v = $request->validate([
            'first_name'               => 'required|string|max:255',
            'last_name'                => 'required|string|max:255',
            'middle_name'              => 'nullable|string|max:255',
            'name_extension'           => 'nullable|string|max:20',
            'date_of_birth'            => 'required|date',
            'email'                    => 'required|email|max:255',
            'phone_number'             => 'required|string|max:30',
            'home_address'             => 'required|string|max:500',
            'emergency_contact_name'   => 'required|string|max:255',
            'emergency_contact_number' => 'required|string|max:30',
            'relationship'             => 'required|string|max:100',
            'tin'                      => 'nullable|string|max:50',
            'sss_number'               => 'nullable|string|max:50',
            'pagibig_number'           => 'nullable|string|max:50',
            'philhealth_number'        => 'nullable|string|max:50',
            'bank_name'                => 'nullable|string|max:100',
            'account_name'             => 'nullable|string|max:255',
            'account_number'           => 'nullable|string|max:50',
            'start_date'               => 'required|date',
            'department'               => 'required|string|max:100',
            'job_category'             => 'required|string|max:100',
            'shift_sched'              => 'required|in:morning,afternoon,night',
            'employment_type'          => 'required|in:regular,probationary,contractual,part_time,intern',
            'role'                     => 'required|in:Employee,HR,Accountant,Manager,Admin',
            'basic_salary'             => 'required|numeric|min:0',
            'reporting_manager'        => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $newHire->update([
                ...$v,
                'onboarding_status' => 'complete',
                'completed_fields'  => array_keys($v),
            ]);

            // Sync associated employee record
            if ($newHire->employee_id) {
                Employee::where('id', $newHire->employee_id)->update([
                    'first_name'               => $v['first_name'],
                    'last_name'                => $v['last_name'],
                    'middle_name'              => $v['middle_name']              ?? null,
                    'name_extension'           => $v['name_extension']           ?? null,
                    'date_of_birth'            => $v['date_of_birth'],
                    'email'                    => $v['email'],
                    'phone_number'             => $v['phone_number'],
                    'home_address'             => $v['home_address'],
                    'emergency_contact_name'   => $v['emergency_contact_name'],
                    'emergency_contact_number' => $v['emergency_contact_number'],
                    'relationship'             => $v['relationship'],
                    'tin'                      => $v['tin']              ?? null,
                    'sss_number'               => $v['sss_number']       ?? null,
                    'pagibig_number'           => $v['pagibig_number']   ?? null,
                    'philhealth_number'        => $v['philhealth_number'] ?? null,
                    'bank_name'                => $v['bank_name']         ?? null,
                    'account_name'             => $v['account_name']      ?? null,
                    'account_number'           => $v['account_number']    ?? null,
                    'start_date'               => $v['start_date'],
                    'department'               => $v['department'],
                    'job_category'             => $v['job_category'],
                    'shift_sched'              => $v['shift_sched'],
                    'employment_type'          => $v['employment_type'],
                    'role'                     => $v['role'],
                    'basic_salary'             => $v['basic_salary'],
                    'reporting_manager'        => $v['reporting_manager'] ?? null,
                    'status'                   => 'onboarding',
                ]);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'data'    => $newHire->fresh(),
                'message' => 'Details saved.',
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // FIX #1: Transfer only creates user account — details already saved by completeNewHireDetails
    public function transferToEmployee(int $newHireId): JsonResponse
    {
        $newHire = NewHire::with('employee')->findOrFail($newHireId);

        if ($newHire->onboarding_status === 'transferred') {
            return response()->json(['success' => false, 'message' => 'Already transferred.'], 422);
        }

        if ($newHire->onboarding_status !== 'complete') {
            return response()->json([
                'success' => false,
                'message' => 'Please complete all required details before transferring.',
            ], 422);
        }

        $employee = Employee::find($newHire->employee_id);
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Associated employee record not found.'], 404);
        }

        DB::beginTransaction();
        try {
            // Create user account only if email not already registered
            if (!User::where('email', $employee->email)->exists()) {
                User::create([
                    'name'     => $employee->first_name . ' ' . $employee->last_name,
                    'email'    => $employee->email,
                    'password' => Hash::make('Employee@123'),
                    'role'     => $employee->role,
                ]);
            }

            $employee->update(['status' => 'active']);

            $newHire->update([
                'onboarding_status' => 'transferred',
                'transferred_at'    => now(),
            ]);

            DB::commit();
            return response()->json([
                'success' => true,
                'data'    => $employee->fresh(),
                'message' => "{$employee->first_name} {$employee->last_name} successfully transferred to Employees!",
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}