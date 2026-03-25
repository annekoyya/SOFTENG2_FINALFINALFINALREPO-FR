<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\EvaluationFormController;
use App\Http\Controllers\KpiController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\NewHireController;

/*
|--------------------------------------------------------------------------
| API Routes — routes/api.php
|--------------------------------------------------------------------------
| Auto-prefixed with /api by Laravel. Never add 'api/' to prefixes here.
| Static routes must come BEFORE wildcard /{model} routes.
*/

// ─── Auth (Public) ────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

Route::prefix('auth')->middleware('auth:sanctum')->group(function () {
    Route::post('/logout',          [AuthController::class, 'logout']);
    Route::get('/me',               [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
});

// ─── Employee Routes ──────────────────────────────────────────────────────────
Route::prefix('employees')->middleware('auth:sanctum')->group(function () {
    Route::get('/archived',             [EmployeeController::class, 'archived']);
    Route::get('/',                     [EmployeeController::class, 'index']);
    Route::post('/',                    [EmployeeController::class, 'store']);
    Route::get('/{employee}',           [EmployeeController::class, 'show']);
    Route::put('/{employee}',           [EmployeeController::class, 'update']);
    Route::patch('/{employee}/status',  [EmployeeController::class, 'updateStatus']);
    Route::delete('/{employee}',        [EmployeeController::class, 'destroy']);
    Route::post('/{id}/restore',        [EmployeeController::class, 'restore']);
    Route::delete('/{id}/purge',        [EmployeeController::class, 'purge']);
});

// ─── Attendance Routes ────────────────────────────────────────────────────────
Route::prefix('attendance')->middleware('auth:sanctum')->group(function () {
    Route::post('/clock-in',        [AttendanceController::class, 'clockIn']);
    Route::post('/clock-out',       [AttendanceController::class, 'clockOut']);
    Route::get('/live-status',      [AttendanceController::class, 'getLiveStatus']);
    Route::get('/summary',          [AttendanceController::class, 'getSummary']);
    Route::get('/monthly-stats',    [AttendanceController::class, 'getMonthlyStats']);
    Route::post('/mark',            [AttendanceController::class, 'markAttendance']);
    Route::post('/process-daily',   [AttendanceController::class, 'processDailyAttendance']);
    Route::get('/',                 [AttendanceController::class, 'getAttendance']);
});

// ─── Leave Request Routes ─────────────────────────────────────────────────────
Route::prefix('leave-requests')->middleware('auth:sanctum')->group(function () {
    Route::get('/',                            [AttendanceController::class, 'getLeaveRequests']);
    Route::post('/',                           [AttendanceController::class, 'createLeaveRequest']);
    Route::post('/{leaveRequest}/approve',     [AttendanceController::class, 'approveLeaveRequest']);
    Route::post('/{leaveRequest}/reject',      [AttendanceController::class, 'rejectLeaveRequest']);
});

// ─── Payroll Routes ───────────────────────────────────────────────────────────
Route::prefix('payrolls')->middleware('auth:sanctum')->group(function () {
    Route::get('/summary',              [PayrollController::class, 'getSummary']);
    Route::post('/calculate',           [PayrollController::class, 'calculate']);
    Route::get('/',                     [PayrollController::class, 'index']);
    Route::get('/{payroll}',            [PayrollController::class, 'show']);
    Route::patch('/{payroll}',          [PayrollController::class, 'update']);
    Route::post('/{payroll}/submit',    [PayrollController::class, 'submitForApproval']);
    Route::post('/{payroll}/approve',   [PayrollController::class, 'approve']);
    Route::post('/{payroll}/reject',    [PayrollController::class, 'reject']);
    Route::post('/{payroll}/process',   [PayrollController::class, 'process']);
    Route::post('/{payroll}/mark-paid', [PayrollController::class, 'markAsPaid']);
    Route::delete('/{payroll}',         [PayrollController::class, 'destroy']);
});

Route::prefix('new-hires')->middleware('auth:sanctum')->group(function () {
    Route::get('/',             [NewHireController::class, 'index']);
    Route::post('/',            [NewHireController::class, 'store']);
    Route::get('/{newHire}',    [NewHireController::class, 'show']);
    Route::put('/{newHire}',    [NewHireController::class, 'update']);
    Route::delete('/{newHire}', [NewHireController::class, 'destroy']);
});

// Add these routes to backend/routes/api.php

// ─── Payroll Periods ──────────────────────────────────────────────────────────
Route::prefix('payroll-periods')->middleware('auth:sanctum')->group(function () {
    Route::get('/',            [\App\Http\Controllers\PayslipController::class, 'listPeriods']);
    Route::post('/',           [\App\Http\Controllers\PayslipController::class, 'createPeriod']);
    Route::post('/generate-next', [\App\Http\Controllers\PayslipController::class, 'generateNextPeriod']);
});

// ─── Payslips ─────────────────────────────────────────────────────────────────
Route::prefix('payslips')->middleware('auth:sanctum')->group(function () {
    // Static routes before wildcards
    Route::get('/summary',          [\App\Http\Controllers\PayslipController::class, 'summary']);
    Route::get('/audit-trail',      [\App\Http\Controllers\PayslipController::class, 'auditTrail']);
    Route::post('/compute',         [\App\Http\Controllers\PayslipController::class, 'computeSingle']);
    Route::post('/compute-all',     [\App\Http\Controllers\PayslipController::class, 'computeAll']);

    Route::get('/',                 [\App\Http\Controllers\PayslipController::class, 'index']);
    Route::get('/{payslip}',        [\App\Http\Controllers\PayslipController::class, 'show']);
    Route::post('/{payslip}/adjust',  [\App\Http\Controllers\PayslipController::class, 'adjust']);
    Route::post('/{payslip}/approve', [\App\Http\Controllers\PayslipController::class, 'approve']);
    Route::post('/{payslip}/pay',     [\App\Http\Controllers\PayslipController::class, 'markPaid']);
});

// PDF + Email
Route::get('/payslips/{payslip}/pdf',           [\App\Http\Controllers\PayslipPdfController::class, 'download']);
Route::post('/payslips/{payslip}/send-email',   [\App\Http\Controllers\PayslipPdfController::class, 'sendEmail']);
Route::post('/payslips/bulk-send-email',        [\App\Http\Controllers\PayslipPdfController::class, 'bulkSendEmail']);
Route::get('/payroll-periods/{period}/summary-pdf', [\App\Http\Controllers\PayslipPdfController::class, 'summaryPdf']);
// ─── Evaluation Routes ────────────────────────────────────────────────────────
Route::prefix('evaluations')->middleware('auth:sanctum')->group(function () {
    // Static routes FIRST — before /{form} wildcard
    Route::get('/my-assignments',                   [EvaluationFormController::class, 'myAssignments']);
    Route::get('/assignments/{assignment}',         [EvaluationFormController::class, 'getAssignment']);
    Route::post('/assignments/{assignment}/submit', [EvaluationFormController::class, 'submitAssignment']);

    // Collection
    Route::get('/',                                 [EvaluationFormController::class, 'index']);
    Route::post('/',                                [EvaluationFormController::class, 'store']);

    // Wildcard — always last
    Route::get('/{form}/analytics',                 [EvaluationFormController::class, 'analytics']);
    Route::get('/{form}',                           [EvaluationFormController::class, 'show']);
    Route::put('/{form}',                           [EvaluationFormController::class, 'update']);
    Route::delete('/{form}',                        [EvaluationFormController::class, 'destroy']);
});

// ─── Performance — KPIs & Goals ───────────────────────────────────────────────
Route::prefix('performance')->middleware('auth:sanctum')->group(function () {
    // KPIs
    Route::get('/kpis',                   [KpiController::class, 'index']);
    Route::post('/kpis',                  [KpiController::class, 'store']);
    Route::get('/kpis/{kpi}',             [KpiController::class, 'show']);
    Route::put('/kpis/{kpi}',             [KpiController::class, 'update']);
    Route::patch('/kpis/{kpi}/progress',  [KpiController::class, 'updateProgress']);
    Route::delete('/kpis/{kpi}',          [KpiController::class, 'destroy']);

    // Goals
    Route::get('/goals',                  [GoalController::class, 'index']);
    Route::post('/goals',                 [GoalController::class, 'store']);
    Route::get('/goals/{goal}',           [GoalController::class, 'show']);
    Route::put('/goals/{goal}',           [GoalController::class, 'update']);
    Route::patch('/goals/{goal}/progress',[GoalController::class, 'updateProgress']);
    Route::delete('/goals/{goal}',        [GoalController::class, 'destroy']);
});

// TODO: Implement PayrollBonusController
// Route::get('/payroll-periods/{period}/bonuses',  [PayrollBonusController::class, 'index']);
// Route::post('/payroll-periods/{period}/bonuses', [PayrollBonusController::class, 'store']);
// Route::post('/payroll-bonuses/{bonus}/approve',  [PayrollBonusController::class, 'approve']);
// Route::post('/payroll-bonuses/{bonus}/reject',   [PayrollBonusController::class, 'reject']);
// Route::delete('/payroll-bonuses/{bonus}',        [PayrollBonusController::class, 'destroy']);
 
// TODO: Implement PayslipAdjustmentController
// Route::patch('/payslips/{payslip}/adjust',       [PayslipAdjustmentController::class, 'adjust']);
 
// TODO: Implement DeductionCategoryController
// Route::get('/deduction-categories',              [DeductionCategoryController::class, 'index']);
// Route::post('/deduction-categories',             [DeductionCategoryController::class, 'store']);
// Route::delete('/deduction-categories/{id}',      [DeductionCategoryController::class, 'destroy']);

// TODO: Implement JobPostingController
// Route::get('/recruitment/stats',    [JobPostingController::class, 'stats']);
// Route::get('/recruitment/pipeline', [JobPostingController::class, 'pipeline']);
// Route::get('/job-postings',           [JobPostingController::class, 'index']);
// Route::post('/job-postings',          [JobPostingController::class, 'store']);
// Route::patch('/job-postings/{id}',    [JobPostingController::class, 'update']);
// Route::post('/job-postings/{id}/close', [JobPostingController::class, 'close']);
 
// TODO: Implement ApplicantController
// Route::get('/applicants',                     [ApplicantController::class, 'index']);
// Route::post('/applicants',                    [ApplicantController::class, 'store']);
// Route::patch('/applicants/{id}/status',       [ApplicantController::class, 'updateStatus']);
// Route::patch('/applicants/{id}/rate',         [ApplicantController::class, 'rate']);
 
// TODO: Implement InterviewController
// Route::get('/interviews',                     [InterviewController::class, 'index']);
// Route::post('/interviews',                    [InterviewController::class, 'store']);
// Route::patch('/interviews/{id}/result',       [InterviewController::class, 'updateResult']);
 
// TODO: Implement JobOfferController
// Route::get('/job-offers',                     [JobOfferController::class, 'index']);
// Route::post('/job-offers',                    [JobOfferController::class, 'store']);
// Route::post('/job-offers/{id}/respond',       [JobOfferController::class, 'respond']);
// Route::post('/job-offers/{id}/convert',       [JobOfferController::class, 'convert']);
 
// ══════════════════════════════════════════════════════════════════════════════
//  Add to backend/routes/api.php  (inside auth:sanctum middleware)
// ══════════════════════════════════════════════════════════════════════════════

// TODO: Implement LeaveBalanceController
// Route::get('/leave-balances',               [LeaveBalanceController::class, 'index']);
// Route::post('/leave-balances/adjust',       [LeaveBalanceController::class, 'adjust']);
// Route::post('/leave-balances/accrue',       [LeaveBalanceController::class, 'accrue']);
// Route::post('/leave-balances/carry-over',   [LeaveBalanceController::class, 'carryOver']);
// Route::post('/leave-balances/seed',         [LeaveBalanceController::class, 'seed']);

// TODO: Implement LeaveRequestController
// Route::get('/leave-requests',                     [LeaveRequestController::class, 'index']);
// Route::post('/leave-requests',                    [LeaveRequestController::class, 'store']);
// Route::post('/leave-requests/{id}/approve',       [LeaveRequestController::class, 'approve']);
// Route::post('/leave-requests/{id}/reject',        [LeaveRequestController::class, 'reject']);
// Route::post('/leave-requests/{id}/cancel',        [LeaveRequestController::class, 'cancel']);

// ══════════════════════════════════════════════════════════════════════════════
//  ROUTES — add to backend/routes/api.php (inside sanctum middleware)
// ══════════════════════════════════════════════════════════════════════════════
//
//  Route::get('/overtime-requests/stats',        [OvertimeController::class, 'stats']);
//  Route::get('/overtime-requests',              [OvertimeController::class, 'index']);
//  Route::post('/overtime-requests',             [OvertimeController::class, 'store']);
//  Route::post('/overtime-requests/{id}/approve',[OvertimeController::class, 'approve']);
//  Route::post('/overtime-requests/{id}/reject', [OvertimeController::class, 'reject']);
//
//
//  FRONTEND WIRING — add to App.tsx + DashboardLayout nav:
//
//  import Overtime from "@/pages/Overtime";
//  <Route path="/overtime" element={<Overtime />} />
//  Nav: { to: "/overtime", label: "Overtime", icon: Clock }
//  Visible to: all roles (employees file, managers approve)
//
//
//  PAYSLIP SERVICE INTEGRATION:
//  In PayslipService::compute(), after building earnings:
//
//  $approvedOT = OvertimeRequest::where('employee_id', $employee->id)
//      ->where('status', 'approved')
//      ->whereNull('payslip_id')
//      ->whereMonth('date', $period->month)
//      ->get();
//
//  $otTotal = $approvedOT->sum('computed_amount');
//
//  // After payslip created:
//  $approvedOT->each(fn($ot) => $ot->update([
//      'status'     => 'paid',
//      'payslip_id' => $payslip->id,
//  ]));
// ══════════════════════════════════════════════════════════════════════════════
 

// ══════════════════════════════════════════════════════════════════════════════
//  ROUTES — add to backend/routes/api.php
//
//  Route::get('/salary-revisions',  [SalaryRevisionController::class, 'index']);
//  Route::post('/salary-revisions', [SalaryRevisionController::class, 'store']);
//
//  FRONTEND — App.tsx:
//  import SalaryRevision from "@/pages/SalaryRevision";
//  <Route path="/salary-revisions" element={<SalaryRevision />} />
//  Nav: { to: "/salary-revisions", label: "Salary history", icon: TrendingUp }
//       Visible to: Admin, HR Manager only
// ══════════════════════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════════════════════════
//  ROUTES — add to backend/routes/api.php
//
//  Route::get('/holidays',           [HolidayController::class, 'index']);
//  Route::post('/holidays',          [HolidayController::class, 'store']);
//  Route::delete('/holidays/{id}',   [HolidayController::class, 'destroy']);
//  Route::get('/holidays/check',     [HolidayController::class, 'check']);
//
//  FRONTEND — App.tsx:
//  import HolidayCalendar from "@/pages/HolidayCalendar";
//  <Route path="/holidays" element={<HolidayCalendar />} />
//  Nav: { to: "/holidays", label: "Holidays", icon: CalendarDays }  — Admin/HR only
//
//  SEEDER — DatabaseSeeder.php:
//  $this->call(HolidaySeeder::class);
// ══════════════════════════════════════════════════════════════════════════════


// TODO: Implement DashboardController
// Route::get('/dashboard/stats',            [DashboardController::class, 'stats']);

// TODO: Implement NotificationController
// Route::get('/notifications',              [NotificationController::class, 'index']);
// Route::post('/notifications/{id}/read',   [NotificationController::class, 'markRead']);
// Route::post('/notifications/read-all',    [NotificationController::class, 'markAllRead']);

// ══════════════════════════════════════════════════════════════════════════════
//  ROUTES — add to backend/routes/api.php
//  Route::get('/reports/generate', [ReportController::class, 'generate']);
//
// ══════════════════════════════════════════════════════════════════════════════
//  BLADE VIEWS — split all_report_blades.blade.php into separate files:
//
//  resources/views/reports/payroll_register.blade.php    ← payroll_register.blade.php
//  resources/views/reports/attendance_report.blade.php   ← first block
//  resources/views/reports/leave_balance.blade.php       ← second block
//  resources/views/reports/tax_certificate.blade.php     ← third block
//  resources/views/reports/overtime_summary.blade.php    ← fourth block
//  resources/views/reports/government_remittance.blade.php ← fifth block
//
//  Each block is separated by {{-- ══ ... ══ --}} comments in the combined file.
//  Create the resources/views/reports/ directory first:
//    mkdir -p resources/views/reports
//
// ══════════════════════════════════════════════════════════════════════════════
//  FRONTEND — App.tsx:
//  import Reports from "@/pages/Reports";
//  <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
//
//  Sidebar.tsx — add to nav (after Salary history, visible to Admin/Accountant/HR):
//  { label: "Reports", path: "/reports", icon: FileText, roles: ["Admin","Accountant","HR Manager"], divider: false }
//

// NOTE: Duplicate notification routes below (commented out)
// Uncomment the correct implementation below
// TODO: Implement NotificationController
// Route::get('/notifications',              [NotificationController::class, 'index']);
// Route::post('/notifications/{id}/read',   [NotificationController::class, 'markRead']);
// Route::post('/notifications/read-all',    [NotificationController::class, 'markAllRead']);