<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');



// ══════════════════════════════════════════════════════════════════════════════
//  Add to backend/routes/console.php  — monthly accrual scheduler
//  (runs on the 1st of every month automatically)
// ══════════════════════════════════════════════════════════════════════════════

use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Http;

Schedule::call(function () {
    // POST to own API — or call the service method directly
    \App\Models\LeaveBalance::query(); // placeholder
    app(\App\Http\Controllers\LeaveBalanceController::class)->accrue();
})->monthlyOn(1, '00:05')->name('leave.monthly-accrual')->withoutOverlapping();

// Carry-over: runs on Jan 1 each year
Schedule::call(function () {
    app(\App\Http\Controllers\LeaveBalanceController::class)->carryOver();
})->yearlyOn(1, 1, '00:10')->name('leave.yearly-carry-over')->withoutOverlapping();


// ══════════════════════════════════════════════════════════════════════════════
//  First-time setup — run after php artisan migrate:
//
//  POST /api/leave-balances/seed
//    → seeds balances for all active employees for current year
//
//  Then set up the scheduler in crontab:
//    * * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
//
// ══════════════════════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════════════════════════
//  Add to frontend/src/App.tsx
//
//  import Leave from "@/pages/Leave";
//  <Route path="/leave" element={<Leave />} />
//
//  Add to DashboardLayout nav (visible to all roles):
//  { to: "/leave", label: "Leave", icon: CalendarOff }
//
// ══════════════════════════════════════════════════════════════════════════════o