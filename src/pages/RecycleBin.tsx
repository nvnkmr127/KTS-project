import { useState, useEffect } from 'react';
import {
  Trash2, RotateCcw, AlertTriangle, Users, BadgeIcon,
  Search, Loader2, RefreshCw, X, GraduationCap, CheckCircle2,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { KPICard } from '../components/KPICard';
import { api } from '../services/api';

interface DeletedStudent {
  id: string;
  name: string;
  roll: string;
  class: string;
  section: string;
  gender: string;
  parent: string;
  phone: string;
  deletedAt?: string;
}

interface DeletedStaff {
  id: string;
  name: string;
  designation: string;
  department: string;
  category: string;
  phone: string;
  email: string;
  joinDate: string;
}

type Tab = 'students' | 'staff';
type ConfirmAction = { type: 'restore' | 'delete'; entity: 'student' | 'staff'; id: string; name: string } | null;

export function RecycleBin() {
  const [activeTab, setActiveTab] = useState<Tab>('students');
  const [search, setSearch] = useState('');

  // Students
  const [deletedStudents, setDeletedStudents] = useState<DeletedStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Staff
  const [deletedStaff, setDeletedStaff] = useState<DeletedStaff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Action states
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null);

  const showToast = (message: string, success: boolean) => {
    setToast({ message, success });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load deleted students ──────────────────────────────────────────────
  const loadDeletedStudents = async () => {
    setLoadingStudents(true);
    try {
      const data = await api.getResources('students', { with: 'batch.academicYear', limit: '1000' });
      const left = data
        .filter((s: any) => {
          const status = (s.status || '').toLowerCase();
          return status === 'left' || status === 'dropout';
        })
        .map((s: any) => ({
          id: String(s.id),
          name: s.name,
          roll: s.enrollment_number || 'N/A',
          class: s.class || '—',
          section: s.section || '—',
          gender: s.gender || 'N/A',
          parent: s.father_name || 'N/A',
          phone: s.student_mobile || '—',
        }));
      setDeletedStudents(left);
    } catch (err) {
      console.error('Error loading deleted students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // ── Load deleted staff ─────────────────────────────────────────────────
  const loadDeletedStaff = () => {
    setLoadingStaff(true);
    try {
      const saved = localStorage.getItem('kts_staff_members');
      const all = saved ? JSON.parse(saved) : [];
      const resigned = all.filter((s: any) => s.status === 'Resigned');
      setDeletedStaff(resigned);
    } catch (err) {
      console.error('Error loading deleted staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    loadDeletedStudents();
    loadDeletedStaff();
  }, []);

  // ── Restore student ────────────────────────────────────────────────────
  const restoreStudent = async (id: string) => {
    setProcessing(true);
    try {
      await api.updateResource('students', id, { status: 'active' });
      await loadDeletedStudents();
      showToast('Student restored successfully!', true);
    } catch (err) {
      console.error('Error restoring student:', err);
      showToast('Failed to restore student. Please try again.', false);
    } finally {
      setProcessing(false);
      setConfirm(null);
    }
  };

  // ── Permanently delete student ─────────────────────────────────────────
  const permanentDeleteStudent = async (id: string) => {
    setProcessing(true);
    try {
      await api.deleteResource('students', id);
      await loadDeletedStudents();
      showToast('Student permanently deleted.', true);
    } catch (err) {
      console.error('Error permanently deleting student:', err);
      showToast('Failed to delete student. Please try again.', false);
    } finally {
      setProcessing(false);
      setConfirm(null);
    }
  };

  // ── Restore staff ──────────────────────────────────────────────────────
  const restoreStaff = (id: string) => {
    setProcessing(true);
    try {
      const saved = localStorage.getItem('kts_staff_members');
      const all = saved ? JSON.parse(saved) : [];
      const updated = all.map((s: any) =>
        s.id === id ? { ...s, status: 'Active' } : s
      );
      localStorage.setItem('kts_staff_members', JSON.stringify(updated));
      loadDeletedStaff();
      showToast('Staff member restored successfully!', true);
    } catch (err) {
      console.error('Error restoring staff:', err);
      showToast('Failed to restore staff member.', false);
    } finally {
      setProcessing(false);
      setConfirm(null);
    }
  };

  // ── Permanently delete staff ───────────────────────────────────────────
  const permanentDeleteStaff = (id: string) => {
    setProcessing(true);
    try {
      const saved = localStorage.getItem('kts_staff_members');
      const all = saved ? JSON.parse(saved) : [];
      const updated = all.filter((s: any) => s.id !== id);
      localStorage.setItem('kts_staff_members', JSON.stringify(updated));
      loadDeletedStaff();
      showToast('Staff member permanently deleted.', true);
    } catch (err) {
      console.error('Error permanently deleting staff:', err);
      showToast('Failed to delete staff member.', false);
    } finally {
      setProcessing(false);
      setConfirm(null);
    }
  };

  // ── Confirm action dispatcher ──────────────────────────────────────────
  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.type === 'restore' && confirm.entity === 'student') restoreStudent(confirm.id);
    else if (confirm.type === 'delete' && confirm.entity === 'student') permanentDeleteStudent(confirm.id);
    else if (confirm.type === 'restore' && confirm.entity === 'staff') restoreStaff(confirm.id);
    else if (confirm.type === 'delete' && confirm.entity === 'staff') permanentDeleteStaff(confirm.id);
  };

  // ── Filtered lists ─────────────────────────────────────────────────────
  const filteredStudents = deletedStudents.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll.toLowerCase().includes(search.toLowerCase()) ||
    s.parent.toLowerCase().includes(search.toLowerCase())
  );

  const filteredStaff = deletedStaff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.designation.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-[12px] font-semibold animate-fade-in ${
          toast.success
            ? 'bg-[var(--teal-bg)] border-[var(--teal-tx)]/20 text-[var(--teal-tx)]'
            : 'bg-[var(--red-bg)] border-[var(--red-tx)]/20 text-[var(--red-tx)]'
        }`}>
          {toast.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {toast.message}
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden">
            <div className={`p-5 pb-4 border-b border-[var(--b)] flex items-start gap-3 ${
              confirm.type === 'delete' ? 'bg-[var(--red-bg)]' : 'bg-[var(--teal-bg)]'
            }`}>
              <div className={`p-2 rounded-xl flex-shrink-0 ${confirm.type === 'delete' ? 'bg-[var(--red-tx)]/10' : 'bg-[var(--teal-tx)]/10'}`}>
                {confirm.type === 'delete'
                  ? <AlertTriangle size={18} className="text-[var(--red-tx)]" />
                  : <RotateCcw size={18} className="text-[var(--teal-tx)]" />
                }
              </div>
              <div>
                <div className="text-[13.5px] font-bold text-[var(--tx)]">
                  {confirm.type === 'restore' ? 'Restore Record' : 'Permanently Delete'}
                </div>
                <div className="text-[11px] text-[var(--tx3)] mt-0.5">
                  {confirm.type === 'restore'
                    ? `Restore "${confirm.name}" back to active records?`
                    : `This will permanently remove "${confirm.name}" and cannot be undone.`
                  }
                </div>
              </div>
            </div>
            <div className="p-4 flex gap-2.5 justify-end">
              <button
                onClick={() => setConfirm(null)}
                disabled={processing}
                className="px-4 py-2 text-[12px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={processing}
                className={`px-4 py-2 text-[12px] rounded-lg text-white font-semibold cursor-pointer disabled:opacity-60 flex items-center gap-2 ${
                  confirm.type === 'delete' ? 'bg-[var(--red)]' : 'bg-[var(--teal)]'
                }`}
              >
                {processing && <Loader2 size={12} className="animate-spin" />}
                {confirm.type === 'restore' ? 'Restore' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        <KPICard
          label="Deleted Students"
          value={deletedStudents.length}
          sub="Marked as 'Left' in system"
          icon={<GraduationCap size={15} />}
          iconBg="var(--red-bg)"
          iconColor="var(--red-tx)"
        />
        <KPICard
          label="Deleted Staff"
          value={deletedStaff.length}
          sub="Marked as 'Resigned' in system"
          icon={<BadgeIcon size={15} />}
          iconBg="var(--amber-bg)"
          iconColor="var(--amber-tx)"
        />
        <KPICard
          label="Total Items"
          value={deletedStudents.length + deletedStaff.length}
          sub="Records in recycle bin"
          icon={<Trash2 size={15} />}
          iconBg="var(--purple-bg)"
          iconColor="var(--purple-tx)"
        />
      </div>

      <Card>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--red-bg)] flex items-center justify-center">
              <Trash2 size={14} className="text-[var(--red-tx)]" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[var(--tx)]">Recycle Bin</div>
              <div className="text-[10.5px] text-[var(--tx3)]">Restore or permanently delete soft-deleted records</div>
            </div>
          </div>
          <button
            onClick={() => { loadDeletedStudents(); loadDeletedStaff(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* Info banner */}
        <div className="mb-4 flex items-start gap-2.5 px-3.5 py-3 bg-[var(--amber-bg)] border border-[var(--amber-tx)]/20 rounded-xl text-[11.5px] text-[var(--amber-tx)]">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            Records here are <strong>soft-deleted</strong> — they remain in the database with a "Left" or "Resigned" status.
            You can restore them at any time, or permanently remove them. Permanent deletion cannot be undone.
          </span>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex border-b border-[var(--b)]">
            {([
              { id: 'students' as Tab, label: 'Students', icon: <GraduationCap size={13} />, count: deletedStudents.length },
              { id: 'staff' as Tab, label: 'Staff', icon: <Users size={13} />, count: deletedStaff.length },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearch(''); }}
                className={`flex items-center gap-1.5 py-2.5 px-4 text-[12px] font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[var(--blue)] text-[var(--blue-tx)]'
                    : 'border-transparent text-[var(--tx3)] hover:text-[var(--tx2)]'
                }`}
              >
                {tab.icon}
                {tab.label}
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-[var(--blue-bg)] text-[var(--blue-tx)]' : 'bg-[var(--surf2)] text-[var(--tx3)]'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 min-w-[220px]">
            <Search size={12} className="text-[var(--tx3)] flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${activeTab === 'students' ? 'students' : 'staff'}...`}
              className="flex-1 bg-transparent text-[12px] text-[var(--tx)] placeholder:text-[var(--tx3)] outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-[var(--tx3)] hover:text-[var(--tx)] cursor-pointer">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <>
            {loadingStudents ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--tx3)]">
                <Loader2 size={22} className="animate-spin text-[var(--blue-tx)]" />
                <span className="text-[12px]">Loading deleted students...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[var(--teal-bg)] flex items-center justify-center">
                  <GraduationCap size={22} className="text-[var(--teal-tx)]" />
                </div>
                <div className="text-[13px] font-semibold text-[var(--tx)]">
                  {search ? 'No matching deleted students' : 'Recycle bin is empty'}
                </div>
                <div className="text-[11.5px] text-[var(--tx3)]">
                  {search ? 'Try a different search term.' : 'No students have been marked as "Left".'}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px] min-w-[620px]">
                  <thead>
                    <tr className="border-b border-[var(--b)]">
                      {['Student', 'Roll No', 'Class', 'Parent / Guardian', 'Phone', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(s => (
                      <tr key={s.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)] transition-colors last:border-0">
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[var(--red-bg)] flex items-center justify-center text-[10px] font-bold text-[var(--red-tx)]">
                              {s.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-[var(--tx)]">{s.name}</div>
                              <div className="text-[10px] text-[var(--tx3)]">{s.gender}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 font-mono text-[11px] text-[var(--tx2)]">{s.roll}</td>
                        <td className="px-2 py-2.5 text-[var(--tx2)]">Class {s.class} — {s.section}</td>
                        <td className="px-2 py-2.5">
                          <div className="font-medium text-[var(--tx)]">{s.parent}</div>
                          <div className="text-[10px] text-[var(--tx3)]">{s.phone}</div>
                        </td>
                        <td className="px-2 py-2.5 text-[var(--tx2)]">{s.phone}</td>
                        <td className="px-2 py-2.5">
                          <Badge variant="red">Left</Badge>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setConfirm({ type: 'restore', entity: 'student', id: s.id, name: s.name })}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-[var(--teal-bg)] text-[var(--teal-tx)] rounded-lg hover:opacity-80 cursor-pointer transition-opacity"
                              title="Restore student"
                            >
                              <RotateCcw size={11} /> Restore
                            </button>
                            <button
                              onClick={() => setConfirm({ type: 'delete', entity: 'student', id: s.id, name: s.name })}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-[var(--red-bg)] text-[var(--red-tx)] rounded-lg hover:opacity-80 cursor-pointer transition-opacity"
                              title="Delete permanently"
                            >
                              <Trash2 size={11} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loadingStudents && filteredStudents.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--b)] text-[11px] text-[var(--tx3)]">
                Showing {filteredStudents.length} of {deletedStudents.length} deleted student{deletedStudents.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <>
            {loadingStaff ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--tx3)]">
                <Loader2 size={22} className="animate-spin text-[var(--blue-tx)]" />
                <span className="text-[12px]">Loading deleted staff...</span>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[var(--teal-bg)] flex items-center justify-center">
                  <Users size={22} className="text-[var(--teal-tx)]" />
                </div>
                <div className="text-[13px] font-semibold text-[var(--tx)]">
                  {search ? 'No matching deleted staff' : 'Recycle bin is empty'}
                </div>
                <div className="text-[11.5px] text-[var(--tx3)]">
                  {search ? 'Try a different search term.' : 'No staff members have been removed.'}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px] min-w-[580px]">
                  <thead>
                    <tr className="border-b border-[var(--b)]">
                      {['Staff Member', 'Designation', 'Department', 'Phone / Email', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map(s => (
                      <tr key={s.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)] transition-colors last:border-0">
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[var(--amber-bg)] flex items-center justify-center text-[10px] font-bold text-[var(--amber-tx)]">
                              {s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="font-semibold text-[var(--tx)]">{s.name}</div>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-[var(--tx2)]">{s.designation}</td>
                        <td className="px-2 py-2.5 text-[var(--tx2)]">{s.department}</td>
                        <td className="px-2 py-2.5">
                          <div className="text-[var(--tx)]">{s.phone}</div>
                          <div className="text-[10px] text-[var(--tx3)]">{s.email}</div>
                        </td>
                        <td className="px-2 py-2.5">
                          <Badge variant="amber">Resigned</Badge>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setConfirm({ type: 'restore', entity: 'staff', id: s.id, name: s.name })}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-[var(--teal-bg)] text-[var(--teal-tx)] rounded-lg hover:opacity-80 cursor-pointer transition-opacity"
                              title="Restore staff member"
                            >
                              <RotateCcw size={11} /> Restore
                            </button>
                            <button
                              onClick={() => setConfirm({ type: 'delete', entity: 'staff', id: s.id, name: s.name })}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-[var(--red-bg)] text-[var(--red-tx)] rounded-lg hover:opacity-80 cursor-pointer transition-opacity"
                              title="Delete permanently"
                            >
                              <Trash2 size={11} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loadingStaff && filteredStaff.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--b)] text-[11px] text-[var(--tx3)]">
                Showing {filteredStaff.length} of {deletedStaff.length} deleted staff member{deletedStaff.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
