<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    private AttendanceService $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    /**
     * Clock in an employee.
     */
    public function clockIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
        ]);

        try {
            $employee = Employee::findOrFail($validated['employee_id']);
            
            // Validate employee can clock in
            $validation = $this->attendanceService->validateClockInOut($employee, 'in');
            if (!$validation['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => implode(', ', $validation['errors']),
                ], 422);
            }

            $ipAddress = $request->ip();
            $deviceInfo = $request->userAgent();

            $attendance = $this->attendanceService->clockIn($employee, $ipAddress, $deviceInfo);

            return response()->json([
                'success' => true,
                'message' => 'Successfully clocked in',
                'data' => $attendance->load('employee'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Clock out an employee.
     */
    public function clockOut(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
        ]);

        try {
            $employee = Employee::findOrFail($validated['employee_id']);
            
            // Validate employee can clock out
            $validation = $this->attendanceService->validateClockInOut($employee, 'out');
            if (!$validation['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => implode(', ', $validation['errors']),
                ], 422);
            }

            $ipAddress = $request->ip();

            $attendance = $this->attendanceService->clockOut($employee, $ipAddress);

            return response()->json([
                'success' => true,
                'message' => 'Successfully clocked out',
                'data' => $attendance->load('employee'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get real-time workforce status.
     */
    public function getLiveStatus(): JsonResponse
    {
        $liveStatus = $this->attendanceService->getLiveWorkforceStatus();

        return response()->json([
            'success' => true,
            'data' => $liveStatus,
        ]);
    }

    /**
     * Get attendance records for a date range.
     */
    public function getAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'employee_id' => 'sometimes|exists:employees,id',
            'status' => 'sometimes|in:present,late,absent,on_leave,half_day',
        ]);

        $query = Attendance::with(['employee', 'recorder'])
            ->forDateRange($validated['start_date'], $validated['end_date']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $validated['employee_id']);
        }

        if ($request->has('status')) {
            $query->where('status', $validated['status']);
        }

        $attendances = $query->orderBy('date', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $attendances,
        ]);
    }

    /**
     * Get attendance summary for an employee.
     */
    public function getSummary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        $summary = $this->attendanceService->getAttendanceSummary(
            $employee,
            $validated['start_date'],
            $validated['end_date']
        );

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Get monthly statistics for an employee.
     */
    public function getMonthlyStats(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        $stats = $this->attendanceService->getMonthlyStatistics(
            $employee,
            $validated['month'],
            $validated['year']
        );

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Manually mark attendance (HR only).
     */
    public function markAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'time_in' => 'sometimes|date_format:H:i:s',
            'time_out' => 'sometimes|date_format:H:i:s',
            'status' => 'required|in:present,late,absent,on_leave,half_day',
            'notes' => 'sometimes|string',
        ]);

        try {
            $employee = Employee::findOrFail($validated['employee_id']);
            
            $attendance = Attendance::updateOrCreate(
                [
                    'employee_id' => $employee->id,
                    'date' => $validated['date'],
                ],
                [
                    'time_in' => $validated['time_in'] ?? null,
                    'time_out' => $validated['time_out'] ?? null,
                    'status' => $validated['status'],
                    'notes' => $validated['notes'] ?? null,
                    'recorded_by' => auth()->id(),
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Attendance record updated',
                'data' => $attendance->load('employee'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Process daily attendance (mark absents).
     */
    public function processDailyAttendance(Request $request): JsonResponse
    {
        $date = $request->query('date', today());
        
        try {
            $result = $this->attendanceService->processDailyAttendance($date);

            return response()->json([
                'success' => true,
                'message' => 'Daily attendance processed',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Create a leave request.
     */
    public function createLeaveRequest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'leave_type' => 'required|in:vacation,sick,emergency,unpaid,maternity,paternity',
            'number_of_days' => 'required|integer|min:1',
            'hours_requested' => 'required|numeric|min:0',
            'reason' => 'required|string',
            'contact_person' => 'sometimes|string',
            'contact_phone' => 'sometimes|string',
        ]);

        try {
            $leaveRequest = LeaveRequest::create([
                'employee_id' => $validated['employee_id'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'leave_type' => $validated['leave_type'],
                'status' => 'pending',
                'number_of_days' => $validated['number_of_days'],
                'hours_requested' => $validated['hours_requested'],
                'reason' => $validated['reason'],
                'contact_person' => $validated['contact_person'] ?? null,
                'contact_phone' => $validated['contact_phone'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Leave request submitted successfully',
                'data' => $leaveRequest->load('employee'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get leave requests.
     */
    public function getLeaveRequests(Request $request): JsonResponse
    {
        $query = LeaveRequest::with(['employee', 'approver']);

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->query('employee_id'));
        }

        $leaveRequests = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $leaveRequests,
        ]);
    }

    /**
     * Approve a leave request.
     */
    public function approveLeaveRequest(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        if (!$leaveRequest->canApprove()) {
            return response()->json([
                'success' => false,
                'message' => 'This leave request cannot be approved',
            ], 422);
        }

        try {
            $leaveRequest->approve(
                auth()->id(),
                $request->query('reason', '')
            );

            return response()->json([
                'success' => true,
                'message' => 'Leave request approved',
                'data' => $leaveRequest->load('approver'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Reject a leave request.
     */
    public function rejectLeaveRequest(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string',
        ]);

        if (!$leaveRequest->canReject()) {
            return response()->json([
                'success' => false,
                'message' => 'This leave request cannot be rejected',
            ], 422);
        }

        try {
            $leaveRequest->reject(auth()->id(), $validated['reason']);

            return response()->json([
                'success' => true,
                'message' => 'Leave request rejected',
                'data' => $leaveRequest->load('approver'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
