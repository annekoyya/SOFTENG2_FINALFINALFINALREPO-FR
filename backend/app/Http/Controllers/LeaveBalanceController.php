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

// ══════════════════════════════════════════════════════════════════════════════
//  LeaveBalanceController
// ══════════════════════════════════════════════════════════════════════════════

class LeaveBalanceController extends Controller
{
    private const LEAVE_TYPES = [
        'vacation','sick','emergency','maternity',
        'paternity','bereavement','solo_parent','unpaid',
    ];

    // GET /api/leave-balances
    public function index(Request $request): JsonResponse
    {
        $year = $request->year ?? now()->year;
        $q    = LeaveBalance::with('employee:id,first_name,last_name')
            ->forYear($year);

        if ($request->employee_id) {
            $q->where('employee_id', $request->employee_id);
        }

        $balances = $q->get()->map(fn ($b) => [
            'id'             => $b->id,
            'employee_id'    => $b->employee_id,
            'employee_name'  => $b->employee
                ? trim("{$b->employee->first_name} {$b->employee->last_name}")
                : null,
            'leave_type'     => $b->leave_type,
            'entitled_days'  => (float) $b->entitled_days,
            'used_days'      => (float) $b->used_days,
            'pending_days'   => (float) $b->pending_days,
            'remaining_days' => (float) $b->remaining_days,
            'carried_over'   => (float) $b->carried_over,
            'year'           => (int)   $b->year,
        ]);

        return response()->json($balances);
    }

