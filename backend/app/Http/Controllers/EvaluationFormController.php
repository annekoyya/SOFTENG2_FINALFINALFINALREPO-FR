<?php

namespace App\Http\Controllers;

use App\Models\EvaluationForm;
use App\Models\EvaluationSection;
use App\Models\EvaluationLikertOption;
use App\Models\EvaluationQuestion;
use App\Models\EvaluationAssignment;
use App\Models\EvaluationResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class EvaluationFormController extends Controller
{
    /**
     * List all evaluation forms.
     * GET /api/evaluations
     */
    public function index(Request $request): JsonResponse
    {
        $query = EvaluationForm::with(['creator'])
            ->withCount([
                'assignments',
                'assignments as responses_count' => fn($q) => $q->where('status', 'submitted'),
                'assignments as pending_count'   => fn($q) => $q->where('status', 'pending'),
            ])
            ->latest();

        if ($request->filled('status'))     $query->where('status', $request->query('status'));
        if ($request->filled('department')) $query->byDepartment($request->query('department'));

        return $this->success($query->paginate(20));
    }

    /**
     * Show a single form with all sections, questions and assignments.
     * GET /api/evaluations/{form}
     */
    public function show(EvaluationForm $form): JsonResponse
    {
        return $this->success(
            $form->load([
                'creator',
                'sections.questions',
                'sections.likertOptions',
                'assignments.user',
            ])
        );
    }

    /**
     * Create a new evaluation form.
     * POST /api/evaluations
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'           => 'required|string|max:200',
            'description'     => 'nullable|string|max:1000',
            'department'      => 'required|string|max:100',
            'period_start'    => 'nullable|date',
            'period_end'      => 'nullable|date|after_or_equal:period_start',
            'evaluator_ids'   => 'required|array|min:1',
            'evaluator_ids.*' => 'exists:users,id',
        ]);

        $form = DB::transaction(function () use ($validated) {
            // Create the form with no sections/questions (simplified)
            $form = EvaluationForm::create([
                'title'       => $validated['title'],
                'description' => $validated['description'] ?? null,
                'department'  => $validated['department'],
                'period_start'  => $validated['period_start'] ?? null,
                'period_end'    => $validated['period_end'] ?? null,
                'created_by'  => Auth::id(),
                'status'      => 'active',
            ]);

            // Create assignments for each evaluator
            foreach ($validated['evaluator_ids'] as $evaluatorId) {
                EvaluationAssignment::create([
                    'form_id'      => $form->id,
                    'evaluator_id' => $evaluatorId,
                    'status'       => 'pending',
                ]);
            }

            return $form;
        });

        return $this->created($form->load(['creator', 'assignments']), 'Evaluation form created');
    }
            ]);

            // 2. Create sections with questions and likert options
            foreach ($validated['sections'] as $sIdx => $sData) {


            return $form->load(['creator', 'assignments']);
        });

        return $this->created($form, 'Evaluation form created successfully');
    }

    /**
     * Update form details (title, deadline, status only — not structure).
     * PUT /api/evaluations/{form}
     */
    public function update(Request $request, EvaluationForm $form): JsonResponse
    {
        $validated = $request->validate([
            'title'      => 'sometimes|string|max:200',
            'deadline'   => 'nullable|date',
            'status'     => 'sometimes|in:draft,active,closed',
            'department' => 'sometimes|string|max:100',
        ]);

        $form->update($validated);

        return $this->success($form->fresh(), 'Form updated');
    }

    /**
     * Delete a draft form.
     * DELETE /api/evaluations/{form}
     */
    public function destroy(EvaluationForm $form): JsonResponse
    {
        if ($form->status !== 'draft') {
            return $this->error('Only draft forms can be deleted.');
        }
        $form->delete();

        return $this->success(null, 'Form deleted');
    }

    // ─── HR: Fill Out Evaluation ──────────────────────────────────────────────

    /**
     * Get the assigned form for the current HR user to fill out.
     * GET /api/evaluations/assignments/{assignment}
     */
    public function getAssignment(EvaluationAssignment $assignment): JsonResponse
    {
        // Ensure the logged-in user owns this assignment
        if ($assignment->user_id !== Auth::id()) {
            return $this->forbidden('You are not assigned to this evaluation.');
        }

        return $this->success(
            $assignment->load([
                'form.sections.questions',
                'form.sections.likertOptions',
                'responses',
            ])
        );
    }

    /**
     * HR submits responses for their assigned evaluation.
     * POST /api/evaluations/assignments/{assignment}/submit
     */
    public function submitAssignment(Request $request, EvaluationAssignment $assignment): JsonResponse
    {
        if ($assignment->user_id !== Auth::id()) {
            return $this->forbidden('You are not assigned to this evaluation.');
        }

        if (!$assignment->canSubmit()) {
            return $this->error('This evaluation has already been submitted.');
        }

        $validated = $request->validate([
            'responses'                          => 'required|array',
            'responses.*.question_id'            => 'required|exists:evaluation_questions,id',
            'responses.*.likert_value'           => 'nullable|integer|min:0',
            'responses.*.text_response'          => 'nullable|string|max:2000',
        ]);

        DB::transaction(function () use ($assignment, $validated) {
            foreach ($validated['responses'] as $resp) {
                EvaluationResponse::updateOrCreate(
                    [
                        'evaluation_assignment_id' => $assignment->id,
                        'evaluation_question_id'   => $resp['question_id'],
                    ],
                    [
                        'likert_value'  => $resp['likert_value'] ?? null,
                        'text_response' => $resp['text_response'] ?? null,
                    ]
                );
            }

            $assignment->submit();
        });

        return $this->success(null, 'Evaluation submitted successfully');
    }

    /**
     * Get list of assignments for the current HR user.
     * GET /api/evaluations/my-assignments
     */
    public function myAssignments(): JsonResponse
    {
        $assignments = EvaluationAssignment::where('user_id', Auth::id())
            ->with(['form'])
            ->latest()
            ->get();

        return $this->success($assignments);
    }

    // ─── Analytics ────────────────────────────────────────────────────────────

    /**
     * Get aggregated analytics for a form.
     * GET /api/evaluations/{form}/analytics
     */
    public function analytics(EvaluationForm $form): JsonResponse
    {
        $form->load([
            'sections.questions.responses',
            'sections.likertOptions',
            'assignments',
        ]);

        $totalEvaluators    = $form->assignments->count();
        $responsesReceived  = $form->assignments->where('status', 'submitted')->count();
        $pendingResponses   = $form->assignments->where('status', 'pending')->count();

        // Calculate average score across all likert responses
        $allLikertResponses = $form->sections
            ->flatMap(fn($s) => $s->questions)
            ->where('type', 'likert')
            ->flatMap(fn($q) => $q->responses)
            ->whereNotNull('likert_value');

        $avgScore = $allLikertResponses->isNotEmpty()
            ? round($allLikertResponses->avg('likert_value'), 1)
            : 0;

        // Build per-section analytics
        $sections = $form->sections->map(function ($section) {
            $questions = $section->questions->map(function ($question) use ($section) {
                $data = [
                    'text' => $question->text,
                    'type' => $question->type,
                ];

                if ($question->isLikert()) {
                    // Build label → count map using the section's likert options
                    $optionMap = $section->likertOptions
                        ->pluck('label', 'value')
                        ->toArray();

                    $summary = [];
                    foreach ($optionMap as $value => $label) {
                        $summary[$label] = $question->responses
                            ->where('likert_value', $value)
                            ->count();
                    }
                    $data['likert_summary'] = $summary;
                } else {
                    // Open-ended — collect all text responses
                    $data['text_responses'] = $question->responses
                        ->whereNotNull('text_response')
                        ->pluck('text_response')
                        ->values()
                        ->toArray();
                }

                return $data;
            });

            return [
                'title'     => $section->title,
                'type'      => $section->type,
                'questions' => $questions,
            ];
        });

        return $this->success([
            'form'               => $form->only(['id', 'title', 'department', 'status', 'deadline']),
            'total_evaluators'   => $totalEvaluators,
            'responses_received' => $responsesReceived,
            'pending_responses'  => $pendingResponses,
            'average_score'      => "{$avgScore}/4",
            'sections'           => $sections,
        ]);
    }
}