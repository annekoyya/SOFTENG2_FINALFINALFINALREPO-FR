<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\NewHire;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class NewHireController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = NewHire::with(['creator', 'employee'])
            ->whereIn('onboarding_status', ['pending', 'complete'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('onboarding_status', $request->query('status'));
        }

        return response()->json(['success' => true, 'data' => $query->paginate(20)]);
    }

    public function show(int $id): JsonResponse
    {
        $newHire = NewHire::with(['creator', 'employee'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $newHire]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name'               => 'required|string|max:100',
            'last_name'                => 'required|string|max:100',
            'email'                    => 'required|email|unique:new_hires,email|unique:employees,email',
            'middle_name'              => 'nullable|string|max:100',
            'name_extension'           => 'nullable|string|max:20',
            'date_of_birth'            => 'nullable|date',
            'phone_number'             => 'nullable|string|max:20',
            'home_address'             => 'nullable|string|max:500',
            'emergency_contact_name'   => 'nullable|string|max:100',
            'emergency_contact_number' => 'nullable|string|max:20',
            'relationship'             => 'nullable|string|max:50',
            'tin'                      => 'nullable|string|max:20',
            'sss_number'               => 'nullable|string|max:20',
            'pagibig_number'           => 'nullable|string|max:20',
            'philhealth_number'        => 'nullable|string|max:20',
            'bank_name'                => 'nullable|string|max:100',
            'account_name'             => 'nullable|string|max:100',
            'account_number'           => 'nullable|string|max:50',
            'start_date'               => 'nullable|date',
            'department'               => 'nullable|string|max:100',
            'job_category'             => 'nullable|string|max:100',
            'employment_type'          => 'nullable|in:regular,probationary,contractual,part_time,intern',
            'role'                     => 'nullable|in:Employee,HR,Manager,Accountant,Admin',
            'basic_salary'             => 'nullable|numeric|min:0',
            'reporting_manager'        => 'nullable|string|max:100',
            'shift_sched'              => 'nullable|in:morning,afternoon,night',
        ]);

        $newHire = NewHire::create([
            ...$validated,
            'created_by'        => Auth::id(),
            'onboarding_status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'data'    => $newHire->fresh(['creator']),
            'message' => 'New hire record created.',
        ], 201);
    }

    /**
     * Step 1: Save all details → sets onboarding_status to 'complete'
     * POST /api/new-hires/{id}/complete-details
     */
    public function completeDetails(Request $request, int $id): JsonResponse
    {
        $newHire = NewHire::findOrFail($id);

        $v = $request->validate([
            'first_name'               => 'required|string|max:255',
            'last_name'                => 'required|string|max:255',
            'middle_name'              => 'nullable|string|max:255',
            'name_extension'           => 'nullable|string|max:20',
            'date_of_birth'            => 'required|date',
            'email'                    => 'required|email|max:255',
            'phone_number'             => 'required|string|max:30',
            'home_address'             => 'required|string|max:500',
            'emergency_contact_name'   => 'required|string|max:255',
            'emergency_contact_number' => 'required|string|max:30',
            'relationship'             => 'required|string|max:100',
            'tin'                      => 'nullable|string|max:50',
            'sss_number'               => 'nullable|string|max:50',
            'pagibig_number'           => 'nullable|string|max:50',
            'philhealth_number'        => 'nullable|string|max:50',
            'bank_name'                => 'nullable|string|max:100',
            'account_name'             => 'nullable|string|max:255',
            'account_number'           => 'nullable|string|max:50',
            'start_date'               => 'required|date',
            'department'               => 'required|string|max:100',
            'job_category'             => 'required|string|max:100',
            'shift_sched'              => 'required|in:morning,afternoon,night',
            'employment_type'          => 'required|in:regular,probationary,contractual,part_time,intern',
            'role'                     => 'required|in:Employee,HR,Accountant,Manager,Admin',
            'basic_salary'             => 'required|numeric|min:0',
            'reporting_manager'        => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $newHire->update([
                ...$v,
                'onboarding_status' => 'complete',
                'completed_fields'  => array_keys($v),
            ]);

            // Sync to associated employee record if one exists
            if ($newHire->employee_id) {
                Employee::where('id', $newHire->employee_id)->update([
                    'first_name'               => $v['first_name'],
                    'last_name'                => $v['last_name'],
                    'middle_name'              => $v['middle_name'] ?? null,
                    'name_extension'           => $v['name_extension'] ?? null,
                    'date_of_birth'            => $v['date_of_birth'],
                    'email'                    => $v['email'],
                    'phone_number'             => $v['phone_number'],
                    'home_address'             => $v['home_address'],
                    'emergency_contact_name'   => $v['emergency_contact_name'],
                    'emergency_contact_number' => $v['emergency_contact_number'],
                    'relationship'             => $v['relationship'],
                    'tin'                      => $v['tin'] ?? null,
                    'sss_number'               => $v['sss_number'] ?? null,
                    'pagibig_number'           => $v['pagibig_number'] ?? null,
                    'philhealth_number'        => $v['philhealth_number'] ?? null,
                    'bank_name'                => $v['bank_name'] ?? null,
                    'account_name'             => $v['account_name'] ?? null,
                    'account_number'           => $v['account_number'] ?? null,
                    'start_date'               => $v['start_date'],
                    'department'               => $v['department'],
                    'job_category'             => $v['job_category'],
                    'shift_sched'              => $v['shift_sched'],
                    'employment_type'          => $v['employment_type'],
                    'role'                     => $v['role'],
                    'basic_salary'             => $v['basic_salary'],
                    'reporting_manager'        => $v['reporting_manager'] ?? null,
                    'status'                   => 'onboarding',
                ]);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'data'    => $newHire->fresh(),
                'message' => 'Details saved.',
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Step 2: Transfer — creates employee if needed, creates user login, activates employee.
     * POST /api/new-hires/{id}/transfer
     */
    public function transfer(int $id): JsonResponse
    {
        $newHire = NewHire::with('employee')->findOrFail($id);

        if ($newHire->onboarding_status === 'transferred') {
            return response()->json(['success' => false, 'message' => 'Already transferred.'], 422);
        }

        if ($newHire->onboarding_status !== 'complete') {
            return response()->json([
                'success' => false,
                'message' => 'Please complete all required details before transferring.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Get existing employee or create one from new hire data
            $employee = $newHire->employee_id
                ? Employee::find($newHire->employee_id)
                : null;

            if (!$employee) {
                $employee = Employee::create([
                    'first_name'               => $newHire->first_name,
                    'last_name'                => $newHire->last_name,
                    'middle_name'              => $newHire->middle_name,
                    'name_extension'           => $newHire->name_extension,
                    'date_of_birth'            => $newHire->date_of_birth ?? '1990-01-01',
                    'email'                    => $newHire->email,
                    'phone_number'             => $newHire->phone_number ?? 'TBD',
                    'home_address'             => $newHire->home_address ?? 'TBD',
                    'emergency_contact_name'   => $newHire->emergency_contact_name ?? 'TBD',
                    'emergency_contact_number' => $newHire->emergency_contact_number ?? 'TBD',
                    'relationship'             => $newHire->relationship ?? 'TBD',
                    'tin'                      => $newHire->tin,
                    'sss_number'               => $newHire->sss_number,
                    'pagibig_number'           => $newHire->pagibig_number,
                    'philhealth_number'        => $newHire->philhealth_number,
                    'bank_name'                => $newHire->bank_name,
                    'account_name'             => $newHire->account_name,
                    'account_number'           => $newHire->account_number,
                    'start_date'               => $newHire->start_date ?? now()->toDateString(),
                    'department'               => $newHire->department ?? 'Administration',
                    'job_category'             => $newHire->job_category ?? 'Staff',
                    'employment_type'          => $newHire->employment_type ?? 'probationary',
                    'role'                     => $newHire->role ?? 'Employee',
                    'basic_salary'             => $newHire->basic_salary ?? 0,
                    'reporting_manager'        => $newHire->reporting_manager,
                    'shift_sched'              => $newHire->shift_sched ?? 'morning',
                    'status'                   => 'onboarding',
                ]);

                // Link back to new hire
                $newHire->update(['employee_id' => $employee->id]);
            }

            // Create user login if not exists
            if (!User::where('email', $employee->email)->exists()) {
                User::create([
                    'name'     => "{$employee->first_name} {$employee->last_name}",
                    'email'    => $employee->email,
                    'password' => Hash::make('Employee@123'),
                    'role'     => $employee->role,
                ]);
            }

            $employee->update(['status' => 'active']);

            $newHire->update([
                'onboarding_status' => 'transferred',
                'transferred_at'    => now(),
            ]);

            DB::commit();
            return response()->json([
                'success' => true,
                'data'    => $employee->fresh(),
                'message' => "{$employee->first_name} {$employee->last_name} successfully transferred to Employees!",
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $hire = NewHire::findOrFail($id);
        $data = $request->validate([
            'training_program' => 'nullable|string|max:200',
            'training_notes'   => 'nullable|string|max:500',
            'first_name'       => 'sometimes|string|max:100',
            'last_name'        => 'sometimes|string|max:100',
            'department'       => 'sometimes|string|max:100',
            'start_date'       => 'sometimes|date',
            'basic_salary'     => 'sometimes|numeric|min:0',
        ]);
        $hire->update($data);
        return response()->json(['success' => true, 'data' => $hire->fresh()]);
    }

    public function destroy(int $id): JsonResponse
    {
        $newHire = NewHire::findOrFail($id);

        if ($newHire->onboarding_status === 'transferred') {
            return response()->json(['success' => false, 'message' => 'Cannot delete a transferred new hire.'], 422);
        }

        $newHire->delete();
        return response()->json(['success' => true, 'message' => 'New hire record deleted.']);
    }
}