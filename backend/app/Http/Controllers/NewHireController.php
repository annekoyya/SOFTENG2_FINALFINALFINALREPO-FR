<?php

namespace App\Http\Controllers;

use App\Models\NewHire;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NewHireController extends Controller
{
    /**
     * List all new hires (excluding already transferred).
     * GET /api/new-hires
     */
    public function index(Request $request): JsonResponse
    {
        $query = NewHire::with(['creator', 'employee'])
            ->whereIn('onboarding_status', ['pending', 'complete'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('onboarding_status', $request->query('status'));
        }

        return $this->success($query->paginate(20));
    }

    /**
     * Show a single new hire.
     * GET /api/new-hires/{newHire}
     */
    public function show(NewHire $newHire): JsonResponse
    {
        return $this->success($newHire->load(['creator', 'employee']));
    }

    /**
     * Create a new hire record. HR/Admin only.
     * POST /api/new-hires
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            // Minimum required to create (just name + email to start)
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'email'      => 'required|email|unique:new_hires,email|unique:employees,email',

            // Everything else optional at creation — filled in later
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
        ]);

        $newHire = NewHire::create([
            ...$validated,
            'created_by'        => Auth::id(),
            'onboarding_status' => 'pending',
        ]);

        // Check if submitted data already completes all required fields
        $newHire->attemptTransfer();

        return $this->created(
            $newHire->fresh(['creator']),
            $newHire->onboarding_status === 'transferred'
                ? 'New hire created and transferred to employees automatically!'
                : 'New hire record created. Fill in remaining fields to transfer.'
        );
    }

    /**
     * Update a new hire record. Triggers auto-transfer check after every save.
     * PUT /api/new-hires/{newHire}
     */
    public function update(Request $request, NewHire $newHire): JsonResponse
    {
        if ($newHire->onboarding_status === 'transferred') {
            return $this->error('This new hire has already been transferred to employees.');
        }

        $validated = $request->validate([
            'first_name'               => 'sometimes|string|max:100',
            'last_name'                => 'sometimes|string|max:100',
            'middle_name'              => 'nullable|string|max:100',
            'name_extension'           => 'nullable|string|max:20',
            'date_of_birth'            => 'nullable|date',
            'email'                    => "sometimes|email|unique:new_hires,email,{$newHire->id}|unique:employees,email",
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
        ]);

        $newHire->update($validated);

        // Auto-transfer check — fires every time fields are updated
        $transferred = $newHire->fresh()->attemptTransfer();

        $newHire->refresh();

        return $this->success(
            $newHire->load(['creator', 'employee']),
            $transferred
                ? '🎉 All required fields complete — transferred to Employees automatically!'
                : "Saved. {$newHire->getCompletionPercentage()}% complete ({" . count($newHire->getMissingFields()) . "} fields remaining)."
        );
    }

    /**
     * Delete a pending new hire record.
     * DELETE /api/new-hires/{newHire}
     */
    public function destroy(NewHire $newHire): JsonResponse
    {
        if ($newHire->onboarding_status === 'transferred') {
            return $this->error('Cannot delete a transferred new hire.');
        }

        $newHire->delete();

        return $this->success(null, 'New hire record deleted.');
    }
}