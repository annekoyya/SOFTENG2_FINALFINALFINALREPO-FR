<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\AttendanceController;

// Payroll routes
Route::prefix('api/payrolls')->middleware('auth')->group(function () {
    // Get payroll summary
    Route::get('/summary', [PayrollController::class, 'getSummary']);
    
    // List payrolls with filters
    Route::get('/', [PayrollController::class, 'index']);
    
    // Get specific payroll
    Route::get('/{payroll}', [PayrollController::class, 'show']);
    
    // Calculate and create payroll
    Route::post('/calculate', [PayrollController::class, 'calculate']);
    
    // Update payroll
    Route::put('/{payroll}', [PayrollController::class, 'update']);
    
    // Submit for approval
    Route::post('/{payroll}/submit', [PayrollController::class, 'submitForApproval']);
    
    // Approve payroll
    Route::post('/{payroll}/approve', [PayrollController::class, 'approve']);
    
    // Reject payroll
    Route::post('/{payroll}/reject', [PayrollController::class, 'reject']);
    
    // Process payroll
    Route::post('/{payroll}/process', [PayrollController::class, 'process']);
    
    // Mark as paid
    Route::post('/{payroll}/mark-paid', [PayrollController::class, 'markAsPaid']);
    
    // Delete payroll (draft only)
    Route::delete('/{payroll}', [PayrollController::class, 'destroy']);
});

// Attendance routes
Route::prefix('api/attendance')->middleware('auth')->group(function () {
    // Clock in/out
    Route::post('/clock-in', [AttendanceController::class, 'clockIn']);
    Route::post('/clock-out', [AttendanceController::class, 'clockOut']);
    
    // Get real-time workforce status
    Route::get('/live-status', [AttendanceController::class, 'getLiveStatus']);
    
    // Get attendance records
    Route::get('/', [AttendanceController::class, 'getAttendance']);
    
    // Get attendance summary
    Route::get('/summary', [AttendanceController::class, 'getSummary']);
    
    // Get monthly statistics
    Route::get('/monthly-stats', [AttendanceController::class, 'getMonthlyStats']);
    
    // Manually mark attendance (HR only)
    Route::post('/mark', [AttendanceController::class, 'markAttendance']);
    
    // Process daily attendance
    Route::post('/process-daily', [AttendanceController::class, 'processDailyAttendance']);
});

// Leave request routes
Route::prefix('api/leave-requests')->middleware('auth')->group(function () {
    // Create leave request
    Route::post('/', [AttendanceController::class, 'createLeaveRequest']);
    
    // Get leave requests
    Route::get('/', [AttendanceController::class, 'getLeaveRequests']);
    
    // Approve leave request
    Route::post('/{leaveRequest}/approve', [AttendanceController::class, 'approveLeaveRequest']);
    
    // Reject leave request
    Route::post('/{leaveRequest}/reject', [AttendanceController::class, 'rejectLeaveRequest']);
});