    // POST /api/leave-balances/adjust
    public function adjust(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'leave_type'  => 'required|in:' . implode(',', self::LEAVE_TYPES),
            'adjustment'  => 'required|numeric',
            'reason'      => 'required|string|max:300',
        ]);

        $year    = now()->year;
        $balance = LeaveBalance::firstOrCreate(
            ['employee_id' => $data['employee_id'], 'leave_type' => $data['leave_type'], 'year' => $year],
            ['entitled_days' => LeaveBalance::annualEntitlement($data['leave_type'])]
        );

        // Positive adjustment adds to entitled_days (HR granted extra)
        // Negative adjustment adds to used_days (retroactive deduction)
        if ($data['adjustment'] > 0) {
            $balance->increment('entitled_days', $data['adjustment']);
        } else {
            $balance->increment('used_days', abs($data['adjustment']));
        }

        return response()->json(['message' => "Balance adjusted by {$data['adjustment']} day(s). Reason: {$data['reason']}"]);
    }

    /**
     * POST /api/leave-balances/accrue
     *
     * Run monthly accrual for vacation and sick leave.
     * Should be called once per month (via scheduler or manual trigger).
     * Caps accrual so total doesn't exceed 15 days/year.
     */
    public function accrue(): JsonResponse
    {
        $year      = now()->year;
        $employees = Employee::where('is_active', true)->get();
        $updated   = 0;
        $accruals  = ['vacation', 'sick'];

        DB::transaction(function () use ($employees, $year, $accruals, &$updated) {
            foreach ($employees as $emp) {
                foreach ($accruals as $type) {
                    $monthly = LeaveBalance::monthlyAccrual($type);
                    $annual  = 15.0; // max per year for vacation and sick

                    $balance = LeaveBalance::firstOrCreate(
                        ['employee_id' => $emp->id, 'leave_type' => $type, 'year' => $year],
                        ['entitled_days' => 0, 'used_days' => 0, 'carried_over' => 0]
                    );

                    // Don't accrue past the annual cap
                    $newEntitled = min($annual, (float)$balance->entitled_days + $monthly);
                    $balance->update(['entitled_days' => $newEntitled]);
                    $updated++;
                }
            }
        });

        return response()->json(['message' => 'Accrual complete.', 'updated' => $updated]);
    }

    /**
     * POST /api/leave-balances/carry-over
     *
     * Carry unused leave from current year into next year.
     * Max carry-over: 5 days for vacation and sick leave.
     * Run this on Jan 1 or end of Dec (via scheduler).
     */
    public function carryOver(): JsonResponse
    {
        $currentYear = now()->year;
        $nextYear    = $currentYear + 1;
        $updated     = 0;
        $carryTypes  = ['vacation', 'sick'];

        DB::transaction(function () use ($currentYear, $nextYear, $carryTypes, &$updated) {
            $balances = LeaveBalance::forYear($currentYear)
                ->whereIn('leave_type', $carryTypes)
                ->get();

            foreach ($balances as $balance) {
                $remaining  = (float) $balance->remaining_days;
                $maxCarry   = LeaveBalance::carryOverMax($balance->leave_type);
                $carryDays  = min($remaining, $maxCarry);

                if ($carryDays <= 0) continue;

                LeaveBalance::updateOrCreate(
                    [
                        'employee_id' => $balance->employee_id,
                        'leave_type'  => $balance->leave_type,
                        'year'        => $nextYear,
                    ],
                    [
                        'carried_over'  => $carryDays,
                        'entitled_days' => LeaveBalance::annualEntitlement($balance->leave_type),
                        'used_days'     => 0,
                    ]
                );
                $updated++;
            }
        });

        return response()->json(['message' => 'Carry-over complete.', 'updated' => $updated]);
    }

    /**
     * Seed balances for all active employees for the current year.
     * Call once after migration: POST /api/leave-balances/seed
     */
    public function seed(): JsonResponse
    {
        $year      = now()->year;
        $employees = Employee::where('is_active', true)->get();
        $created   = 0;

        $nonAccruedTypes = [
            'emergency','maternity','paternity','bereavement','solo_parent',
        ];

        DB::transaction(function () use ($employees, $year, $nonAccruedTypes, &$created) {
            foreach ($employees as $emp) {
                // Non-accrued: grant upfront
                foreach ($nonAccruedTypes as $type) {
                    $exists = LeaveBalance::where([
                        'employee_id' => $emp->id,
                        'leave_type'  => $type,
                        'year'        => $year,
                    ])->exists();

                    if (!$exists) {
                        LeaveBalance::create([
                            'employee_id'   => $emp->id,
                            'leave_type'    => $type,
                            'year'          => $year,
                            'entitled_days' => LeaveBalance::annualEntitlement($type),
                        ]);
                        $created++;
                    }
                }

                // Accrued: start at 0, accrual job fills them monthly
                foreach (['vacation', 'sick'] as $type) {
                    LeaveBalance::firstOrCreate([
                        'employee_id' => $emp->id,
                        'leave_type'  => $type,
                        'year'        => $year,
                    ], ['entitled_days' => 0]);
                    $created++;
                }
            }
        });

        return response()->json(['message' => "Seeded balances for {$employees->count()} employees.", 'created' => $created]);
    }
}


// ══════════════════════════════════════════════════════════════════════════════
//  LeaveRequestController  (replaces / extends your existing one)
// ══════════════════════════════════════════════════════════════════════════════

class LeaveRequestController extends Controller
{
    // GET /api/leave-requests
    public function index(Request $request): JsonResponse
    {
        $q = LeaveRequest::with([
            'employee:id,first_name,last_name,department',
            'approvedBy:id,name',
        ]);

        if ($request->employee_id) $q->where('employee_id', $request->employee_id);
        if ($request->status)      $q->where('status', $request->status);
        if ($request->leave_type)  $q->where('leave_type', $request->leave_type);

        return response()->json(
            $q->latest()->get()->map(fn ($r) => [
                'id'              => $r->id,
                'employee_id'     => $r->employee_id,
                'employee_name'   => $r->employee
                    ? trim("{$r->employee->first_name} {$r->employee->last_name}")
                    : null,
                'department'      => $r->employee?->department,
                'leave_type'      => $r->leave_type,
                'start_date'      => $r->start_date?->toDateString(),
                'end_date'        => $r->end_date?->toDateString(),
                'days_requested'  => (float) $r->days_requested,
                'reason'          => $r->reason,
                'status'          => $r->status,
                'approved_by'     => $r->approved_by,
                'approved_by_name'=> $r->approvedBy?->name,
                'rejected_reason' => $r->rejected_reason,
                'created_at'      => $r->created_at?->toDateTimeString(),
            ])
        );
    }

