<?php

namespace App\Console\Commands;

use App\Services\AttendanceService;
use Illuminate\Console\Command;

class ProcessDailyAttendance extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:process-daily {--date= : The date to process (default: today)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process daily attendance records - marks unmarked employees as absent';

    /**
     * Execute the console command.
     */
    public function handle(AttendanceService $attendanceService): int
    {
        $date = $this->option('date') ?? now()->toDateString();

        $this->info("Processing attendance records for {$date}...");

        try {
            // Process daily attendance
            $result = $attendanceService->processDailyAttendance($date);

            $this->info("✓ Successfully processed {$result} attendance records");
            $this->info("Employees marked as absent: " . ($result ?? 'N/A'));

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("✗ Error processing attendance: " . $e->getMessage());

            return Command::FAILURE;
        }
    }
}
