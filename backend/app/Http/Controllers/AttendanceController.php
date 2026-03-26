<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Holiday;
use App\Models\LeaveRequest;
use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    public function __construct(private AttendanceService $attendanceService) {}

    // ─── Clock In / Out ───────────────────────────────────────────────────────

    /**
     * Clock in an employee.
     * POST /api/attendance/clock-in
     */
public function today(): JsonResponse
{
    $user     = Auth::user();
    $employee = $user->employee;
    $today    = now()->toDateString();
 
    if (!$employee) {
        return response()->json(['error' => 'No employee record found.'], 404);
    }
 
    $record = Attendance::where('employee_id', $employee->id)
        ->where('date', $today)
        ->first();
 
    // Check leave
    $onLeave = LeaveRequest::where('employee_id', $employee->id)
        ->where('status', 'approved')
        ->where('start_date', '<=', $today)
        ->where('end_date',   '>=', $today)
        ->exists();
 
    // Check holiday
    $holiday = Holiday::findForDate($today);
 
    // Get shift (from employee record or default)
    $shiftStart = $employee->shift_start ?? '08:00';
    $shiftEnd   = $employee->shift_end   ?? '17:00';
    $shiftName  = $employee->shift_name  ?? 'Regular shift';
 
    return response()->json([
        'has_clocked_in'  => (bool) $record?->check_in,
        'has_clocked_out' => (bool) $record?->check_out,
        'check_in'        => $record?->check_in,
        'check_out'       => $record?->check_out,
        'status'          => $record?->status,
        'shift_start'     => $shiftStart,
        'shift_end'       => $shiftEnd,
        'shift_name'      => $shiftName,
        'is_on_leave'     => $onLeave,
        'is_holiday'      => (bool) $holiday,
        'holiday_name'    => $holiday?->name,
    ]);
}
 
// ── POST /api/attendance/clock-in ─────────────────────────────────────────────
 
public function clockIn(): JsonResponse
{
    $employee = Auth::user()->employee;
    $today    = now()->toDateString();
    $timeNow  = now()->format('H:i');
 
    if (!$employee) return response()->json(['message' => 'No employee record.'], 422);
 
    // Prevent double clock-in
    $existing = Attendance::where('employee_id', $employee->id)->where('date', $today)->first();
    if ($existing?->check_in) {
        return response()->json(['message' => 'You have already clocked in today.'], 422);
    }
 
    // Determine status (late if after shift_start + 5 min grace)
    $shiftStart = $employee->shift_start ?? '08:00';
    $graceCutoff = Carbon::parse($shiftStart)->addMinutes(5)->format('H:i');
    $status = $timeNow > $graceCutoff ? 'late' : 'present';
 
    Attendance::updateOrCreate(
        ['employee_id' => $employee->id, 'date' => $today],
        ['check_in' => $timeNow, 'status' => $status]
    );
 
    return response()->json(['message' => 'Clocked in.', 'time' => $timeNow, 'status' => $status]);
}
 
// ── POST /api/attendance/clock-out ────────────────────────────────────────────
 
public function clockOut(): JsonResponse
{
    $employee = Auth::user()->employee;
    $today    = now()->toDateString();
    $timeNow  = now()->format('H:i');
 
    if (!$employee) return response()->json(['message' => 'No employee record.'], 422);
 
    $record = Attendance::where('employee_id', $employee->id)->where('date', $today)->first();
 
    if (!$record || !$record->check_in) {
        return response()->json(['message' => 'You have not clocked in yet.'], 422);
    }
    if ($record->check_out) {
        return response()->json(['message' => 'You have already clocked out today.'], 422);
    }
 
    $record->update(['check_out' => $timeNow]);
    return response()->json(['message' => 'Clocked out.', 'time' => $timeNow]);
}
 
// ── POST /api/attendance/import ───────────────────────────────────────────────
// Bulk import from the frontend-parsed Excel rows
 
public function import(Request $request): JsonResponse
{
    $request->validate([
        'records'              => 'required|array|min:1',
        'records.*.employee_id'=> 'required|integer|exists:employees,id',
        'records.*.date'       => 'required|date',
        'records.*.check_in'   => 'nullable|string',
        'records.*.check_out'  => 'nullable|string',
        'records.*.status'     => 'nullable|in:present,absent,late,on_leave,holiday',
    ]);
 
    $imported = 0;
    $skipped  = 0;
    $errors   = [];
 
    DB::transaction(function () use ($request, &$imported, &$skipped, &$errors) {
        foreach ($request->records as $row) {
            try {
                $updated = Attendance::updateOrCreate(
                    ['employee_id' => $row['employee_id'], 'date' => $row['date']],
                    [
                        'check_in'  => $row['check_in']  ?? null,
                        'check_out' => $row['check_out'] ?? null,
                        'status'    => $row['status']    ?? 'present',
                    ]
                );
                $updated->wasRecentlyCreated ? $imported++ : $skipped++;
            } catch (\Exception $e) {
                $errors[] = "Row employee #{$row['employee_id']} {$row['date']}: {$e->getMessage()}";
                $skipped++;
            }
        }
    });
 
    return response()->json(compact('imported', 'skipped', 'errors'));
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