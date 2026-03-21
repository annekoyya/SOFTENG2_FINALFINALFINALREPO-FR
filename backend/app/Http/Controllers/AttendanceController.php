<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AttendanceController extends Controller
{
    public function __construct(private AttendanceService $attendanceService) {}

    // ─── Clock In / Out ───────────────────────────────────────────────────────

    /**
     * Clock in an employee.
     * POST /api/attendance/clock-in
     */
    public function clockIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);

        $validation = $this->attendanceService->validateClockInOut($employee, 'in');
        if (!$validation['valid']) {
            return $this->error(implode(', ', $validation['errors']));
        }

        $attendance = $this->attendanceService->clockIn(
            $employee,
            $request->ip(),
            $request->userAgent()
        );

        return $this->created($attendance->load('employee'), 'Successfully clocked in');
    }

    /**
     * Clock out an employee.
     * POST /api/attendance/clock-out
     */
    public function clockOut(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);

        $validation = $this->attendanceService->validateClockInOut($employee, 'out');
        if (!$validation['valid']) {
            return $this->error(implode(', ', $validation['errors']));
        }

        $attendance = $this->attendanceService->clockOut($employee, $request->ip());

        return $this->success($attendance->load('employee'), 'Successfully clocked out');
    }

    // ─── Live & Summary Data ──────────────────────────────────────────────────

    /**
     * Real-time workforce status for the live dashboard.
     * GET /api/attendance/live-status
     */
    public function getLiveStatus(): JsonResponse
    {
        $liveStatus = $this->attendanceService->getLiveWorkforceStatus();

        return $this->success($liveStatus);
    }

    /**
     * Attendance records for a date range, with optional filters.
     * GET /api/attendance
     */
    public function getAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'employee_id' => 'sometimes|exists:employees,id',
            'status'      => 'sometimes|in:present,late,absent,on_leave,half_day',
        ]);

        $query = Attendance::with(['employee', 'recorder'])
            ->forDateRange($validated['start_date'], $validated['end_date']);

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $validated['employee_id']);
        }

        if ($request->filled('status')) {
            $query->where('status', $validated['status']);
        }

        $attendances = $query->orderBy('date', 'desc')->paginate(20);

        return $this->success($attendances);
    }

    /**
     * Attendance summary for an employee over a date range.
     * GET /api/attendance/summary
     */
    public function getSummary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        $summary  = $this->attendanceService->getAttendanceSummary(
            $employee,
            $validated['start_date'],
            $validated['end_date']
        );

        return $this->success($summary);
    }

    /**
     * Monthly attendance statistics for an employee.
     * GET /api/attendance/monthly-stats
     */
    public function getMonthlyStats(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month'       => 'required|integer|min:1|max:12',
            'year'        => 'required|integer|min:2020',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        $stats    = $this->attendanceService->getMonthlyStatistics(
            $employee,
            (int) $validated['month'],
            (int) $validated['year']
        );

        return $this->success($stats);
    }

    // ─── Manual Override (HR only) ────────────────────────────────────────────

    /**
     * Manually create or update an attendance record.
     * POST /api/attendance/mark
     */
    public function markAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date'        => 'required|date',
            'time_in'     => 'nullable|date_format:H:i:s',
            'time_out'    => 'nullable|date_format:H:i:s|after:time_in',
            'status'      => 'required|in:present,late,absent,on_leave,half_day',
            'notes'       => 'nullable|string|max:500',
        ]);

        $employee   = Employee::findOrFail($validated['employee_id']);
        $attendance = Attendance::updateOrCreate(
            ['employee_id' => $employee->id, 'date' => $validated['date']],
            [
                'time_in'     => $validated['time_in'] ?? null,
                'time_out'    => $validated['time_out'] ?? null,
                'status'      => $validated['status'],
                'notes'       => $validated['notes'] ?? null,
                'recorded_by' => Auth::id(),
            ]
        );

        return $this->success($attendance->load('employee'), 'Attendance record updated');
    }

    /**
     * Process daily attendance — marks absent for employees with no record.
     * POST /api/attendance/process-daily
     */
    public function processDailyAttendance(Request $request): JsonResponse
    {
        // Cast to string explicitly so service receives '2026-03-13', not a Carbon object
        $date = $request->query('date')
            ? \Carbon\Carbon::parse($request->query('date'))->toDateString()
            : today()->toDateString();

        $result = $this->attendanceService->processDailyAttendance($date);

        return $this->success($result, 'Daily attendance processed');
    }

    // ─── Leave Requests ───────────────────────────────────────────────────────

    /**
     * Submit a leave request.
     * POST /api/leave-requests
     */
    public function createLeaveRequest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id'    => 'required|exists:employees,id',
            'start_date'     => 'required|date|after_or_equal:today',
            'end_date'       => 'required|date|after_or_equal:start_date',
            'leave_type'     => 'required|in:vacation,sick,emergency,unpaid,maternity,paternity',
            'number_of_days' => 'required|integer|min:1',
            'hours_requested'=> 'required|numeric|min:0',
            'reason'         => 'required|string|max:1000',
            'contact_person' => 'nullable|string|max:100',
            'contact_phone'  => 'nullable|string|max:20',
        ]);

        $leaveRequest = LeaveRequest::create(array_merge($validated, ['status' => 'pending']));

        return $this->created($leaveRequest->load('employee'), 'Leave request submitted successfully');
    }

    /**
     * Get leave requests with optional filters.
     * GET /api/leave-requests
     */
    public function getLeaveRequests(Request $request): JsonResponse
    {
        $query = LeaveRequest::with(['employee', 'approver']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->query('employee_id'));
        }

        if ($request->filled('leave_type')) {
            $query->where('leave_type', $request->query('leave_type'));
        }

        $leaveRequests = $query->orderBy('created_at', 'desc')->paginate(20);

        return $this->success($leaveRequests);
    }

    /**
     * Approve a leave request.
     * POST /api/leave-requests/{leaveRequest}/approve
     */
    public function approveLeaveRequest(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        if (!$leaveRequest->canApprove()) {
            return $this->error('This leave request cannot be approved');
        }

        $leaveRequest->approve(Auth::id(), $request->input('reason', ''));

        return $this->success($leaveRequest->load('approver'), 'Leave request approved');
    }

    /**
     * Reject a leave request.
     * POST /api/leave-requests/{leaveRequest}/reject
     */
    public function rejectLeaveRequest(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $validated = $request->validate(['reason' => 'required|string|max:500']);

        if (!$leaveRequest->canReject()) {
            return $this->error('This leave request cannot be rejected');
        }

        $leaveRequest->reject(Auth::id(), $validated['reason']);

        return $this->success($leaveRequest->load('approver'), 'Leave request rejected');
    }
}