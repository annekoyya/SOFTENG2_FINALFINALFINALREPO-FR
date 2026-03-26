<?php 
namespace App\Http\Controllers;
 
use App\Models\Shift;
use App\Models\EmployeeShift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
 
class ShiftController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Shift::withCount('employeeShifts as employee_count')->get());
    }
 
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'             => 'required|string|max:100',
            'start_time'       => 'required|string',
            'end_time'         => 'required|string',
            'shift_type'       => 'required|in:morning,afternoon,night,custom',
            'differential_pct' => 'nullable|numeric|min:0|max:100',
            'break_minutes'    => 'nullable|integer|min:0|max:120',
        ]);
        return response()->json(Shift::create($data), 201);
    }
 
    public function update(Request $request, int $id): JsonResponse
    {
        $shift = Shift::findOrFail($id);
        $shift->update($request->validate([
            'name'             => 'sometimes|string|max:100',
            'start_time'       => 'sometimes|string',
            'end_time'         => 'sometimes|string',
            'shift_type'       => 'sometimes|in:morning,afternoon,night,custom',
            'differential_pct' => 'nullable|numeric|min:0|max:100',
            'break_minutes'    => 'nullable|integer|min:0|max:120',
        ]));
        return response()->json($shift);
    }
 
    // GET /api/employee-shifts
    public function employeeShifts(): JsonResponse
    {
        $list = EmployeeShift::with(['employee:id,first_name,last_name,department','shift'])
            ->get()
            ->map(fn ($es) => [
                'employee_id'    => $es->employee_id,
                'employee_name'  => $es->employee ? trim("{$es->employee->first_name} {$es->employee->last_name}") : '—',
                'department'     => $es->employee?->department ?? '—',
                'shift_id'       => $es->shift_id,
                'shift_name'     => $es->shift?->name,
                'shift_start'    => $es->shift?->start_time,
                'shift_end'      => $es->shift?->end_time,
                'effective_date' => $es->effective_date?->toDateString(),
            ]);
        return response()->json($list);
    }
 
    // POST /api/employee-shifts
    public function assignShift(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id'    => 'required|exists:employees,id',
            'shift_id'       => 'required|exists:shifts,id',
            'effective_date' => 'required|date',
        ]);
 
        $assignment = EmployeeShift::updateOrCreate(
            ['employee_id' => $data['employee_id']],
            ['shift_id' => $data['shift_id'], 'effective_date' => $data['effective_date']]
        );
 
        // Also update the denormalized columns on employees table
        $shift = Shift::find($data['shift_id']);
        \App\Models\Employee::where('id', $data['employee_id'])->update([
            'shift_name'  => $shift?->name,
            'shift_start' => $shift?->start_time,
            'shift_end'   => $shift?->end_time,
        ]);
 
        return response()->json($assignment, 201);
    }
}
 