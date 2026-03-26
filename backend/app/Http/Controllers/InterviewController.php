<?php

namespace App\Http\Controllers;

use App\Models\Interview;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class InterviewController extends Controller
{
    /**
     * Push interview to new hire.
     * POST /api/interviews/{id}/push-to-new-hire
     */
    public function pushToNewHire(int $id): JsonResponse
    {
        $interview = Interview::with(['applicant.jobPosting'])->findOrFail($id);
 
    if ($interview->result !== 'passed') {
        return response()->json(['message' => 'Interview must be marked as passed first.'], 422);
    }
 
    $applicant = $interview->applicant;
    $job       = $applicant?->jobPosting;
 
    if (!$applicant) {
        return response()->json(['message' => 'Applicant not found.'], 404);
    }
 
    // Check if new hire already exists for this applicant
    $existing = \App\Models\NewHire::where('email', $applicant->email)->first();
    if ($existing) {
        return response()->json([
            'message'     => 'A new hire record already exists for this applicant.',
            'new_hire_id' => $existing->id,
        ], 422);
    }
 
    $newHire = \App\Models\NewHire::create([
        'first_name'      => $applicant->first_name,
        'last_name'       => $applicant->last_name,
        'email'           => $applicant->email,
        'phone_number'    => $applicant->phone,
        'home_address'    => $applicant->address,
        'department'      => $job?->department,
        'employment_type' => $job?->employment_type ?? 'probationary',
        'basic_salary'    => $job?->salary_max ?? $job?->salary_min ?? 0,
        'status'          => 'pending',
        'source'          => 'recruitment',
        'job_posting_id'  => $job?->id,
        'created_by'      => Auth::id(),
    ]);
 
    // Update applicant status to hired
    $applicant->update(['status' => 'hired']);
 
    \App\Models\PayrollAuditLog::create([
        'action'      => 'interview_to_new_hire',
        'entity_type' => 'NewHire',
        'entity_id'   => $newHire->id,
        'user_id'     => Auth::id(),
        'description' => "Applicant {$applicant->first_name} {$applicant->last_name} pushed to New Hire from interview #{$id}",
    ]);
 
    return response()->json([
        'message'     => 'Added to new hire queue.',
        'new_hire_id' => $newHire->id,
    ], 201);
    }
}
