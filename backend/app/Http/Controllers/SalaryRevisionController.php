<?php
namespace App\Http\Controllers;
 
use App\Models\Employee;
use App\Models\SalaryRevision;
use App\Models\PayrollAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
 
class SalaryRevisionController extends Controller
{
    // GET /api/salary-revisions?employee_id=X
    public function index(Request $request): JsonResponse
    {
        $q = SalaryRevision::with([
            'employee:id,first_name,last_name,department',
            'approvedBy:id,name',
        ]);
        if ($request->employee_id) $q->where('employee_id', $request->employee_id);
 
        return response()->json(
            $q->latest('effective_date')->get()->map(fn ($r) => [
                'id'               => $r->id,
                'employee_id'      => $r->employee_id,
                'employee_name'    => $r->employee
                    ? trim("{$r->employee->first_name} {$r->employee->last_name}") : null,
                'department'       => $r->employee?->department,
                'previous_salary'  => (float) $r->previous_salary,
                'new_salary'       => (float) $r->new_salary,
                'change_amount'    => (float) $r->change_amount,
                'change_pct'       => (float) $r->change_pct,
                'reason'           => $r->reason,
                'notes'            => $r->notes,
                'effective_date'   => $r->effective_date?->toDateString(),
                'approved_by'      => $r->approved_by,
                'approved_by_name' => $r->approvedBy?->name,
                'created_at'       => $r->created_at?->toDateTimeString(),
            ])
        );
    }
 
    // POST /api/salary-revisions
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id'    => 'required|exists:employees,id',
            'new_salary'     => 'required|numeric|min:0',
            'reason'         => 'required|in:promotion,annual_review,merit,market_adjustment,correction,other',
            'effective_date' => 'required|date',
            'notes'          => 'nullable|string|max:500',
        ]);
 
        $employee = Employee::findOrFail($data['employee_id']);
        $prevSal  = (float) $employee->basic_salary;
        $newSal   = (float) $data['new_salary'];
        $change   = $newSal - $prevSal;
        $pct      = $prevSal > 0 ? ($change / $prevSal) * 100 : 0;
 
        DB::transaction(function () use ($data, $employee, $prevSal, $newSal, $change, $pct) {
            // 1. Record the revision
            $revision = SalaryRevision::create([
                'employee_id'    => $data['employee_id'],
                'previous_salary'=> $prevSal,
                'new_salary'     => $newSal,
                'change_amount'  => round($change, 2),
                'change_pct'     => round($pct, 2),
                'reason'         => $data['reason'],
                'notes'          => $data['notes'] ?? null,
                'effective_date' => $data['effective_date'],
                'approved_by'    => Auth::id(),
            ]);
 
            // 2. Update employee's current salary
            $employee->update(['basic_salary' => $newSal]);
 
            // 3. Audit log
            PayrollAuditLog::create([
                'action'      => 'salary_revised',
                'entity_type' => 'SalaryRevision',
                'entity_id'   => $revision->id,
                'user_id'     => Auth::id(),
                'description' => "Salary revised for {$employee->first_name}: ₱{$prevSal} → ₱{$newSal} ({$data['reason']})",
            ]);
        });
 
        return response()->json(['message' => 'Salary revision saved and employee record updated.'], 201);
    }
}
 