<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class AttendanceSeeder extends Seeder
{
    /**
     * Seed attendance records for the past 30 days.
     */
    public function run(): void
    {
        $employees = Employee::all();
        $startDate = Carbon::now()->subDays(30);
        $endDate = Carbon::now();

        $statuses = ['present', 'present', 'present', 'present', 'late', 'absent', 'on_leave'];
        $shifts = ['morning', 'afternoon', 'night'];

        foreach ($employees as $employee) {
            $currentDate = $startDate->copy();

            while ($currentDate <= $endDate) {
                // Skip weekends for some employees
                if ($currentDate->isWeekend() && rand(0, 1)) {
                    $currentDate->addDay();
                    continue;
                }

                $status = $statuses[array_rand($statuses)];
                $shift = $shifts[array_rand($shifts)];

                // For Present and Late, add check-in time
                $checkInTime = null;
                if ($status === 'present' || $status === 'late') {
                    $baseTime = match($shift) {
                        'morning' => Carbon::createFromTime(7, 0),
                        'afternoon' => Carbon::createFromTime(15, 0),
                        'night' => Carbon::createFromTime(23, 0),
                    };

                    // Add some randomness
                    $minutesOffset = rand(-15, 45); // Can be early or late
                    $checkInTime = $baseTime->copy()->addMinutes($minutesOffset);

                    // If more than 30 minutes late, mark as Late
                    if ($minutesOffset > 30) {
                        $status = 'late';
                    } else {
                        $status = 'present';
                    }
                }

                Attendance::create([
                    'employee_id' => $employee->id,
                    'date' => $currentDate->toDateString(),
                    'time_in' => $checkInTime?->toTimeString(),
                    'status' => strtolower($status),
                    'minutes_late' => max(0, $minutesOffset),
                    'hours_worked' => $status === 'Present' ? 8.0 : 0.0,
                    'notes' => $status === 'on_leave' ? 'Annual leave' : null,
                    'within_grace_period' => $minutesOffset >= -15 && $minutesOffset <= 15,
                ]);

                $currentDate->addDay();
            }
        }
    }
}
