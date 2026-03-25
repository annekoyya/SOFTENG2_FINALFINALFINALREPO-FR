<?php

namespace App\Http\Controllers;

use App\Models\PayrollBonus;
use App\Models\PayrollAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PayrollBonusController extends Controller
{
    // ── GET /api/payroll-periods/{period}/bonuses ──────────────────────────────

    public function index(int $periodId): JsonResponse
    {
        $bonuses = PayrollBonus::with(['employee:id,first_name,last_name', 'approvedByUser:id,name'])
            ->where('payroll_period_id', $periodId)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($b) => [
                'id'               => $b->id,
                'employee_id'      => $b->employee_id,
                'employee_name'    => $b->employee
                    ? trim("{$b->employee->first_name} {$b->employee->last_name}")
                    : '—',
                'bonus_type'       => $b->bonus_type,
                'amount'           => (float) $b->amount,
                'note'             => $b->note,
                'status'           => $b->status,
                'submitted_by'     => $b->submittedByUser?->name,
                'approved_by'      => $b->approvedByUser?->name,
                'payroll_period_id'=> $b->payroll_period_id,
                'created_at'       => $b->created_at?->toDateTimeString(),
            ]);

        return response()->json($bonuses);
    }

    // ── POST /api/payroll-periods/{period}/bonuses ─────────────────────────────

    public function store(Request $request, int $periodId): JsonResponse
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'bonus_type'  => 'required|string|max:100',
            'amount'      => 'required|numeric|min:0.01',
            'note'        => 'nullable|string|max:500',
        ]);

        // Admins / Accountants who add directly get auto-approved
        $user  = Auth::user();
        $autoApprove = in_array((string) $user?->role, ['Admin', 'Accountant']);

        $bonus = PayrollBonus::create([
            'employee_id'       => $data['employee_id'],
            'payroll_period_id' => $periodId,
            'bonus_type'        => $data['bonus_type'],
            'amount'            => $data['amount'],
            'note'              => $data['note'] ?? null,
            'status'            => $autoApprove ? 'approved' : 'pending',
            'submitted_by'      => (int) ($user?->id ?? 1),
            'approved_by'       => $autoApprove ? (int) ($user?->id ?? 1) : null,
            'approved_at'       => $autoApprove ? now() : null,
        ]);

        PayrollAuditLog::create([
            'action'      => 'bonus_added',
            'entity_type' => 'PayrollBonus',
            'entity_id'   => $bonus->id,
            'user_id'     => (int) $user?->id,
            'description' => "Bonus '{$bonus->bonus_type}' of ₱{$bonus->amount} added for employee #{$bonus->employee_id}"
                           . ($autoApprove ? ' (auto-approved)' : ' (pending approval)'),
        ]);

        return response()->json(['message' => 'Bonus added.', 'bonus' => $bonus], 201);
    }

    // ── POST /api/payroll-bonuses/{bonus}/approve ──────────────────────────────

    public function approve(int $bonusId): JsonResponse
    {
        $bonus = PayrollBonus::findOrFail($bonusId);

        if ($bonus->status !== 'pending') {
            return response()->json(['message' => 'Bonus is not pending.'], 422);
        }

        $user = Auth::user();
        $bonus->update([
            'status'      => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        PayrollAuditLog::create([
            'action'      => 'bonus_approved',
            'entity_type' => 'PayrollBonus',
            'entity_id'   => $bonus->id,
            'user_id'     => $user->id,
            'description' => "Bonus #{$bonus->id} approved by {$user->name}",
        ]);

        return response()->json(['message' => 'Bonus approved.']);
    }

    // ── POST /api/payroll-bonuses/{bonus}/reject ───────────────────────────────

    public function reject(int $bonusId): JsonResponse
    {
        $bonus = PayrollBonus::findOrFail($bonusId);

        if ($bonus->status !== 'pending') {
            return response()->json(['message' => 'Bonus is not pending.'], 422);
        }

        $user = Auth::user();
        $bonus->update([
            'status'      => 'rejected',
            'rejected_at' => now(),
        ]);

        PayrollAuditLog::create([
            'action'      => 'bonus_rejected',
            'entity_type' => 'PayrollBonus',
            'entity_id'   => $bonus->id,
            'user_id'     => $user->id,
            'description' => "Bonus #{$bonus->id} rejected by {$user->name}",
        ]);

        return response()->json(['message' => 'Bonus rejected.']);
    }

    // ── DELETE /api/payroll-bonuses/{bonus} ────────────────────────────────────

    public function destroy(int $bonusId): JsonResponse
    {
        $bonus = PayrollBonus::findOrFail($bonusId);

        if ($bonus->status === 'approved' && $bonus->payslip_id) {
            return response()->json([
                'message' => 'Cannot delete a bonus that has already been included in a payslip.',
            ], 422);
        }

        $bonus->delete();

        return response()->json(['message' => 'Bonus deleted.']);
    }
}