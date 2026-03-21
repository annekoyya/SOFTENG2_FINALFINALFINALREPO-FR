<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EmployeeController extends Controller
{
    // ─── Read ─────────────────────────────────────────────────────────────────

    /**
     * List all active employees with optional filters.
     * GET /api/employees
     */
    public function index(Request $request): JsonResponse
    {
        $query = Employee::query();

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('department'))      $query->byDepartment($request->query('department'));
        if ($request->filled('employment_type')) $query->byEmploymentType($request->query('employment_type'));
        if ($request->filled('status'))          $query->where('status', $request->query('status'));
        else                                     $query->active();

        $employees = $query->orderBy('last_name')->orderBy('first_name')->paginate(20);

        return $this->success($employees);
    }

    /**
     * Show a single employee's full profile.
     * GET /api/employees/{employee}
     */
    public function show(Employee $employee): JsonResponse
    {
        return $this->success(
            $employee->load(['manager', 'leaveRequests' => fn($q) => $q->latest()->limit(5)])
        );
    }

    /**
     * List archived (soft-deleted) employees.
     * GET /api/employees/archived
     */
    public function archived(Request $request): JsonResponse
    {
        $query = Employee::onlyTrashed();

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        $employees = $query->orderBy('deleted_at', 'desc')->paginate(20);

        return $this->success($employees);
    }

    // ─── Create & Edit ────────────────────────────────────────────────────────

    /**
     * Create a new employee.
     * POST /api/employees
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateEmployee($request);
        $employee  = Employee::create($validated);

        return $this->created($employee, 'Employee created successfully');
    }

    /**
     * Update an existing employee.
     * PUT /api/employees/{employee}
     */
    public function update(Request $request, Employee $employee): JsonResponse
    {
        $validated = $this->validateEmployee($request, $employee->id);
        $employee->update($validated);

        return $this->success($employee->fresh(), 'Employee updated successfully');
    }

    // ─── Status ───────────────────────────────────────────────────────────────

    /**
     * Update employee status.
     * PATCH /api/employees/{employee}/status
     */
    public function updateStatus(Request $request, Employee $employee): JsonResponse
    {
        $validated = $request->validate([
            'status'   => 'required|in:active,on_leave,suspended,terminated',
            'end_date' => 'required_if:status,terminated|nullable|date',
        ]);

        $employee->update($validated);

        return $this->success($employee, 'Employee status updated');
    }

    // ─── Archive / Restore / Purge ────────────────────────────────────────────

    /**
     * Soft-delete (archive) an employee.
     * DELETE /api/employees/{employee}
     */
    public function destroy(Employee $employee): JsonResponse
    {
        $employee->delete();

        return $this->success(null, "{$employee->full_name} has been archived");
    }

    /**
     * Restore a soft-deleted employee.
     * POST /api/employees/{id}/restore
     */
    public function restore(int $id): JsonResponse
    {
        $employee = Employee::onlyTrashed()->findOrFail($id);
        $employee->restore();

        return $this->success($employee, "{$employee->full_name} has been restored");
    }

    /**
     * Permanently delete an archived employee. Admin only.
     * DELETE /api/employees/{id}/purge
     */
    public function purge(int $id): JsonResponse
    {
        $employee = Employee::onlyTrashed()->findOrFail($id);
        $name     = $employee->full_name;
        $employee->forceDelete();

        return $this->success(null, "{$name} has been permanently deleted");
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private function validateEmployee(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'first_name'               => 'required|string|max:100',
            'last_name'                => 'required|string|max:100',
            'middle_name'              => 'nullable|string|max:100',
            'name_extension'           => 'nullable|string|max:10',
            'date_of_birth'            => 'required|date|before:today',
            'email'                    => 'required|email|unique:employees,email,' . ($ignoreId ?? 'NULL'),
            'phone_number'             => 'required|string|max:20',
            'home_address'             => 'required|string|max:500',
            'emergency_contact_name'   => 'required|string|max:100',
            'emergency_contact_number' => 'required|string|max:20',
            'relationship'             => 'required|string|max:50',
            'tin'                      => 'nullable|string|max:20',
            'sss_number'               => 'nullable|string|max:20',
            'pagibig_number'           => 'nullable|string|max:20',
            'philhealth_number'        => 'nullable|string|max:20',
            'bank_name'                => 'nullable|string|max:100',
            'account_name'             => 'nullable|string|max:100',
            'account_number'           => 'nullable|string|max:30',
            'start_date'               => 'required|date',
            'end_date'                 => 'nullable|date|after:start_date',
            'department'               => 'required|string|max:100',
            'job_category'             => 'required|string|max:100',
            'employment_type'          => 'required|in:regular,probationary,contractual,part_time,intern',
            'reporting_manager'        => 'nullable|string|max:100',
            'basic_salary'             => 'required|numeric|min:0',
            'role'                     => 'sometimes|in:Employee,HR,Manager,Accountant,Admin',
            'manager_id'               => 'nullable|exists:employees,id',
        ]);
    }
}