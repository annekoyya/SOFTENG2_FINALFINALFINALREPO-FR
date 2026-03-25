<?php

namespace App\Http\Controllers;

use App\Models\DeductionCategory;
use App\Models\PayrollAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DeductionCategoryController extends Controller
{
    // ── GET /api/deduction-categories ─────────────────────────────────────────

    public function index(): JsonResponse
    {
        $categories = DeductionCategory::orderBy('is_system', 'desc')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    // ── POST /api/deduction-categories ────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:150|unique:deduction_categories,name',
            'required_id'  => 'required|in:sss_number,philhealth_number,pagibig_number,tin_number,none',
            'is_mandatory' => 'boolean',
            'fixed_amount' => 'nullable|numeric|min:0',
            'description'  => 'nullable|string|max:500',
        ]);

        $category = DeductionCategory::create([
            ...$data,
            'is_system' => false, // user-created categories are never system
        ]);

        PayrollAuditLog::create([
            'action'      => 'deduction_category_created',
            'entity_type' => 'DeductionCategory',
            'entity_id'   => $category->id,
            'user_id'     => Auth::id(),
            'description' => "Deduction category '{$category->name}' created",
        ]);

        return response()->json($category, 201);
    }

    // ── DELETE /api/deduction-categories/{id} ─────────────────────────────────

    public function destroy(int $id): JsonResponse
    {
        $category = DeductionCategory::findOrFail($id);

        if ($category->is_system) {
            return response()->json([
                'message' => 'System deduction categories cannot be deleted.',
            ], 403);
        }

        $name = $category->name;
        $category->delete();

        PayrollAuditLog::create([
            'action'      => 'deduction_category_deleted',
            'entity_type' => 'DeductionCategory',
            'entity_id'   => $id,
            'user_id'     => Auth::id(),
            'description' => "Deduction category '{$name}' deleted",
        ]);

        return response()->json(['message' => 'Category deleted.']);
    }
}