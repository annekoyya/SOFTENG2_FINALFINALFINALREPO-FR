<?php

namespace App\Http\Controllers;
 
use App\Models\Holiday;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
 
class HolidayController extends Controller
{
    // GET /api/holidays?year=2026
    public function index(Request $request): JsonResponse
    {
        $year = $request->year ?? now()->year;
        // Include recurring holidays from any year + specific holidays for this year
        $holidays = Holiday::where(function ($q) use ($year) {
            $q->forYear($year)->orWhere('is_recurring', true);
        })->orderBy('date')->get();
 
        return response()->json($holidays);
    }
 
    // POST /api/holidays
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'           => 'required|string|max:200',
            'date'           => 'required|date',
            'holiday_type'   => 'required|in:regular,special_non_working,special_working',
            'is_recurring'   => 'boolean',
            'pay_multiplier' => 'nullable|numeric|min:1',
            'description'    => 'nullable|string|max:500',
        ]);
 
        $holiday = Holiday::create([
            ...$data,
            'pay_multiplier' => $data['pay_multiplier'] ?? match($data['holiday_type']) {
                'regular'             => 2.00,
                'special_non_working' => 1.30,
                'special_working'     => 1.30,
            },
            'created_by' => Auth::id(),
        ]);
 
        return response()->json($holiday, 201);
    }
 
    // DELETE /api/holidays/{id}
    public function destroy(int $id): JsonResponse
    {
        Holiday::findOrFail($id)->delete();
        return response()->json(['message' => 'Holiday removed.']);
    }
 
    // GET /api/holidays/check?date=2026-12-25
    public function check(Request $request): JsonResponse
    {
        $date    = $request->validate(['date' => 'required|date'])['date'];
        $holiday = Holiday::findForDate($date);
        return response()->json([
            'is_holiday'     => (bool) $holiday,
            'holiday'        => $holiday,
            'pay_multiplier' => $holiday?->pay_multiplier ?? 1.00,
        ]);
    }
}
 
