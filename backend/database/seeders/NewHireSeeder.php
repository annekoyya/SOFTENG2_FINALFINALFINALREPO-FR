<?php
// database/seeders/NewHireSeeder.php

namespace Database\Seeders;

use App\Models\NewHire;
use App\Models\Applicant;
use App\Models\User;
use Illuminate\Database\Seeder;

class NewHireSeeder extends Seeder
{
    public function run(): void
    {
        $createdBy = User::where('role', 'Admin')->value('id') ?? 1;

        // Seed from hired applicants
        $hiredApplicants = Applicant::where('pipeline_stage', 'hired')->with('jobPosting')->get();

        foreach ($hiredApplicants as $applicant) {
            if (NewHire::where('email', $applicant->email)->exists()) continue;

            NewHire::create([
                'first_name'        => $applicant->first_name,
                'last_name'         => $applicant->last_name,
                'email'             => $applicant->email,
                'phone_number'      => $applicant->phone ?? null,
                'department'        => $applicant->jobPosting->department ?? 'Front Office',
                'job_category'      => $applicant->jobPosting->job_category ?? 'Staff',
                'start_date'        => now()->addDays(7)->toDateString(),
                'basic_salary'      => 25000,
                'onboarding_status' => 'pending',
                'applicant_id'      => $applicant->id,
                'created_by'        => $createdBy,
                'employment_type'   => 'probationary',
                'role'              => 'Employee',
                'shift_sched'       => 'morning',
            ]);
        }

        // Manual test new hires
        $manualNewHires = [
            [
                'first_name'   => 'Jessica',
                'last_name'    => 'Ocampo',
                'email'        => 'jessica.ocampo@bluelotus.com',
                'phone_number' => '09201234504',
                'department'   => 'Front Office',
                'job_category' => 'Front Desk Agent',
                'start_date'   => '2026-04-01',
                'basic_salary' => 25000,
            ],
            [
                'first_name'   => 'Patrick',
                'last_name'    => 'Gonzales',
                'email'        => 'patrick.gonzales@bluelotus.com',
                'phone_number' => '09211234505',
                'department'   => 'Housekeeping',
                'job_category' => 'Room Attendant',
                'start_date'   => '2026-04-15',
                'basic_salary' => 22000,
            ],
        ];

        foreach ($manualNewHires as $data) {
            NewHire::updateOrCreate(
                ['email' => $data['email']],
                array_merge($data, [
                    'onboarding_status' => 'pending',
                    'created_by'        => $createdBy,
                    'employment_type'   => 'probationary',
                    'role'              => 'Employee',
                    'shift_sched'       => 'morning',
                ])
            );
        }

        $this->command->info('✓ New hires seeded successfully!');
    }
}