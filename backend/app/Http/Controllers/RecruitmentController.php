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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;

class RecruitmentController extends Controller
{
    // ==================== JOB POSTINGS ====================
    
    public function getJobPostings(): JsonResponse
    {
        $postings = JobPosting::with(['creator', 'applicants'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Add applicant count to each job
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

    public function updateApplicantStage(Request $request, int $id): JsonResponse
{
    $validated = $request->validate([
        'pipeline_stage' => 'required|in:applied,reviewed,interview_scheduled,interviewed,hired,rejected',
    ]);
    
    $applicant = Applicant::findOrFail($id);
    $applicant->update($validated);
    
    return response()->json(['success' => true, 'data' => $applicant]);
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
            'phone' => 'required|string',
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
            'phone' => $validated['phone'],
            'job_posting_id' => $validated['job_posting_id'],
            'resume_path' => $resumePath,
            'pipeline_stage' => 'applied'
        ]);
        
        return response()->json(['success' => true, 'data' => $applicant]);
    }
    
    public function hireApplicant(int $id): JsonResponse
    {
        $applicant = Applicant::findOrFail($id);
        
        DB::beginTransaction();
        
        try {
            $applicant->update([
                'pipeline_stage' => 'hired',
                'hired_at' => now()
            ]);
            
            // Auto-create training
            $training = Training::create([
                'title' => "Onboarding: {$applicant->jobPosting->title}",
                'description' => "Training for {$applicant->first_name} {$applicant->last_name}\nPosition: {$applicant->jobPosting->title}\nDepartment: {$applicant->jobPosting->department}",
                'applicant_id' => $applicant->id,
                'created_by' => Auth::id(),
            ]);
            
            TrainingAssignment::create([
                'training_id' => $training->id,
                'applicant_id' => $applicant->id,
                'status' => 'pending'
            ]);
            
            DB::commit();
            
            return response()->json(['success' => true, 'data' => $applicant]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
    public function rejectApplicant(int $id): JsonResponse
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
        $assignments = TrainingAssignment::with(['training', 'applicant', 'trainer'])
            ->get();
        return response()->json(['success' => true, 'data' => $assignments]);
    }
    
    public function assignTrainer(Request $request, int $assignmentId): JsonResponse
    {
        $validated = $request->validate([
            'trainer_id' => 'required|exists:employees,id',
        ]);
        
        $assignment = TrainingAssignment::findOrFail($assignmentId);
        $trainer = Employee::find($validated['trainer_id']);
        $applicant = Applicant::find($assignment->applicant_id);
        
        // Verify trainer is from same department
        if ($trainer->department !== $applicant->jobPosting->department) {
            return response()->json([
                'success' => false,
                'message' => 'Trainer must be from the same department'
            ], 422);
        }
        
        $assignment->update([
            'trainer_id' => $validated['trainer_id'],
            'status' => 'in_progress'
        ]);
        
        return response()->json(['success' => true]);
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
            
            // Create new hire record
            $applicant = $assignment->applicant;
            NewHire::create([
                'first_name' => $applicant->first_name,
                'last_name' => $applicant->last_name,
                'email' => $applicant->email,
                'phone' => $applicant->phone,
                'department' => $applicant->jobPosting->department,
                'job_category' => $applicant->jobPosting->job_category,
                'start_date' => now()->addDays(7),
                'applicant_id' => $applicant->id,
                'training_id' => $assignment->training_id,
                'status' => 'pending'
            ]);
            
            DB::commit();
            
            return response()->json(['success' => true]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
    // ==================== NEW HIRES ====================
    
    public function getNewHires(): JsonResponse
    {
        $newHires = NewHire::with(['applicant', 'applicant.jobPosting', 'training'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['success' => true, 'data' => $newHires]);
    }
    
    public function transferToEmployee(int $newHireId): JsonResponse
    {
        $newHire = NewHire::findOrFail($newHireId);
        
        DB::beginTransaction();
        
        try {
            // Create employee
            $employee = Employee::create([
                'first_name' => $newHire->first_name,
                'last_name' => $newHire->last_name,
                'email' => $newHire->email,
                'phone_number' => $newHire->phone,
                'department' => $newHire->department,
                'job_category' => $newHire->job_category,
                'start_date' => $newHire->start_date,
                'status' => 'active',
                'employment_type' => 'regular',
                'basic_salary' => $newHire->offered_salary ?? 25000,
            ]);
            
            // Create user account
            User::create([
                'name' => $newHire->first_name . ' ' . $newHire->last_name,
                'email' => $newHire->email,
                'password' => Hash::make('Employee@123'),
                'role' => 'Employee',
            ]);
            
            $newHire->update([
                'status' => 'transferred',
                'employee_id' => $employee->id
            ]);
            
            DB::commit();
            
            return response()->json(['success' => true, 'data' => $employee]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}