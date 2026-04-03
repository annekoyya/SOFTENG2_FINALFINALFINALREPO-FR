<?php

namespace Database\Seeders;

use App\Models\JobPosting;
use App\Models\Applicant;
use App\Models\Interview;
use App\Models\JobOffer;
use Illuminate\Database\Seeder;

class JobPostingSeeder extends Seeder
{
    /**
     * Seed job postings, applicants, interviews, and job offers.
     */
    public function run(): void
    {
        // Create job postings
        $jobPostings = [
            [
                'title' => 'Front Desk Receptionist',
                'department' => 'Operations',
                'employment_type' => 'full_time',
                'location' => 'Blue Lotus Hotel, Davao City',
                'salary_min' => 15000,
                'salary_max' => 20000,
                'description' => 'Handle guest check-ins, manage reservations, and provide excellent customer service at the front desk.',
                'requirements' => 'High school diploma, excellent communication skills, customer service experience preferred.',
                'slots' => 2,
                'status' => 'open',
                'posted_by' => 1,
                'closes_at' => now()->addDays(30),
            ],
            [
                'title' => 'Housekeeping Supervisor',
                'department' => 'Operations',
                'employment_type' => 'full_time',
                'location' => 'Blue Lotus Hotel, Davao City',
                'salary_min' => 18000,
                'salary_max' => 25000,
                'description' => 'Oversee housekeeping staff, maintain cleanliness standards, and manage room assignments.',
                'requirements' => '2+ years housekeeping experience, leadership skills, attention to detail.',
                'slots' => 1,
                'status' => 'open',
                'posted_by' => 1,
                'closes_at' => now()->addDays(30),
            ],
            [
                'title' => 'Kitchen Assistant',
                'department' => 'Food & Beverage',
                'employment_type' => 'part_time',
                'location' => 'Blue Lotus Hotel, Davao City',
                'salary_min' => 12000,
                'salary_max' => 18000,
                'description' => 'Assist in food preparation, maintain kitchen cleanliness, and support cooking operations.',
                'requirements' => 'Basic cooking skills, food safety knowledge, physical stamina.',
                'slots' => 3,
                'status' => 'open',
                'posted_by' => 1,
                'closes_at' => now()->addDays(30),
            ],
            [
                'title' => 'Maintenance Technician',
                'department' => 'Engineering',
                'employment_type' => 'full_time',
                'location' => 'Blue Lotus Hotel, Davao City',
                'salary_min' => 20000,
                'salary_max' => 28000,
                'description' => 'Perform routine maintenance, repairs, and ensure all hotel facilities are in working order.',
                'requirements' => 'Technical skills, basic electrical/plumbing knowledge, physical fitness.',
                'slots' => 1,
                'status' => 'open',
                'posted_by' => 1,
                'closes_at' => now()->addDays(30),
            ],
            [
                'title' => 'Event Coordinator',
                'department' => 'Sales & Marketing',
                'employment_type' => 'contractual',
                'location' => 'Blue Lotus Hotel, Davao City',
                'salary_min' => 25000,
                'salary_max' => 35000,
                'description' => 'Coordinate weddings, corporate events, and special occasions at the hotel.',
                'requirements' => 'Event planning experience, excellent organizational skills.',
                'slots' => 1,
                'status' => 'open',
                'posted_by' => 1,
                'closes_at' => now()->addDays(30),
            ],
        ];

        foreach ($jobPostings as $posting) {
            JobPosting::create($posting);
        }

        // Create applicants
        $applicants = [
            [
                'job_posting_id' => 1,
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'email' => 'maria.santos@email.com',
                'phone' => '+63 917 123 4567',
                'address' => 'Davao City, Philippines',
                'resume_path' => null,
                'cover_letter' => 'I am excited to apply for the Front Desk Receptionist position...',
                'source' => 'online',
                'status' => 'interview',
                'rating' => 4,
                'notes' => 'Strong communication skills, previous hotel experience.',
                'applied_at' => now()->subDays(10),
            ],
            [
                'job_posting_id' => 1,
                'first_name' => 'Carlos',
                'last_name' => 'Reyes',
                'email' => 'carlos.reyes@email.com',
                'phone' => '+63 918 234 5678',
                'address' => 'Tagum City, Philippines',
                'resume_path' => null,
                'cover_letter' => 'I have 2 years of customer service experience...',
                'source' => 'walk_in',
                'status' => 'screening',
                'rating' => 3,
                'notes' => 'Good basic qualifications, needs interview.',
                'applied_at' => now()->subDays(5),
            ],
            [
                'job_posting_id' => 2,
                'first_name' => 'Ana',
                'last_name' => 'Garcia',
                'email' => 'ana.garcia@email.com',
                'phone' => '+63 919 345 6789',
                'address' => 'Panabo City, Philippines',
                'resume_path' => null,
                'cover_letter' => 'I have extensive housekeeping experience...',
                'source' => 'referral',
                'status' => 'hired',
                'rating' => 5,
                'notes' => 'Excellent candidate, hired immediately.',
                'applied_at' => now()->subDays(15),
            ],
            [
                'job_posting_id' => 3,
                'first_name' => 'Pedro',
                'last_name' => 'Lopez',
                'email' => 'pedro.lopez@email.com',
                'phone' => '+63 920 456 7890',
                'address' => 'Davao City, Philippines',
                'resume_path' => null,
                'cover_letter' => 'I am passionate about food service...',
                'source' => 'online',
                'status' => 'applied',
                'rating' => null,
                'notes' => 'New application, pending review.',
                'applied_at' => now()->subDays(2),
            ],
            [
                'job_posting_id' => 4,
                'first_name' => 'Rosa',
                'last_name' => 'Mendoza',
                'email' => 'rosa.mendoza@email.com',
                'phone' => '+63 921 567 8901',
                'address' => 'Digos City, Philippines',
                'resume_path' => null,
                'cover_letter' => 'I have technical skills in maintenance...',
                'source' => 'agency',
                'status' => 'offer',
                'rating' => 4,
                'notes' => 'Technical skills verified, offer extended.',
                'applied_at' => now()->subDays(8),
            ],
        ];

        foreach ($applicants as $applicant) {
            Applicant::create($applicant);
        }

        // Create interviews
        $interviews = [
            [
                'applicant_id' => 1,
                'interview_type' => 'onsite',
                'scheduled_at' => now()->addDays(2)->setTime(10, 0),
                'location' => 'Blue Lotus Hotel, Conference Room A',
                'interviewer_id' => 2, // HR
                'result' => 'pending',
                'feedback' => null,
            ],
            [
                'applicant_id' => 5,
                'interview_type' => 'onsite',
                'scheduled_at' => now()->addDays(1)->setTime(14, 0),
                'location' => 'Blue Lotus Hotel, HR Office',
                'interviewer_id' => 2,
                'result' => 'pending',
                'feedback' => null,
            ],
        ];

        foreach ($interviews as $interview) {
            Interview::create($interview);
        }

        // Create job offers
        $jobOffers = [
            [
                'applicant_id' => 3,
                'job_posting_id' => 2,
                'offered_salary' => 18000.00,
                'start_date' => now()->addDays(30)->toDateString(),
                'status' => 'accepted',
                'notes' => 'Welcome to the team!',
                'offered_by' => 2,
                'expires_at' => now()->addDays(7),
            ],
        ];

        foreach ($jobOffers as $offer) {
            JobOffer::create($offer);
        }
    }
}