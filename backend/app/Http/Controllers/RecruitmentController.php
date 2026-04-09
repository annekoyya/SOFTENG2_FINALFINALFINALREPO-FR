<?php
// app/Http/Controllers/RecruitmentController.php

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
use Illuminate\Support\Facades\Schema;

class RecruitmentController extends Controller
{
    // ==================== JOB POSTINGS ====================
    
    public function getJobPostings(): JsonResponse
    {
        $postings = JobPosting::with(['creator', 'applicants'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        foreach ($postings as $posting) {
            $posting->applicants_count = $posting->applicants->count();
            $posting->hired_count = $posting->applicants->where('pipeline_stage', 'hired')->count();
        }
        
        return response()->json(['success' => true, 'data' => $postings]);
    }
    
    public function createJobPosting(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'job_category' => 'required|string|max:255',
            'description' => 'required|string',
            'slots' => 'required|integer|min:1',
            'posted_date' => 'nullable|date',
            'deadline' => 'nullable|date|after:posted_date',
        ]);
        
        $posting = JobPosting::create([
            ...$validated,
            'created_by' => Auth::id(),
            'status' => 'open'
        ]);
        
        return response()->json(['success' => true, 'data' => $posting]);
    }
    
    public function updateJobPosting(Request $request, int $id): JsonResponse
    {
        $posting = JobPosting::findOrFail($id);
        $posting->update($request->all());
        return response()->json(['success' => true, 'data' => $posting]);
    }
    
    public function deleteJobPosting(int $id): JsonResponse
    {
        $posting = JobPosting::findOrFail($id);
        $posting->delete();
        return response()->json(['success' => true]);
    }
    
    // ==================== APPLICANTS ====================
    
    public function getApplicants(Request $request): JsonResponse
    {
        $query = Applicant::with(['jobPosting', 'interview']);
        
        if ($request->filled('job_posting_id')) {
            $query->where('job_posting_id', $request->job_posting_id);
        }
        
        if ($request->filled('pipeline_stage')) {
            $query->where('pipeline_stage', $request->pipeline_stage);
        }
        
        $applicants = $query->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $applicants]);
    }
    
    public function createApplicant(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:applicants,email',
            'phone' => 'nullable|string|max:20',
            'job_posting_id' => 'required|exists:job_postings,id',
            'resume' => 'nullable|file|mimes:pdf,doc,docx|max:2048'
        ]);
        
        $resumePath = null;
        if ($request->hasFile('resume')) {
            $resumePath = $request->file('resume')->store('resumes', 'public');
        }
        
        $applicant = Applicant::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'job_posting_id' => $validated['job_posting_id'],
            'resume_path' => $resumePath,
            'pipeline_stage' => 'applied'
        ]);
        
        return response()->json(['success' => true, 'data' => $applicant], 201);
    }
    
    public function updateApplicantStage(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'pipeline_stage' => 'required|in:applied,reviewed,interview_scheduled,interviewed,hired,rejected',
        ]);
        
        $applicant = Applicant::findOrFail($id);
        $applicant->update($validated);
        
        return response()->json(['success' => true, 'data' => $applicant]);
    }
    
    // ==================== HIRE / REJECT ====================
    
