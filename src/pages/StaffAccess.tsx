import { useState, useEffect } from 'react';
import { Search, Key, X, Lock, Trash2, LogOut } from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';
import { STAFF, StaffMember } from './StaffManagement';
import { api } from '../services/api';
import { useDialog } from '../context/DialogContext';

interface StaffAccessInfo {
  staffId: string;
  email: string;
  isActive: boolean;
  hasAccess: boolean;
}

export function StaffAccess() {
  const { alert, confirm } = useDialog();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [accessRecords, setAccessRecords] = useState<Record<string, StaffAccessInfo>>(() => {
    const saved = localStorage.getItem('kts_staff_access');
    return (saved && JSON.parse(saved)) || {};
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStaff, setModalStaff] = useState<StaffMember | null>(null);
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [inputRole, setInputRole] = useState('faculty');
  const [roles, setRoles] = useState<{ id: number, name: string }[]>([]);

  // Load roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await api.getRoles();
        if (data && data.length > 0) {
          setRoles(data);
          setInputRole(data[0].name);
        }
      } catch (err) {
        console.error('Failed to load roles:', err);
      }
    };
    fetchRoles();
  }, []);

  // Load staff list & sync DB access state
  useEffect(() => {
    async function fetchStaffAndUsers() {
      const savedStaffStr = localStorage.getItem('kts_staff_members');
      let loadedStaff: StaffMember[] = [];
      if (savedStaffStr) {
        try {
          const parsed = JSON.parse(savedStaffStr);
          if (Array.isArray(parsed)) {
            loadedStaff = parsed.filter((s) => s && s.id && s.status !== 'Resigned');
          }
        } catch (err) {
          console.error('Error parsing staff list:', err);
        }
      }

      try {
        const staffData = await api.getResources('faculty');
        const staffListFromApi = Array.isArray(staffData) ? staffData : (staffData?.data || []);
        if (staffListFromApi.length > 0) {
          const normalizedStaff = staffListFromApi.map((s: any) => ({
            ...s,
            documents: typeof s.documents === 'string' ? JSON.parse(s.documents) : (s.documents || []),
            status: s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : 'Active',
            salary: typeof s.salary === 'string' ? parseFloat(s.salary) : s.salary
          }));
          loadedStaff = normalizedStaff.filter((s: any) => s && s.id && s.status !== 'Resigned');
          localStorage.setItem('kts_staff_members', JSON.stringify(normalizedStaff));
        }
      } catch (err) {
        console.error('Error fetching staff list from DB in StaffAccess:', err);
      }

      if (loadedStaff.length === 0) {
        loadedStaff = STAFF.filter((s) => s && s.id);
      }

      setStaffList(loadedStaff);

      // Synchronize accessRecords with database users
      try {
        const dbUsers = await api.getResources('users');
        if (Array.isArray(dbUsers)) {
          setAccessRecords((prev) => {
            const updated = { ...prev };
            loadedStaff.forEach((s) => {
              const matched = dbUsers.find(
                (u: any) =>
                  (s.email && u.email?.toLowerCase() === s.email.toLowerCase()) ||
                  (s.name && u.name?.toLowerCase() === s.name.toLowerCase()) ||
                  (u.id && String(u.id) === String(s.id))
              );
              if (matched) {
                updated[s.id] = {
                  staffId: s.id,
                  email: matched.email,
                  isActive: (matched.status || 'active').toLowerCase() !== 'inactive',
                  hasAccess: true,
                };
              }
            });
            return updated;
          });
        }
      } catch (err) {
        console.error('Error syncing DB users in StaffAccess:', err);
      }

      // Set first category as default
      const cats = Array.from(new Set(loadedStaff.map((s) => s.category || 'Teaching')));
      if (cats.length > 0) {
        setSelectedCategory((prev) => cats.includes(prev) ? prev : cats[0]);
      }
    }
    fetchStaffAndUsers();
  }, []);

  // Sync access records to localStorage
  useEffect(() => {
    localStorage.setItem('kts_staff_access', JSON.stringify(accessRecords));
  }, [accessRecords]);

  // Unique categories list with counts
  const categories = Array.from(new Set(staffList.filter((s) => s && s.id).map((s) => s.category || 'Teaching')));

  const getCategoryCount = (categoryName: string) => {
    return staffList.filter((s) => s && s.id && (s.category || 'Teaching') === categoryName).length;
  };

  const getAccessInfo = (staffId: string): StaffAccessInfo => {
    return accessRecords[staffId] || { staffId, email: '', isActive: false, hasAccess: false };
  };

  // Force logout a staff member by calling backend force-logout endpoint (revoking tokens)
  // and writing a force-logout flag to localStorage
  const forceLogout = async (staffId: string) => {
    const staff = staffList.find((s) => s.id === staffId);
    const record = accessRecords[staffId];
    const targetEmail = (record?.email || staff?.email || '').trim();

    try {
      const existingUsers = await api.getResources('users');
      const matchedUser = Array.isArray(existingUsers) ? existingUsers.find(
        (u: any) =>
          (targetEmail && u.email?.toLowerCase() === targetEmail.toLowerCase()) ||
          (staff?.name && u.name?.toLowerCase() === staff.name.toLowerCase()) ||
          (u.id && String(u.id) === String(staffId))
      ) : null;

      if (matchedUser) {
        // Call backend force-logout endpoint (revokes tokens + sets status to inactive)
        await api.forceLogoutUser(matchedUser.id);
      } else if (targetEmail) {
        // Fallback update
        await api.updateResource('faculty', staffId, { status: 'inactive' });
      }

      // Write per-email flag so any tab the staff has open on the same machine detects forced logout
      if (targetEmail) {
        const flagKey = `kts_force_logout_${targetEmail.toLowerCase()}`;
        localStorage.setItem(flagKey, String(Date.now()));
      }

      // Update local access record state
      setAccessRecords((prev) => ({
        ...prev,
        [staffId]: {
          staffId,
          email: targetEmail || prev[staffId]?.email || '',
          isActive: false,
          hasAccess: true,
        },
      }));

      await alert(
        `Force logout triggered for ${targetEmail || staff?.name || 'staff member'}. User tokens revoked and active sessions terminated.`,
        "Force Logout"
      );
    } catch (err) {
      await alert('Failed to force logout: ' + ((err as Error).message || err), "Error");
    }
  };

  // Toggle active / inactive state
  const toggleAccessActive = async (staffId: string) => {
    const staff = staffList.find((s) => s.id === staffId);
    const record = accessRecords[staffId];
    const targetEmail = record?.email || staff?.email || '';
    const currentIsActive = record?.isActive ?? true;
    const newActiveState = !currentIsActive;

    try {
      const existingUsers = await api.getResources('users');
      const matchedUser = Array.isArray(existingUsers) ? existingUsers.find(
        (u: any) =>
          (targetEmail && u.email?.toLowerCase() === targetEmail.toLowerCase()) ||
          (staff?.name && u.name?.toLowerCase() === staff.name.toLowerCase()) ||
          (u.id && String(u.id) === String(staffId))
      ) : null;

      if (matchedUser) {
        if (!newActiveState) {
          await api.forceLogoutUser(matchedUser.id);
        } else {
          await api.updateResource('faculty', matchedUser.id, { status: 'active' });
        }
      }

      if (!newActiveState && targetEmail) {
        const flagKey = `kts_force_logout_${targetEmail.toLowerCase()}`;
        localStorage.setItem(flagKey, String(Date.now()));
      }

      setAccessRecords((prev) => ({
        ...prev,
        [staffId]: {
          staffId,
          email: targetEmail,
          isActive: newActiveState,
          hasAccess: true,
        },
      }));
    } catch (err) {
      await alert('Failed to update status on server: ' + ((err as Error).message || err), "Error");
    }
  };

  // Give / save credentials
  const saveAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalStaff) return;

    try {
      // Check if user already exists in DB
      const existingUsers = await api.getResources('users');
      const matchedUser = Array.isArray(existingUsers) ? existingUsers.find(
        (u: any) => u.email.toLowerCase() === inputEmail.toLowerCase()
      ) : null;

      const userData = {
        name: modalStaff.name,
        email: inputEmail,
        password: inputPassword,
        status: 'active',
        department: modalStaff.department || modalStaff.designation || 'Teaching',
        phone: modalStaff.phone || '9999999999',
        role: inputRole,
      };

      if (matchedUser) {
        // Update user
        await api.updateResource('faculty', matchedUser.id, userData);
      } else {
        // Create user
        await api.createResource('faculty', userData);
      }

      setAccessRecords((prev) => ({
        ...prev,
        [modalStaff.id]: {
          staffId: modalStaff.id,
          email: inputEmail,
          isActive: true,
          hasAccess: true,
        },
      }));

      setModalOpen(false);
      setModalStaff(null);
    } catch (err) {
      await alert('Failed to save credentials to server: ' + ((err as Error).message || err), "Error");
    }
  };

  // Remove credentials
  const removeAccess = async (staffId: string) => {
    const staff = staffList.find((s) => s.id === staffId);
    const record = accessRecords[staffId];
    const targetEmail = record?.email || staff?.email || '';

    if (await confirm('Are you sure you want to remove login access for this staff member? This will also force logout any active session.', 'Remove Access', true)) {
      try {
        const existingUsers = await api.getResources('users');
        const matchedUser = Array.isArray(existingUsers) ? existingUsers.find(
          (u: any) =>
            (targetEmail && u.email?.toLowerCase() === targetEmail.toLowerCase()) ||
            (staff?.name && u.name?.toLowerCase() === staff.name.toLowerCase()) ||
            (u.id && String(u.id) === String(staffId))
        ) : null;

        if (matchedUser) {
          await api.forceLogoutUser(matchedUser.id).catch(() => {});
          await api.deleteResource('faculty', matchedUser.id);
        }

        if (targetEmail) {
          const flagKey = `kts_force_logout_${targetEmail.toLowerCase()}`;
          localStorage.setItem(flagKey, String(Date.now()));
        }

        setAccessRecords((prev) => {
          const next = { ...prev };
          delete next[staffId];
          return next;
        });
      } catch (err) {
        await alert('Failed to delete credentials on server: ' + ((err as Error).message || err), "Error");
      }
    }
  };

  // Open modal
  const openAccessModal = async (staff: StaffMember) => {
    const info = getAccessInfo(staff.id);
    const emailToUse = info.email || staff.email || '';
    setModalStaff(staff);
    setInputEmail(emailToUse);
    setInputPassword('');

    try {
      if (emailToUse) {
        const existingUsers = await api.getResources('users');
        const matchedUser = existingUsers.find(
          (u: any) => u.email.toLowerCase() === emailToUse.toLowerCase()
        );
        if (matchedUser && matchedUser.role) {
          setInputRole(matchedUser.role);
        } else if (roles.length > 0) {
          setInputRole(roles[0].name);
        }
      } else if (roles.length > 0) {
        setInputRole(roles[0].name);
      }
    } catch (err) {
      console.error(err);
    }

    setModalOpen(true);
  };

  // Filter staff list in the selected category
  const filteredStaff = staffList.filter((s) => {
    if (!s || !s.id) return false;
    const isInCategory = (s.category || 'Teaching') === selectedCategory;
    const matchesSearch =
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.designation || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.department || '').toLowerCase().includes(search.toLowerCase());
    return isInCategory && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {/* Categories Grid (Card Form) */}
      <div className="text-[13.5px] font-bold text-[var(--tx)] mb-3 flex items-center gap-1.5">
        <Lock size={15} className="text-[var(--blue-tx)]" /> Staff Categories
      </div>

      {categories.length === 0 ? (
        <Card className="mb-5">
          <div className="text-center py-8 text-[var(--tx3)] flex flex-col items-center gap-2">
            <Lock size={32} className="opacity-40" />
            <div className="font-semibold text-[13px] text-[var(--tx)]">No Staff Directory Records Found</div>
            <p className="text-[11.5px] max-w-[320px]">
              Please go to the <strong>Staff Management</strong> tab to add staff members or import staff directory records first.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = getCategoryCount(cat);
            return (
              <div
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all hover:shadow-md ${isSelected
                    ? 'bg-[var(--blue-bg)] border-[var(--blue-tx)] text-[var(--blue-tx)] shadow-sm'
                    : 'bg-[var(--surf)] border-[var(--b)] text-[var(--tx)] hover:bg-[var(--surf2)]'
                  }`}
              >
                <div className="text-[11px] font-bold tracking-wider uppercase opacity-60">Category</div>
                <div className="text-[15px] font-bold mt-1.5 truncate">{cat}</div>
                <div className="text-[12px] opacity-80 mt-2 flex items-center gap-1">
                  <span className="font-semibold">{count}</span> staff members
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Members Access Management */}
      {selectedCategory && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-[13px] font-bold text-[var(--tx)]">
                {selectedCategory} Access Control List
              </div>
              <div className="text-[11px] text-[var(--tx3)]">
                Manage login credentials and activation state for staff members in {selectedCategory}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 w-full sm:max-w-[280px]">
              <Search size={13} className="text-[var(--tx3)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${selectedCategory.toLowerCase()} staff...`}
                className="flex-1 bg-transparent text-[11.5px] text-[var(--tx)] placeholder:text-[var(--tx3)] outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px] min-w-[750px]">
              <thead>
                <tr className="border-b border-[var(--b)] text-[var(--tx3)]">
                  {['Staff Member', 'Designation & Dept', 'Login Email', 'Access Status', 'Actions'].map((h) => (
                    <th key={h} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-3 py-2 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((s) => {
                  const access = getAccessInfo(s.id);
                  const nameText = s.name || 'Staff Member';
                  const initials = nameText.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2) || 'S';
                  return (
                    <tr key={s.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)]/40 transition-colors last:border-0">
                      {/* Name */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            initials={initials}
                            bg="var(--purple-bg)"
                            color="var(--purple-tx)"
                          />
                          <div>
                            <span className="font-semibold text-[var(--tx)]">{nameText}</span>
                            <div className="text-[10px] text-[var(--tx3)]">ID: {s.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Details */}
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-[var(--tx)]">{s.designation || 'Staff'}</div>
                        <div className="text-[10.5px] text-[var(--tx3)]">{s.department || 'N/A'}</div>
                      </td>

                      {/* Email */}
                      <td className="px-3 py-2.5 text-[var(--tx2)]">
                        {access.hasAccess ? (
                          <span className="font-mono text-[11px] bg-[var(--surf2)] border border-[var(--b)] px-2 py-0.5 rounded text-[var(--tx)]">
                            {access.email}
                          </span>
                        ) : (
                          <span className="text-[var(--tx3)] italic">No Credentials Set</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5">
                        {access.hasAccess ? (
                          access.isActive ? (
                            <Badge variant="teal">Active</Badge>
                          ) : (
                            <Badge variant="red">Inactive</Badge>
                          )
                        ) : (
                          <Badge variant="gray">No Access</Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAccessModal(s)}
                            className="px-2.5 py-1 text-[11px] font-semibold border border-[var(--blue-tx)]/20 bg-[var(--blue-bg)] text-[var(--blue-tx)] hover:opacity-90 rounded-lg cursor-pointer transition-opacity flex items-center gap-1"
                          >
                            <Key size={11} /> {access.hasAccess ? 'Edit Access' : 'Give Access'}
                          </button>

                          {access.hasAccess && (
                            <>
                              {/* Toggle active / inactive state */}
                              <button
                                type="button"
                                onClick={() => toggleAccessActive(s.id)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${access.isActive
                                    ? 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20'
                                    : 'bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20'
                                  }`}
                              >
                                {access.isActive ? 'Inactive' : 'Active'}
                              </button>

                              {/* Force Logout button */}
                              <button
                                type="button"
                                onClick={() => forceLogout(s.id)}
                                title="Force logout this staff member"
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20 flex items-center gap-1"
                              >
                                <LogOut size={11} /> Force Logout
                              </button>

                              <button
                                type="button"
                                onClick={() => removeAccess(s.id)}
                                className="p-1 text-[var(--tx3)] hover:text-[var(--red)] hover:bg-[var(--red-bg)] border border-transparent hover:border-[var(--red-tx)]/10 rounded-lg cursor-pointer transition-colors"
                                title="Remove Access Credentials"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-[var(--tx3)]">
                      No staff members found in this category
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Give / Edit Access Modal */}
      {modalOpen && modalStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={saveAccess} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">
                  {getAccessInfo(modalStaff.id).hasAccess ? 'Edit Credentials' : 'Give Login Access'}
                </div>
                <div className="text-[11px] text-[var(--tx3)] mt-0.5">
                  Set portal login credentials for <strong>{modalStaff.name}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setModalOpen(false); setModalStaff(null); }}
                className="p-1.5 rounded-lg hover:bg-[var(--surf2)] text-[var(--tx3)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--tx2)] mb-1.5">Login Email *</label>
                <input
                  type="email"
                  required
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="staff@krishnaveni.edu"
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--tx2)] mb-1.5">Password *</label>
                <input
                  type="password"
                  required
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--tx2)] mb-1.5">Role *</label>
                <select
                  value={inputRole}
                  onChange={(e) => setInputRole(e.target.value)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] cursor-pointer"
                >
                  {roles.map(r => (
                    <option key={r.name} value={r.name}>
                      {r.name.charAt(0).toUpperCase() + r.name.slice(1).replace(/-/g, ' ')}
                    </option>
                  ))}
                  {roles.length === 0 && <option value="faculty">Faculty</option>}
                </select>
              </div>
            </div>

            <div className="flex gap-2 p-5 pt-0">
              <button
                type="button"
                onClick={() => { setModalOpen(false); setModalStaff(null); }}
                className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] cursor-pointer hover:bg-[var(--surf3)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
              >
                Save Credentials
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
