<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EvaluationFormController;
use App\Http\Controllers\KpiController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\NewHireController;
use App\Http\Controllers\RecruitmentController;
use App\Http\Controllers\PayslipController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\LeaveBalanceController;

// backend/routes/api.php
// ADD all of these inside your Route::middleware('auth:sanctum') block



// ── Attendance (FIX #6, #7, #8) ───────────────────────────────────────────────
Route::prefix('attendance')->group(function () {
    Route::get('/',              [AttendanceController::class, 'index']);
    Route::get('/live-status',   [AttendanceController::class, 'liveStatus']);
    Route::get('/monthly-stats', [AttendanceController::class, 'monthlyStats']);
    Route::get('/export',        [AttendanceController::class, 'export']);
    Route::post('/import',       [AttendanceController::class, 'import']);
    Route::post('/manual',       [AttendanceController::class, 'manual']);
});

// ── Leave Requests (FIX #9) ───────────────────────────────────────────────────
Route::prefix('leave-requests')->group(function () {
    Route::get('/',              [LeaveController::class, 'index']);
    Route::post('/',             [LeaveController::class, 'store']);
    Route::post('/{id}/approve', [LeaveController::class, 'approve']);
    Route::post('/{id}/reject',  [LeaveController::class, 'reject']);
    Route::post('/{id}/cancel',  [LeaveController::class, 'cancel']);
});

// ── Leave Balances ────────────────────────────────────────────────────────────
Route::prefix('leave-balances')->group(function () {
    Route::get('/',        [LeaveController::class, 'balances']);
    Route::post('/seed',   [LeaveController::class, 'seedBalances']);
    Route::post('/accrue', [LeaveController::class, 'accrue']);
});

// ── Payroll PDF (FIX #11) — must be inside auth middleware ───────────────────
Route::get('/payroll-periods/{periodId}/summary-pdf', [App\Http\Controllers\PayslipController::class, 'summaryPdf']);

// ── Evaluations — add send route if missing (needed for drafts) ──────────────
Route::post('/evaluations/{form}/send', [App\Http\Controllers\EvaluationFormController::class, 'send']);

// ── Employees ─────────────────────────────────────────────────────────────────
// Static sub-routes MUST come before {employee} wildcard
Route::prefix('employees')->group(function () {
    Route::get('/departments',    [EmployeeController::class, 'getDepartments']);
    Route::get('/job-categories', [EmployeeController::class, 'getJobCategories']);
    Route::get('/salary-mapping', [EmployeeController::class, 'getSalaryMapping']);
    Route::get('/archived',       [EmployeeController::class, 'archived']);

    Route::get('/',    [EmployeeController::class, 'index']);
    Route::post('/',   [EmployeeController::class, 'store']);

    Route::get('/{employee}',    [EmployeeController::class, 'show']);
    Route::put('/{employee}',    [EmployeeController::class, 'update']);
    Route::delete('/{employee}', [EmployeeController::class, 'destroy']);

    Route::patch('/{employee}/status', [EmployeeController::class, 'updateStatus']);
    Route::patch('/{employee}/role',   [EmployeeController::class, 'updateRole']);

    Route::post('/{id}/restore', [EmployeeController::class, 'restore']);
    Route::delete('/{id}/purge', [EmployeeController::class, 'purge']);
    Route::get('/{id}/export',   [EmployeeController::class, 'export']);
});

// ── New Hires ─────────────────────────────────────────────────────────────────
Route::prefix('new-hires')->group(function () {
    Route::get('/',    [NewHireController::class, 'index']);
    Route::post('/',   [NewHireController::class, 'store']);
    Route::get('/{id}',    [NewHireController::class, 'show']);
    Route::put('/{id}',    [NewHireController::class, 'update']);
    Route::delete('/{id}', [NewHireController::class, 'destroy']);
    Route::post('/{id}/transfer',        [RecruitmentController::class, 'transferToEmployee']);
    Route::post('/{id}/complete-details', [RecruitmentController::class, 'completeNewHireDetails']);
});

