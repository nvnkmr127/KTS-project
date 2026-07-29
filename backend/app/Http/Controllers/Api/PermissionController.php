<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    /**
     * Display a listing of permissions grouped by module.
     */
    public function index()
    {
        // Filter out irrelevant orphan permissions (e.g., widgets)
        $permissions = Permission::where('name', 'not like', '%widget%')
            ->orderBy('name')
            ->get();

        $groupedPermissions = $permissions->groupBy(function ($permission) {
            $name = strtolower($permission->name);

            if (str_contains($name, 'attendance')) {
                return 'Attendance Management';
            }
            if (str_contains($name, 'student')) {
                return 'Student Management';
            }
            if (str_contains($name, 'financial') || str_contains($name, 'fee') || str_contains($name, 'invoice') || str_contains($name, 'payment') || str_contains($name, 'salary')) {
                return 'Financial & Fee Management';
            }
            if (str_contains($name, 'user') || str_contains($name, 'staff') || str_contains($name, 'faculty') || str_contains($name, 'leave')) {
                return 'Staff & HR Management';
            }
            if (str_contains($name, 'course') || str_contains($name, 'batch') || str_contains($name, 'timetable') || str_contains($name, 'exam') || str_contains($name, 'subject') || str_contains($name, 'class')) {
                return 'Academics & Timetable';
            }
            if (str_contains($name, 'event') || str_contains($name, 'calendar') || str_contains($name, 'notification') || str_contains($name, 'communication') || str_contains($name, 'whatsapp') || str_contains($name, 'meeting') || str_contains($name, 'enquiry')) {
                return 'Communication & Events';
            }
            if (str_contains($name, 'analytic') || str_contains($name, 'report')) {
                return 'Analytics & Reports';
            }
            if (str_contains($name, 'role') || str_contains($name, 'permission') || str_contains($name, 'setting') || str_contains($name, 'system') || str_contains($name, 'webhook') || str_contains($name, 'asset') || str_contains($name, 'backend') || str_contains($name, 'dashboard')) {
                return 'System & Security';
            }

            return 'General System';
        });

        return response()->json([
            'flat' => $permissions,
            'grouped' => $groupedPermissions
        ]);
    }
}
