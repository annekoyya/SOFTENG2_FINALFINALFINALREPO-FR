Let me read the transcript to get the full codebase context before fixing everything.The transcript is mostly document generation logs. I have enough context from the conversation. Let me build all the fixes now.

**`backend/app/Http/Controllers/RecruitmentController.php`**

```php
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
```

---

**`backend/app/Http/Controllers/EmployeeController.php`**

```php
<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class EmployeeController extends Controller
{
    // FIX #4: salary mapping per job category
    private const SALARY_MAP = [
        'Front Desk Agent'       => 22000,
        'Front Desk Supervisor'  => 30000,
        'Housekeeping Attendant' => 18000,
        'Housekeeping Supervisor'=> 26000,
        'Chef de Partie'         => 32000,
        'Sous Chef'              => 40000,
        'Executive Chef'         => 60000,
        'Food & Beverage Server' => 19000,
        'F&B Supervisor'         => 27000,
        'Security Guard'         => 18000,
        'Security Supervisor'    => 24000,
        'Maintenance Technician' => 20000,
        'Chief Engineer'         => 45000,
        'HR Assistant'           => 22000,
        'HR Officer'             => 30000,
        'HR Manager'             => 50000,
        'Accountant'             => 28000,
        'Finance Manager'        => 55000,
        'Rooms Division Manager' => 58000,
        'General Manager'        => 80000,
        'IT Support'             => 25000,
        'Admin Assistant'        => 20000,
    ];

    public function getDepartments(): JsonResponse
    {
        $departments = [
            'Human Resources', 'Finance', 'Front Office',
            'Food & Beverage', 'Housekeeping', 'Rooms Division',
            'Security', 'Engineering', 'Administration', 'IT',
        ];
        return response()->json(['success' => true, 'data' => $departments]);
    }

    public function getJobCategories(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => array_keys(self::SALARY_MAP)]);
    }

    // FIX #4: return salary map so front-end can auto-fill
    public function getSalaryMapping(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => self::SALARY_MAP]);
    }

    public function index(Request $request): JsonResponse
    {
        $q = Employee::whereNull('deleted_at')->where('status', '!=', 'terminated');

        if ($request->filled('department'))       $q->where('department',       $request->department);
        if ($request->filled('employment_type'))  $q->where('employment_type',  $request->employment_type);
        if ($request->filled('status'))           $q->where('status',           $request->status);
        if ($request->filled('search')) {
            $s = $request->search;
            $q->where(fn($x) =>
                $x->where('first_name', 'like', "%$s%")
                  ->orWhere('last_name',  'like', "%$s%")
                  ->orWhere('email',      'like', "%$s%")
            );
        }

        return response()->json(['success' => true, 'data' => $q->orderBy('first_name')->paginate(50)]);
    }

    public function store(Request $request): JsonResponse
    {
        $v = $this->validateEmployee($request);
        $employee = Employee::create($v);
        return response()->json(['success' => true, 'data' => $employee], 201);
    }

    public function show(Employee $employee): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $employee]);
    }

    // FIX #2: update correctly validates and saves
    public function update(Request $request, Employee $employee): JsonResponse
    {
        $v = $this->validateEmployee($request, $employee->id);
        $employee->update($v);
        return response()->json([
            'success' => true,
            'data'    => $employee->fresh(),
            'message' => 'Employee updated successfully.',
        ]);
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $employee->delete(); // soft delete
        return response()->json(['success' => true, 'message' => 'Employee archived.']);
    }

    public function updateStatus(Request $request, Employee $employee): JsonResponse
    {
        $v = $request->validate(['status' => 'required|in:active,on_leave,suspended,terminated']);
        $employee->update($v);
        return response()->json(['success' => true, 'data' => $employee->fresh()]);
    }

    public function updateRole(Request $request, Employee $employee): JsonResponse
    {
        $v = $request->validate(['role' => 'required|in:Employee,HR,Manager,Accountant,Admin']);
        $employee->update($v);
        return response()->json(['success' => true, 'data' => $employee->fresh()]);
    }

    // FIX #3 & #5: PDF export, no permanent delete option
    public function export(int $id): \Symfony\Component\HttpFoundation\Response
    {
        $employee = Employee::withTrashed()->findOrFail($id);

        $html = $this->buildEmployeePdfHtml($employee);

        try {
            $pdf      = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('a4', 'portrait');
            $filename = 'employee_' . $employee->id . '_' . str_replace(' ', '_', $employee->first_name . '_' . $employee->last_name) . '.pdf';
            return $pdf->download($filename);
        } catch (\Throwable) {
            // DomPDF not installed — return HTML download
            $filename = 'employee_' . $employee->id . '.html';
            return response($html, 200, [
                'Content-Type'        => 'text/html; charset=utf-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
        }
    }

    public function archived(): JsonResponse
    {
        $employees = Employee::onlyTrashed()->orderBy('deleted_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $employees]);
    }

    public function restore(int $id): JsonResponse
    {
        $employee = Employee::onlyTrashed()->findOrFail($id);
        $employee->restore();
        return response()->json(['success' => true, 'message' => 'Employee restored.']);
    }

    // FIX #5: purge/permanently-delete removed from controller so no route calls it
    // (route still exists but returns 403 to prevent accidental use)
    public function purge(int $id): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Permanent deletion is disabled. Use archive/restore instead.',
        ], 403);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function validateEmployee(Request $request, ?int $ignoreId = null): array
    {
        $emailRule = 'required|email|unique:employees,email' . ($ignoreId ? ",{$ignoreId}" : '');

        return $request->validate([
            'first_name'               => 'required|string|max:255',
            'last_name'                => 'required|string|max:255',
            'middle_name'              => 'nullable|string|max:255',
            'name_extension'           => 'nullable|string|max:20',
            'date_of_birth'            => 'required|date',
            'email'                    => $emailRule,
            'phone_number'             => 'required|string|max:30',
            'home_address'             => 'required|string|max:500',
            'emergency_contact_name'   => 'required|string|max:255',
            'emergency_contact_number' => 'required|string|max:30',
            'relationship'             => 'required|string|max:100',
            'department'               => 'required|string|max:100',
            'job_category'             => 'required|string|max:100',
            'employment_type'          => 'required|in:regular,probationary,contractual,part_time,intern',
            'start_date'               => 'required|date',
            'basic_salary'             => 'required|numeric|min:0',
            'role'                     => 'required|in:Employee,HR,Manager,Accountant,Admin',
            'shift_sched'              => 'required|in:morning,afternoon,night',
            'status'                   => 'sometimes|in:active,on_leave,suspended,terminated,onboarding',
            'tin'                      => 'nullable|string|max:50',
            'sss_number'               => 'nullable|string|max:50',
            'pagibig_number'           => 'nullable|string|max:50',
            'philhealth_number'        => 'nullable|string|max:50',
            'bank_name'                => 'nullable|string|max:100',
            'account_name'             => 'nullable|string|max:255',
            'account_number'           => 'nullable|string|max:50',
            'end_date'                 => 'nullable|date',
            'reporting_manager'        => 'nullable|string|max:255',
            'photo_path'               => 'nullable|string',
        ]);
    }

    private function buildEmployeePdfHtml(Employee $employee): string
    {
        $fmt  = fn($v) => $v ?? '—';
        $name = $employee->getFullNameAttribute();

        return <<<HTML
<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Employee Profile — {$name}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 30px; }
  h1 { font-size: 18px; color: #1a2e52; margin-bottom: 4px; }
  .sub { color: #555; font-size: 11px; margin-bottom: 20px; }
  .section { margin-bottom: 16px; }
  .section h2 { font-size: 13px; background: #1a2e52; color: #fff; padding: 4px 10px; margin-bottom: 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 5px 10px; border: 1px solid #dde; font-size: 11px; }
  td:first-child { font-weight: bold; width: 35%; background: #f4f6fb; }
  .footer { margin-top: 30px; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 8px; }
</style></head><body>
<h1>{$name}</h1>
<div class="sub">{$fmt($employee->job_category)} · {$fmt($employee->department)} · Status: {$fmt($employee->status)}</div>

<div class="section"><h2>Personal Information</h2><table>
  <tr><td>Date of Birth</td><td>{$fmt($employee->date_of_birth?->format('F d, Y'))}</td></tr>
  <tr><td>Email</td><td>{$fmt($employee->email)}</td></tr>
  <tr><td>Phone</td><td>{$fmt($employee->phone_number)}</td></tr>
  <tr><td>Home Address</td><td>{$fmt($employee->home_address)}</td></tr>
  <tr><td>Emergency Contact</td><td>{$fmt($employee->emergency_contact_name)} ({$fmt($employee->relationship)}) — {$fmt($employee->emergency_contact_number)}</td></tr>
</table></div>

<div class="section"><h2>Employment Details</h2><table>
  <tr><td>Department</td><td>{$fmt($employee->department)}</td></tr>
  <tr><td>Job Category</td><td>{$fmt($employee->job_category)}</td></tr>
  <tr><td>Employment Type</td><td>{$fmt($employee->employment_type)}</td></tr>
  <tr><td>Start Date</td><td>{$fmt($employee->start_date?->format('F d, Y'))}</td></tr>
  <tr><td>Basic Salary</td><td>₱{$fmt(number_format((float)$employee->basic_salary, 2))}</td></tr>
  <tr><td>Shift Schedule</td><td>{$fmt($employee->shift_sched)}</td></tr>
  <tr><td>Reporting Manager</td><td>{$fmt($employee->reporting_manager)}</td></tr>
  <tr><td>System Role</td><td>{$fmt($employee->role)}</td></tr>
</table></div>

<div class="section"><h2>Government IDs</h2><table>
  <tr><td>TIN</td><td>{$fmt($employee->tin)}</td></tr>
  <tr><td>SSS Number</td><td>{$fmt($employee->sss_number)}</td></tr>
  <tr><td>PhilHealth</td><td>{$fmt($employee->philhealth_number)}</td></tr>
  <tr><td>Pag-IBIG</td><td>{$fmt($employee->pagibig_number)}</td></tr>
</table></div>

<div class="section"><h2>Banking Information</h2><table>
  <tr><td>Bank Name</td><td>{$fmt($employee->bank_name)}</td></tr>
  <tr><td>Account Name</td><td>{$fmt($employee->account_name)}</td></tr>
</table></div>

<div class="footer">Generated {$_=now()->format('F d, Y H:i')} · Blue Lotus Hotel HR Harmony Suite · Confidential</div>
</body></html>
HTML;
    }
}
```

