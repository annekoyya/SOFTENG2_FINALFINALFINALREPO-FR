<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class LeaveController extends Controller
{
    private const LEAVE_TYPES = [
        'vacation','sick','emergency','maternity',
        'paternity','bereavement','solo_parent','unpaid',
    ];

    // ─── GET /api/leave-requests ──────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = LeaveRequest::with(['employee:id,first_name,last_name,department'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('employee_id')) $query->where('employee_id', $request->employee_id);
        if ($request->filled('status'))      $query->where('status',      $request->status);
        if ($request->filled('leave_type'))  $query->where('leave_type',  $request->leave_type);

        $requests = $query->get()->map(fn($r) => [
            'id'              => $r->id,
            'employee_id'     => $r->employee_id,
            'employee_name'   => $r->employee ? trim("{$r->employee->first_name} {$r->employee->last_name}") : null,
            'department'      => $r->employee?->department,
            'leave_type'      => $r->leave_type,
            'start_date'      => $r->start_date?->toDateString(),
            'end_date'        => $r->end_date?->toDateString(),
            'days_requested'  => (float) ($r->days_requested ?? $r->number_of_days ?? 0),
            'reason'          => $r->reason,
            'status'          => $r->status,
            'rejected_reason' => $r->rejected_reason ?? $r->approval_reason ?? null,
            'created_at'      => $r->created_at?->toDateTimeString(),
        ]);

        return response()->json(['success' => true, 'data' => $requests]);
    }

    // ─── POST /api/leave-requests ─────────────────────────────────────────────
    // FIX #9: HR can create (employee_id param); Admin approves
    public function store(Request $request): JsonResponse
    {
        $v = $request->validate([
            'leave_type'  => 'required|in:' . implode(',', self::LEAVE_TYPES),
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'reason'      => 'required|string|max:500',
            'employee_id' => 'nullable|exists:employees,id',
        ]);

        $user       = Auth::user();
        $employeeId = $v['employee_id'] ?? null;

        if (!$employeeId) {
            // Find the employee record linked to the current user's email
            $emp = Employee::where('email', $user->email)->first();
            if (!$emp) {
                return response()->json([
                    'success' => false,
                    'message' => 'No employee record linked to your account. Please provide an employee_id.',
                ], 422);
            }
            $employeeId = $emp->id;
        }

        $days = $this->countBusinessDays($v['start_date'], $v['end_date']);

        // Check balance (skip for unpaid)
        if ($v['leave_type'] !== 'unpaid') {
            $balance = LeaveBalance::where([
                'employee_id' => $employeeId,
                'leave_type'  => $v['leave_type'],
                'year'        => now()->year,
            ])->first();

            if ($balance) {
                $remaining = (float) $balance->entitled_days + (float) $balance->carried_over - (float) $balance->used_days;
                if ($days > $remaining) {
                    return response()->json([
                        'success' => false,
                        'message' => "Insufficient balance. You have {$remaining} day(s) remaining.",
                    ], 422);
                }
            }
        }

        $base = [
            'employee_id' => $employeeId,
            'leave_type'  => $v['leave_type'],
            'start_date'  => $v['start_date'],
            'end_date'    => $v['end_date'],
            'reason'      => $v['reason'],
            'status'      => 'pending',
        ];

        // Support both column naming conventions
        try {
            $req = LeaveRequest::create(array_merge($base, ['days_requested' => $days]));
        } catch (\Throwable) {
            $req = LeaveRequest::create(array_merge($base, [
                'number_of_days'  => (int) $days,
                'hours_requested' => $days * 8,
            ]));
        }

        return response()->json(['success' => true, 'data' => $req, 'message' => 'Leave request submitted'], 201);
    }

    // ─── POST /api/leave-requests/{id}/approve ────────────────────────────────
    // FIX #9: Only Admin can approve
    public function approve(int $id): JsonResponse
    {
        // FIX #9: HR creates, Admin approves
        if (!in_array(Auth::user()->role, ['Admin'])) {
            return response()->json(['success' => false, 'message' => 'Only Admin can approve leave requests.'], 403);
        }

        $req = LeaveRequest::findOrFail($id);

        if ($req->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Request is not pending.'], 422);
        }

        DB::transaction(function () use ($req) {
            $days   = (float) ($req->days_requested ?? $req->number_of_days ?? 0);
            $update = ['status' => 'approved', 'approved_at' => now()];
            try { $update['approver_id'] = Auth::id(); } catch (\Throwable) {}
            try { $update['approved_by'] = Auth::id(); } catch (\Throwable) {}
            $req->update($update);

            // Deduct leave balance
            if ($req->leave_type !== 'unpaid' && $days > 0) {
                LeaveBalance::where([
                    'employee_id' => $req->employee_id,
                    'leave_type'  => $req->leave_type,
                    'year'        => now()->year,
                ])->increment('used_days', $days);
            }

            // Stamp attendance records as on_leave for each business day
            $cur = new \DateTime($req->start_date instanceof \Carbon\Carbon
                ? $req->start_date->toDateString() : (string) $req->start_date);
            $end = new \DateTime($req->end_date instanceof \Carbon\Carbon
                ? $req->end_date->toDateString() : (string) $req->end_date);

            while ($cur <= $end) {
                if (!in_array((int) $cur->format('N'), [6, 7])) {
                    Attendance::updateOrCreate(
                        ['employee_id' => $req->employee_id, 'date' => $cur->format('Y-m-d')],
                        ['status' => 'on_leave', 'recorded_by' => Auth::id()]
                    );
                }
                $cur->modify('+1 day');
            }
        });

        return response()->json(['success' => true, 'message' => 'Leave approved.']);
    }

    // ─── POST /api/leave-requests/{id}/reject ─────────────────────────────────
    // FIX #9: Only Admin can reject
    public function reject(Request $request, int $id): JsonResponse
    {
        if (!in_array(Auth::user()->role, ['Admin'])) {
            return response()->json(['success' => false, 'message' => 'Only Admin can reject leave requests.'], 403);
        }

        $req  = LeaveRequest::findOrFail($id);
        $data = $request->validate(['reason' => 'required|string|max:300']);

        if ($req->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Request is not pending.'], 422);
        }

        $update = ['status' => 'rejected', 'rejected_reason' => $data['reason']];
        try { $update['approver_id'] = Auth::id(); } catch (\Throwable) {}
        try { $update['approved_by'] = Auth::id(); } catch (\Throwable) {}
        $req->update($update);

        return response()->json(['success' => true, 'message' => 'Leave rejected.']);
    }

    // ─── POST /api/leave-requests/{id}/cancel ─────────────────────────────────
    public function cancel(int $id): JsonResponse
    {
        $req = LeaveRequest::findOrFail($id);
        if ($req->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Only pending requests can be cancelled.'], 422);
        }
        $req->update(['status' => 'cancelled']);
        return response()->json(['success' => true]);
    }

    // ─── GET /api/leave-balances ──────────────────────────────────────────────
    public function balances(Request $request): JsonResponse
    {
        $year  = $request->input('year', now()->year);
        $query = LeaveBalance::with('employee:id,first_name,last_name');
        if ($request->filled('employee_id')) $query->where('employee_id', $request->employee_id);
        $query->where('year', $year);

        $balances = $query->get()->map(fn($b) => [
            'id'             => $b->id,
            'employee_id'    => $b->employee_id,
            'leave_type'     => $b->leave_type,
            'entitled_days'  => (float) $b->entitled_days,
            'used_days'      => (float) $b->used_days,
            'carried_over'   => (float) $b->carried_over,
            'remaining_days' => max(0, (float) $b->entitled_days + (float) $b->carried_over - (float) $b->used_days),
            'year'           => (int) $b->year,
        ]);

        return response()->json(['success' => true, 'data' => $balances]);
    }

    // ─── POST /api/leave-balances/seed ────────────────────────────────────────
    public function seedBalances(): JsonResponse
    {
        $year      = now()->year;
        $employees = Employee::where('status', 'active')->get();
        $created   = 0;

        DB::transaction(function () use ($employees, $year, &$created) {
            $upfront = ['emergency' => 3, 'maternity' => 105, 'paternity' => 7, 'bereavement' => 3, 'solo_parent' => 7];
            foreach ($employees as $emp) {
                foreach ($upfront as $type => $days) {
                    LeaveBalance::firstOrCreate(
                        ['employee_id' => $emp->id, 'leave_type' => $type, 'year' => $year],
                        ['entitled_days' => $days, 'used_days' => 0, 'carried_over' => 0]
                    ); $created++;
                }
                foreach (['vacation', 'sick'] as $type) {
                    LeaveBalance::firstOrCreate(
                        ['employee_id' => $emp->id, 'leave_type' => $type, 'year' => $year],
                        ['entitled_days' => 0, 'used_days' => 0, 'carried_over' => 0]
                    ); $created++;
                }
            }
        });

        return response()->json(['success' => true, 'message' => "Seeded {$employees->count()} employees."]);
    }

    // ─── POST /api/leave-balances/accrue ──────────────────────────────────────
    public function accrue(): JsonResponse
    {
        $year = now()->year; $updated = 0;
        DB::transaction(function () use ($year, &$updated) {
            Employee::where('status', 'active')->each(function ($emp) use ($year, &$updated) {
                foreach (['vacation', 'sick'] as $type) {
                    $b = LeaveBalance::firstOrCreate(
                        ['employee_id' => $emp->id, 'leave_type' => $type, 'year' => $year],
                        ['entitled_days' => 0]
                    );
                    $b->update(['entitled_days' => min(15.0, (float) $b->entitled_days + 1.25)]);
                    $updated++;
                }
            });
        });
        return response()->json(['success' => true, 'message' => "Accrual complete. {$updated} records updated."]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function countBusinessDays(string $start, string $end): float
    {
        $count = 0;
        $cur   = new \DateTime($start);
        $fin   = new \DateTime($end);
        while ($cur <= $fin) {
            if (!in_array((int) $cur->format('N'), [6, 7])) $count++;
            $cur->modify('+1 day');
        }
        return (float) $count;
    }
}