public function hireApplicant(int $id): JsonResponse
{
    $applicant = Applicant::findOrFail($id);
    
    DB::beginTransaction();
    
    try {
        // Update applicant stage
        $applicant->update([
            'pipeline_stage' => 'hired',
            'hired_at' => now()
        ]);
        
        // Create employee record
        $employee = Employee::create([
            'first_name' => $applicant->first_name,
            'last_name' => $applicant->last_name,
            'email' => $applicant->email,
            'phone_number' => $applicant->phone ?? 'N/A',
            'department' => $applicant->jobPosting->department,
            'job_category' => $applicant->jobPosting->job_category,
            'start_date' => now()->addDays(7)->toDateString(),
            'date_of_birth' => '1990-01-01',
            'home_address' => 'To be updated',
            'emergency_contact_name' => 'To be updated',
            'emergency_contact_number' => 'To be updated',
            'relationship' => 'To be updated',
            'status' => 'onboarding',
            'employment_type' => 'probationary',
            'basic_salary' => 25000,
            'role' => 'Employee',
            'middle_name' => null,
            'name_extension' => null,
            'tin' => null,
            'sss_number' => null,
            'pagibig_number' => null,
            'philhealth_number' => null,
            'bank_name' => null,
            'account_name' => null,
            'account_number' => null,
            'end_date' => null,
            'reporting_manager' => null,
            'photo_path' => null,
            'shift_sched' => 'morning',
        ]);
        
        // Create training record with applicant_id
        $training = Training::create([
            'title' => "Onboarding: {$applicant->jobPosting->title}",
            'description' => "Training for {$applicant->first_name} {$applicant->last_name}",
            'applicant_id' => $applicant->id,  // ✅ Add this
            'created_by' => Auth::id(),
        ]);
        
        // Create training assignment with applicant_id
        TrainingAssignment::create([
            'training_id' => $training->id,
            'applicant_id' => $applicant->id,  // ✅ Add this
            'employee_id' => $employee->id,
            'status' => 'pending'
        ]);
        
        DB::commit();
        
        return response()->json([
            'success' => true, 
            'data' => $applicant,
            'message' => 'Applicant hired! Training created.'
        ]);
        
    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}    public function rejectApplicant(int $id): JsonResponse
    {
        $applicant = Applicant::findOrFail($id);
        $applicant->update(['pipeline_stage' => 'rejected']);
        return response()->json(['success' => true]);
    }
    
    // ==================== INTERVIEWS ====================
    
    public function getInterviews(): JsonResponse
    {
        $interviews = Interview::with(['applicant', 'applicant.jobPosting', 'interviewer'])
            ->orderBy('scheduled_at', 'desc')
            ->get();
        return response()->json(['success' => true, 'data' => $interviews]);
    }
    
    public function scheduleInterview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'applicant_id' => 'required|exists:applicants,id',
            'interviewer_id' => 'required|exists:users,id',
            'scheduled_at' => 'required|date',
        ]);
        
        DB::beginTransaction();
        
        try {
            $interview = Interview::create([
                ...$validated,
                'status' => 'scheduled'
            ]);
            
            Applicant::find($validated['applicant_id'])->update(['pipeline_stage' => 'interview_scheduled']);
            
            DB::commit();
            
            return response()->json(['success' => true, 'data' => $interview]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
    public function completeInterview(int $id): JsonResponse
    {
        $interview = Interview::findOrFail($id);
        
        DB::beginTransaction();
        
        try {
            $interview->update(['status' => 'completed']);
            $interview->applicant->update(['pipeline_stage' => 'interviewed']);
            
            DB::commit();
            
            return response()->json(['success' => true]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
    // ==================== TRAININGS ====================
    
    public function getTrainings(): JsonResponse
    {
        $trainings = Training::with(['applicant', 'applicant.jobPosting', 'assignments', 'assignments.trainer'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['success' => true, 'data' => $trainings]);
    }
    
    public function getTrainingAssignments(): JsonResponse
    {
        $assignments = TrainingAssignment::with(['training', 'employee', 'trainer'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['success' => true, 'data' => $assignments]);
    }
    
    public function assignTrainer(Request $request, int $assignmentId): JsonResponse
    {
        $validated = $request->validate([
            'trainer_id' => 'required|exists:employees,id',
        ]);
        
        $assignment = TrainingAssignment::findOrFail($assignmentId);
        
        $assignment->update([
            'trainer_id' => $validated['trainer_id'],
            'status' => 'in_progress'
        ]);
        
        return response()->json(['success' => true, 'data' => $assignment]);
    }
    
    public function completeTraining(int $assignmentId): JsonResponse
    {
        $assignment = TrainingAssignment::findOrFail($assignmentId);
        
        DB::beginTransaction();
        
        try {
            $assignment->update([
                'status' => 'completed',
                'completed_at' => now()
            ]);
            
            $employee = Employee::find($assignment->employee_id);
            
            if ($employee) {
                $employee->update(['status' => 'active']);
                
                NewHire::create([
                    'first_name' => $employee->first_name,
                    'last_name' => $employee->last_name,
                    'email' => $employee->email,
                    'phone_number' => $employee->phone_number,
                    'department' => $employee->department,
                    'job_category' => $employee->job_category,
                    'start_date' => $employee->start_date,
                    'employee_id' => $employee->id,
                    'training_id' => $assignment->training_id,
                    'onboarding_status' => 'pending',
                    'created_by' => Auth::id(),
                    'basic_salary' => $employee->basic_salary,
                    'employment_type' => $employee->employment_type,
                    'role' => $employee->role,
                ]);
            }
            
            DB::commit();
            
            return response()->json(['success' => true, 'message' => 'Training completed!']);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
    // ==================== NEW HIRES ====================
    
    public function getNewHires(): JsonResponse
    {
        $newHires = NewHire::with(['applicant', 'applicant.jobPosting', 'training', 'employee'])
            ->where('onboarding_status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['success' => true, 'data' => $newHires]);
    }
    
    public function transferToEmployee(int $newHireId): JsonResponse
    {
        $newHire = NewHire::findOrFail($newHireId);
        
        DB::beginTransaction();
        
        try {
            $employee = Employee::find($newHire->employee_id);
            
            if (!$employee) {
                return response()->json(['success' => false, 'message' => 'Employee not found'], 404);
            }
            
            // Create user account
            User::create([
                'name' => $employee->first_name . ' ' . $employee->last_name,
                'email' => $employee->email,
                'password' => Hash::make('Employee@123'),
                'role' => $employee->role,
            ]);
            
            $newHire->update([
                'onboarding_status' => 'transferred',
                'transferred_at' => now(),
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true, 
                'data' => $employee,
                'message' => 'Successfully transferred!'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function completeNewHireDetails(Request $request, int $id): JsonResponse
{
    $newHire = NewHire::findOrFail($id);
    
    $validated = $request->validate([
        'first_name' => 'required|string',
        'last_name' => 'required|string',
        'email' => 'required|email',
        'phone_number' => 'required|string',
        'date_of_birth' => 'required|date',
        'home_address' => 'required|string',
        'emergency_contact_name' => 'required|string',
        'emergency_contact_number' => 'required|string',
        'relationship' => 'required|string',
        'department' => 'required|string',
        'job_category' => 'required|string',
        'shift_sched' => 'required|string',
        'employment_type' => 'required|string',
        'basic_salary' => 'required|numeric',
    ]);
    
    DB::beginTransaction();
    
    try {
        // Update new hire with completed details
        $newHire->update([
            ...$validated,
            'onboarding_status' => 'complete',
            'completed_fields' => json_encode(array_keys($validated)),
        ]);
        
        // Update the associated employee record
        $employee = Employee::find($newHire->employee_id);
        if ($employee) {
            $employee->update([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone_number' => $validated['phone_number'],
                'date_of_birth' => $validated['date_of_birth'],
                'home_address' => $validated['home_address'],
                'emergency_contact_name' => $validated['emergency_contact_name'],
                'emergency_contact_number' => $validated['emergency_contact_number'],
                'relationship' => $validated['relationship'],
                'department' => $validated['department'],
                'job_category' => $validated['job_category'],
                'shift_sched' => $validated['shift_sched'],
                'employment_type' => $validated['employment_type'],
                'basic_salary' => $validated['basic_salary'],
                'status' => 'active',
            ]);
        }
        
        // Create user account
        $user = User::create([
            'name' => $validated['first_name'] . ' ' . $validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make('Employee@123'),
            'role' => 'Employee',
        ]);
        
        DB::commit();
        
        return response()->json([
            'success' => true,
            'message' => 'Employee details completed and transferred!'
        ]);
        
    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}
}