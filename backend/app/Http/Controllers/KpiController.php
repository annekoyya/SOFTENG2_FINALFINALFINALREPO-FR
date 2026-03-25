<?php

namespace App\Http\Controllers;

use App\Models\Kpi;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class KpiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Kpi::with(['employee', 'setter'])->latest();
        if ($request->filled('employee_id')) $query->forEmployee((int) $request->query('employee_id'));
        if ($request->filled('status'))      $query->where('status', $request->query('status'));
        if ($request->filled('category'))    $query->where('category', $request->query('category'));
        return $this->success($query->paginate(20));
    }

    public function show(Kpi $kpi): JsonResponse
    {
        return $this->success($kpi->load(['employee', 'setter']));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id'   => 'required|exists:employees,id',
            'title'         => 'required|string|max:200',
            'description'   => 'nullable|string|max:1000',
            'unit'          => 'nullable|string|max:50',
            'target_value'  => 'required|numeric|min:0',
            'current_value' => 'sometimes|numeric|min:0',
            'weight'        => 'sometimes|numeric|min:0|max:10',
            'start_date'    => 'required|date',
            'end_date'      => 'required|date|after_or_equal:start_date',
            'category'      => 'required|in:productivity,quality,attendance,customer_service,teamwork,other',
            'notes'         => 'nullable|string|max:1000',
        ]);
        $kpi = Kpi::create([...$validated, 'set_by' => Auth::id(), 'status' => 'active']);
        return $this->created($kpi->load(['employee', 'setter']), 'KPI created successfully');
    }

    public function update(Request $request, Kpi $kpi): JsonResponse
    {
        $validated = $request->validate([
            'title'        => 'sometimes|string|max:200',
            'description'  => 'nullable|string|max:1000',
            'unit'         => 'nullable|string|max:50',
            'target_value' => 'sometimes|numeric|min:0',
            'weight'       => 'sometimes|numeric|min:0|max:10',
            'end_date'     => 'sometimes|date',
            'category'     => 'sometimes|in:productivity,quality,attendance,customer_service,teamwork,other',
            'notes'        => 'nullable|string|max:1000',
            'status'       => 'sometimes|in:active,achieved,not_achieved,cancelled',
        ]);
        $kpi->update($validated);
        return $this->success($kpi->fresh(['employee', 'setter']), 'KPI updated');
    }

    public function updateProgress(Request $request, Kpi $kpi): JsonResponse
    {
        if ($kpi->status !== 'active') return $this->error('Only active KPIs can be updated.');
        $validated = $request->validate(['current_value' => 'required|numeric|min:0']);
        $kpi->update(['current_value' => $validated['current_value']]);
        $kpi->updateStatus();
        return $this->success($kpi->fresh(['employee']), 'Progress updated');
    }

    public function destroy(Kpi $kpi): JsonResponse
    {
        $kpi->update(['status' => 'cancelled']);
        return $this->success(null, 'KPI cancelled');
    }
}
