<?php

namespace Database\Seeders;

use App\Models\TrainingCourse;
use App\Models\TrainingAssignment;
use App\Models\Employee;
use Illuminate\Database\Seeder;

class TrainingSeeder extends Seeder
{
    /**
     * Seed training courses and assignments.
     */
    public function run(): void
    {
        // Create training courses
        $courses = [
            [
                'title' => 'Customer Service Excellence',
                'description' => 'Training on providing exceptional customer service and handling guest complaints.',
                'category' => 'Service',
                'duration_hours' => 8,
                'status' => 'active',
                'created_by' => 1,
            ],
            [
                'title' => 'Food Safety and Hygiene',
                'description' => 'Essential training on food handling, safety protocols, and hygiene standards.',
                'category' => 'Safety',
                'duration_hours' => 6,
                'status' => 'active',
                'created_by' => 1,
            ],
            [
                'title' => 'Emergency Response Procedures',
                'description' => 'Training on handling emergency situations and evacuation procedures.',
                'category' => 'Safety',
                'duration_hours' => 4,
                'status' => 'active',
                'created_by' => 1,
            ],
            [
                'title' => 'Microsoft Office Suite',
                'description' => 'Comprehensive training on Word, Excel, PowerPoint, and Outlook.',
                'category' => 'Technical',
                'duration_hours' => 12,
                'status' => 'active',
                'created_by' => 1,
            ],
            [
                'title' => 'Leadership and Management Skills',
                'description' => 'Training for supervisors on leadership, team management, and performance coaching.',
                'category' => 'Management',
                'duration_hours' => 16,
                'status' => 'active',
                'created_by' => 1,
            ],
        ];

        foreach ($courses as $course) {
            TrainingCourse::create($course);
        }

        // Assign training to employees
        $employees = Employee::all();
        $courses = TrainingCourse::all();

        foreach ($employees as $employee) {
            // Assign 1-2 courses per employee
            $assignedCourses = $courses->random(rand(1, 2));

            foreach ($assignedCourses as $course) {
                $status = ['assigned', 'in_progress', 'completed'][array_rand(['assigned', 'in_progress', 'completed'])];

                $assignment = TrainingAssignment::create([
                    'employee_id' => $employee->id,
                    'course_id' => $course->id,
                    'status' => $status,
                    'assigned_date' => now()->subDays(rand(1, 60)),
                    'due_date' => now()->addDays(rand(30, 90)),
                    'assigned_by' => 2, // HR user
                ]);

                if ($status === 'completed') {
                    $assignment->update([
                        'completed_date' => now()->subDays(rand(1, 30)),
                        'score' => rand(75, 100),
                        'notes' => 'Successfully completed training course.',
                    ]);
                } elseif ($status === 'in_progress') {
                    $assignment->update([
                        'notes' => 'Currently working on the course modules.',
                    ]);
                }
            }
        }
    }
}
