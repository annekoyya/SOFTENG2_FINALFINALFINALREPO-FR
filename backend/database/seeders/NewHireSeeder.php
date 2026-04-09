<?php
// database/seeders/NewHireSeeder.php

namespace Database\Seeders;

use App\Models\NewHire;
use App\Models\Applicant;
use Illuminate\Database\Seeder;

class NewHireSeeder extends Seeder
{
    public function run(): void
    {
        // Get hired applicants
        $hiredApplicants = Applicant::where('pipeline_stage', 'hired')->get();

        foreach ($hiredApplicants as $applicant) {
            // Check if new hire already exists
            $existing = NewHire::where('email', $applicant->email)->first();
            if ($existing) continue;

            NewHire::create([
                'first_name' => $applicant->first_name,
                'last_name' => $applicant->last_name,
                'email' => $applicant->email,
                'phone' => $applicant->phone,
                'department' => $applicant->jobPosting->department ?? 'Front Office',
                'job_category' => $applicant->jobPosting->job_category ?? 'Staff',
                'start_date' => now()->addDays(7)->toDateString(),
                'offered_salary' => 25000,
                'status' => 'pending',
                'source' => 'recruitment',
                'applicant_id' => $applicant->id,
            ]);
        }

        // Also add some manual new hires for testing
        $manualNewHires = [
            [
                'first_name' => 'Jessica',
                'last_name' => 'Ocampo',
                'email' => 'jessica.ocampo@bluelotus.com',
                'phone' => '09201234504',
                'department' => 'Front Office',
                'job_category' => 'Staff',
                'start_date' => '2026-04-01',
                'offered_salary' => 25000,
                'status' => 'pending',
                'source' => 'recruitment',
            ],
            [
                'first_name' => 'Patrick',
                'last_name' => 'Gonzales',
                'email' => 'patrick.gonzales@bluelotus.com',
                'phone' => '09211234505',
                'department' => 'Housekeeping',
                'job_category' => 'Staff',
                'start_date' => '2026-04-15',
                'offered_salary' => 22000,
                'status' => 'pending',
                'source' => 'recruitment',
            ],
        ];

        foreach ($manualNewHires as $data) {
            NewHire::updateOrCreate(
                ['email' => $data['email']],
                $data
            );
        }

        $this->command->info('✓ New hires seeded successfully!');
    }
}