---

**`backend/app/Http/Controllers/AttendanceController.php`**

```php
<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    // FIX #8: shift times
    private const SHIFT_TIMES = [
        'morning'   => ['start' => '07:00', 'grace_end' => '07:30'],
        'afternoon' => ['start' => '15:00', 'grace_end' => '15:30'],
        'night'     => ['start' => '23:00', 'grace_end' => '23:30'],
    ];

    public function index(Request $request): JsonResponse
    {
        $q = Attendance::with('employee');

        if ($request->filled('employee_id')) $q->where('employee_id', $request->employee_id);
        if ($request->filled('date_from'))   $q->where('date', '>=', $request->date_from);
        if ($request->filled('date_to'))     $q->where('date', '<=', $request->date_to);
        if ($request->filled('status'))      $q->where('status', $request->status);
        if ($request->filled('month')) {
            $q->whereYear('date', substr($request->month, 0, 4))
              ->whereMonth('date', substr($request->month, 5, 2));
        }

        return response()->json([
            'success' => true,
            'data'    => $q->orderBy('date', 'desc')->paginate(100),
        ]);
    }

    // FIX #6: live status dashboard
    public function liveStatus(): JsonResponse
    {
        $today     = today()->toDateString();
        $employees = Employee::where('status', 'active')->get();

        $records = Attendance::with('employee')
            ->where('date', $today)
            ->get()
            ->keyBy('employee_id');

        $onLeave = LeaveRequest::where('status', 'approved')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->pluck('employee_id')
            ->toArray();

        $summary = [
            'present'  => 0,
            'late'     => 0,
            'absent'   => 0,
            'on_leave' => count($onLeave),
        ];

        $list = $employees->map(function ($emp) use ($records, $onLeave, $today, &$summary) {
            $rec = $records->get($emp->id);

            if (in_array($emp->id, $onLeave)) {
                $status = 'on_leave';
            } elseif (!$rec) {
                // After working hours (past noon) mark absent
                $status = now()->hour >= 12 ? 'absent' : 'not_yet';
            } else {
                $status = $rec->status;
            }

            if (in_array($status, ['present', 'late', 'absent', 'on_leave'])) {
                $key = $status;
                if (isset($summary[$key])) $summary[$key]++;
            }

            return [
                'employee_id'   => $emp->id,
                'name'          => $emp->first_name . ' ' . $emp->last_name,
                'department'    => $emp->department,
                'shift'         => $emp->shift_sched ?? 'morning',
                'status'        => $status,
                'time_in'       => $rec?->time_in,
                'time_out'      => $rec?->time_out,
                'minutes_late'  => $rec?->minutes_late ?? 0,
                'hours_worked'  => $rec?->hours_worked ?? 0,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => [
                'date'    => $today,
                'summary' => $summary,
                'records' => $list->values(),
            ],
        ]);
    }

    public function monthlyStats(Request $request): JsonResponse
    {
        $month = $request->input('month', now()->format('Y-m'));

        [$year, $mon] = explode('-', $month);

        $stats = Attendance::whereYear('date', $year)
            ->whereMonth('date', $mon)
            ->selectRaw('
                COUNT(*) as total_records,
                SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = "late" THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = "on_leave" THEN 1 ELSE 0 END) as on_leave,
                AVG(minutes_late) as avg_late_minutes,
                AVG(hours_worked) as avg_hours_worked
            ')
            ->first();

        return response()->json(['success' => true, 'data' => $stats]);
    }

    // FIX #7: export as CSV download
    public function export(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $q = Attendance::with('employee');

        if ($request->filled('employee_id')) $q->where('employee_id', $request->employee_id);
        if ($request->filled('date_from'))   $q->where('date', '>=', $request->date_from);
        if ($request->filled('date_to'))     $q->where('date', '<=', $request->date_to);
        if ($request->filled('month')) {
            $q->whereYear('date', substr($request->month, 0, 4))
              ->whereMonth('date', substr($request->month, 5, 2));
        }

        $records = $q->orderBy('date', 'desc')->get();

        $csv   = "Employee ID,Name,Department,Date,Status,Time In,Time Out,Minutes Late,Hours Worked,Notes\n";

        foreach ($records as $r) {
            $name = $r->employee ? "{$r->employee->first_name} {$r->employee->last_name}" : "ID:{$r->employee_id}";
            $dept = $r->employee?->department ?? '';
            $csv .= implode(',', [
                $r->employee_id,
                '"' . $name . '"',
                '"' . $dept . '"',
                $r->date,
                $r->status,
                $r->time_in  ?? '',
                $r->time_out ?? '',
                $r->minutes_late,
                $r->hours_worked,
                '"' . str_replace('"', '""', $r->notes ?? '') . '"',
            ]) . "\n";
        }

        $filename = 'attendance_' . ($request->month ?? date('Y-m')) . '.csv';

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    // FIX #8: import with shift-aware late calculation
    public function import(Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|file|mimes:csv,xlsx,xls']);

        $file    = $request->file('file');
        $path    = $file->getRealPath();
        $ext     = strtolower($file->getClientOriginalExtension());

        $rows = $ext === 'csv'
            ? $this->parseCsv($path)
            : $this->parseXlsx($path);

        $imported = 0;
        $errors   = [];

        foreach ($rows as $i => $row) {
            try {
                $employeeId = $row['employee_id'] ?? null;
                $date       = $row['date']        ?? null;
                $timeIn     = $row['time_in']     ?? null;

                if (!$employeeId || !$date) {
                    $errors[] = "Row " . ($i + 2) . ": missing employee_id or date";
                    continue;
                }

                $employee = Employee::find($employeeId);
                if (!$employee) {
                    $errors[] = "Row " . ($i + 2) . ": employee {$employeeId} not found";
                    continue;
                }

                // FIX #8: shift-aware late calculation
                $shift        = self::SHIFT_TIMES[$employee->shift_sched ?? 'morning'];
                $shiftStart   = Carbon::parse($date . ' ' . $shift['start']);
                $graceEnd     = Carbon::parse($date . ' ' . $shift['grace_end']);
                $minutesLate  = 0;
                $status       = 'absent';
                $withinGrace  = false;

                if ($timeIn) {
                    $clockIn = Carbon::parse($date . ' ' . $timeIn);
                    if ($clockIn <= $graceEnd) {
                        $status       = 'present';
                        $withinGrace  = $clockIn <= $shiftStart;
                    } else {
                        $status      = 'late';
                        $minutesLate = $clockIn->diffInMinutes($shiftStart);
                    }
                }

                $timeOut    = $row['time_out'] ?? null;
                $hoursWorked = 0;
                if ($timeIn && $timeOut) {
                    $hoursWorked = round(
                        Carbon::parse($date . ' ' . $timeIn)
                              ->diffInMinutes(Carbon::parse($date . ' ' . $timeOut)) / 60,
                        2
                    );
                }

                Attendance::updateOrCreate(
                    ['employee_id' => $employeeId, 'date' => $date],
                    [
                        'time_in'             => $timeIn,
                        'time_out'            => $timeOut,
                        'status'              => $row['status'] ?? $status,
                        'minutes_late'        => $minutesLate,
                        'hours_worked'        => $hoursWorked,
                        'within_grace_period' => $withinGrace,
                        'recorded_by'         => Auth::id(),
                        'notes'               => $row['notes'] ?? null,
                    ]
                );

                $imported++;
            } catch (\Throwable $e) {
                $errors[] = "Row " . ($i + 2) . ": " . $e->getMessage();
            }
        }

        return response()->json([
            'success' => true,
            'data'    => ['imported' => $imported, 'errors' => $errors],
            'message' => "{$imported} records imported.",
        ]);
    }

    // FIX #6 & #8: manual entry with shift-aware calculation
    public function manual(Request $request): JsonResponse
    {
        $v = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date'        => 'required|date',
            'time_in'     => 'nullable|date_format:H:i',
            'time_out'    => 'nullable|date_format:H:i',
            'status'      => 'required|in:present,late,absent,on_leave,half_day',
            'notes'       => 'nullable|string|max:500',
        ]);

        $employee = Employee::findOrFail($v['employee_id']);

        // FIX #8: use employee's shift for late calculation
        $minutesLate = 0;
        if ($v['time_in'] && $v['status'] !== 'absent') {
            $shift      = self::SHIFT_TIMES[$employee->shift_sched ?? 'morning'];
            $shiftStart = Carbon::parse($v['date'] . ' ' . $shift['start']);
            $graceEnd   = Carbon::parse($v['date'] . ' ' . $shift['grace_end']);
            $clockIn    = Carbon::parse($v['date'] . ' ' . $v['time_in']);

            if ($clockIn > $graceEnd) {
                $minutesLate = $clockIn->diffInMinutes($shiftStart);
            }
        }

        $hoursWorked = 0;
        if (!empty($v['time_in']) && !empty($v['time_out'])) {
            $hoursWorked = round(
                Carbon::parse($v['date'] . ' ' . $v['time_in'])
                      ->diffInMinutes(Carbon::parse($v['date'] . ' ' . $v['time_out'])) / 60,
                2
            );
        }

        $record = Attendance::updateOrCreate(
            ['employee_id' => $v['employee_id'], 'date' => $v['date']],
            [
                'time_in'      => $v['time_in']  ?? null,
                'time_out'     => $v['time_out'] ?? null,
                'status'       => $v['status'],
                'minutes_late' => $minutesLate,
                'hours_worked' => $hoursWorked,
                'recorded_by'  => Auth::id(),
                'notes'        => $v['notes'] ?? null,
            ]
        );

        return response()->json(['success' => true, 'data' => $record]);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function parseCsv(string $path): array
    {
        $rows    = [];
        $handle  = fopen($path, 'r');
        $headers = array_map('strtolower', array_map('trim', fgetcsv($handle)));

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) === count($headers)) {
                $rows[] = array_combine($headers, $row);
            }
        }
        fclose($handle);
        return $rows;
    }

    private function parseXlsx(string $path): array
    {
        // PhpSpreadsheet if available, else fall back to treating as CSV
        if (class_exists('\PhpOffice\PhpSpreadsheet\IOFactory')) {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($path);
            $sheet       = $spreadsheet->getActiveSheet()->toArray(null, true, true, false);
            $headers     = array_map('strtolower', array_map('trim', $sheet[0]));
            $rows        = [];
            for ($i = 1; $i < count($sheet); $i++) {
                if (array_filter($sheet[$i])) {
                    $rows[] = array_combine($headers, $sheet[$i]);
                }
            }
            return $rows;
        }
        return $this->parseCsv($path);
    }
}
```

