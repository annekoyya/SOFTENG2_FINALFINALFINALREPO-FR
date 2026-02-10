<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Process daily attendance at 5:05 PM (17:05) - after shift end at 5:00 PM
        // This marks all employees without clock-out records as absent
        $schedule->post('/api/attendance/process-daily')
            ->dailyAt('17:05')
            ->name('attendance.process-daily')
            ->description('Mark unmarked employees as absent and process daily attendance records');

        // Optional: Clean up old attendance records (keep last 2 years)
        // $schedule->call(function () {
        //     \App\Models\Attendance::whereDate('created_at', '<', now()->subYears(2))->delete();
        // })->yearly();

        // Optional: Generate monthly attendance reports
        // $schedule->call(function () {
        //     \Log::info('Monthly attendance report generated');
        // })->monthlyOn(1, '08:00');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
