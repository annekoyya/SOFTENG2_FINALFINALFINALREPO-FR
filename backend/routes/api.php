<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PayrollController;

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