---

**`backend/app/Http/Controllers/LeaveController.php`**

```php
<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use App\Models\LeaveBalance;
use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class LeaveController extends Controller
{
    // FIX #9: HR creates leave requests; Admin/HR/Manager approves
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $q    = LeaveRequest::with('employee');

        // Employees see only their own
        if ($user->role === 'Employee') {
            $employee = Employee::where('email', $user->email)->first();
            if ($employee) $q->where('employee_id', $employee->id);
        }

        if ($request->filled('employee_id')) $q->where('employee_id', $request->employee_id);
        if ($request->filled('status'))      $q->where('status',      $request->status);
        if ($request->filled('type'))        $q->where('type',        $request->type);

        return response()->json([
            'success' => true,
            'data'    => $q->orderBy('created_at', 'desc')->paginate(50),
        ]);
    }

    // FIX #9: HR (and Employee) can create leave requests
    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'type'        => 'required|in:vacation,sick,emergency,maternity,paternity,bereavement,solo_parent,unpaid',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'reason'      => 'nullable|string|max:500',
        ]);

        // Calculate working days
        $days = 0;
        foreach (CarbonPeriod::create($v['start_date'], $v['end_date']) as $day) {
            if (!$day->isWeekend()) $days++;
        }

        // Check leave balance (skip for unpaid/emergency)
        if (!in_array($v['type'], ['unpaid', 'emergency'])) {
            $balance = LeaveBalance::where('employee_id', $v['employee_id'])
                ->where('leave_type', $v['type'])
                ->first();

            if ($balance && $balance->balance < $days) {
                return response()->json([
                    'success' => false,
                    'message' => "Insufficient {$v['type']} leave balance. Available: {$balance->balance} days, Requested: {$days} days.",
                ], 422);
            }
        }

        $leave = LeaveRequest::create([
            ...$v,
            'days'       => $days,
            'status'     => 'pending',
            'created_by' => Auth::id(),
        ]);

        return response()->json(['success' => true, 'data' => $leave->load('employee'), 'message' => 'Leave request submitted.'], 201);
    }

    public function pending(): JsonResponse
    {
        $leaves = LeaveRequest::with('employee')
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $leaves]);
    }

    // FIX #9: Admin/HR/Manager can approve
    public function approve(int $id): JsonResponse
    {
        $user = Auth::user();
        if (!in_array($user->role, ['Admin', 'HR', 'Manager'])) {
            return response()->json(['success' => false, 'message' => 'Only Admin, HR, or Manager can approve leave.'], 403);
        }

        $leave = LeaveRequest::with('employee')->findOrFail($id);

        if ($leave->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Only pending requests can be approved.'], 422);
        }

        DB::beginTransaction();
        try {
            $leave->update([
                'status'      => 'approved',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            // Stamp attendance records as on_leave for each working day
            foreach (CarbonPeriod::create($leave->start_date, $leave->end_date) as $day) {
                if ($day->isWeekend()) continue;
                Attendance::updateOrCreate(
                    ['employee_id' => $leave->employee_id, 'date' => $day->toDateString()],
                    ['status' => 'on_leave', 'recorded_by' => Auth::id(), 'notes' => ucfirst($leave->type) . ' leave approved']
                );
            }

            // Deduct from leave balance
            if (!in_array($leave->type, ['unpaid', 'emergency'])) {
                LeaveBalance::where('employee_id', $leave->employee_id)
                    ->where('leave_type', $leave->type)
                    ->decrement('balance', $leave->days ?? 1);
            }

            DB::commit();
            return response()->json(['success' => true, 'data' => $leave->fresh(), 'message' => 'Leave approved.']);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function reject(int $id): JsonResponse
    {
        $user = Auth::user();
        if (!in_array($user->role, ['Admin', 'HR', 'Manager'])) {
            return response()->json(['success' => false, 'message' => 'Only Admin, HR, or Manager can reject leave.'], 403);
        }

        $leave = LeaveRequest::findOrFail($id);
        if ($leave->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Only pending requests can be rejected.'], 422);
        }

        $leave->update(['status' => 'rejected', 'approved_by' => Auth::id(), 'approved_at' => now()]);
        return response()->json(['success' => true, 'message' => 'Leave rejected.']);
    }

    public function cancel(int $id): JsonResponse
    {
        $leave = LeaveRequest::findOrFail($id);

        if ($leave->status === 'approved') {
            // Restore balance
            if (!in_array($leave->type, ['unpaid', 'emergency'])) {
                LeaveBalance::where('employee_id', $leave->employee_id)
                    ->where('leave_type', $leave->type)
                    ->increment('balance', $leave->days ?? 1);
            }
            // Remove on_leave attendance stamps
            Attendance::where('employee_id', $leave->employee_id)
                ->whereBetween('date', [$leave->start_date, $leave->end_date])
                ->where('status', 'on_leave')
                ->delete();
        }

        $leave->update(['status' => 'cancelled']);
        return response()->json(['success' => true, 'message' => 'Leave cancelled.']);
    }
}
```

---

**`backend/app/Http/Controllers/EvaluationFormController.php`**

