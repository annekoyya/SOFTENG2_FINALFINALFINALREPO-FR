<?php

namespace Database\Seeders;

use App\Models\LeaveRequest;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class LeaveRequestSeeder extends Seeder
{
    /**
     * Seed leave requests with pending and approved status.
     */
    public function run(): void
    {
        $employees = Employee::all();
        $hrUser = User::where('role', 'HR')->first();
        $adminUser = User::where('role', 'Admin')->first();

        $leaveTypes = ['vacation', 'sick', 'emergency', 'unpaid'];
        $statuses = ['pending', 'approved', 'approved', 'approved', 'rejected'];

        foreach ($employees as $employee) {
            // Create 1-3 leave requests per employee
            $numRequests = rand(1, 3);

            for ($i = 0; $i < $numRequests; $i++) {
                $startDate = Carbon::now()->addDays(rand(1, 60));
                $endDate = $startDate->copy()->addDays(rand(1, 5));

                $status = $statuses[array_rand($statuses)];
                $leaveType = $leaveTypes[array_rand($leaveTypes)];

                $request = LeaveRequest::create([
                    'employee_id' => $employee->id,
                    'start_date' => $startDate->toDateString(),
                    'end_date' => $endDate->toDateString(),
                    'leave_type' => $leaveType,
                    'status' => $status,
                    'number_of_days' => $startDate->diffInDays($endDate) + 1,
                    'hours_requested' => ($startDate->diffInDays($endDate) + 1) * 8,
                    'approver_id' => $status !== 'pending' ? ($hrUser?->id ?? 1) : null,
                    'approved_at' => $status !== 'pending' ? Carbon::now()->subDays(rand(1, 30)) : null,
                    'reason' => match($leaveType) {
                        'vacation' => 'Family vacation',
                        'sick' => 'Medical appointment',
                        'emergency' => 'Family emergency',
                        'unpaid' => 'Personal matters',
                        default => 'Leave request'
                    },
                    'contact_person' => 'John Doe',
                    'contact_phone' => '+63 917 123 4567',
                ]);

                // If approved, update approval_reason
                if ($status === 'approved') {
                    $request->update([
                        'approval_reason' => 'Approved for leave'
                    ]);
                }
            }
        }
    }
}