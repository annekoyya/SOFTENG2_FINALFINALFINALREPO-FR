<?php

namespace Database\Seeders;

use App\Models\JobPosting;
use App\Models\Applicant;
use App\Models\Interview;
use App\Models\User;
use Illuminate\Database\Seeder;

class JobPostingSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::where('role', 'Admin')->value('id') ?? 1;
        $hrId    = User::where('role', 'HR')->value('id') ?? 2;

        // ── Job Postings ──────────────────────────────────────────────────
        $postings = [
            [
                'title'        => 'Front Desk Receptionist',
                'department'   => 'Front Office',
                'job_category' => 'Front Desk Agent',
                'description'  => 'Handle guest check-ins, manage reservations, and provide excellent customer service at the front desk.',
                'slots'        => 2,
                'status'       => 'open',
                'created_by'   => $adminId,
                'posted_date'  => now()->subDays(10)->toDateString(),
                'deadline'     => now()->addDays(20)->toDateString(),
            ],
            [
                'title'        => 'Housekeeping Supervisor',
                'department'   => 'Housekeeping',
                'job_category' => 'Housekeeping Supervisor',
                'description'  => 'Oversee housekeeping staff, maintain cleanliness standards, and manage room assignments.',
                'slots'        => 1,
                'status'       => 'open',
                'created_by'   => $adminId,
                'posted_date'  => now()->subDays(15)->toDateString(),
                'deadline'     => now()->addDays(15)->toDateString(),
            ],
            [
                'title'        => 'Kitchen Assistant',
                'department'   => 'Food & Beverage',
                'job_category' => 'Kitchen Steward',
                'description'  => 'Assist in food preparation, maintain kitchen cleanliness, and support cooking operations.',
                'slots'        => 3,
                'status'       => 'open',
                'created_by'   => $adminId,
                'posted_date'  => now()->subDays(5)->toDateString(),
                'deadline'     => now()->addDays(25)->toDateString(),
            ],
            [
                'title'        => 'Maintenance Technician',
                'department'   => 'Maintenance',
                'job_category' => 'Maintenance Technician',
                'description'  => 'Perform routine maintenance, repairs, and ensure all hotel facilities are in working order.',
                'slots'        => 1,
                'status'       => 'open',
                'created_by'   => $adminId,
                'posted_date'  => now()->subDays(8)->toDateString(),
                'deadline'     => now()->addDays(22)->toDateString(),
            ],
            [
                'title'        => 'Sales Manager',
                'department'   => 'Sales & Marketing',
                'job_category' => 'Sales Manager',
                'description'  => 'Coordinate corporate accounts, drive revenue targets, and manage key client relationships.',
                'slots'        => 1,
                'status'       => 'open',
                'created_by'   => $adminId,
                'posted_date'  => now()->subDays(3)->toDateString(),
                'deadline'     => now()->addDays(27)->toDateString(),
            ],
        ];

        foreach ($postings as $data) {
            JobPosting::updateOrCreate(
                ['title' => $data['title'], 'department' => $data['department']],
                $data
            );
        }

        // ── Applicants ────────────────────────────────────────────────────
        $applicants = [
            [
                'job_posting_id' => JobPosting::where('title', 'Front Desk Receptionist')->value('id'),
                'first_name'     => 'Carlos',
                'last_name'      => 'Reyes',
                'email'          => 'carlos.reyes@email.com',
                'phone'          => '09182345678',
                'pipeline_stage' => 'reviewed',
                'notes'          => 'Good basic qualifications, needs interview.',
            ],
            [
                'job_posting_id' => JobPosting::where('title', 'Housekeeping Supervisor')->value('id'),
                'first_name'     => 'Ana',
                'last_name'      => 'Garcia',
                'email'          => 'ana.garcia@email.com',
                'phone'          => '09193456789',
                'pipeline_stage' => 'hired',
                'notes'          => 'Excellent candidate, hired immediately.',
                'hired_at'       => now()->subDays(5),
            ],
            [
                'job_posting_id' => JobPosting::where('title', 'Kitchen Assistant')->value('id'),
                'first_name'     => 'Pedro',
                'last_name'      => 'Lopez',
                'email'          => 'pedro.lopez@email.com',
                'phone'          => '09204567890',
                'pipeline_stage' => 'applied',
                'notes'          => 'New application, pending review.',
            ],
            [
                'job_posting_id' => JobPosting::where('title', 'Maintenance Technician')->value('id'),
                'first_name'     => 'Rosa',
                'last_name'      => 'Mendoza',
                'email'          => 'rosa.mendoza@email.com',
                'phone'          => '09215678901',
                'pipeline_stage' => 'interviewed',
                'notes'          => 'Technical skills verified.',
            ],
        ];

        foreach ($applicants as $data) {
            if (!$data['job_posting_id']) continue;
            Applicant::updateOrCreate(['email' => $data['email']], $data);
        }

        // ── Interviews ────────────────────────────────────────────────────
        $carlosId = Applicant::where('email', 'carlos.reyes@email.com')->value('id');
        $rosaId   = Applicant::where('email', 'rosa.mendoza@email.com')->value('id');

        if ($carlosId) {
            Interview::updateOrCreate(
                ['applicant_id' => $carlosId],
                [
                    'applicant_id'   => $carlosId,
                    'interviewer_id' => $hrId,
                    'scheduled_at'   => now()->addDays(2)->setTime(10, 0),
                    'status'         => 'scheduled',
                    'feedback'       => null,
                ]
            );
        }

        if ($rosaId) {
            Interview::updateOrCreate(
                ['applicant_id' => $rosaId],
                [
                    'applicant_id'   => $rosaId,
                    'interviewer_id' => $hrId,
                    'scheduled_at'   => now()->subDays(1)->setTime(14, 0),
                    'status'         => 'completed',
                    'feedback'       => 'Strong technical background, recommended for hire.',
                ]
            );
        }

        $this->command->info('✓ Job postings, applicants, and interviews seeded!');
    }
}