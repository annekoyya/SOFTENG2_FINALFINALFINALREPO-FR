<?php
namespace App\Http\Controllers;
 
use App\Models\TrainingCourse;
use App\Models\TrainingAssignment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
 
class TrainingController extends Controller
{
    // GET /api/training-courses
    public function courses(): JsonResponse
    {
        return response()->json(TrainingCourse::latest()->get());
    }
 
    // POST /api/training-courses
    public function storeCourse(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'           => 'required|string|max:200',
            'category'        => 'required|string|max:100',
            'description'     => 'nullable|string',
            'duration_hours'  => 'required|numeric|min:0.5',
            'validity_months' => 'nullable|integer|min:1',
            'is_mandatory'    => 'boolean',
        ]);
        return response()->json(TrainingCourse::create($data), 201);
    }
 
    // GET /api/training-assignments
    public function assignments(Request $request): JsonResponse
    {
        // Auto-expire assignments past their expiry date
        TrainingAssignment::where('status', 'completed')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now()->toDateString())
            ->update(['status' => 'expired']);
 
        $q = TrainingAssignment::with([
            'employee:id,first_name,last_name,department',
            'course:id,title,validity_months',
        ]);
 
        if ($request->employee_id) $q->where('employee_id', $request->employee_id);
        if ($request->status)      $q->where('status', $request->status);
 
        return response()->json(
            $q->latest()->get()->map(fn ($a) => [
                'id'             => $a->id,
                'employee_id'    => $a->employee_id,
                'employee_name'  => $a->employee ? trim("{$a->employee->first_name} {$a->employee->last_name}") : '—',
                'department'     => $a->employee?->department ?? '—',
                'course_id'      => $a->course_id,
                'course_title'   => $a->course?->title,
                'status'         => $a->status,
                'assigned_date'  => $a->assigned_date?->toDateString(),
                'due_date'       => $a->due_date?->toDateString(),
                'completed_date' => $a->completed_date?->toDateString(),
                'expires_at'     => $a->expires_at?->toDateString(),
                'score'          => $a->score,
                'notes'          => $a->notes,
            ])
        );
    }
 
    // POST /api/training-assignments
    public function assign(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'course_id'   => 'required|exists:training_courses,id',
            'due_date'    => 'nullable|date',
        ]);
 
        $assignment = TrainingAssignment::create([
            ...$data,
            'status'        => 'assigned',
            'assigned_date' => now()->toDateString(),
            'assigned_by'   => Auth::id(),
        ]);
 
        return response()->json($assignment, 201);
    }
 
    // POST /api/training-assignments/{id}/complete
    public function complete(int $id): JsonResponse
    {
        $assignment = TrainingAssignment::with('course')->findOrFail($id);
 
        $completedDate = now()->toDateString();
        $expiresAt     = null;
 
        if ($assignment->course?->validity_months) {
            $expiresAt = Carbon::now()
                ->addMonths($assignment->course->validity_months)
                ->toDateString();
        }
 
        $assignment->update([
            'status'         => 'completed',
            'completed_date' => $completedDate,
            'expires_at'     => $expiresAt,
        ]);
 
        return response()->json(['message' => 'Marked as completed.', 'expires_at' => $expiresAt]);
    }
}
 