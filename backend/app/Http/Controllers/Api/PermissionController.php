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
        $permissions = Permission::orderBy('name')->get();

        // Optional: Group permissions logically if needed, or return flat
        $groupedPermissions = $permissions->groupBy(function ($permission) {
            $parts = explode(' ', $permission->name);
            $module = end($parts);
            return ucfirst($module);
        });

        return response()->json([
            'flat' => $permissions,
            'grouped' => $groupedPermissions
        ]);
    }
}