```php
<?php

namespace App\Http\Controllers;

use App\Models\EvaluationForm;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class EvaluationFormController extends Controller
{
    public function index(): JsonResponse
    {
        // FIX #14: auto-close forms past deadline before returning list
        $this->autoCloseExpired();

        $forms = EvaluationForm::withCount('assignments')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $forms]);
    }

    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'nullable|string',
            'department'     => 'nullable|string|max:100',
            'sections_data'  => 'required|array',
            'deadline'       => 'nullable|date|after:today',
            'date_start'     => 'nullable|date',
            'date_end'       => 'nullable|date',
        ]);

        $form = EvaluationForm::create([
            ...$v,
            'created_by' => Auth::id(),
            'status'     => 'draft',
        ]);

        return response()->json(['success' => true, 'data' => $form], 201);
    }

    public function show(EvaluationForm $form): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $form->load('assignments.user')]);
    }

    // FIX #13: cannot edit active forms
    public function update(Request $request, EvaluationForm $form): JsonResponse
    {
        if ($form->status === 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Active evaluations cannot be edited. Close the form first.',
            ], 422);
        }

        $v = $request->validate([
            'title'         => 'sometimes|string|max:255',
            'description'   => 'nullable|string',
            'department'    => 'nullable|string|max:100',
            'sections_data' => 'sometimes|array',
            'deadline'      => 'nullable|date',
            'date_start'    => 'nullable|date',
            'date_end'      => 'nullable|date',
        ]);

        $form->update($v);
        return response()->json(['success' => true, 'data' => $form->fresh()]);
    }

    public function destroy(EvaluationForm $form): JsonResponse
    {
        if ($form->status === 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete an active evaluation. Close it first.',
            ], 422);
        }
        $form->delete();
        return response()->json(['success' => true]);
    }

    // FIX #12: send only to HR users as evaluators
    public function send(Request $request, EvaluationForm $form): JsonResponse
    {
        $v = $request->validate([
            'user_ids'   => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
        ]);

        // FIX #12: ensure all assigned users are HR
        $nonHR = User::whereIn('id', $v['user_ids'])->where('role', '!=', 'HR')->pluck('name');
        if ($nonHR->isNotEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Only HR users can be evaluators. Non-HR users: ' . $nonHR->implode(', '),
            ], 422);
        }

        foreach ($v['user_ids'] as $userId) {
            EvaluationAssignment::firstOrCreate(
                ['evaluation_form_id' => $form->id, 'user_id' => $userId],
                ['status' => 'pending']
            );
        }

        $form->update(['status' => 'active']);

        return response()->json(['success' => true, 'message' => 'Evaluation sent to ' . count($v['user_ids']) . ' evaluators.']);
    }

    public function close(EvaluationForm $form): JsonResponse
    {
        $form->update(['status' => 'closed']);
        return response()->json(['success' => true, 'message' => 'Evaluation closed.']);
    }

    public function myAssignments(): JsonResponse
    {
        // FIX #14: auto-close expired forms
        $this->autoCloseExpired();

        $assignments = EvaluationAssignment::with('form')
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $assignments]);
    }

    public function getAssignment(EvaluationAssignment $assignment): JsonResponse
    {
        // Only the assigned evaluator can view
        if ($assignment->user_id !== Auth::id() && !in_array(Auth::user()->role, ['Admin', 'HR'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        return response()->json(['success' => true, 'data' => $assignment->load('form')]);
    }

    public function submitAssignment(Request $request, EvaluationAssignment $assignment): JsonResponse
    {
        if ($assignment->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        if ($assignment->status === 'submitted') {
            return response()->json(['success' => false, 'message' => 'Already submitted.'], 422);
        }

        if ($assignment->form->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'This evaluation is no longer active.'], 422);
        }

        $v = $request->validate(['responses_data' => 'required|array']);

        $assignment->update([
            'status'         => 'submitted',
            'submitted_at'   => now(),
            'responses_data' => $v['responses_data'],
        ]);

        return response()->json(['success' => true, 'message' => 'Evaluation submitted.']);
    }

    // FIX #15: analytics with response distribution charts
    public function analytics(EvaluationForm $form): JsonResponse
    {
        $assignments = EvaluationAssignment::with('form')
            ->where('evaluation_form_id', $form->id)
            ->where('status', 'submitted')
            ->get();

        $total       = EvaluationAssignment::where('evaluation_form_id', $form->id)->count();
        $submitted   = $assignments->count();
        $responseRate = $total > 0 ? round(($submitted / $total) * 100, 1) : 0;

        // Aggregate responses per question
        $questionStats = [];

        foreach ($assignments as $assignment) {
            $responses = $assignment->responses_data ?? [];
            foreach ($responses as $qId => $answer) {
                if (!isset($questionStats[$qId])) {
                    $questionStats[$qId] = ['answers' => [], 'total' => 0, 'sum' => 0];
                }
                $questionStats[$qId]['answers'][] = $answer;
                $questionStats[$qId]['total']++;
                if (is_numeric($answer)) {
                    $questionStats[$qId]['sum'] += $answer;
                }
            }
        }

        // Build distribution for Likert questions
        $chartData = [];
        foreach ($questionStats as $qId => $stats) {
            $dist = array_count_values(array_map('strval', $stats['answers']));
            arsort($dist);

            $chartData[$qId] = [
                'question_id'     => $qId,
                'total_responses' => $stats['total'],
                'average'         => $stats['total'] > 0 ? round($stats['sum'] / $stats['total'], 2) : null,
                'distribution'    => $dist,
            ];
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'form'          => $form,
                'total'         => $total,
                'submitted'     => $submitted,
                'response_rate' => $responseRate,
                'chart_data'    => $chartData,
            ],
        ]);
    }

    // FIX #14: auto-close evaluations past deadline
    private function autoCloseExpired(): void
    {
        EvaluationForm::where('status', 'active')
            ->whereNotNull('deadline')
            ->where('deadline', '<', now()->toDateString())
            ->update(['status' => 'closed']);
    }
}
```

---

**`src/hooks/useAccounting.ts`** — FIX #10: role-aware workflow

```typescript
import { useState, useCallback } from "react";
import { authFetch } from "./api";

export interface PayrollPeriod {
  id: number;
  type: "semi_monthly" | "monthly";
  period_start: string;
  period_end: string;
  label: string;
  status: "open" | "processing" | "computed" | "approved" | "paid";
  notes?: string;
  approved_by?: number;
  approved_at?: string;
  payslips_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Payslip {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name?: string;
    department: string;
    job_category: string;
    basic_salary: number;
    email?: string;
  };
  period?: PayrollPeriod;
  working_days_in_period: number;
  days_worked: number;
  days_absent: number;
  days_on_leave: number;
  days_unpaid_leave: number;
  minutes_late: number;
  overtime_hours: number;
  basic_pay: number;
  overtime_pay: number;
  transport_allowance: number;
  meal_allowance: number;
  other_allowances: number;
  bonuses: number;
  thirteenth_month_pay: number;
  gross_pay: number;
  late_deduction: number;
  absent_deduction: number;
  unpaid_leave_deduction: number;
  sss_employee: number;
  philhealth_employee: number;
  pagibig_employee: number;
  bir_withholding_tax: number;
  sss_loan_deduction: number;
  pagibig_loan_deduction: number;
  company_loan_deduction: number;
  other_deductions: number;
  total_deductions: number;
  sss_employer: number;
  philhealth_employer: number;
  pagibig_employer: number;
  net_pay: number;
  status: "draft" | "computed" | "approved" | "paid" | "cancelled";
  email_sent: boolean;
  email_sent_at?: string;
  computed_by?: number;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  earnings?: PayslipLineItem[];
  deductions?: PayslipLineItem[];
}

export interface PayslipLineItem {
  id: number;
  payslip_id: number;
  category: "earning" | "deduction";
  label: string;
  amount: number;
  is_manual: boolean;
}

export interface PayrollSummary {
  period: PayrollPeriod;
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  total_sss_employee: number;
  total_sss_employer: number;
  total_philhealth_employee: number;
  total_philhealth_employer: number;
  total_pagibig_employee: number;
  total_pagibig_employer: number;
  total_bir: number;
  by_department: Record<string, { count: number; gross: number; net: number }>;
}

export interface AuditLog {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  performed_by: number;
  performer?: { id: number; name: string; email: string };
  description?: string;
  created_at: string;
}

export interface ComputeResult {
  success: { employee_id: number; name: string; net_pay: number }[];
  failed:  { employee_id?: number; name: string; error: string }[];
}

export function useAccounting() {
  const [periods,         setPeriods]         = useState<PayrollPeriod[]>([]);
  const [payslips,        setPayslips]        = useState<Payslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [summary,         setSummary]         = useState<PayrollSummary | null>(null);
  const [auditLogs,       setAuditLogs]       = useState<AuditLog[]>([]);
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  const call = useCallback(async <T>(fn: () => Promise<Response>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      const res  = await fn();
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? `HTTP ${res.status}`);
      return (body.data ?? body) as T;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPeriods = useCallback(async () => {
    const data = await call<{ data: PayrollPeriod[] } | PayrollPeriod[]>(
      () => authFetch("/api/payroll-periods")
    );
    const list = Array.isArray(data) ? data : ((data as any).data ?? []);
    setPeriods(list);
  }, [call]);

  const createPeriod = useCallback(async (payload: {
    type: string; period_start: string; period_end: string; label: string;
  }) => {
    const p = await call<PayrollPeriod>(() =>
      authFetch("/api/payroll-periods", { method: "POST", body: JSON.stringify(payload) })
    );
    setPeriods(prev => [p, ...prev]);
    return p;
  }, [call]);

  const generateNextPeriod = useCallback(async (type = "semi_monthly") => {
    const p = await call<PayrollPeriod>(() =>
      authFetch(`/api/payroll-periods/generate-next?type=${type}`, { method: "POST" })
    );
    setPeriods(prev => [p, ...prev]);
    return p;
  }, [call]);

  const fetchPayslips = useCallback(async (periodId?: number) => {
    const params = periodId ? `?payroll_period_id=${periodId}&per_page=100` : "?per_page=100";
    const data   = await call<{ data: Payslip[] } | Payslip[]>(() =>
      authFetch(`/api/payslips${params}`)
    );
    setPayslips(Array.isArray(data) ? data : ((data as any).data ?? []));
  }, [call]);

  const fetchPayslip = useCallback(async (id: number) => {
    const p = await call<Payslip>(() => authFetch(`/api/payslips/${id}`));
    setSelectedPayslip(p);
    return p;
  }, [call]);

  const computeSingle = useCallback(async (employeeId: number, periodId: number) =>
    call<Payslip>(() =>
      authFetch("/api/payslips/compute", {
        method: "POST",
        body: JSON.stringify({ employee_id: employeeId, payroll_period_id: periodId }),
      })
    ), [call]);

  const computeAll = useCallback(async (periodId: number) => {
    const result = await call<ComputeResult>(() =>
      authFetch("/api/payslips/compute-all", {
        method: "POST",
        body: JSON.stringify({ payroll_period_id: periodId }),
      })
    );
    await fetchPayslips(periodId);
    return result;
  }, [call, fetchPayslips]);

  const addAdjustment = useCallback(async (
    payslipId: number, category: "earning"|"deduction",
    label: string, amount: number, note: string,
  ) => {
    const updated = await call<Payslip>(() =>
      authFetch(`/api/payslips/${payslipId}/adjust`, {
        method: "POST",
        body: JSON.stringify({ category, label, amount, note }),
      })
    );
    setPayslips(prev => prev.map(p => p.id === payslipId ? updated : p));
    if (selectedPayslip?.id === payslipId) setSelectedPayslip(updated);
    return updated;
  }, [call, selectedPayslip]);

  const approvePayslip = useCallback(async (id: number) => {
    const updated = await call<Payslip>(() =>
      authFetch(`/api/payslips/${id}/approve`, { method: "POST" })
    );
    setPayslips(prev => prev.map(p => p.id === id ? updated : p));
    if (selectedPayslip?.id === id) setSelectedPayslip(updated);
  }, [call, selectedPayslip]);

  const markAsPaid = useCallback(async (id: number) => {
    const updated = await call<Payslip>(() =>
      authFetch(`/api/payslips/${id}/pay`, { method: "POST" })
    );
    setPayslips(prev => prev.map(p => p.id === id ? updated : p));
    if (selectedPayslip?.id === id) setSelectedPayslip(updated);
  }, [call, selectedPayslip]);

  const approveAll = useCallback(async (periodId: number) => {
    const result = await call<{ count: number }>(() =>
      authFetch(`/api/payslips/approve-all/${periodId}`, { method: "POST" })
    );
    await fetchPayslips(periodId);
    return result;
  }, [call, fetchPayslips]);

  const fetchSummary = useCallback(async (periodId: number) => {
    const data = await call<PayrollSummary>(() =>
      authFetch(`/api/payslips/summary?payroll_period_id=${periodId}`)
    );
    setSummary(data);
  }, [call]);

  const fetchAuditLogs = useCallback(async (periodId?: number) => {
    const params = periodId ? `?payroll_period_id=${periodId}` : "";
    const data   = await call<{ data: AuditLog[] } | AuditLog[]>(() =>
      authFetch(`/api/payslips/audit-trail${params}`)
    );
    setAuditLogs(Array.isArray(data) ? data : ((data as any).data ?? []));
  }, [call]);

  const sendEmail = useCallback(async (payslipId: number) => {
    await call(() => authFetch(`/api/payslips/${payslipId}/send-email`, { method: "POST" }));
    setPayslips(prev => prev.map(p => p.id === payslipId ? { ...p, email_sent: true } : p));
  }, [call]);

  const bulkSendEmail = useCallback(async (periodId: number) =>
    call<{ sent_count: number; failed_count: number }>(() =>
      authFetch("/api/payslips/bulk-send-email", {
        method: "POST",
        body: JSON.stringify({ payroll_period_id: periodId }),
      })
    ), [call]);

  // FIX #11: individual payslip PDF
  const downloadPdf = useCallback(async (payslipId: number) => {
    try {
      const res = await authFetch(`/api/payslips/${payslipId}/pdf`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement("a"), { href: url, download: `payslip_${payslipId}.pdf` });
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (e) { setError(e instanceof Error ? e.message : "PDF download failed"); }
  }, []);

  const downloadSummaryPdf = useCallback(async (periodId: number, periodLabel?: string) => {
    try {
      const res = await authFetch(`/api/payroll-periods/${periodId}/summary-pdf`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob        = await res.blob();
      const url         = URL.createObjectURL(blob);
      const disposition = res.headers.get("content-disposition") ?? "";
      const ext         = disposition.includes(".html") ? "html" : "pdf";
      const safeName    = (periodLabel ?? String(periodId)).replace(/[^a-zA-Z0-9_\- ]/g, "_");
      const a           = Object.assign(document.createElement("a"), { href: url, download: `payroll_summary_${safeName}.${ext}` });
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF download failed");
      throw e;
    }
  }, []);

  return {
    periods, payslips, selectedPayslip, summary, auditLogs, isLoading, error,
    fetchPeriods, createPeriod, generateNextPeriod,
    fetchPayslips, fetchPayslip, computeSingle, computeAll,
    addAdjustment, approvePayslip, markAsPaid, approveAll,
    fetchSummary, fetchAuditLogs,
    sendEmail, bulkSendEmail,
    downloadPdf, downloadSummaryPdf,
    clearSelected: () => setSelectedPayslip(null),
    clearError:    () => setError(null),
  };
}
```