// ── Recruitment ───────────────────────────────────────────────────────────────
Route::prefix('recruitment')->group(function () {
    // Job Postings
    Route::get('/job-postings',       [RecruitmentController::class, 'getJobPostings']);
    Route::post('/job-postings',      [RecruitmentController::class, 'createJobPosting']);
    Route::put('/job-postings/{id}',  [RecruitmentController::class, 'updateJobPosting']);
    Route::delete('/job-postings/{id}', [RecruitmentController::class, 'deleteJobPosting']);

    // Applicants
    Route::get('/applicants',         [RecruitmentController::class, 'getApplicants']);
    Route::post('/applicants',        [RecruitmentController::class, 'createApplicant']);

    // Interviews
    Route::get('/interviews',         [RecruitmentController::class, 'getInterviews']);
    Route::post('/interviews',        [RecruitmentController::class, 'scheduleInterview']);
    Route::get('/interviewers',       [RecruitmentController::class, 'getInterviewers']);

    // Training
    Route::get('/training-assignments',                              [RecruitmentController::class, 'getTrainingAssignments']);
    Route::post('/training-assignments/{id}/assign-trainer',        [RecruitmentController::class, 'assignTrainer']);
    Route::post('/training-assignments/{id}/complete',              [RecruitmentController::class, 'completeTraining']);

    // New Hires (recruitment side)
    Route::post('/new-hires/{id}/complete-details', [RecruitmentController::class, 'completeNewHireDetails']);
});

// These sit outside /recruitment prefix (existing routes kept)
Route::patch('/recruitment/applicants/{id}/stage',  [RecruitmentController::class, 'updateApplicantStage']);
Route::post('/applicants/{id}/hire',                [RecruitmentController::class, 'hireApplicant']);
Route::post('/applicants/{id}/reject',              [RecruitmentController::class, 'rejectApplicant']);
Route::post('/interviews/{id}/complete',            [RecruitmentController::class, 'completeInterview']);


