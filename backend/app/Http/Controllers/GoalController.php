<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class GoalController extends Controller
{
    /**
     * List goals with filters.
     * GET /api/performance/goals
     */
    public function index(Request $request): JsonResponse
    {
        $query = Goal::with(['employee', 'setter'])->latest();

        if ($request->filled('employee_id')) {
            $query->forEmployee((int) $request->query('employee_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->query('priority'));
        }

        if ($request->boolean('overdue')) {
            $query->overdue();
        }

        $goals = $query->paginate(20);

        return $this->success($goals);
    }

    /**
     * Show a single goal.
     * GET /api/performance/goals/{goal}
     */
    public function show(Goal $goal): JsonResponse
    {
        return $this->success($goal->load(['employee', 'setter', 'evaluation']));
    }

    /**
     * Create a new goal. Manager/Admin only.
     * POST /api/performance/goals
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id'   => 'required|exists:employees,id',
            'title'         => 'required|string|max:200',
            'description'   => 'nullable|string|max:1000',
            'due_date'      => 'required|date',
            'priority'      => 'required|in:low,medium,high,critical',
            'category'      => 'required|in:professional_development,performance,project,behavioral,other',
            'evaluation_id' => 'nullable|exists:evaluations,id',
        ]);

        $goal = Goal::create([
            ...$validated,
            'set_by'   => Auth::id(),
            'status'   => 'not_started',
            'progress' => 0,
        ]);

        return $this->created(
            $goal->load(['employee', 'setter']),
            'Goal created successfully'
        );
    }

    /**
     * Update goal details.
     * PUT /api/performance/goals/{goal}
     */
    public function update(Request $request, Goal $goal): JsonResponse
    {
        $validated = $request->validate([
            'title'       => 'sometimes|string|max:200',
            'description' => 'nullable|string|max:1000',
            'due_date'    => 'sometimes|date',
            'priority'    => 'sometimes|in:low,medium,high,critical',
            'category'    => 'sometimes|in:professional_development,performance,project,behavioral,other',
            'status'      => 'sometimes|in:not_started,in_progress,completed,overdue,cancelled',
        ]);

        $goal->update($validated);

        return $this->success($goal->fresh(['employee', 'setter']), 'Goal updated');
    }

    /**
     * Update goal progress (0-100%).
     * PATCH /api/performance/goals/{goal}/progress
     */
    public function updateProgress(Request $request, Goal $goal): JsonResponse
    {
        if (in_array($goal->status, ['completed', 'cancelled'])) {
            return $this->error('Cannot update progress on completed or cancelled goals.');
        }

        $validated = $request->validate([
            'progress' => 'required|integer|min:0|max:100',
            'notes'    => 'nullable|string|max:1000',
        ]);

        $goal->updateProgress(
            $validated['progress'],
            $validated['notes'] ?? ''
        );

        return $this->success($goal->fresh(['employee']), 'Progress updated');
    }

    /**
     * Soft-delete a goal.
     * DELETE /api/performance/goals/{goal}
     */
    public function destroy(Goal $goal): JsonResponse
    {
        $goal->delete();

        return $this->success(null, 'Goal deleted');
    }
}