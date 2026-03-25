<?php

namespace App\Http\Controllers;

use App\Models\Payslip;
use App\Models\PayrollAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PayslipAdjustmentController extends Controller
{
    /**
     * PATCH /api/payslips/{id}/adjust
     *
     * Allows Admin / Accountant to override overtime_amount and total_allowances
     * on a payslip that is still in draft or computed status.
     * Recalculates net_pay and logs the change in payroll_audit_logs.
     */
    public function adjust(Request $request, int $payslipId): JsonResponse
    {
        $payslip = Payslip::findOrFail($payslipId);

        // Only allow edits before approval
        if (in_array($payslip->status, ['approved', 'paid'])) {
            return response()->json([
                'message' => "Cannot edit a payslip with status '{$payslip->status}'.",
            ], 422);
        }

        $data = $request->validate([
            'overtime_amount'   => 'required|numeric|min:0',
            'total_allowances'  => 'required|numeric|min:0',
            'note'              => 'required|string|max:500',
        ]);

        $user = Auth::user();

        // Snapshot old values for audit log
        $oldOvertime   = (float) $payslip->overtime_amount;
        $oldAllowances = (float) $payslip->total_allowances;
        $oldNet        = (float) $payslip->net_pay;

        DB::transaction(function () use ($payslip, $data, $user, $oldOvertime, $oldAllowances, $oldNet) {
            // Recalculate gross and net
            $newGross = $payslip->basic_salary
                + $data['overtime_amount']
                + $data['total_allowances']
                + $payslip->total_bonuses;  // approved bonuses already factored in

            $newNet = $newGross - $payslip->total_deductions;

            $payslip->update([
                'overtime_amount'  => $data['overtime_amount'],
                'total_allowances' => $data['total_allowances'],
                'gross_pay'        => $newGross,
                'net_pay'          => $newNet,
                'status'           => 'computed', // reset to computed to require re-approval
            ]);

            // Build a human-readable diff
            $changes = [];
            if ($data['overtime_amount'] != $oldOvertime) {
                $changes[] = "overtime ₱{$oldOvertime} → ₱{$data['overtime_amount']}";
            }
            if ($data['total_allowances'] != $oldAllowances) {
                $changes[] = "allowances ₱{$oldAllowances} → ₱{$data['total_allowances']}";
            }
            $changes[] = "net pay ₱{$oldNet} → ₱{$newNet}";

            PayrollAuditLog::create([
                'action'      => 'adjusted',
                'entity_type' => 'Payslip',
                'entity_id'   => $payslip->id,
                'user_id'     => $user->id,
                'description' => implode('; ', $changes) . ". Note: {$data['note']}",
            ]);
        });

        return response()->json([
            'message' => 'Payslip adjusted. Status reset to computed — please re-approve.',
            'net_pay' => $payslip->fresh()->net_pay,
        ]);
    }
}