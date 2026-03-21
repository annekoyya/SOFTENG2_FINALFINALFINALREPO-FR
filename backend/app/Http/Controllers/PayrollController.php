<?php

namespace App\Http\Controllers;

use App\Models\Payroll;
use App\Models\Employee;
use App\Services\PayrollService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class PayrollController extends Controller
{
    public function __construct(private PayrollService $payrollService) {}

    // ─── Read ─────────────────────────────────────────────────────────────────

    /**
     * Payroll summary for the dashboard.
     * GET /api/payrolls/summary
     */
    public function getSummary(Request $request): JsonResponse
    {
        $year  = (int) $request->query('year', now()->year);
        $month = (int) $request->query('month', now()->month);

        $summary = $this->payrollService->getMonthlyPayrollSummary($year, $month);

        return $this->success($summary);
    }

    /**
     * List all payrolls with filters.
     * GET /api/payrolls
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payroll::with(['employee', 'creator', 'approver']);

        if ($request->filled('status')) {
            $query->byStatus($request->query('status'));
        }

        if ($request->filled('month') && $request->filled('year')) {
            $query->forMonth((int) $request->query('year'), (int) $request->query('month'));
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->query('employee_id'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        $payrolls = $query->orderBy('created_at', 'desc')->paginate(20);

        return $this->success($payrolls);
    }

    /**
     * Show a single payroll record.
     * GET /api/payrolls/{payroll}
     */
    public function show(Payroll $payroll): JsonResponse
    {
        return $this->success($payroll->load(['employee', 'creator', 'approver']));
    }

    // ─── Create & Edit ────────────────────────────────────────────────────────

    /**
     * Calculate and create a payroll record (creates as draft).
     * POST /api/payrolls/calculate
     */
    public function calculate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id'      => 'required|exists:employees,id',
            'pay_period_start' => 'required|date',
            'pay_period_end'   => 'required|date|after_or_equal:pay_period_start',
        ]);

        $employee    = Employee::findOrFail($validated['employee_id']);
        $periodStart = Carbon::parse($validated['pay_period_start']);
        $periodEnd   = Carbon::parse($validated['pay_period_end']);

        // Prevent duplicate payroll for the same period
        $existing = Payroll::where('employee_id', $employee->id)
            ->where('pay_period_start', $periodStart->toDateString())
            ->where('pay_period_end', $periodEnd->toDateString())
            ->first();

        if ($existing) {
            return $this->error(
                'Payroll for this period already exists.',
                409,
                ['existing_payroll_id' => $existing->id]
            );
        }

        $calculation = $this->payrollService->calculatePayroll($employee, $periodStart, $periodEnd);

        $payroll = Payroll::create([
            'employee_id'             => $employee->id,
            'pay_period_start'        => $periodStart->toDateString(),
            'pay_period_end'          => $periodEnd->toDateString(),
            'base_salary'             => $calculation['base_salary'],
            'overtime_pay'            => $calculation['overtime_pay'],
            'bonuses'                 => $calculation['bonuses'],
            'allowances'              => $calculation['allowances'],
            'gross_salary'            => $calculation['gross_salary'],
            'sss_contribution'        => $calculation['deductions']['sss_contribution'],
            'philhealth_contribution' => $calculation['deductions']['philhealth_contribution'],
            'pagibig_contribution'    => $calculation['deductions']['pagibig_contribution'],
            'tax_withholding'         => $calculation['deductions']['tax_withholding'],
            'other_deductions'        => $calculation['deductions']['other_deductions'],
            'total_deductions'        => $calculation['total_deductions'],
            'net_salary'              => $calculation['net_salary'],
            'calculation_breakdown'   => $calculation['calculation_breakdown'],
            'status'                  => 'draft',
            'created_by'              => Auth::id(),
        ]);

        return $this->created($payroll->load('employee'), 'Payroll calculated successfully');
    }

    /**
     * Update a draft or pending payroll (adjustments, bonuses, etc.).
     * PATCH /api/payrolls/{payroll}
     */
    public function update(Request $request, Payroll $payroll): JsonResponse
    {
        if (!$payroll->canEdit()) {
            return $this->error('This payroll cannot be edited in its current status.');
        }

        $validated = $request->validate([
            'overtime_pay'    => 'sometimes|numeric|min:0',
            'bonuses'         => 'sometimes|numeric|min:0',
            'allowances'      => 'sometimes|numeric|min:0',
            'other_deductions'=> 'sometimes|numeric|min:0',
            'notes'           => 'sometimes|nullable|string|max:1000',
        ]);

        $payroll->fill($validated);
        $payroll->recalculate(); // Uses the model method to recompute gross + net
        $payroll->save();

        return $this->success($payroll, 'Payroll updated successfully');
    }

    // ─── Workflow Actions ─────────────────────────────────────────────────────

    /**
     * Submit a draft payroll for approval.
     * POST /api/payrolls/{payroll}/submit
     */
    public function submitForApproval(Payroll $payroll): JsonResponse
    {
        if (!$payroll->canSubmit()) {
            return $this->error('Only draft payrolls can be submitted for approval.');
        }

        $payroll->update(['status' => 'pending_approval']);

        return $this->success($payroll, 'Payroll submitted for approval');
    }

    /**
     * Approve a pending payroll.
     * POST /api/payrolls/{payroll}/approve
     */
    public function approve(Payroll $payroll): JsonResponse
    {
        if (!$payroll->canApprove()) {
            return $this->error('Only pending payrolls can be approved.');
        }

        $payroll->update([
            'status'      => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return $this->success($payroll->fresh(['approver']), 'Payroll approved successfully');
    }

    /**
     * Reject a pending payroll and return it to draft.
     * POST /api/payrolls/{payroll}/reject
     */
    public function reject(Request $request, Payroll $payroll): JsonResponse
    {
        if ($payroll->status !== 'pending_approval') {
            return $this->error('Only pending payrolls can be rejected.');
        }

        $validated = $request->validate(['reason' => 'required|string|max:500']);

        $payroll->update([
            'status' => 'draft',
            'notes'  => trim($payroll->notes . "\n\nRejection reason: " . $validated['reason']),
        ]);

        return $this->success($payroll, 'Payroll rejected and moved back to draft');
    }

    /**
     * Process an approved payroll.
     * POST /api/payrolls/{payroll}/process
     */
    public function process(Payroll $payroll): JsonResponse
    {
        if (!$payroll->canProcess()) {
            return $this->error('Only approved payrolls can be processed.');
        }

        $payroll->update(['status' => 'processed']);

        return $this->success($payroll, 'Payroll processed successfully');
    }

    /**
     * Mark a processed payroll as paid.
     * POST /api/payrolls/{payroll}/mark-paid
     */
    public function markAsPaid(Payroll $payroll): JsonResponse
    {
        if (!$payroll->canMarkPaid()) {
            return $this->error('Only processed payrolls can be marked as paid.');
        }

        $payroll->update([
            'status'  => 'paid',
            'paid_at' => now(),
        ]);

        return $this->success($payroll, 'Payroll marked as paid');
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    /**
     * Delete a draft payroll record.
     * DELETE /api/payrolls/{payroll}
     */
    public function destroy(Payroll $payroll): JsonResponse
    {
        if ($payroll->status !== 'draft') {
            return $this->error('Only draft payrolls can be deleted.');
        }

        $payroll->delete();

        return $this->success(null, 'Payroll deleted successfully');
    }
}