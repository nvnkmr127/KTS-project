<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $roles = Role::with('permissions')->orderBy('id', 'desc')->get();
        return response()->json($roles);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'string'
        ]);

        DB::beginTransaction();
        try {
            $role = Role::create([
                'name' => $request->name,
                'guard_name' => 'web',
            ]);

            if ($request->has('permissions')) {
                $role->syncPermissions($request->permissions);
            }

            DB::commit();
            return response()->json([
                'message' => 'Role created successfully',
                'role' => $role->load('permissions')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating role', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Role $role)
    {
        return response()->json($role->load('permissions'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Role $role)
    {
        $request->validate([
            'name' => 'required|unique:roles,name,' . $role->id,
            'permissions' => 'array',
            'permissions.*' => 'string'
        ]);

        DB::beginTransaction();
        try {
            $role->update([
                'name' => $request->name,
            ]);

            if ($request->has('permissions')) {
                $role->syncPermissions($request->permissions);
            }

            DB::commit();
            return response()->json([
                'message' => 'Role updated successfully',
                'role' => $role->load('permissions')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating role', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Role $role)
    {
        if (in_array($role->name, ['super-admin', 'admin'])) {
            return response()->json(['message' => 'Cannot delete system roles'], 403);
        }

        $role->delete();
        return response()->json(['message' => 'Role deleted successfully']);
    }

    /**
     * Sync permissions to a role.
     */
    public function syncPermissions(Request $request, Role $role)
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string'
        ]);

        $role->syncPermissions($request->permissions);

        return response()->json([
            'message' => 'Permissions synced successfully',
            'role' => $role->load('permissions')
        ]);
    }
}