    // POST /api/leave-requests
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'leave_type' => 'required|in:vacation,sick,emergency,maternity,paternity,bereavement,solo_parent,unpaid',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
            'reason'     => 'required|string|max:500',
        ]);

        $user       = Auth::user();
        $employee   = $user->employee;
        $days       = $this->countBusinessDays($data['start_date'], $data['end_date']);
        $year       = now()->year;

        // Check balance (skip for unpaid)
        if ($data['leave_type'] !== 'unpaid') {
            $balance = LeaveBalance::where([
                'employee_id' => $employee->id,
                'leave_type'  => $data['leave_type'],
                'year'        => $year,
            ])->first();

            if ($balance && $days > $balance->remaining_days) {
                return response()->json([
                    'message' => "Insufficient {$data['leave_type']} leave balance. You have {$balance->remaining_days} day(s) remaining.",
                ], 422);
            }
        }

        $leaveRequest = LeaveRequest::create([
            ...$data,
            'employee_id'    => $employee->id,
            'days_requested' => $days,
            'status'         => 'pending',
        ]);

        return response()->json($leaveRequest, 201);
    }

    // POST /api/leave-requests/{id}/approve
    public function approve(int $id): JsonResponse
    {
        $req = LeaveRequest::findOrFail($id);

        if ($req->status !== 'pending') {
            return response()->json(['message' => 'Request is not pending.'], 422);
        }

        DB::transaction(function () use ($req) {
            $req->update(['status' => 'approved', 'approved_by' => Auth::id()]);

            // Deduct from balance
            if ($req->leave_type !== 'unpaid') {
                LeaveBalance::where([
                    'employee_id' => $req->employee_id,
                    'leave_type'  => $req->leave_type,
                    'year'        => now()->year,
                ])->increment('used_days', $req->days_requested);
            }

            // Mark attendance records as "on-leave" for date range
            $cur = new \DateTime($req->start_date);
            $end = new \DateTime($req->end_date);
            while ($cur <= $end) {
                if (!in_array((int)$cur->format('N'), [6, 7])) { // skip weekends
                    Attendance::updateOrCreate(
                        ['employee_id' => $req->employee_id, 'date' => $cur->format('Y-m-d')],
                        ['status' => 'on_leave']
                    );
                }
                $cur->modify('+1 day');
            }
        });

        return response()->json(['message' => 'Leave approved.']);
    }

    // POST /api/leave-requests/{id}/reject
    public function reject(Request $request, int $id): JsonResponse
    {
        $req  = LeaveRequest::findOrFail($id);
        $data = $request->validate(['reason' => 'required|string|max:300']);

        if ($req->status !== 'pending') {
            return response()->json(['message' => 'Request is not pending.'], 422);
        }

        $req->update(['status' => 'rejected', 'rejected_reason' => $data['reason']]);
        return response()->json(['message' => 'Leave rejected.']);
    }

    // POST /api/leave-requests/{id}/cancel
    public function cancel(int $id): JsonResponse
    {
        $req = LeaveRequest::findOrFail($id);

        if (!in_array($req->status, ['pending'])) {
            return response()->json(['message' => 'Only pending requests can be cancelled.'], 422);
        }

        $req->update(['status' => 'cancelled']);
        return response()->json(['message' => 'Request cancelled.']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function countBusinessDays(string $start, string $end): float
    {
        $count = 0;
        $cur   = new \DateTime($start);
        $fin   = new \DateTime($end);
        while ($cur <= $fin) {
            if (!in_array((int)$cur->format('N'), [6, 7])) $count++;
            $cur->modify('+1 day');
        }
        return (float) $count;
    }
}