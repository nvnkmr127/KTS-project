import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Card } from '../components/Card';
import { Shield, ShieldAlert, Check, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.getRoles(),
        api.getPermissions()
      ]);
      setRoles(rolesRes);
      if (permsRes && permsRes.grouped) {
        setPermissions(permsRes.grouped);
      }
      
      // Select first role by default if none selected
      if (rolesRes.length > 0 && !selectedRole) {
        handleSelectRole(rolesRes[0]);
      } else if (selectedRole) {
        // Update selected role data
        const updated = rolesRes.find((r: Role) => r.id === selectedRole.id);
        if (updated) handleSelectRole(updated);
      }
    } catch (err) {
      console.error('Failed to fetch roles/permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions.map(p => p.name));
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
    const allSelected = modulePerms.every(p => selectedPermissions.includes(p.name));
    if (allSelected) {
      // Remove all
      const toRemove = modulePerms.map(p => p.name);
      setSelectedPermissions(prev => prev.filter(p => !toRemove.includes(p)));
    } else {
      // Add all
      const toAdd = modulePerms.map(p => p.name);
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
        await alert('Role updated successfully!', 'Success');
      }
      
      setEditingRole(false);
      setIsCreatingRole(false);
      await fetchData();
    } catch (err: any) {
      await alert(`Failed to save role: ${err.message || 'Unknown error'}`, 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.name === 'super-admin' || role.name === 'admin') {
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
        await alert(`Failed to delete role: ${err.message || 'Unknown error'}`, 'Error');
      }
    }
  };

  const renderModulePermissions = (moduleName: string, perms: Permission[]) => {
    const allSelected = perms.every(p => selectedPermissions.includes(p.name));
    const someSelected = perms.some(p => selectedPermissions.includes(p.name)) && !allSelected;
    
    // Disable editing for super-admin as it has all access automatically
    const isSuperAdmin = selectedRole?.name === 'super-admin';

    return (
      <div key={moduleName} className="mb-6 border border-[var(--b)] rounded-xl overflow-hidden bg-[var(--surf)]">
        <div 
          className="bg-[var(--surf2)] px-4 py-3 border-b border-[var(--b)] flex items-center justify-between cursor-pointer"
          onClick={() => !isSuperAdmin && handleToggleModule(perms)}
        >
          <div className="font-semibold text-[13px] text-[var(--tx)]">{moduleName} Management</div>
          
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--tx3)]">
              {perms.filter(p => selectedPermissions.includes(p.name)).length} / {perms.length} selected
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
          {perms.map(perm => {
            const isChecked = selectedPermissions.includes(perm.name) || isSuperAdmin;
            
            return (
              <label 
                key={perm.id} 
                className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${
                  isSuperAdmin ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--surf2)]'
                } ${
                  isChecked 
                    ? 'border-[var(--blue)] bg-[var(--blue-bg)]' 
                    : 'border-[var(--b)] bg-[var(--surf)]'
                }`}
              >
                <div className="mt-0.5">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
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
                <div>
                  <div className="text-[12.5px] font-medium text-[var(--tx)] capitalize leading-none mb-1">
                    {perm.name.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[10px] text-[var(--tx3)]">
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
    <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--tx)] flex items-center gap-2">
            <Shield className="text-[var(--blue)]" size={24} />
            Roles & Permissions
          </h1>
          <p className="text-[12px] text-[var(--tx3)] mt-1">
            Manage system roles and configure granular access permissions.
          </p>
        </div>
        
        <button
          onClick={handleCreateNew}
          className="bg-[var(--blue)] text-white px-4 py-2 rounded-xl text-[13px] font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <Plus size={16} /> Create New Role
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar: Roles List */}
        <Card className="w-full lg:w-72 shrink-0 p-0 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
          <div className="p-4 border-b border-[var(--b)] bg-[var(--surf2)]">
            <h2 className="font-semibold text-[14px] text-[var(--tx)]">System Roles</h2>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {loading ? (
              <div className="p-4 text-center text-[12px] text-[var(--tx3)]">Loading roles...</div>
            ) : (
              <div className="flex flex-col gap-1">
                {roles.map(role => (
                  <div
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                      selectedRole?.id === role.id && !isCreatingRole
                        ? 'bg-[var(--blue-bg)] border-[var(--blue-tx)] text-[var(--blue-tx)] shadow-sm'
                        : 'hover:bg-[var(--surf2)] text-[var(--tx)] border-transparent border'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-[13px] capitalize">{role.name.replace('-', ' ')}</div>
                      <div className="text-[11px] opacity-70 mt-0.5">
                        {role.permissions.length} permissions
                      </div>
                    </div>
                    {['super-admin', 'admin'].includes(role.name) && (
                      <ShieldAlert size={14} className="opacity-50" />
                    )}
                  </div>
                ))}
                
                {isCreatingRole && (
                  <div className="p-3 rounded-lg bg-[var(--blue-bg)] border-[var(--blue-tx)] text-[var(--blue-tx)] border shadow-sm">
                    <div className="font-semibold text-[13px]">New Custom Role</div>
                    <div className="text-[11px] opacity-70 mt-0.5">Unsaved</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Main Content: Role Editor */}
        <Card className="flex-1 flex flex-col h-[calc(100vh-140px)] p-0 overflow-hidden">
          {selectedRole || isCreatingRole ? (
            <>
              {/* Header */}
              <div className="p-5 border-b border-[var(--b)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  {isCreatingRole || editingRole ? (
                    <div className="flex items-center gap-3">
                      <input 
                        type="text" 
                        placeholder="e.g. librarian, editor"
                        value={roleForm.name}
                        onChange={(e) => setRoleForm({ name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-1.5 text-[14px] font-semibold text-[var(--tx)] outline-none focus:border-[var(--blue)] min-w-[200px]"
                        autoFocus
                      />
                      {editingRole && (
                        <button onClick={() => setEditingRole(false)} className="p-1.5 text-[var(--tx3)] hover:bg-[var(--surf2)] rounded-md">
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
                          className="p-1 text-[var(--tx3)] hover:text-[var(--blue)] bg-[var(--surf2)] hover:bg-[var(--blue-bg)] rounded-md transition-colors"
                          title="Edit Role Name"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="text-[12px] text-[var(--tx3)] mt-1 flex items-center gap-2">
                    {selectedRole?.name === 'super-admin' ? (
                      <span className="text-orange-500 flex items-center gap-1">
                        <ShieldAlert size={12} /> Full unrestricted access
                      </span>
                    ) : (
                      <span>Configure module-level permissions below.</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {selectedRole && !['super-admin', 'admin'].includes(selectedRole.name) && !isCreatingRole && (
                    <button
                      onClick={() => handleDeleteRole(selectedRole)}
                      className="px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                  
                  <button
                    disabled={isSaving || (selectedRole?.name === 'super-admin')}
                    onClick={handleSaveRole}
                    className="px-4 py-1.5 text-[12px] font-semibold text-white bg-[var(--blue)] hover:opacity-90 rounded-lg transition-opacity flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <span className="animate-spin text-lg leading-none mt-[-2px]">↻</span> : <Save size={14} />}
                    {isCreatingRole ? 'Create Role' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Permissions Body */}
              <div className="flex-1 overflow-y-auto p-5">
                {selectedRole?.name === 'super-admin' && (
                  <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-3">
                    <ShieldAlert className="text-orange-500 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-semibold text-[13px] text-orange-700 dark:text-orange-400">Super Administrator</h4>
                      <p className="text-[11.5px] text-orange-600/80 dark:text-orange-400/80 mt-1">
                        This role automatically has all permissions and overrides any specific selections. You cannot modify permissions for this role.
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
              <p className="text-[12px] mt-1 max-w-[250px]">Choose a role from the sidebar to view or edit its permissions, or create a new one.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
