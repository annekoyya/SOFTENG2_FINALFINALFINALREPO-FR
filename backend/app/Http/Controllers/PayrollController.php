<?php

namespace App\Http\Controllers;

use App\Models\Payroll;
use App\Models\Employee;
use App\Services\PayrollService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PayrollController extends Controller
{
    private PayrollService $payrollService;

    public function __construct(PayrollService $payrollService)
    {
        $this->payrollService = $payrollService;
    }

    /**
     * Get payroll summary for dashboard.
     */
    public function getSummary(Request $request): JsonResponse
    {
        $year = $request->query('year', now()->year);
        $month = $request->query('month', now()->month);

        $summary = $this->payrollService->getMonthlyPayrollSummary($year, $month);

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Get all payrolls with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payroll::with(['employee', 'creator', 'approver']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        // Filter by month/year
        if ($request->has('month') && $request->has('year')) {
            $month = $request->query('month');
            $year = $request->query('year');
            $query->forMonth($year, $month);
        }

        // Filter by employee
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->query('employee_id'));
        }

        // Search by employee name
        if ($request->has('search')) {
            $search = $request->query('search');
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        $payrolls = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $payrolls,
        ]);
    }

    /**
     * Get a specific payroll record.
     */
    public function show(Payroll $payroll): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $payroll->load(['employee', 'creator', 'approver']),
        ]);
    }

    /**
     * Calculate and create a payroll record.
     */
    public function calculate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'pay_period_start' => 'required|date',
            'pay_period_end' => 'required|date',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        $periodStart = Carbon::parse($validated['pay_period_start']);
        $periodEnd = Carbon::parse($validated['pay_period_end']);

        // Check if payroll already exists for this period
        $existing = Payroll::where('employee_id', $employee->id)
            ->where('pay_period_start', $periodStart)
            ->where('pay_period_end', $periodEnd)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Payroll for this period already exists.',
                'data' => $existing,
            ], 409);
        }

        // Calculate payroll
        // $calculation = $this->payrollService->calculatePayroll($employee, $periodStart, $periodEnd);

        // Create payroll record
        // $payroll = Payroll::create([
        //     'employee_id' => $employee->id,
        //     'pay_period_start' => $periodStart,
        //     'pay_period_end' => $periodEnd,
        //     'base_salary' => $calculation['base_salary'],
        //     'overtime_pay' => $calculation['overtime_pay'],
        //     'bonuses' => $calculation['bonuses'],
        //     'allowances' => $calculation['allowances'],
        //     'gross_salary' => $calculation['gross_salary'],
        //     'sss_contribution' => $calculation['deductions']['sss_contribution'],
        //     'philhealth_contribution' => $calculation['deductions']['philhealth_contribution'],
        //     'pagibig_contribution' => $calculation['deductions']['pagibig_contribution'],
        //     'tax_withholding' => $calculation['deductions']['tax_withholding'],
        //     'other_deductions' => $calculation['deductions']['other_deductions'],
        //     'total_deductions' => $calculation['total_deductions'],
        //     'net_salary' => $calculation['net_salary'],
        //     'calculation_breakdown' => $calculation['calculation_breakdown'],
        //     'status' => 'draft',
        //     // 'created_by' => auth()->id(),
        // ]);

    //     return response()->json([
    //         'success' => true,
    //         'message' => 'Payroll calculated successfully.',
    //         'data' => $payroll,
    //     ], 201);
    // }

    /**
     * Update a payroll record (only if draft/pending).
     */
    // public function update(Request $request, Payroll $payroll): JsonResponse
    // {
    //     if (!$payroll->canEdit()) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'This payroll cannot be edited in its current status.',
    //         ], 422);
    //     }

    //     $validated = $request->validate([
    //         'overtime_pay' => 'sometimes|numeric|min:0',
    //         'bonuses' => 'sometimes|numeric|min:0',
    //         'allowances' => 'sometimes|numeric|min:0',
    //         'other_deductions' => 'sometimes|numeric|min:0',
    //         'notes' => 'sometimes|string',
    //     ]);

    //     // Update values
    //     $payroll->fill($validated);

    //     // Recalculate totals
    //     $payroll->gross_salary = $payroll->base_salary + $payroll->overtime_pay + $payroll->bonuses + $payroll->allowances;
    //     $payroll->total_deductions = $payroll->sss_contribution + $payroll->philhealth_contribution + 
    //                                  $payroll->pagibig_contribution + $payroll->tax_withholding + $payroll->other_deductions;
    //     $payroll->recalculateNetSalary();
        
    //     $payroll->save();

    //     return response()->json([
    //         'success' => true,
    //         'message' => 'Payroll updated successfully.',
    //         'data' => $payroll,
    //     ]);
    // }

    /**
     * Submit payroll for approval.
     */
    public function submitForApproval(Payroll $payroll): JsonResponse
    {
        if ($payroll->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Only draft payrolls can be submitted for approval.',
            ], 422);
        }

        $payroll->update(['status' => 'pending_approval']);

        return response()->json([
            'success' => true,
            'message' => 'Payroll submitted for approval.',
            'data' => $payroll,
        ]);
    }

    /**
     * Approve a payroll record.
     */
    public function approve(Payroll $payroll): JsonResponse
    {
        if (!$payroll->canApprove()) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending payrolls can be approved.',
            ], 422);
        }

        // $payroll->update([
        //     'status' => 'approved',
        //     'approved_by' => auth()->id(),
        //     'approved_at' => now(),
        // ]);

        return response()->json([
            'success' => true,
            'message' => 'Payroll approved successfully.',
            'data' => $payroll,
        ]);
    }

    /**
     * Reject a payroll record.
     */
    public function reject(Request $request, Payroll $payroll): JsonResponse
    {
        if ($payroll->status !== 'pending_approval') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending payrolls can be rejected.',
            ], 422);
        }

        $validated = $request->validate(['reason' => 'required|string']);

        $payroll->update([
            'status' => 'draft',
            'notes' => $payroll->notes . "\n\nRejection reason: " . $validated['reason'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payroll rejected and moved back to draft.',
            'data' => $payroll,
        ]);
    }

    /**
     * Process an approved payroll (mark as processed).
     */
    public function process(Payroll $payroll): JsonResponse
    {
        if (!$payroll->canProcess()) {
            return response()->json([
                'success' => false,
                'message' => 'Only approved payrolls can be processed.',
            ], 422);
        }

        $payroll->update(['status' => 'processed']);

        return response()->json([
            'success' => true,
            'message' => 'Payroll processed successfully.',
            'data' => $payroll,
        ]);
    }

    /**
     * Mark payroll as paid.
     */
    public function markAsPaid(Payroll $payroll): JsonResponse
    {
        if ($payroll->status !== 'processed') {
            return response()->json([
                'success' => false,
                'message' => 'Only processed payrolls can be marked as paid.',
            ], 422);
        }

        $payroll->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payroll marked as paid.',
            'data' => $payroll,
        ]);
    }

    /**
     * Delete a payroll record (only draft).
     */
    public function destroy(Payroll $payroll): JsonResponse
    {
        if ($payroll->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Only draft payrolls can be deleted.',
            ], 422);
        }

        $payroll->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payroll deleted successfully.',
        ]);
    }
}
