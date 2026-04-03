<?php

namespace Database\Seeders;

use App\Models\EvaluationForm;
use App\Models\EvaluationSection;
use App\Models\EvaluationQuestion;
use App\Models\EvaluationLikertOption;
use App\Models\EvaluationAssignment;
use App\Models\EvaluationResponse;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;

class EvaluationSeeder extends Seeder
{
    /**
     * Seed evaluation forms, questions, and responses.
     */
    public function run(): void
    {
        // Create evaluation form
        $form = EvaluationForm::create([
            'title' => 'Employee Performance Evaluation',
            'description' => 'Annual performance review for employees',
            'status' => 'active',
            'created_by' => 1, // Admin
        ]);

        // Create sections
        $sections = [
            [
                'form_id' => $form->id,
                'title' => 'Job Knowledge & Skills',
                'description' => 'Assessment of technical skills and job knowledge',
                'order' => 1,
            ],
            [
                'form_id' => $form->id,
                'title' => 'Work Quality & Productivity',
                'description' => 'Evaluation of work output and efficiency',
                'order' => 2,
            ],
            [
                'form_id' => $form->id,
                'title' => 'Communication & Teamwork',
                'description' => 'Assessment of interpersonal skills',
                'order' => 3,
            ],
            [
                'form_id' => $form->id,
                'title' => 'Attendance & Punctuality',
                'description' => 'Evaluation of reliability and attendance',
                'order' => 4,
            ],
        ];

        foreach ($sections as $sectionData) {
            $section = EvaluationSection::create($sectionData);
            $sections[] = $section; // Keep reference
        }

        // Create Likert options
        $likertOptions = [
            ['value' => 1, 'label' => 'Poor', 'description' => 'Does not meet expectations'],
            ['value' => 2, 'label' => 'Below Average', 'description' => 'Partially meets expectations'],
            ['value' => 3, 'label' => 'Average', 'description' => 'Meets expectations'],
            ['value' => 4, 'label' => 'Good', 'description' => 'Exceeds expectations'],
            ['value' => 5, 'label' => 'Excellent', 'description' => 'Significantly exceeds expectations'],
        ];

        foreach ($likertOptions as $option) {
            EvaluationLikertOption::create($option);
        }

        // Create questions
        $questions = [
            [
                'section_id' => $sections[0]->id,
                'question_text' => 'Demonstrates required technical skills for the position',
                'question_type' => 'likert',
                'is_required' => true,
                'order' => 1,
            ],
            [
                'section_id' => $sections[0]->id,
                'question_text' => 'Stays current with industry knowledge and best practices',
                'question_type' => 'likert',
                'is_required' => true,
                'order' => 2,
            ],
            [
                'section_id' => $sections[1]->id,
                'question_text' => 'Completes assigned tasks accurately and on time',
                'question_type' => 'likert',
                'is_required' => true,
                'order' => 1,
            ],
            [
                'section_id' => $sections[1]->id,
                'question_text' => 'Maintains high standards of work quality',
                'question_type' => 'likert',
                'is_required' => true,
                'order' => 2,
            ],
            [
                'section_id' => $sections[2]->id,
                'question_text' => 'Communicates effectively with team members',
                'question_type' => 'likert',
                'is_required' => true,
                'order' => 1,
            ],
            [
                'section_id' => $sections[2]->id,
                'question_text' => 'Contributes positively to team collaboration',
                'question_type' => 'likert',
                'is_required' => true,
                'order' => 2,
            ],
            [
                'section_id' => $sections[3]->id,
                'question_text' => 'Maintains consistent attendance and punctuality',
                'question_type' => 'likert',
                'is_required' => true,
                'order' => 1,
            ],
            [
                'section_id' => $form->id,
                'question_text' => 'Overall Performance Comments',
                'question_type' => 'textarea',
                'is_required' => false,
                'order' => 1,
            ],
        ];

        foreach ($questions as $question) {
            EvaluationQuestion::create($question);
        }

        // Create assignments for some employees
        $employees = Employee::take(3)->get();
        $hrUser = User::where('role', 'HR')->first();

        foreach ($employees as $employee) {
            $assignment = EvaluationAssignment::create([
                'form_id' => $form->id,
                'employee_id' => $employee->id,
                'evaluator_id' => $hrUser?->id ?? 2,
                'status' => 'completed',
                'assigned_at' => now()->subDays(rand(1, 30)),
                'completed_at' => now()->subDays(rand(1, 15)),
                'due_date' => now()->addDays(30),
            ]);

            // Create responses
            $evaluationQuestions = EvaluationQuestion::where('section_id', '!=', $form->id)->get();
            foreach ($evaluationQuestions as $question) {
                EvaluationResponse::create([
                    'assignment_id' => $assignment->id,
                    'question_id' => $question->id,
                    'response_value' => rand(3, 5), // Random score 3-5
                ]);
            }

            // Add comment response
            $commentQuestion = EvaluationQuestion::where('question_type', 'textarea')->first();
            if ($commentQuestion) {
                EvaluationResponse::create([
                    'assignment_id' => $assignment->id,
                    'question_id' => $commentQuestion->id,
                    'response_value' => 'Good performance overall. Shows dedication to work and willingness to learn.',
                ]);
            }
        }
    }
}