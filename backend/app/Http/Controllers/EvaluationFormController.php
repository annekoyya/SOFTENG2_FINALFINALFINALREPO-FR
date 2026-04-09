<?php
// backend/app/Http/Controllers/EvaluationFormController.php
// REPLACE ENTIRE FILE

namespace App\Http\Controllers;

use App\Models\EvaluationForm;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class EvaluationFormController extends Controller
{
    // ─── GET /api/evaluations ─────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = EvaluationForm::with('creator')->withCount([
            'assignments',
            'assignments as responses_count' => fn($q) => $q->where('status', 'submitted'),
        ]);

        if ($request->filled('status'))     $query->where('status',     $request->status);
        if ($request->filled('department')) $query->where('department', $request->department);

        $forms = $query->orderBy('created_at', 'desc')->get()->map(function ($form) {
            $form->sections      = json_decode($form->sections_data ?? '[]', true) ?: [];
            $form->pending_count = max(0, ($form->assignments_count ?? 0) - ($form->responses_count ?? 0));
            return $form;
        });

        return response()->json(['success' => true, 'data' => $forms]);
    }

    // ─── POST /api/evaluations ────────────────────────────────────────────────
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'           => 'required|string|max:255',
            'department'      => 'required|string|max:255',
            'deadline'        => 'nullable|date',
            'date_start'      => 'nullable|date',
            'sections'        => 'required|array|min:1',
            'evaluator_ids'   => 'nullable|array',
            'evaluator_ids.*' => 'integer',        // don't require exists:users to avoid crash
            'save_as_draft'   => 'boolean',
        ]);

        $asDraft = (bool) ($validated['save_as_draft'] ?? false);
        $status  = $asDraft ? 'draft' : 'active';

        DB::beginTransaction();
        try {
            $form = EvaluationForm::create([
                'title'         => $validated['title'],
                'department'    => $validated['department'],
                'deadline'      => $validated['deadline']   ?? null,
                'date_start'    => $validated['date_start'] ?? null,
                'status'        => $status,
                'created_by'    => Auth::id(),
                'sections_data' => json_encode($validated['sections']),
            ]);

            // Assign evaluators
            $evaluatorIds = $validated['evaluator_ids'] ?? [];

            if ($status === 'active') {
                // If sending immediately, assign to all HR users PLUS any specified
                $hrUserIds = User::where('role', 'HR')->pluck('id')->toArray();
                $all = array_unique(array_merge($hrUserIds, $evaluatorIds));
                $this->createAssignments($form->id, $all);
            } elseif (!empty($evaluatorIds)) {
                $this->createAssignments($form->id, $evaluatorIds);
            }

            DB::commit();

            $form->sections = $validated['sections'];
            return response()->json([
                'success' => true,
                'data'    => $form,
                'message' => $asDraft ? 'Draft saved' : 'Evaluation sent to HR evaluators',
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ─── GET /api/evaluations/{form} ─────────────────────────────────────────
    public function show(int $id): JsonResponse
    {
        $form = EvaluationForm::with(['creator', 'assignments.user'])->findOrFail($id);
        $form->sections = json_decode($form->sections_data ?? '[]', true) ?: [];
        return response()->json(['success' => true, 'data' => $form]);
    }

    // ─── PUT /api/evaluations/{form} ─────────────────────────────────────────
    public function update(Request $request, int $id): JsonResponse
    {
        $form = EvaluationForm::findOrFail($id);

        if ($form->status === 'closed') {
            return response()->json(['success' => false, 'message' => 'Closed forms cannot be edited'], 422);
        }

        $data = [];
        if ($request->filled('title'))      $data['title']      = $request->title;
        if ($request->filled('department')) $data['department'] = $request->department;
        if ($request->has('deadline'))      $data['deadline']   = $request->deadline;
        if ($request->has('date_start'))    $data['date_start'] = $request->date_start;
        if ($request->has('sections'))      $data['sections_data'] = json_encode($request->sections);

        $form->update($data);
        $form->sections = json_decode($form->sections_data ?? '[]', true) ?: [];

        return response()->json(['success' => true, 'data' => $form, 'message' => 'Updated']);
    }

    // ─── POST /api/evaluations/{form}/send ───────────────────────────────────
    public function send(int $id): JsonResponse
    {
        $form = EvaluationForm::findOrFail($id);

        if ($form->status !== 'draft') {
            return response()->json(['success' => false, 'message' => 'Only drafts can be sent'], 422);
        }

        DB::beginTransaction();
        try {
            $form->update(['status' => 'active']);

            // Assign to all HR users
            $hrIds = User::where('role', 'HR')->pluck('id')->toArray();
            $this->createAssignments($form->id, $hrIds);

            DB::commit();
            return response()->json(['success' => true, 'data' => $form, 'message' => 'Sent to HR evaluators']);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ─── POST /api/evaluations/{form}/close ──────────────────────────────────
    public function close(int $id): JsonResponse
    {
        $form = EvaluationForm::findOrFail($id);
        if ($form->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Only active forms can be closed'], 422);
        }
        $form->update(['status' => 'closed']);
        return response()->json(['success' => true, 'data' => $form]);
    }

    // ─── DELETE /api/evaluations/{form} ──────────────────────────────────────
    public function destroy(int $id): JsonResponse
    {
        $form = EvaluationForm::findOrFail($id);
        if ($form->status === 'active') {
            return response()->json(['success' => false, 'message' => 'Close the form before deleting'], 422);
        }
        $form->delete();
        return response()->json(['success' => true, 'message' => 'Deleted']);
    }

    // ─── GET /api/evaluations/my-assignments ─────────────────────────────────
    public function myAssignments(): JsonResponse
    {
        $userId = Auth::id();

        $assignments = EvaluationAssignment::with('form')
            ->where('user_id', $userId)
            ->get()
            ->map(function ($a) {
                $form = $a->form;
                return [
                    'id'                 => $a->id,
                    'evaluation_form_id' => $a->evaluation_form_id,
                    'status'             => $a->status,
                    'submitted_at'       => $a->submitted_at,
                    'responses_data'     => $a->responses_data,
                    'form' => [
                        'id'         => $form->id,
                        'title'      => $form->title,
                        'department' => $form->department,
                        'deadline'   => $form->deadline,
                        'status'     => $form->status,
                        'sections'   => json_decode($form->sections_data ?? '[]', true) ?: [],
                    ],
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'pending'   => $assignments->where('status', 'pending')->values(),
                'completed' => $assignments->where('status', 'submitted')->values(),
            ],
        ]);
    }

    // ─── GET /api/evaluations/assignments/{assignment} ────────────────────────
    public function getAssignment(int $id): JsonResponse
    {
        $assignment = EvaluationAssignment::with('form')->findOrFail($id);

        if ($assignment->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $assignment->form->sections = json_decode($assignment->form->sections_data ?? '[]', true) ?: [];
        return response()->json(['success' => true, 'data' => $assignment]);
    }

    // ─── POST /api/evaluations/assignments/{assignment}/submit ────────────────
    public function submitAssignment(Request $request, int $id): JsonResponse
    {
        $assignment = EvaluationAssignment::findOrFail($id);

        if ($assignment->user_id !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        if ($assignment->status === 'submitted') {
            return response()->json(['success' => false, 'message' => 'Already submitted'], 422);
        }

        $request->validate(['responses' => 'required|array']);

        $assignment->update([
            'status'         => 'submitted',
            'submitted_at'   => now(),
            'responses_data' => json_encode($request->responses),
        ]);

        return response()->json(['success' => true, 'message' => 'Submitted successfully']);
    }

    // ─── GET /api/evaluations/{form}/analytics ────────────────────────────────
    public function analytics(int $id): JsonResponse
    {
        $form        = EvaluationForm::findOrFail($id);
        $assignments = EvaluationAssignment::where('evaluation_form_id', $id)->get();
        $submitted   = $assignments->where('status', 'submitted');

        $sections = json_decode($form->sections_data ?? '[]', true) ?: [];

        // Build rating tallies per question
        // Each response item: { question_id, rating, text_response }
        $ratingsByQuestion = [];   // question_id => [label => count]
        $textByQuestion    = [];   // question_id => [response strings]
        $totalRating = 0; $totalRatingCount = 0;

        foreach ($submitted as $a) {
            $responses = json_decode($a->responses_data ?? '[]', true) ?: [];
            foreach ($responses as $r) {
                $qid = $r['question_id'] ?? null;
                if (!$qid) continue;

                if (isset($r['rating']) && $r['rating'] !== null) {
                    $label = $this->ratingLabel((int) $r['rating']);
                    $ratingsByQuestion[$qid][$label] = ($ratingsByQuestion[$qid][$label] ?? 0) + 1;
                    $totalRating      += (int) $r['rating'];
                    $totalRatingCount += 1;
                }
                if (!empty($r['text_response'])) {
                    $textByQuestion[$qid][] = $r['text_response'];
                }
            }
        }

        // Attach analytics to each question in sections
        $enrichedSections = array_map(function ($section) use ($ratingsByQuestion, $textByQuestion) {
            $section['questions'] = array_map(function ($q) use ($ratingsByQuestion, $textByQuestion) {
                $qid = $q['id'] ?? null;
                $q['likert_summary']  = $ratingsByQuestion[$qid] ?? [];
                $q['text_responses']  = $textByQuestion[$qid]    ?? [];
                $q['response_count']  = count($q['likert_summary'])
                    ? array_sum($q['likert_summary'])
                    : count($q['text_responses']);
                $q['average_rating']  = 0;
                if (!empty($q['likert_summary'])) {
                    $labelMap = ['Excellent' => 5, 'Very Good' => 4, 'Good' => 3, 'Fair' => 2, 'Poor' => 1];
                    $total = 0; $cnt = 0;
                    foreach ($q['likert_summary'] as $label => $count) {
                        $total += ($labelMap[$label] ?? 3) * $count;
                        $cnt   += $count;
                    }
                    $q['average_rating'] = $cnt > 0 ? round($total / $cnt, 1) : 0;
                }
                return $q;
            }, $section['questions'] ?? []);
            return $section;
        }, $sections);

        $avgScore = $totalRatingCount > 0 ? round($totalRating / $totalRatingCount, 1) : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'form' => [
                    'id'         => $form->id,
                    'title'      => $form->title,
                    'department' => $form->department,
                    'status'     => $form->status,
                    'deadline'   => $form->deadline,
                ],
                'total_evaluators'   => $assignments->count(),
                'responses_received' => $submitted->count(),
                'pending_responses'  => $assignments->count() - $submitted->count(),
                'average_score'      => (string) $avgScore,
                'sections'           => $enrichedSections,
            ],
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function createAssignments(int $formId, array $userIds): void
    {
        foreach (array_unique($userIds) as $uid) {
            EvaluationAssignment::updateOrCreate(
                ['evaluation_form_id' => $formId, 'user_id' => $uid],
                ['status' => 'pending']
            );
        }
    }

    private function ratingLabel(int $value): string
    {
        return match ($value) {
            5 => 'Excellent', 4 => 'Very Good',
            3 => 'Good', 2 => 'Fair', default => 'Poor',
        };
    }
}