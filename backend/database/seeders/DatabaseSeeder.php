<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Run all seeders in the correct order.
     * php artisan db:seed
     */
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,           // Default system users (admin, hr, accountant, etc.)
            EmployeeSeeder::class,        // Realistic employee records + matching user accounts
            NewHireSeeder::class,         // New hire onboarding records in various stages
            JobPostingSeeder::class,      // Job postings, applicants, interviews, job offers
            AttendanceSeeder::class,      // Attendance records for past 30 days
            LeaveRequestSeeder::class,    // Leave requests with various statuses
            PayrollSeeder::class,         // Payroll periods and payslips
            EvaluationSeeder::class,      // Performance evaluation forms and responses
            TrainingSeeder::class,        // Training courses and assignments
            DeductionCategorySeeder::class, // Deduction categories
        ]);
    }
}