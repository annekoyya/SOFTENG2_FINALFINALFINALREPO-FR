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
        $hrUser = User::where('email', 'hr@hrharmony.com')->first();
        $hrManagerId = $hrUser ? $hrUser->id : 1;

        // Get hired applicants
        $hiredApplicants = Applicant::where('pipeline_stage', 'hired')->get();

        foreach ($hiredApplicants as $applicant) {
            // Check if new hire already exists for this applicant
            $existing = NewHire::where('email', $applicant->email)->first();
            if ($existing) continue;

            NewHire::create([
                'created_by' => $hrManagerId,
                'onboarding_status' => 'pending',
                'employee_id' => null,
                'first_name' => $applicant->first_name,
                'last_name' => $applicant->last_name,
                'middle_name' => null,
                'name_extension' => null,
                'date_of_birth' => null,
                'email' => $applicant->email,
                'phone_number' => $applicant->phone,
                'home_address' => null,
                'emergency_contact_name' => null,
                'emergency_contact_number' => null,
                'relationship' => null,
                'tin' => null,
                'sss_number' => null,
                'pagibig_number' => null,
                'philhealth_number' => null,
                'bank_name' => null,
                'account_name' => null,
                'account_number' => null,
                'start_date' => now()->addDays(7)->toDateString(),
                'department' => $applicant->jobPosting?->department ?? 'Front Office',
                'job_category' => $applicant->jobPosting?->job_category ?? 'Staff',
                'employment_type' => 'probationary',
                'role' => 'Employee',
                'basic_salary' => 25000,
                'reporting_manager' => null,
                'completed_fields' => json_encode(['first_name', 'last_name', 'email', 'phone_number', 'start_date', 'department', 'job_category']),
                'transferred_at' => null,
                'training_id' => null,
                'applicant_id' => $applicant->id,
            ]);
        }

        $this->command->info('✓ New hires created from ' . $hiredApplicants->count() . ' hired applicants!');
    }
}