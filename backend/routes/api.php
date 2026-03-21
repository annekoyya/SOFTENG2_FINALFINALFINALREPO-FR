<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PayrollController;

/*
|--------------------------------------------------------------------------
| API Routes — routes/api.php
|--------------------------------------------------------------------------
| This file is auto-prefixed with /api by Laravel.
| DO NOT add 'api/' to any prefix here — it causes double-prefixing.
| e.g. prefix('employees') → accessible at /api/employees
|
| Auth: using 'auth:sanctum' (not plain 'auth') for stateless API token auth.
| Static routes (no wildcards) must come BEFORE wildcard routes /{model}
| to avoid Laravel matching /calculate or /summary as a model ID.
*/

// ─── Auth Routes (No middleware — public access) ──────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login',    [AuthController::class, 'login']);     // POST   /api/auth/login
    Route::post('/register', [AuthController::class, 'register']);  // POST   /api/auth/register
    Route::post('/logout',   [AuthController::class, 'logout'])->middleware('auth:sanctum');     // POST   /api/auth/logout (protected)
    Route::get('/me',        [AuthController::class, 'me'])->middleware('auth:sanctum');         // GET    /api/auth/me (protected)
});

// ─── Employee Routes ──────────────────────────────────────────────────────────
Route::prefix('employees')->middleware('auth:sanctum')->group(function () {

    // Static routes first — must be before /{employee}
    Route::get('/archived',               [EmployeeController::class, 'archived']);      // GET    /api/employees/archived

    // Collection
    Route::get('/',                       [EmployeeController::class, 'index']);         // GET    /api/employees
    Route::post('/',                      [EmployeeController::class, 'store']);         // POST   /api/employees

    // Wildcard — always last
    Route::get('/{employee}',             [EmployeeController::class, 'show']);          // GET    /api/employees/{id}
    Route::put('/{employee}',             [EmployeeController::class, 'update']);        // PUT    /api/employees/{id}
    Route::patch('/{employee}/status',    [EmployeeController::class, 'updateStatus']);  // PATCH  /api/employees/{id}/status
    Route::delete('/{employee}',          [EmployeeController::class, 'destroy']);       // DELETE /api/employees/{id}
    Route::post('/{id}/restore',          [EmployeeController::class, 'restore']);       // POST   /api/employees/{id}/restore
    Route::delete('/{id}/purge',          [EmployeeController::class, 'purge']);         // DELETE /api/employees/{id}/purge
});

// ─── Attendance Routes ────────────────────────────────────────────────────────
Route::prefix('attendance')->middleware('auth:sanctum')->group(function () {

    // Static routes first
    Route::post('/clock-in',              [AttendanceController::class, 'clockIn']);              // POST /api/attendance/clock-in
    Route::post('/clock-out',             [AttendanceController::class, 'clockOut']);             // POST /api/attendance/clock-out
    Route::get('/live-status',            [AttendanceController::class, 'getLiveStatus']);        // GET  /api/attendance/live-status
    Route::get('/summary',                [AttendanceController::class, 'getSummary']);           // GET  /api/attendance/summary
    Route::get('/monthly-stats',          [AttendanceController::class, 'getMonthlyStats']);      // GET  /api/attendance/monthly-stats
    Route::post('/mark',                  [AttendanceController::class, 'markAttendance']);       // POST /api/attendance/mark
    Route::post('/process-daily',         [AttendanceController::class, 'processDailyAttendance']); // POST /api/attendance/process-daily

    // Collection
    Route::get('/',                       [AttendanceController::class, 'getAttendance']);        // GET  /api/attendance
});

// ─── Leave Request Routes ─────────────────────────────────────────────────────
Route::prefix('leave-requests')->middleware('auth:sanctum')->group(function () {

    // Static routes first
    Route::get('/',                       [AttendanceController::class, 'getLeaveRequests']);     // GET  /api/leave-requests
    Route::post('/',                      [AttendanceController::class, 'createLeaveRequest']);   // POST /api/leave-requests

    // Wildcard — always last
    Route::post('/{leaveRequest}/approve',[AttendanceController::class, 'approveLeaveRequest']); // POST /api/leave-requests/{id}/approve
    Route::post('/{leaveRequest}/reject', [AttendanceController::class, 'rejectLeaveRequest']);  // POST /api/leave-requests/{id}/reject
});

// ─── Payroll Routes ───────────────────────────────────────────────────────────
Route::prefix('payrolls')->middleware('auth:sanctum')->group(function () {

    // Static routes first — MUST be before /{payroll} or Laravel
    // will match /calculate and /summary as payroll IDs → 404
    Route::get('/summary',                [PayrollController::class, 'getSummary']);              // GET  /api/payrolls/summary
    Route::post('/calculate',             [PayrollController::class, 'calculate']);               // POST /api/payrolls/calculate

    // Collection
    Route::get('/',                       [PayrollController::class, 'index']);                   // GET  /api/payrolls

    // Wildcard — always last
    Route::get('/{payroll}',              [PayrollController::class, 'show']);                    // GET  /api/payrolls/{id}
    Route::patch('/{payroll}',            [PayrollController::class, 'update']);                  // PATCH /api/payrolls/{id}
    Route::post('/{payroll}/submit',      [PayrollController::class, 'submitForApproval']);       // POST /api/payrolls/{id}/submit
    Route::post('/{payroll}/approve',     [PayrollController::class, 'approve']);                 // POST /api/payrolls/{id}/approve
    Route::post('/{payroll}/reject',      [PayrollController::class, 'reject']);                  // POST /api/payrolls/{id}/reject
    Route::post('/{payroll}/process',     [PayrollController::class, 'process']);                 // POST /api/payrolls/{id}/process
    Route::post('/{payroll}/mark-paid',   [PayrollController::class, 'markAsPaid']);              // POST /api/payrolls/{id}/mark-paid
    Route::delete('/{payroll}',           [PayrollController::class, 'destroy']);                 // DELETE /api/payrolls/{id}
});