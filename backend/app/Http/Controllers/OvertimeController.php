<?php

namespace App\Http\Controllers;
 
use App\Models\Employee;
use App\Models\OvertimeRequest;
use App\Models\PayrollAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
 
class OvertimeController extends Controller
{
    // GET /api/overtime-requests
    public function index(Request $request): JsonResponse
    {
        $q = OvertimeRequest::with([
            'employee:id,first_name,last_name,department',
            'approvedBy:id,name',
        ]);
 
        if ($request->employee_id) $q->where('employee_id', $request->employee_id);
        if ($request->status)      $q->where('status', $request->status);
        if ($request->month) {
            $q->whereYear('date', substr($request->month, 0, 4))
              ->whereMonth('date', substr($request->month, 5, 2));
        }
 
        return response()->json(
            $q->latest()->get()->map(fn($r) => [
                'id'               => $r->id,
                'employee_id'      => $r->employee_id,
                'employee_name'    => $r->employee
                    ? trim("{$r->employee->first_name} {$r->employee->last_name}")
                    : null,
                'department'       => $r->employee?->department,
                'date'             => $r->date?->toDateString(),
                'overtime_type'    => $r->overtime_type,
                'hours_requested'  => (float) $r->hours_requested,
                'hours_approved'   => $r->hours_approved !== null ? (float)$r->hours_approved : null,
                'reason'           => $r->reason,
                'status'           => $r->status,
                'approved_by'      => $r->approved_by,
                'approved_by_name' => $r->approvedBy?->name,
                'rejected_reason'  => $r->rejected_reason,
                'computed_amount'  => $r->computed_amount !== null ? (float)$r->computed_amount : null,
                'payslip_id'       => $r->payslip_id,
                'created_at'       => $r->created_at?->toDateTimeString(),
            ])
        );
    }
 
    // GET /api/overtime-requests/stats
    public function stats(): JsonResponse
    {
        $month = now()->month;
        $year  = now()->year;
 
        $monthlyApproved = OvertimeRequest::where('status', 'approved')
            ->whereMonth('date', $month)->whereYear('date', $year);
 
        return response()->json([
            'pending_count'           => OvertimeRequest::where('status','pending')->count(),
            'approved_this_month'     => (clone $monthlyApproved)->count(),
            'total_hours_this_month'  => (float) (clone $monthlyApproved)->sum('hours_approved'),
            'total_amount_this_month' => (float) (clone $monthlyApproved)->sum('computed_amount'),
        ]);
    }
 
    // POST /api/overtime-requests
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date'            => 'required|date',
            'overtime_type'   => 'required|in:regular,rest_day,special_holiday,regular_holiday',
            'hours_requested' => 'required|numeric|min:0.5|max:12',
            'reason'          => 'required|string|max:500',
        ]);
 
        $user = Auth::user();
        $userId = (int) $user?->id;
        $employee = Employee::where('id', $userId)->first();
        if (!$employee) {
            return response()->json(['message' => 'Employee record not found for current user'], 404);
        }
        $ot = OvertimeRequest::create([...$data, 'employee_id' => $employee->id, 'status' => 'pending']);
        return response()->json($ot, 201);
    }
 
    // POST /api/overtime-requests/{id}/approve
    public function approve(Request $request, int $id): JsonResponse
    {
        $ot   = OvertimeRequest::with('employee')->findOrFail($id);
        $data = $request->validate(['hours_approved' => 'required|numeric|min:0.5|max:12']);
 
        if ($ot->status !== 'pending') {
            return response()->json(['message' => 'Not pending.'], 422);
        }
 
        // Compute OT pay: (basic_salary / 26 / 8) * multiplier * hours
        $emp        = $ot->employee;
        $hourlyRate = $emp ? ($emp->basic_salary / 26 / 8) : 0;
        $multiplier = OvertimeRequest::multiplier($ot->overtime_type);
        $amount     = $hourlyRate * $multiplier * $data['hours_approved'];
 
        $ot->update([
            'status'          => 'approved',
            'hours_approved'  => $data['hours_approved'],
            'computed_amount' => round($amount, 2),
            'approved_by'     => Auth::id(),
        ]);
 
        PayrollAuditLog::create([
            'action'      => 'overtime_approved',
            'entity_type' => 'OvertimeRequest',
            'entity_id'   => $ot->id,
            'user_id'     => Auth::id(),
            'description' => "OT approved: {$data['hours_approved']}h for {$emp?->first_name} on {$ot->date} = ₱{$amount}",
        ]);
 
        return response()->json(['message' => 'Overtime approved.', 'computed_amount' => $amount]);
    }
 
    // POST /api/overtime-requests/{id}/reject
    public function reject(Request $request, int $id): JsonResponse
    {
        $ot   = OvertimeRequest::findOrFail($id);
        $data = $request->validate(['reason' => 'required|string|max:300']);
 
        if ($ot->status !== 'pending') {
            return response()->json(['message' => 'Not pending.'], 422);
        }
 
        $ot->update(['status' => 'rejected', 'rejected_reason' => $data['reason']]);
        return response()->json(['message' => 'Overtime request rejected.']);
    }
}
 
