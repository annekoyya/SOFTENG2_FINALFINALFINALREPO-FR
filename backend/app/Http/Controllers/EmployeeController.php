<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class EmployeeController extends Controller
{
    // ─── Salary map keyed by job_category ────────────────────────────────────
    private const SALARY_MAP = [
        // Front Office
        'Front Desk Agent'        => 18000,
        'Concierge'               => 19000,
        'Reservations Agent'      => 18500,
        'Guest Relations Officer' => 20000,
        'Bell Staff'              => 16000,
        // Housekeeping
        'Room Attendant'          => 16000,
        'Laundry Attendant'       => 15500,
        'Housekeeping Supervisor' => 22000,
        'Public Area Cleaner'     => 15000,
        // Food & Beverage
        'Waiter/Waitress'         => 16500,
        'Bartender'               => 18000,
        'Chef de Partie'          => 25000,
        'Sous Chef'               => 32000,
        'Executive Chef'          => 45000,
        'Kitchen Steward'         => 15000,
        // Maintenance
        'Maintenance Technician'  => 19000,
        'Electrician'             => 22000,
        'Plumber'                 => 21000,
        'Maintenance Supervisor'  => 28000,
        // Administration
        'HR Officer'              => 25000,
        'Accounting Staff'        => 24000,
        'Payroll Officer'         => 26000,
        'General Manager'         => 65000,
        'Department Manager'      => 42000,
        'Supervisor'              => 28000,
        // Security
        'Security Guard'          => 17000,
        'Security Supervisor'     => 22000,
        // Sales & Marketing
        'Sales Manager'           => 38000,
        'Marketing Officer'       => 28000,
        'Reservations Manager'    => 32000,
    ];

    // ─── GET /api/employees ───────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = Employee::query();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) =>
                $q->where('first_name', 'like', "%$s%")
                  ->orWhere('last_name',  'like', "%$s%")
                  ->orWhere('email',      'like', "%$s%")
                  ->orWhere('department', 'like', "%$s%")
            );
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        $employees = $query->orderBy('last_name')->paginate(20);

        return $this->success($employees);
    }

    // ─── GET /api/employees/archived ─────────────────────────────────────────
    public function archived(): JsonResponse
    {
        $employees = Employee::onlyTrashed()->orderBy('deleted_at', 'desc')->paginate(20);
        return $this->success($employees);
    }

    // ─── GET /api/employees/{employee} ───────────────────────────────────────
    public function show(Employee $employee): JsonResponse
    {
        return $this->success($employee);
    }

    // ─── POST /api/employees ─────────────────────────────────────────────────
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());
        $validated['basic_salary'] = self::SALARY_MAP[$validated['job_category']] ?? 0;

        $employee = Employee::create($validated);
        return $this->created($employee, 'Employee created successfully');
    }

    // ─── PUT /api/employees/{employee} ───────────────────────────────────────
    public function update(Request $request, Employee $employee): JsonResponse
    {
        $validated = $request->validate($this->rules($employee->id));

        // Auto-update salary if job_category changed
        if (isset($validated['job_category'])) {
            $validated['basic_salary'] = self::SALARY_MAP[$validated['job_category']] ?? $employee->basic_salary;
        }

        $employee->update($validated);
        return $this->success($employee->fresh(), 'Employee updated successfully');
    }

    // ─── PATCH /api/employees/{employee}/status ───────────────────────────────
    public function updateStatus(Request $request, Employee $employee): JsonResponse
    {
        $request->validate(['status' => 'required|in:active,on_leave,suspended,terminated']);
        $employee->update(['status' => $request->status]);
        return $this->success($employee->fresh(), 'Status updated');
    }

    // ─── PATCH /api/employees/{employee}/role ────────────────────────────────
    public function updateRole(Request $request, Employee $employee): JsonResponse
    {
        $request->validate(['role' => 'required|in:Employee,HR,Manager,Accountant,Admin']);
        $employee->update(['role' => $request->role]);
        return $this->success($employee->fresh(), 'Role updated');
    }

    // ─── DELETE /api/employees/{employee} (soft delete / archive) ────────────
    public function destroy(Employee $employee): JsonResponse
    {
        $employee->delete();
        return $this->success(null, 'Employee archived');
    }

    // ─── POST /api/employees/{id}/restore ────────────────────────────────────
    public function restore(int $id): JsonResponse
    {
        $employee = Employee::onlyTrashed()->findOrFail($id);
        $employee->restore();
        return $this->success($employee->fresh(), 'Employee restored');
    }

    // ─── DELETE /api/employees/{id}/purge ────────────────────────────────────
    public function purge(int $id): JsonResponse
    {
        $employee = Employee::onlyTrashed()->findOrFail($id);
        $employee->forceDelete();
        return $this->success(null, 'Employee permanently deleted');
    }

    // ─── GET /api/employees/departments ──────────────────────────────────────
    public function getDepartments(): JsonResponse
    {
        $departments = Employee::distinct()->orderBy('department')->pluck('department')->filter()->values();
        return $this->success($departments);
    }

    // ─── GET /api/employees/job-categories ───────────────────────────────────
    public function getJobCategories(Request $request): JsonResponse
    {
        $query = Employee::distinct()->orderBy('job_category');
        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }
        $categories = $query->pluck('job_category')->filter()->values();
        return $this->success($categories);
    }

    // ─── GET /api/employees/salary-mapping ───────────────────────────────────
    public function getSalaryMapping(): JsonResponse
    {
        return $this->success(self::SALARY_MAP);
    }

    // ─── GET /api/employees/{id}/export ──────────────────────────────────────
    public function export(int $id): JsonResponse
    {
        $employee = Employee::withTrashed()->findOrFail($id);
        return $this->success($employee, 'Employee data exported');
    }

    // ─── Validation rules ────────────────────────────────────────────────────
    private function rules(?int $ignoreId = null): array
    {
        return [
            'first_name'               => 'required|string|max:100',
            'last_name'                => 'required|string|max:100',
            'middle_name'              => 'nullable|string|max:100',
            'name_extension'           => 'nullable|string|max:10',
            'date_of_birth'            => 'required|date',
            'email'                    => 'required|email|unique:employees,email,' . ($ignoreId ?? 'NULL'),
            'phone_number'             => 'required|string|max:20',
            'home_address'             => 'required|string',
            'emergency_contact_name'   => 'required|string|max:100',
            'emergency_contact_number' => 'required|string|max:20',
            'relationship'             => 'required|string|max:50',
            'tin'                      => 'nullable|string|max:30',
            'sss_number'               => 'nullable|string|max:30',
            'pagibig_number'           => 'nullable|string|max:30',
            'philhealth_number'        => 'nullable|string|max:30',
            'bank_name'                => 'nullable|string|max:100',
            'account_name'             => 'nullable|string|max:100',
            'account_number'           => 'nullable|string|max:50',
            'start_date'               => 'required|date',
            'end_date'                 => 'nullable|date|after:start_date',
            'department'               => 'required|string|max:100',
            'job_category'             => 'required|string|max:100',
            'employment_type'          => 'required|in:regular,probationary,contractual,part_time,intern',
            'shift_sched'              => 'required|in:morning,afternoon,night',
            'status'                   => 'sometimes|in:active,on_leave,suspended,terminated',
            'role'                     => 'sometimes|in:Employee,HR,Manager,Accountant,Admin',
        ];
    }
}