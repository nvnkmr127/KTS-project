import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Card } from '../components/Card';
import { Shield, ShieldAlert, Check, Plus, Edit2, Trash2, X, Save, Search } from 'lucide-react';
import { useDialog } from '../context/DialogContext';

interface Permission {
  id: number;
  name: string;
  guard_name: string;
}

interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions: Permission[];
}

export function RolesPermissions() {
  const { alert, confirm } = useDialog();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '' });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.getRoles().catch(() => []),
        api.getPermissions().catch(() => ({ flat: [], grouped: {} }))
      ]);

      const rolesList: Role[] = Array.isArray(rolesRes) 
        ? rolesRes 
        : (rolesRes?.data && Array.isArray(rolesRes.data) ? rolesRes.data : []);

      setRoles(rolesList);

      if (permsRes && permsRes.grouped) {
        setPermissions(permsRes.grouped);
      } else {
        setPermissions({});
      }
      
      // Select first role by default if none selected
      if (rolesList.length > 0) {
        setSelectedRole(prev => {
          if (!prev) {
            const first = rolesList[0];
            setSelectedPermissions((first.permissions || []).map(p => p.name));
            return first;
          }
          const updated = rolesList.find(r => r.id === prev.id);
          if (updated) {
            setSelectedPermissions((updated.permissions || []).map(p => p.name));
            return updated;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to fetch roles/permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissions((role?.permissions || []).map(p => p.name));
    setEditingRole(false);
    setIsCreatingRole(false);
  };

  const handleCreateNew = () => {
    setIsCreatingRole(true);
    setSelectedRole(null);
    setRoleForm({ name: '' });
    setSelectedPermissions([]);
  };

  const handleEditRoleName = () => {
    if (selectedRole) {
      setRoleForm({ name: selectedRole.name });
      setEditingRole(true);
    }
  };

  const handleTogglePermission = (permName: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permName) 
        ? prev.filter(p => p !== permName)
        : [...prev, permName]
    );
  };

  const handleToggleModule = (modulePerms: Permission[]) => {
    const validPerms = (modulePerms || []).filter(p => p && p.name);
    const allSelected = validPerms.every(p => selectedPermissions.includes(p.name));
    if (allSelected) {
      // Remove all
      const toRemove = validPerms.map(p => p.name);
      setSelectedPermissions(prev => prev.filter(p => !toRemove.includes(p)));
    } else {
      // Add all
      const toAdd = validPerms.map(p => p.name);
      setSelectedPermissions(prev => Array.from(new Set([...prev, ...toAdd])));
    }
  };

  const handleSaveRole = async () => {
    if (!roleForm.name.trim() && isCreatingRole) {
      await alert('Role name is required.', 'Validation Error');
      return;
    }

    setIsSaving(true);
    try {
      if (isCreatingRole) {
        await api.createRole({ 
          name: roleForm.name,
          permissions: selectedPermissions 
        });
        await alert('Role created successfully!', 'Success');
      } else if (selectedRole) {
        if (editingRole) {
          await api.updateRole(selectedRole.id, { 
            name: roleForm.name,
            permissions: selectedPermissions 
          });
        } else {
          // Just syncing permissions
          await api.syncRolePermissions(selectedRole.id, selectedPermissions);
        }
        await alert('Role permissions updated successfully!', 'Success');
      }
      
      setEditingRole(false);
      setIsCreatingRole(false);
      await fetchData();
    } catch (err: any) {
      await alert(`Failed to save role: ${err?.message || 'Unknown error'}`, 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (['super-admin', 'admin'].includes(role.name)) {
      await alert('System roles cannot be deleted.', 'Error');
      return;
    }
    
    if (await confirm(`Are you sure you want to delete the role "${role.name}"?`, 'Confirm Delete', true)) {
      try {
        await api.deleteRole(role.id);
        if (selectedRole?.id === role.id) {
          setSelectedRole(null);
        }
        await fetchData();
      } catch (err: any) {
        await alert(`Failed to delete role: ${err?.message || 'Unknown error'}`, 'Error');
      }
    }
  };

  const renderModulePermissions = (moduleName: string, perms: Permission[]) => {
    const validPerms = (perms || []).filter(p => p && p.name);
    
    const filteredPerms = searchTerm.trim() 
      ? validPerms.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase().trim()))
      : validPerms;

    if (filteredPerms.length === 0) return null;

    const allSelected = filteredPerms.every(p => selectedPermissions.includes(p.name));
    const someSelected = filteredPerms.some(p => selectedPermissions.includes(p.name)) && !allSelected;
    
    // Disable editing for super-admin as it has all access automatically
    const isSuperAdmin = selectedRole?.name === 'super-admin';

    return (
      <div key={moduleName} className="mb-6 border border-[var(--b)] rounded-xl overflow-hidden bg-[var(--surf)] shadow-sm">
        <div 
          className="bg-[var(--surf2)] px-4 py-3 border-b border-[var(--b)] flex items-center justify-between cursor-pointer select-none"
          onClick={() => !isSuperAdmin && handleToggleModule(filteredPerms)}
        >
          <div className="font-semibold text-[13.5px] text-[var(--tx)] flex items-center gap-2">
            {moduleName}
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-[var(--tx3)]">
              {filteredPerms.filter(p => selectedPermissions.includes(p.name)).length} / {filteredPerms.length} selected
            </span>
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
              allSelected 
                ? 'bg-[var(--blue)] border-[var(--blue)] text-white' 
                : someSelected 
                  ? 'bg-[var(--blue)] border-[var(--blue)] text-white opacity-60'
                  : 'border-[var(--tx3)] text-transparent'
            }`}>
              {someSelected && !allSelected ? <div className="w-2.5 h-0.5 bg-white rounded-full" /> : <Check size={14} strokeWidth={3} />}
            </div>
          </div>
        </div>
        
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPerms.map(perm => {
            const isChecked = selectedPermissions.includes(perm.name) || isSuperAdmin;
            
            return (
              <label 
                key={perm.id || perm.name} 
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  isSuperAdmin ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-[var(--blue)] hover:shadow-xs'
                } ${
                  isChecked 
                    ? 'border-[var(--blue)] bg-[var(--blue-bg)]' 
                    : 'border-[var(--b)] bg-[var(--surf)]'
                }`}
              >
                <div className="mt-0.5">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isChecked ? 'bg-[var(--blue)] border-[var(--blue)] text-white' : 'border-[var(--tx3)] bg-transparent'
                  }`}>
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="sr-only"
                    checked={isChecked}
                    disabled={isSuperAdmin}
                    onChange={() => handleTogglePermission(perm.name)} 
                  />
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-semibold text-[var(--tx)] capitalize leading-tight mb-1">
                    {perm.name.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[10.5px] text-[var(--tx3)]">
                    Access to {perm.name} operations
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--bg)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--tx)] flex items-center gap-2">
            <Shield className="text-[var(--blue)]" size={24} />
            Roles & Permissions
          </h1>
          <p className="text-[12px] text-[var(--tx3)] mt-1">
            Configure granular access permissions for system roles in Krishnaveni Talent School.
          </p>
        </div>
        
        <button
          onClick={handleCreateNew}
          className="bg-[var(--blue)] text-white px-4 py-2 rounded-xl text-[13px] font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap shadow-xs"
        >
          <Plus size={16} /> Create New Role
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar: Roles List */}
        <Card className="w-full lg:w-72 shrink-0 p-0 overflow-hidden flex flex-col h-[calc(100vh-160px)]">
          <div className="p-4 border-b border-[var(--b)] bg-[var(--surf2)] flex items-center justify-between">
            <h2 className="font-semibold text-[14px] text-[var(--tx)]">System Roles</h2>
            <span className="text-[11px] text-[var(--tx3)] font-medium">{roles.length} roles</span>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {loading ? (
              <div className="p-4 text-center text-[12px] text-[var(--tx3)]">Loading roles...</div>
            ) : (
              <div className="flex flex-col gap-1">
                {roles.map(role => {
                  const isSelected = selectedRole?.id === role.id && !isCreatingRole;
                  const permCount = role.permissions ? role.permissions.length : 0;

                  return (
                    <div
                      key={role.id}
                      onClick={() => handleSelectRole(role)}
                      className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[var(--blue-bg)] border-[var(--blue-tx)] text-[var(--blue-tx)] font-semibold shadow-xs border'
                          : 'hover:bg-[var(--surf2)] text-[var(--tx)] border-transparent border'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-[13px] capitalize">{role.name.replace('-', ' ')}</div>
                        <div className="text-[11px] opacity-70 mt-0.5">
                          {role.name === 'super-admin' ? 'Full Access' : `${permCount} permissions`}
                        </div>
                      </div>
                      {['super-admin', 'admin'].includes(role.name) && (
                        <ShieldAlert size={14} className="opacity-50 text-amber-500" />
                      )}
                    </div>
                  );
                })}
                
                {isCreatingRole && (
                  <div className="p-3 rounded-xl bg-[var(--blue-bg)] border-[var(--blue-tx)] text-[var(--blue-tx)] border shadow-xs">
                    <div className="font-semibold text-[13px]">New Custom Role</div>
                    <div className="text-[11px] opacity-70 mt-0.5">Unsaved</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Main Content: Role Editor */}
        <Card className="flex-1 flex flex-col h-[calc(100vh-160px)] p-0 overflow-hidden">
          {selectedRole || isCreatingRole ? (
            <>
              {/* Header */}
              <div className="p-5 border-b border-[var(--b)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surf2)]">
                <div>
                  {isCreatingRole || editingRole ? (
                    <div className="flex items-center gap-3">
                      <input 
                        type="text" 
                        placeholder="e.g. librarian, coordinator"
                        value={roleForm.name}
                        onChange={(e) => setRoleForm({ name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        className="bg-[var(--surf)] border border-[var(--b)] rounded-lg px-3 py-1.5 text-[14px] font-semibold text-[var(--tx)] outline-none focus:border-[var(--blue)] min-w-[200px]"
                        autoFocus
                      />
                      {editingRole && (
                        <button onClick={() => setEditingRole(false)} className="p-1.5 text-[var(--tx3)] hover:bg-[var(--surf)] rounded-md">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <h2 className="text-[18px] font-bold text-[var(--tx)] capitalize">
                        {selectedRole?.name.replace('-', ' ')}
                      </h2>
                      {!['super-admin', 'admin'].includes(selectedRole?.name || '') && (
                        <button 
                          onClick={handleEditRoleName}
                          className="p-1 text-[var(--tx3)] hover:text-[var(--blue)] bg-[var(--surf)] hover:bg-[var(--blue-bg)] rounded-md transition-colors"
                          title="Edit Role Name"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="text-[12px] text-[var(--tx3)] mt-1 flex items-center gap-2">
                    {selectedRole?.name === 'super-admin' ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <ShieldAlert size={13} /> Super Admin has unrestricted permissions automatically.
                      </span>
                    ) : (
                      <span>Select permissions below and click Save Changes to apply.</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {selectedRole && !['super-admin', 'admin'].includes(selectedRole.name) && !isCreatingRole && (
                    <button
                      onClick={() => handleDeleteRole(selectedRole)}
                      className="px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 size={14} /> Delete Role
                    </button>
                  )}
                  
                  <button
                    disabled={isSaving || (selectedRole?.name === 'super-admin')}
                    onClick={handleSaveRole}
                    className="px-5 py-2 text-[13px] font-semibold text-white bg-[var(--blue)] hover:opacity-90 rounded-xl transition-opacity flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                  >
                    {isSaving ? <span className="animate-spin text-lg leading-none">↻</span> : <Save size={15} />}
                    {isCreatingRole ? 'Create Role' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Permissions Search & Body */}
              <div className="p-4 border-b border-[var(--b)] bg-[var(--surf)]">
                <div className="relative max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tx3)]" />
                  <input
                    type="text"
                    placeholder="Search permissions (e.g. attendance, salary, student)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-[12.5px] bg-[var(--surf2)] border border-[var(--b)] rounded-xl outline-none focus:border-[var(--blue)] text-[var(--tx)]"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tx3)] hover:text-[var(--tx)]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {selectedRole?.name === 'super-admin' && (
                  <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                    <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-semibold text-[13px] text-amber-800 dark:text-amber-400">Super Administrator</h4>
                      <p className="text-[11.5px] text-amber-700/80 dark:text-amber-400/80 mt-1">
                        This role automatically has all permissions and overrides specific selections.
                      </p>
                    </div>
                  </div>
                )}
                
                {Object.entries(permissions).map(([moduleName, modulePerms]) => 
                  renderModulePermissions(moduleName, modulePerms)
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--tx3)] p-8 text-center">
              <Shield size={48} className="opacity-20 mb-4" />
              <h3 className="font-semibold text-[15px] text-[var(--tx)]">Select a Role</h3>
              <p className="text-[12px] mt-1 max-w-[250px]">Choose a role from the left menu to view or edit its permissions, or create a new custom role.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