// ─── Public ─────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// ─── Protected ─────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);
});
// ─── Protected ────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout',          [AuthController::class, 'logout']);
        Route::get('/me',               [AuthController::class, 'me']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // ── Employees ─────────────────────────────────────────────────────────
    Route::prefix('employees')->group(function () {
        Route::get('/departments',         [EmployeeController::class, 'getDepartments']);
        Route::get('/job-categories',      [EmployeeController::class, 'getJobCategories']);
        Route::get('/salary-mapping',      [EmployeeController::class, 'getSalaryMapping']);
        Route::get('/archived',            [EmployeeController::class, 'archived']);
        Route::get('/',                    [EmployeeController::class, 'index']);
        Route::post('/',                   [EmployeeController::class, 'store']);
        Route::get('/{employee}',          [EmployeeController::class, 'show']);
        Route::put('/{employee}',          [EmployeeController::class, 'update']);
        Route::delete('/{employee}',       [EmployeeController::class, 'destroy']);
        Route::patch('/{employee}/status', [EmployeeController::class, 'updateStatus']);
        Route::patch('/{employee}/role',   [EmployeeController::class, 'updateRole']);
        Route::get('/{id}/export',         [EmployeeController::class, 'export']);
        Route::post('/{id}/restore',       [EmployeeController::class, 'restore']);
        Route::delete('/{id}/purge',       [EmployeeController::class, 'purge']);
    });

    // ── Attendance ────────────────────────────────────────────────────────
    Route::prefix('attendance')->group(function () {
        Route::get('/',              [AttendanceController::class, 'index']);
        Route::get('/live-status',   [AttendanceController::class, 'liveStatus']);
        Route::get('/monthly-stats', [AttendanceController::class, 'monthlyStats']);
        Route::get('/export',        [AttendanceController::class, 'export']);
        Route::post('/import',       [AttendanceController::class, 'import']);
        Route::post('/manual',       [AttendanceController::class, 'manual']);
    });

    // ── Leave ─────────────────────────────────────────────────────────────
    Route::prefix('leave-requests')->group(function () {
        Route::get('/',              [LeaveController::class, 'index']);
        Route::post('/',             [LeaveController::class, 'store']);
        Route::get('/pending',       [LeaveController::class, 'pending']);
        Route::post('/{id}/approve', [LeaveController::class, 'approve']);
        Route::post('/{id}/reject',  [LeaveController::class, 'reject']);
        Route::post('/{id}/cancel',  [LeaveController::class, 'cancel']);
    });

    Route::prefix('leave-balances')->group(function () {
        Route::get('/',            [LeaveBalanceController::class, 'index']);
        Route::post('/adjust',     [LeaveBalanceController::class, 'adjust']);
        Route::post('/accrue',     [LeaveBalanceController::class, 'accrue']);
        Route::post('/carry-over', [LeaveBalanceController::class, 'carryOver']);
        Route::post('/seed',       [LeaveBalanceController::class, 'seed']);
    });

    // ── Payroll Periods ───────────────────────────────────────────────────
    Route::prefix('payroll-periods')->group(function () {
        Route::get('/',                       [PayslipController::class, 'listPeriods']);
        Route::post('/',                      [PayslipController::class, 'createPeriod']);
        Route::post('/generate-next',         [PayslipController::class, 'generateNextPeriod']);
        Route::get('/{periodId}/summary-pdf', [PayslipController::class, 'summaryPdf']);
    });

    // ── Payslips ──────────────────────────────────────────────────────────
    Route::prefix('payslips')->group(function () {
        Route::get('/',                       [PayslipController::class, 'index']);
        Route::get('/summary',                [PayslipController::class, 'summary']);
        Route::get('/audit-trail',            [PayslipController::class, 'auditTrail']);
        Route::post('/compute',               [PayslipController::class, 'computeSingle']);
        Route::post('/compute-all',           [PayslipController::class, 'computeAll']);
        Route::post('/bulk-send-email',       [PayslipController::class, 'bulkSendEmail']);
        Route::post('/approve-all/{period}',  [PayslipController::class, 'approveAll']);
        Route::get('/{payslip}',              [PayslipController::class, 'show']);
        Route::post('/{payslip}/adjust',      [PayslipController::class, 'adjust']);
        Route::post('/{payslip}/approve',     [PayslipController::class, 'approve']);
        Route::post('/{payslip}/pay',         [PayslipController::class, 'markPaid']);
        Route::post('/{payslip}/send-email',  [PayslipController::class, 'sendEmail']);
        Route::get('/{payslip}/pdf',          [PayslipController::class, 'downloadPdf']);
    });

    // ── Evaluations ───────────────────────────────────────────────────────
    Route::prefix('evaluations')->group(function () {
        Route::get('/my-assignments',                   [EvaluationFormController::class, 'myAssignments']);
        Route::get('/assignments/{assignment}',         [EvaluationFormController::class, 'getAssignment']);
        Route::post('/assignments/{assignment}/submit', [EvaluationFormController::class, 'submitAssignment']);
        Route::get('/',                                 [EvaluationFormController::class, 'index']);
        Route::post('/',                                [EvaluationFormController::class, 'store']);
        Route::get('/{form}/analytics',                 [EvaluationFormController::class, 'analytics']);
        Route::get('/{form}',                           [EvaluationFormController::class, 'show']);
        Route::put('/{form}',                           [EvaluationFormController::class, 'update']);
        Route::delete('/{form}',                        [EvaluationFormController::class, 'destroy']);
        Route::post('/{form}/close',                    [EvaluationFormController::class, 'close']);
        Route::post('/{form}/send',                     [EvaluationFormController::class, 'send']);
    });

    // ── Recruitment ───────────────────────────────────────────────────────
   // Inside Route::middleware('auth:sanctum')->group(function () {

Route::prefix('recruitment')->group(function () {
    // Job Postings
    Route::get('/job-postings', [RecruitmentController::class, 'getJobPostings']);
    Route::post('/job-postings', [RecruitmentController::class, 'createJobPosting']);
    Route::put('/job-postings/{id}', [RecruitmentController::class, 'updateJobPosting']);
    Route::delete('/job-postings/{id}', [RecruitmentController::class, 'deleteJobPosting']);

    // Applicants
    Route::get('/applicants', [RecruitmentController::class, 'getApplicants']);
    Route::post('/applicants', [RecruitmentController::class, 'createApplicant']);
    Route::patch('/applicants/{id}/stage', [RecruitmentController::class, 'updateApplicantStage']);
    Route::post('/applicants/{id}/hire', [RecruitmentController::class, 'hireApplicant']);
    Route::post('/applicants/{id}/reject', [RecruitmentController::class, 'rejectApplicant']);

    // Interviews
    Route::get('/interviews', [RecruitmentController::class, 'getInterviews']);
    Route::post('/interviews', [RecruitmentController::class, 'scheduleInterview']);
    Route::patch('/interviews/{id}/status', [RecruitmentController::class, 'updateInterviewStatus']);
    Route::post('/interviews/{id}/complete', [RecruitmentController::class, 'completeInterview']);

    // Trainings
    Route::get('/trainings', [RecruitmentController::class, 'getTrainings']);
    Route::post('/trainings', [RecruitmentController::class, 'createTraining']);
    Route::delete('/trainings/{id}', [RecruitmentController::class, 'deleteTraining']);
    Route::post('/trainings/assign', [RecruitmentController::class, 'assignTraining']);
    Route::get('/training-assignments', [RecruitmentController::class, 'getTrainingAssignments']);
    Route::patch('/training-assignments/{id}/status', [RecruitmentController::class, 'updateTrainingStatus']);
    Route::post('/training-assignments/{id}/assign-trainer', [RecruitmentController::class, 'assignTrainer']);
    Route::post('/training-assignments/{id}/complete', [RecruitmentController::class, 'completeTraining']);

    // New Hires
    Route::get('/new-hires', [RecruitmentController::class, 'getNewHires']);
    Route::post('/new-hires/{id}/complete-details', [RecruitmentController::class, 'completeNewHireDetails']);
    Route::post('/new-hires/{id}/transfer', [RecruitmentController::class, 'transferToEmployee']);
});  // ← This closes the recruitment prefix group

    // ── Performance ───────────────────────────────────────────────────────
    Route::prefix('performance')->group(function () {
        Route::get('/kpis',            [KpiController::class, 'index']);
        Route::post('/kpis',           [KpiController::class, 'store']);
        Route::get('/kpis/{kpi}',      [KpiController::class, 'show']);
        Route::put('/kpis/{kpi}',      [KpiController::class, 'update']);
        Route::delete('/kpis/{kpi}',   [KpiController::class, 'destroy']);

        Route::get('/goals',           [GoalController::class, 'index']);
        Route::post('/goals',          [GoalController::class, 'store']);
        Route::get('/goals/{goal}',    [GoalController::class, 'show']);
        Route::put('/goals/{goal}',    [GoalController::class, 'update']);
        Route::delete('/goals/{goal}', [GoalController::class, 'destroy']);
    });

    // ── New Hires (standalone CRUD via NewHireController) ─────────────────
// Separate new-hires routes (if you have NewHireController)
Route::prefix('new-hires')->group(function () {
    Route::get('/', [NewHireController::class, 'index']);
    Route::post('/', [NewHireController::class, 'store']);
    Route::get('/{newHire}', [NewHireController::class, 'show']);
    Route::put('/{newHire}', [NewHireController::class, 'update']);
    Route::delete('/{newHire}', [NewHireController::class, 'destroy']);
    Route::post('/{id}/transfer', [RecruitmentController::class, 'transferToEmployee']); // Add this line
});

    // ── Users ─────────────────────────────────────────────────────────────
    Route::get('/users', function (\Illuminate\Http\Request $request) {
        $query = \App\Models\User::query();
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }
        return response()->json([
            'success' => true,
            'data'    => $query->get(['id', 'name', 'email', 'role']),
        ]);
    });
});