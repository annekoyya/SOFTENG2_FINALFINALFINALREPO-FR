<?php
// database/seeders/ApplicantSeeder.php

namespace Database\Seeders;

use App\Models\Applicant;
use App\Models\JobPosting;
use Illuminate\Database\Seeder;

class ApplicantSeeder extends Seeder
{
    public function run(): void
    {
        // Get first job posting or create one
        $jobPosting = JobPosting::first();
        
        if (!$jobPosting) {
            $jobPosting = JobPosting::create([
                'title' => 'Front Desk Agent',
                'department' => 'Front Office',
                'job_category' => 'Staff',
                'description' => 'Responsible for greeting guests and checking them in.',
                'status' => 'open',
                'created_by' => 1,
            ]);
        }

        $applicants = [
            [
                'first_name' => 'Jessica',
                'last_name' => 'Ocampo',
                'email' => 'jessica.ocampo@email.com',
                'phone' => '09201234504',
                'job_posting_id' => $jobPosting->id,
                'pipeline_stage' => 'hired',
                'notes' => 'Excellent communication skills',
            ],
            [
                'first_name' => 'Patrick',
                'last_name' => 'Gonzales',
                'email' => 'patrick.gonzales@email.com',
                'phone' => '09211234505',
                'job_posting_id' => $jobPosting->id,
                'pipeline_stage' => 'hired',
                'notes' => 'Strong leadership potential',
            ],
            [
                'first_name' => 'Stephanie',
                'last_name' => 'Villanueva',
                'email' => 'stephanie.villanueva@email.com',
                'phone' => '09221234506',
                'job_posting_id' => $jobPosting->id,
                'pipeline_stage' => 'interviewed',
                'notes' => 'Good customer service experience',
            ],
            [
                'first_name' => 'Victor',
                'last_name' => 'Fernandez',
                'email' => 'victor.fernandez@email.com',
                'phone' => '09231234507',
                'job_posting_id' => $jobPosting->id,
                'pipeline_stage' => 'hired',
                'notes' => 'Technical background',
            ],
            [
                'first_name' => 'Michelle',
                'last_name' => 'Dizon',
                'email' => 'michelle.dizon@email.com',
                'phone' => '09241234508',
                'job_posting_id' => $jobPosting->id,
                'pipeline_stage' => 'interview_scheduled',
                'notes' => 'Fluent in English',
            ],
        ];

        foreach ($applicants as $data) {
            Applicant::updateOrCreate(
                ['email' => $data['email']],
                $data
            );
        }

        $this->command->info('✓ ' . count($applicants) . ' applicant records seeded successfully!');
        $this->command->info('  - Hired applicants: ' . Applicant::where('pipeline_stage', 'hired')->count());
        $this->command->info('  - Interviewed: ' . Applicant::where('pipeline_stage', 'interviewed')->count());
        $this->command->info('  - Interview Scheduled: ' . Applicant::where('pipeline_stage', 'interview_scheduled')->count());
    }
}