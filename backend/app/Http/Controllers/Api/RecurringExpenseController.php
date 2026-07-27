<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecurringExpense;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RecurringExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = RecurringExpense::with('category')->orderBy('next_due_date', 'asc');
        
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => 'required|string',
            'title' => 'required|string|max:255',
            'type' => 'required|in:recurring,emi',
            'amount' => 'required|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'frequency' => 'required|in:daily,weekly,monthly,yearly',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'next_due_date' => 'required|date',
        ]);

        $catName = $request->category;
        $category = \App\Models\ExpenseCategory::firstOrCreate(['name' => $catName]);
        $validated['expense_category_id'] = $category->id;
        unset($validated['category']);

        $recurring = RecurringExpense::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Recurring expense created successfully',
            'data' => $recurring->load('category')
        ], 201);
    }

    public function update(Request $request, RecurringExpense $recurringExpense): JsonResponse
    {
        $validated = $request->validate([
            'category' => 'sometimes|string',
            'title' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:recurring,emi',
            'amount' => 'sometimes|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'frequency' => 'sometimes|in:daily,weekly,monthly,yearly',
            'start_date' => 'sometimes|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'next_due_date' => 'sometimes|date',
            'status' => 'sometimes|in:active,completed,cancelled'
        ]);

        if (isset($validated['category'])) {
            $catName = $validated['category'];
            $category = \App\Models\ExpenseCategory::firstOrCreate(['name' => $catName]);
            $validated['expense_category_id'] = $category->id;
            unset($validated['category']);
        }

        $recurringExpense->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Recurring expense updated successfully',
            'data' => $recurringExpense->load('category')
        ]);
    }

    public function destroy(RecurringExpense $recurringExpense): JsonResponse
    {
        $recurringExpense->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Recurring expense deleted successfully'
        ]);
    }
}