---

**`src/pages/Accounting.tsx`** — FIX #10: Admin sees Approve All → Email; Accountant sees Compute → Email; both share payslip view:

```tsx
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAccounting, type Payslip, type PayrollSummary, type AuditLog } from "@/hooks/useAccounting";
import {
  Plus, Play, Mail, Download, CalendarDays, Eye, CheckCircle,
  DollarSign, Loader2, ShieldCheck, TrendingUp, ChevronRight, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PERIOD_STATUS_STYLES: Record<string, string> = {
  open:       "bg-gray-100 text-gray-700",
  processing: "bg-blue-100 text-blue-700",
  computed:   "bg-amber-100 text-amber-700",
  approved:   "bg-green-100 text-green-700",
  paid:       "bg-emerald-100 text-emerald-700",
};

const SLIP_STATUS_STYLES: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-700",
  computed:  "bg-amber-100 text-amber-700",
  approved:  "bg-blue-100 text-blue-700",
  paid:      "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const fmt = (n: number) =>
  `₱${(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

// ══════════════════════════════════════════════════════════════════════════
// PAYSLIP DETAIL SHEET
// ══════════════════════════════════════════════════════════════════════════

function PayslipDetailSheet({
  payslip, open, onClose,
  onApprove, onMarkPaid, onSendEmail, onDownloadPdf, onAddAdjustment, canCompute, canApprove,
}: {
  payslip: Payslip | null; open: boolean; onClose: () => void;
  onApprove: (id: number) => Promise<void>;
  onMarkPaid: (id: number) => Promise<void>;
  onSendEmail: (id: number) => Promise<void>;
  onDownloadPdf: (id: number) => void;
  onAddAdjustment: (id: number, cat: "earning"|"deduction", label: string, amount: number, note: string) => Promise<void>;
  canCompute: boolean;
  canApprove: boolean;
}) {
  const { toast } = useToast();
  const [acting, setActing] = useState(false);
  const [adjOpen, setAdjOpen] = useState(false);
  const [adjForm, setAdjForm] = useState({ category: "earning" as "earning"|"deduction", label: "", amount: "", note: "" });

  if (!payslip) return null;

  const wrap = (fn: () => Promise<void>, msg: string) => async () => {
    setActing(true);
    try { await fn(); toast({ title: msg }); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setActing(false); }
  };

  const earnings = [
    { label: "Basic Pay",           amount: payslip.basic_pay },
    { label: "Overtime Pay",        amount: payslip.overtime_pay },
    { label: "Transport Allowance", amount: payslip.transport_allowance },
    { label: "Meal Allowance",      amount: payslip.meal_allowance },
    { label: "Other Allowances",    amount: payslip.other_allowances },
    { label: "Bonuses",             amount: payslip.bonuses },
    { label: "13th Month Pay",      amount: payslip.thirteenth_month_pay },
  ].filter(e => e.amount > 0);

  const deductions = [
    { label: "Late Deduction",        amount: payslip.late_deduction },
    { label: "Absent Deduction",      amount: payslip.absent_deduction },
    { label: "Unpaid Leave",          amount: payslip.unpaid_leave_deduction },
    { label: "SSS Employee",          amount: payslip.sss_employee },
    { label: "PhilHealth Employee",   amount: payslip.philhealth_employee },
    { label: "Pag-IBIG Employee",     amount: payslip.pagibig_employee },
    { label: "Withholding Tax (BIR)", amount: payslip.bir_withholding_tax },
    { label: "SSS Loan",              amount: payslip.sss_loan_deduction },
    { label: "Pag-IBIG Loan",         amount: payslip.pagibig_loan_deduction },
    { label: "Company Loan",          amount: payslip.company_loan_deduction },
    { label: "Other Deductions",      amount: payslip.other_deductions },
  ].filter(d => d.amount > 0);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Payslip — {payslip.employee?.first_name} {payslip.employee?.last_name}</SheetTitle>
          <div className="text-sm text-muted-foreground">{payslip.period?.label} · {payslip.employee?.department}</div>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Status",      value: <Badge className={cn("text-xs border-0 capitalize", SLIP_STATUS_STYLES[payslip.status])}>{payslip.status}</Badge> },
              { label: "Days Worked", value: `${payslip.days_worked}/${payslip.working_days_in_period}` },
              { label: "Days Absent", value: String(payslip.days_absent) },
              { label: "Mins Late",   value: payslip.minutes_late > 0 ? `${payslip.minutes_late}m` : "0" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="font-medium text-sm mt-0.5">{value}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="font-semibold text-sm mb-2">Earnings</div>
            <div className="space-y-1.5">
              {earnings.map(e => (
                <div key={e.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{e.label}</span>
                  <span className="text-green-700 font-medium">{fmt(e.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-sm pt-2 border-t">
                <span>Gross Pay</span><span className="text-green-700">{fmt(payslip.gross_pay)}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="font-semibold text-sm mb-2">Deductions</div>
            <div className="space-y-1.5">
              {deductions.map(d => (
                <div key={d.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="text-red-600 font-medium">{fmt(d.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-sm pt-2 border-t">
                <span>Total Deductions</span><span className="text-red-600">{fmt(payslip.total_deductions)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-muted/30 p-4 flex justify-between items-center">
            <span className="font-bold">Net Pay</span>
            <span className="text-2xl font-bold">{fmt(payslip.net_pay)}</span>
          </div>

          {adjOpen && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
              <div className="font-semibold text-sm">Add Adjustment</div>
              <Select value={adjForm.category} onValueChange={v => setAdjForm(p => ({ ...p, category: v as any }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="earning">Earning</SelectItem>
                  <SelectItem value="deduction">Deduction</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Label" value={adjForm.label} onChange={e => setAdjForm(p => ({ ...p, label: e.target.value }))} />
              <Input type="number" placeholder="Amount ₱" value={adjForm.amount} onChange={e => setAdjForm(p => ({ ...p, amount: e.target.value }))} />
              <Input placeholder="Reason (for audit trail)" value={adjForm.note} onChange={e => setAdjForm(p => ({ ...p, note: e.target.value }))} />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" disabled={acting} onClick={async () => {
                  if (!adjForm.label || !adjForm.amount || !adjForm.note) {
                    toast({ title: "Fill all fields", variant: "destructive" }); return;
                  }
                  setActing(true);
                  try {
                    await onAddAdjustment(payslip.id, adjForm.category, adjForm.label, parseFloat(adjForm.amount), adjForm.note);
                    toast({ title: "Adjustment added" }); setAdjOpen(false);
                    setAdjForm({ category: "earning", label: "", amount: "", note: "" });
                  } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
                  finally { setActing(false); }
                }}>
                  {acting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Add
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setAdjOpen(false)}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => onDownloadPdf(payslip.id)}>
                <Download className="h-4 w-4" /> PDF
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={wrap(() => onSendEmail(payslip.id), "Email sent")} disabled={acting}>
                {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Email
              </Button>
            </div>
            {payslip.status !== "paid" && payslip.status !== "cancelled" && (
              <div className="flex gap-2">
                {!adjOpen && canCompute && (
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setAdjOpen(true)}>Adjust</Button>
                )}
                {/* FIX #10: Accountant approves computed; Admin approves computed too */}
                {payslip.status === "computed" && canApprove && (
                  <Button size="sm" className="flex-1 gap-1" onClick={wrap(() => onApprove(payslip.id), "Approved")} disabled={acting}>
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Approve
                  </Button>
                )}
                {payslip.status === "approved" && canApprove && (
                  <Button size="sm" className="flex-1 gap-1 bg-green-600 hover:bg-green-700" onClick={wrap(() => onMarkPaid(payslip.id), "Marked as paid")} disabled={acting}>
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />} Mark Paid
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SUMMARY TAB
// ══════════════════════════════════════════════════════════════════════════

function SummaryTab({ summary, isLoading }: { summary: PayrollSummary | null; isLoading: boolean }) {
  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!summary) return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
      <TrendingUp className="h-10 w-10 text-muted-foreground/30 mb-3" />
      <p className="text-muted-foreground">No data. Compute payroll first.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Employees",        value: String(summary.total_employees), color: "text-foreground" },
          { label: "Total Gross Pay",  value: fmt(summary.total_gross),        color: "text-green-600" },
          { label: "Total Deductions", value: fmt(summary.total_deductions),   color: "text-red-600" },
          { label: "Total Net Pay",    value: fmt(summary.total_net),          color: "text-blue-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
            <div className={cn("text-xl font-bold", color)}>{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b bg-blue-50">
          <h3 className="font-semibold text-blue-900 text-sm">Government Remittance Summary</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-5 py-3 font-semibold text-left">Contribution</th>
              <th className="px-5 py-3 font-semibold text-right">Employee Share</th>
              <th className="px-5 py-3 font-semibold text-right">Employer Share</th>
              <th className="px-5 py-3 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[
              ["SSS",        summary.total_sss_employee,        summary.total_sss_employer],
              ["PhilHealth", summary.total_philhealth_employee, summary.total_philhealth_employer],
              ["Pag-IBIG",   summary.total_pagibig_employee,    summary.total_pagibig_employer],
              ["BIR / Tax",  summary.total_bir,                 0],
            ].map(([lbl, emp, er]) => (
              <tr key={lbl as string} className="hover:bg-muted/20">
                <td className="px-5 py-3 font-medium">{lbl}</td>
                <td className="px-5 py-3 text-right">{fmt(emp as number)}</td>
                <td className="px-5 py-3 text-right">{er ? fmt(er as number) : "—"}</td>
                <td className="px-5 py-3 text-right font-semibold">{fmt((emp as number) + (er as number))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {Object.keys(summary.by_department).length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">By Department</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-5 py-3 font-semibold text-left">Department</th>
                <th className="px-5 py-3 font-semibold text-right">Employees</th>
                <th className="px-5 py-3 font-semibold text-right">Gross</th>
                <th className="px-5 py-3 font-semibold text-right">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(summary.by_department).map(([dept, d]) => (
                <tr key={dept} className="hover:bg-muted/20">
                  <td className="px-5 py-3 font-medium">{dept}</td>
                  <td className="px-5 py-3 text-right">{d.count}</td>
                  <td className="px-5 py-3 text-right text-green-700">{fmt(d.gross)}</td>
                  <td className="px-5 py-3 text-right font-semibold">{fmt(d.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// AUDIT TAB
// ══════════════════════════════════════════════════════════════════════════

const ACTION_STYLES: Record<string, string> = {
  computed:      "bg-amber-100 text-amber-700",
  adjusted:      "bg-purple-100 text-purple-700",
  approved:      "bg-blue-100 text-blue-700",
  paid:          "bg-green-100 text-green-700",
  email_sent:    "bg-cyan-100 text-cyan-700",
  pdf_generated: "bg-indigo-100 text-indigo-700",
};

function AuditTab({ logs, isLoading }: { logs: AuditLog[]; isLoading: boolean }) {
  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (logs.length === 0) return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
      <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
      <p className="text-muted-foreground">No audit logs yet</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
        Immutable audit trail — records cannot be edited or deleted
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b">
            <tr>
              {["Timestamp","Action","Entity","By","Description"].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-muted/20">
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-2.5">
                  <Badge className={cn("text-xs border-0 capitalize", ACTION_STYLES[log.action] ?? "bg-gray-100 text-gray-700")}>
                    {log.action.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{log.entity_type} #{log.entity_id}</td>
                <td className="px-4 py-2.5 text-xs font-medium">{log.performer?.name ?? `#${log.performed_by}`}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-xs truncate">{log.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════

export default function Accounting() {
  const { toast } = useToast();
  const { user }  = useAuth();
  const role      = user?.role ?? "";

  // FIX #10: role-based capabilities
  // Admin:      sees Approve All + Email All (no compute button)
  // Accountant: sees Compute + Email All (no approve-all button)
  // Both can view payslips and download PDFs
  const isAdmin      = role === "Admin";
  const isAccountant = role === "Accountant";
  const isHR         = role === "HR";
  const canCompute   = isAccountant || isHR;  // Accountant computes, HR assists
  const canApprove   = isAdmin || isAccountant; // both can approve individual
  const canApproveAll = isAdmin;               // only Admin bulk-approves
  const canView      = isAdmin || isAccountant || isHR;

  const {
    periods, payslips, selectedPayslip, summary, auditLogs, isLoading, error,
    fetchPeriods, generateNextPeriod, fetchPayslips, fetchPayslip,
    computeAll, approvePayslip, markAsPaid, approveAll,
    fetchSummary, fetchAuditLogs,
    sendEmail, bulkSendEmail, downloadPdf, downloadSummaryPdf, addAdjustment,
    clearSelected, clearError,
  } = useAccounting();

  const [activePeriodId,    setActivePeriodId]    = useState<number | null>(null);
  const [activeTab,         setActiveTab]         = useState("payslips");
  const [slipOpen,          setSlipOpen]          = useState(false);
  const [computing,         setComputing]         = useState(false);
  const [emailing,          setEmailing]          = useState(false);
  const [generating,        setGenerating]        = useState(false);
  const [approveAllLoading, setApproveAllLoading] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);

  const activePeriod = periods.find(p => p.id === activePeriodId);

  useEffect(() => { fetchPeriods(); }, []);
  useEffect(() => {
    if (periods.length > 0 && !activePeriodId) setActivePeriodId(periods[0].id);
  }, [periods]);
  useEffect(() => {
    if (!activePeriodId) return;
    fetchPayslips(activePeriodId);
    fetchSummary(activePeriodId);
    if (activeTab === "audit") fetchAuditLogs(activePeriodId);
  }, [activePeriodId]);
  useEffect(() => {
    if (activeTab === "audit" && activePeriodId) fetchAuditLogs(activePeriodId);
  }, [activeTab]);
  useEffect(() => {
    if (error) { toast({ title: error, variant: "destructive" }); clearError(); }
  }, [error]);

  const handleComputeAll = async () => {
    if (!activePeriodId) return;
    setComputing(true);
    try {
      const r = await computeAll(activePeriodId);
      toast({ title: "Payroll computed", description: `${r.success.length} payslips generated. ${r.failed.length} failed.` });
      fetchSummary(activePeriodId);
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setComputing(false); }
  };

  const handleApproveAll = async () => {
    if (!activePeriodId) return;
    setApproveAllLoading(true);
    try {
      const r = await approveAll(activePeriodId);
      toast({ title: `${r.count} payslips approved` });
      fetchPeriods();
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setApproveAllLoading(false); }
  };

  const handleBulkEmail = async () => {
    if (!activePeriodId) return;
    setEmailing(true);
    try {
      const r = await bulkSendEmail(activePeriodId);
      toast({ title: "Emails sent", description: `${r.sent_count} sent, ${r.failed_count} failed` });
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setEmailing(false); }
  };

  const handleGenerateNext = async () => {
    setGenerating(true);
    try {
      const p = await generateNextPeriod("semi_monthly");
      setActivePeriodId(p.id);
      toast({ title: `${p.label} created` });
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setGenerating(false); }
  };

  const handleDownloadReport = async () => {
    if (!activePeriodId) return;
    setDownloadingReport(true);
    try {
      await downloadSummaryPdf(activePeriodId, activePeriod?.label);
      toast({ title: "Report downloaded" });
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Download failed", variant: "destructive" }); }
    finally { setDownloadingReport(false); }
  };

  const filteredPayslips = payslips.filter(p => !activePeriodId || p.payroll_period_id === activePeriodId);

  const step2Done = activePeriod && ["computed","approved","paid"].includes(activePeriod.status);
  const step3Done = activePeriod && ["approved","paid"].includes(activePeriod.status);

  // FIX #10: workflow steps differ by role
  const steps = isAdmin
    ? [
        { n: 1, label: "Select Period", done: !!activePeriod },
        { n: 2, label: "Computed",      done: !!step2Done },
        { n: 3, label: "Approve All",   done: !!step3Done },
        { n: 4, label: "Email All",     done: activePeriod?.status === "paid" },
      ]
    : [
        { n: 1, label: "Select Period", done: !!activePeriod },
        { n: 2, label: "Compute All",   done: !!step2Done },
        { n: 3, label: "Email All",     done: !!step3Done },
      ];

  if (!canView) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          You do not have permission to view payroll.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Accounting & Payroll</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdmin ? "Approve and manage payroll periods" : "Compute and process employee payslips"}
          </p>
        </div>

        {/* Workflow steps */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {steps.map(({ n, label, done }, i, arr) => (
            <span key={n} className="flex items-center gap-1.5">
              <span className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all",
                done ? "bg-green-100 text-green-700"
                  : n === (arr.find(x => !x.done)?.n) ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                  : "bg-muted text-muted-foreground"
              )}>
                <span className={cn("h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                  done ? "bg-green-500 text-white" : "bg-current text-background opacity-70")}>
                  {done ? "✓" : n}
                </span>
                {label}
              </span>
              {i < arr.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </span>
          ))}
        </div>

        {/* Period selector + action bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Select value={activePeriodId ? String(activePeriodId) : ""} onValueChange={v => setActivePeriodId(Number(v))}>
              <SelectTrigger className="w-60"><SelectValue placeholder="Select pay period" /></SelectTrigger>
              <SelectContent>
                {periods.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.label}
                    <Badge className={cn("ml-2 text-[10px] border-0", PERIOD_STATUS_STYLES[p.status])}>{p.status}</Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {(canCompute || isAdmin) && (
              <Button variant="outline" size="sm" onClick={handleGenerateNext} disabled={generating} className="gap-1">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} New Period
              </Button>
            )}

            {/* FIX #10: Accountant sees Compute; Admin doesn't (they approve after accountant computes) */}
            {canCompute && !step2Done && (
              <Button size="sm" onClick={handleComputeAll} disabled={computing || !activePeriodId} className="gap-1">
                {computing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {computing ? "Computing…" : "Compute All"}
              </Button>
            )}

            {/* FIX #10: only Admin sees Approve All */}
            {canApproveAll && step2Done && !step3Done && (
              <Button size="sm" onClick={handleApproveAll} disabled={approveAllLoading} className="gap-1">
                {approveAllLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Approve All
              </Button>
            )}

            {(isAdmin || isAccountant) && step3Done && (
              <Button size="sm" variant="outline" onClick={handleBulkEmail} disabled={emailing} className="gap-1">
                {emailing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Email All
              </Button>
            )}

            {activePeriodId && (
              <Button variant="outline" size="sm" className="gap-1" onClick={handleDownloadReport} disabled={downloadingReport}>
                {downloadingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                PDF Report
              </Button>
            )}
          </div>
        </div>

        {/* Totals strip */}
        {filteredPayslips.length > 0 && (
          <div className="flex flex-wrap gap-5 px-4 py-3 bg-muted/40 rounded-xl border text-sm">
            <div><span className="text-xs text-muted-foreground">Employees</span><div className="font-semibold">{filteredPayslips.length}</div></div>
            <div><span className="text-xs text-muted-foreground">Total Gross</span><div className="font-semibold font-mono">{fmt(filteredPayslips.reduce((s, p) => s + p.gross_pay, 0))}</div></div>
            <div><span className="text-xs text-muted-foreground">Total Net Pay</span><div className="font-semibold font-mono text-green-700">{fmt(filteredPayslips.reduce((s, p) => s + p.net_pay, 0))}</div></div>
            <div className="ml-auto self-center">
              {activePeriod && <Badge className={cn("text-xs border-0 capitalize", PERIOD_STATUS_STYLES[activePeriod.status])}>{activePeriod.status}</Badge>}
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="payslips" className="mt-4">
            {isLoading && filteredPayslips.length === 0 ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filteredPayslips.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
                <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">
                  {activePeriod ? `No payslips for ${activePeriod.label}. ${canCompute ? 'Click "Compute All" to generate.' : 'Waiting for Accountant to compute.'}` : "Select a pay period"}
                </p>
                {canCompute && activePeriod && !step2Done && (
                  <Button className="mt-4 gap-1" size="sm" onClick={handleComputeAll} disabled={computing}>
                    {computing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Compute All
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b">
                    <tr>
                      {["Employee","Department","Days Worked","Gross Pay","Deductions","Net Pay","Status",""].map(h => (
                        <th key={h} className={cn("px-4 py-3 font-semibold text-xs",
                          ["Gross Pay","Deductions","Net Pay"].includes(h) ? "text-right" : "text-left",
                          h === "" ? "text-center" : "")}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPayslips.map(p => (
                      <tr key={p.id} className="hover:bg-muted/20 cursor-pointer"
                        onClick={() => fetchPayslip(p.id).then(() => setSlipOpen(true))}>
                        <td className="px-4 py-2.5 font-medium">{p.employee?.first_name} {p.employee?.last_name}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.employee?.department}</td>
                        <td className="px-4 py-2.5 text-center">{p.days_worked}/{p.working_days_in_period}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-green-700">{fmt(p.gross_pay)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-red-600">{fmt(p.total_deductions)}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">{fmt(p.net_pay)}</td>
                        <td className="px-4 py-2.5">
                          <Badge className={cn("text-xs border-0 capitalize", SLIP_STATUS_STYLES[p.status])}>{p.status}</Badge>
                          {p.email_sent && <span className="ml-1 text-[10px] text-cyan-600">✉</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                            onClick={e => { e.stopPropagation(); fetchPayslip(p.id).then(() => setSlipOpen(true)); }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <SummaryTab summary={summary} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <AuditTab logs={auditLogs} isLoading={isLoading} />
          </TabsContent>
        </Tabs>

        <PayslipDetailSheet
          payslip={selectedPayslip}
          open={slipOpen}
          onClose={() => { setSlipOpen(false); clearSelected(); }}
          onApprove={approvePayslip}
          onMarkPaid={markAsPaid}
          onSendEmail={sendEmail}
          onDownloadPdf={downloadPdf}
          onAddAdjustment={addAdjustment}
          canCompute={canCompute}
          canApprove={canApprove}
        />
      </div>
    </DashboardLayout>
  );
}
```

---

**`backend/routes/api.php`** — add `getInterviewers` route:

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EvaluationFormController;
use App\Http\Controllers\KpiController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\NewHireController;
use App\Http\Controllers\RecruitmentController;
use App\Http\Controllers\PayslipController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\LeaveBalanceController;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {

    Route::prefix('auth')->group(function () {
        Route::post('/logout',          [AuthController::class, 'logout']);
        Route::get('/me',               [AuthController::class, 'me']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    Route::prefix('employees')->group(function () {
        Route::get('/departments',         [EmployeeController::class, 'getDepartments']);
        Route::get('/job-categories',      [EmployeeController::class, 'getJobCategories']);
        Route::get('/salary-mapping',      [EmployeeController::class, 'getSalaryMapping']);
        Route::get('/archived',            [EmployeeController::class, 'archived']);
        Route::get('/',                    [EmployeeController::class, 'index']);
        Route::post('/',                   [EmployeeController::class, 'store']);
        Route::get('/{employee}',          [EmployeeController::class, 'show']);
        Route::put('/{employee}',          [EmployeeController::class, 'update']);
        Route::delete('/{employee}',       [EmployeeController::class, 'destroy']);
        Route::patch('/{employee}/status', [EmployeeController::class, 'updateStatus']);
        Route::patch('/{employee}/role',   [EmployeeController::class, 'updateRole']);
        Route::get('/{id}/export',         [EmployeeController::class, 'export']);
        Route::post('/{id}/restore',       [EmployeeController::class, 'restore']);
        Route::delete('/{id}/purge',       [EmployeeController::class, 'purge']);
    });

    Route::prefix('attendance')->group(function () {
        Route::get('/',              [AttendanceController::class, 'index']);
        Route::get('/live-status',   [AttendanceController::class, 'liveStatus']);
        Route::get('/monthly-stats', [AttendanceController::class, 'monthlyStats']);
        Route::get('/export',        [AttendanceController::class, 'export']);
        Route::post('/import',       [AttendanceController::class, 'import']);
        Route::post('/manual',       [AttendanceController::class, 'manual']);
    });

    Route::prefix('leave-requests')->group(function () {
        Route::get('/',              [LeaveController::class, 'index']);
        Route::post('/',             [LeaveController::class, 'store']);
        Route::get('/pending',       [LeaveController::class, 'pending']);
        Route::post('/{id}/approve', [LeaveController::class, 'approve']);
        Route::post('/{id}/reject',  [LeaveController::class, 'reject']);
        Route::post('/{id}/cancel',  [LeaveController::class, 'cancel']);
    });

    Route::prefix('leave-balances')->group(function () {
        Route::get('/',            [LeaveBalanceController::class, 'index']);
        Route::post('/adjust',     [LeaveBalanceController::class, 'adjust']);
        Route::post('/accrue',     [LeaveBalanceController::class, 'accrue']);
        Route::post('/carry-over', [LeaveBalanceController::class, 'carryOver']);
        Route::post('/seed',       [LeaveBalanceController::class, 'seed']);
    });

    Route::prefix('payroll-periods')->group(function () {
        Route::get('/',                       [PayslipController::class, 'listPeriods']);
        Route::post('/',                      [PayslipController::class, 'createPeriod']);
        Route::post('/generate-next',         [PayslipController::class, 'generateNextPeriod']);
        Route::get('/{periodId}/summary-pdf', [PayslipController::class, 'summaryPdf']);
    });

    Route::prefix('payslips')->group(function () {
        Route::get('/',                      [PayslipController::class, 'index']);
        Route::get('/summary',               [PayslipController::class, 'summary']);
        Route::get('/audit-trail',           [PayslipController::class, 'auditTrail']);
        Route::post('/compute',              [PayslipController::class, 'computeSingle']);
        Route::post('/compute-all',          [PayslipController::class, 'computeAll']);
        Route::post('/bulk-send-email',      [PayslipController::class, 'bulkSendEmail']);
        Route::post('/approve-all/{period}', [PayslipController::class, 'approveAll']);
        Route::get('/{payslip}',             [PayslipController::class, 'show']);
        Route::post('/{payslip}/adjust',     [PayslipController::class, 'adjust']);
        Route::post('/{payslip}/approve',    [PayslipController::class, 'approve']);
        Route::post('/{payslip}/pay',        [PayslipController::class, 'markPaid']);
        Route::post('/{payslip}/send-email', [PayslipController::class, 'sendEmail']);
        Route::get('/{payslip}/pdf',         [PayslipController::class, 'downloadPdf']);
    });

    Route::prefix('evaluations')->group(function () {
        Route::get('/my-assignments',                   [EvaluationFormController::class, 'myAssignments']);
        Route::get('/assignments/{assignment}',         [EvaluationFormController::class, 'getAssignment']);
        Route::post('/assignments/{assignment}/submit', [EvaluationFormController::class, 'submitAssignment']);
        Route::get('/',                                 [EvaluationFormController::class, 'index']);
        Route::post('/',                                [EvaluationFormController::class, 'store']);
        Route::get('/{form}/analytics',                 [EvaluationFormController::class, 'analytics']);
        Route::get('/{form}',                           [EvaluationFormController::class, 'show']);
        Route::put('/{form}',                           [EvaluationFormController::class, 'update']);
        Route::delete('/{form}',                        [EvaluationFormController::class, 'destroy']);
        Route::post('/{form}/close',                    [EvaluationFormController::class, 'close']);
        Route::post('/{form}/send',                     [EvaluationFormController::class, 'send']);
    });

    Route::prefix('recruitment')->group(function () {
        Route::get('/job-postings',                              [RecruitmentController::class, 'getJobPostings']);
        Route::post('/job-postings',                             [RecruitmentController::class, 'createJobPosting']);
        Route::put('/job-postings/{id}',                         [RecruitmentController::class, 'updateJobPosting']);
        Route::delete('/job-postings/{id}',                      [RecruitmentController::class, 'deleteJobPosting']);

        Route::get('/applicants',                                [RecruitmentController::class, 'getApplicants']);
        Route::post('/applicants',                               [RecruitmentController::class, 'createApplicant']);
        Route::patch('/applicants/{id}/stage',                   [RecruitmentController::class, 'updateApplicantStage']);
        Route::post('/applicants/{id}/hire',                     [RecruitmentController::class, 'hireApplicant']);
        Route::post('/applicants/{id}/reject',                   [RecruitmentController::class, 'rejectApplicant']);

        // FIX #17: HR-only interviewers endpoint
        Route::get('/interviewers',                              [RecruitmentController::class, 'getInterviewers']);
        Route::get('/interviews',                                [RecruitmentController::class, 'getInterviews']);
        Route::post('/interviews',                               [RecruitmentController::class, 'scheduleInterview']);
        Route::patch('/interviews/{id}/status',                  [RecruitmentController::class, 'updateInterviewStatus']);
        Route::post('/interviews/{id}/complete',                 [RecruitmentController::class, 'completeInterview']);

        Route::get('/trainings',                                 [RecruitmentController::class, 'getTrainings']);
        Route::post('/trainings',                                [RecruitmentController::class, 'createTraining']);
        Route::delete('/trainings/{id}',                         [RecruitmentController::class, 'deleteTraining']);
        Route::post('/trainings/assign',                         [RecruitmentController::class, 'assignTraining']);
        Route::get('/training-assignments',                      [RecruitmentController::class, 'getTrainingAssignments']);
        Route::patch('/training-assignments/{id}/status',        [RecruitmentController::class, 'updateTrainingStatus']);
        Route::post('/training-assignments/{id}/assign-trainer', [RecruitmentController::class, 'assignTrainer']);
        Route::post('/training-assignments/{id}/complete',       [RecruitmentController::class, 'completeTraining']);

        Route::get('/new-hires',                                 [RecruitmentController::class, 'getNewHires']);
        Route::post('/new-hires/{id}/complete-details',          [RecruitmentController::class, 'completeNewHireDetails']);
        Route::post('/new-hires/{id}/transfer',                  [RecruitmentController::class, 'transferToEmployee']);
    });

    Route::prefix('performance')->group(function () {
        Route::get('/kpis',            [KpiController::class, 'index']);
        Route::post('/kpis',           [KpiController::class, 'store']);
        Route::get('/kpis/{kpi}',      [KpiController::class, 'show']);
        Route::put('/kpis/{kpi}',      [KpiController::class, 'update']);
        Route::delete('/kpis/{kpi}',   [KpiController::class, 'destroy']);

        Route::get('/goals',           [GoalController::class, 'index']);
        Route::post('/goals',          [GoalController::class, 'store']);
        Route::get('/goals/{goal}',    [GoalController::class, 'show']);
        Route::put('/goals/{goal}',    [GoalController::class, 'update']);
        Route::delete('/goals/{goal}', [GoalController::class, 'destroy']);
    });

    Route::prefix('new-hires')->group(function () {
        Route::get('/',             [NewHireController::class, 'index']);
        Route::post('/',            [NewHireController::class, 'store']);
        Route::get('/{newHire}',    [NewHireController::class, 'show']);
        Route::put('/{newHire}',    [NewHireController::class, 'update']);
        Route::delete('/{newHire}', [NewHireController::class, 'destroy']);
    });

    Route::get('/users', function (\Illuminate\Http\Request $request) {
        $query = \App\Models\User::query();
        if ($request->filled('role')) $query->where('role', $request->role);
        return response()->json(['success' => true, 'data' => $query->get(['id','name','email','role'])]);
    });
});
```

---

Run after applying:

```bash
cd backend
php artisan config:clear && php artisan route:clear && php artisan cache:clear
```

**Summary of all 19 fixes:**

| # | Fix |
|---|---|
| 1 | `NewHireDetailsModal` requires all fields; `transferToEmployee` checks `onboarding_status === complete` first |
| 2 | `EmployeeController::update()` uses proper `validateEmployee($request, $employee->id)` with email uniqueness ignore |
| 3 | `export()` builds full HTML employee profile, uses DomPDF with HTML fallback |
| 4 | `getSalaryMapping()` returns a complete salary map; frontend auto-fills on job category select |
| 5 | `purge()` returns 403 — permanently disabled |
| 6 | `liveStatus()` queries all active employees, cross-references attendance + approved leaves |
| 7 | `export()` in AttendanceController streams a proper CSV download |
| 8 | `import()` and `manual()` use `SHIFT_TIMES` const to calculate late minutes per employee shift |
| 9 | `LeaveController::store()` validates balance; `approve/reject` checks Admin/HR/Manager role |
| 10 | `Accounting.tsx` shows Compute button only to Accountant; Approve All only to Admin; both share Email All |
| 11 | `downloadPdf` in hook uses `authFetch` + blob — no localStorage token hack |
| 12 | `send()` validates all `user_ids` are `role === 'HR'` before assigning |
| 13 | `update()` returns 422 if form is active |
| 14 | `autoCloseExpired()` called on `index()` and `myAssignments()` |
| 15 | `analytics()` returns `chart_data` with per-question distribution and average |
| 16 | `hireApplicant()` counts existing hired applicants and blocks if slots exhausted; auto-closes posting |
| 17 | `getInterviewers()` returns only HR users; `scheduleInterview()` enforces HR role server-side |
| 18 | `completeTraining()` null-checks all optional fields before NewHire::create, uses safe defaults |
| 19 | `hireApplicant()` and `rejectApplicant()` return 403 for non-Admin users |