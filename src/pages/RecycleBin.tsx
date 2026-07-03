import { useState, useEffect } from 'react';
import {
  Trash2, RotateCcw, AlertTriangle, Users, BadgeIcon,
  Search, Loader2, RefreshCw, X, GraduationCap, CheckCircle2,
  Activity,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { KPICard } from '../components/KPICard';
import { api } from '../services/api';
import { useDialog } from '../context/DialogContext';

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
  isAlumni?: boolean;
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

type Tab = 'students' | 'staff' | 'activity_logs';
type ConfirmAction = { 
  type: 'restore' | 'delete'; 
  entity: 'student' | 'staff' | 'activity_log'; 
  id: string; 
  name: string; 
  isAlumni?: boolean 
} | null;

export function RecycleBin() {
  const { alert } = useDialog();
  const [activeTab, setActiveTab] = useState<Tab>('students');
  const [search, setSearch] = useState('');

  // Students
  const [deletedStudents, setDeletedStudents] = useState<DeletedStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Staff
  const [deletedStaff, setDeletedStaff] = useState<DeletedStaff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Activity Logs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deletedActivityLogs, setDeletedActivityLogs] = useState<any[]>([]);
  const [loadingActivityLogs, setLoadingActivityLogs] = useState(false);
  const [activityExpandedId, setActivityExpandedId] = useState<string | null>(null);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((s: any) => {
          const status = (s.status || '').toLowerCase();
          return status === 'left' || status === 'dropout';
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((s: any) => ({
          id: String(s.id),
          name: s.name,
          roll: s.enrollment_number || 'N/A',
          class: s.class || '—',
          section: s.section || '—',
          gender: s.gender || 'N/A',
          parent: s.father_name || 'N/A',
          phone: s.student_mobile || '—',
          isAlumni: false,
        }));
        
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let backendAlumni: any[] = [];
      try { backendAlumni = await api.getResources('alumni') || []; } catch {}
      const localAlumniStr = localStorage.getItem('kts_alumni_records');
      const localAlumni = localAlumniStr ? JSON.parse(localAlumniStr) : [];
      
      const allAlumniMap = new Map();
      [...backendAlumni, ...localAlumni].forEach(a => {
        if (!allAlumniMap.has(String(a.id))) allAlumniMap.set(String(a.id), a);
      });
      const deletedAlumniList = Array.from(allAlumniMap.values())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((a: any) => (a.status || '').toLowerCase() === 'deleted')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((a: any) => ({
          id: String(a.id),
          name: a.name,
          roll: a.roll || a.enrollment_number || 'N/A',
          class: a.class || '—',
          section: a.section || '—',
          gender: a.gender || 'N/A',
          parent: '—',
          phone: a.phone || '—',
          isAlumni: true,
        }));

      setDeletedStudents([...left, ...deletedAlumniList]);
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
      const all = (saved && JSON.parse(saved)) || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resigned = all.filter((s: any) => s.status === 'Resigned');
      setDeletedStaff(resigned);
    } catch (err) {
      console.error('Error loading deleted staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  // ── Load recycled activity logs ───────────────────────────────────────
  const loadDeletedActivityLogs = async () => {
    setLoadingActivityLogs(true);
    try {
      const res = await api.getActivityLogs({ recycled: 'true', limit: '500' });
      const data = res.data ?? res ?? [];
      setDeletedActivityLogs(data);
    } catch (err) {
      console.error('Error loading recycled activity logs:', err);
    } finally {
      setLoadingActivityLogs(false);
    }
  };

  useEffect(() => {
    loadDeletedStudents();
    loadDeletedStaff();
    loadDeletedActivityLogs();
  }, []);

  const refreshAll = () => {
    if (activeTab === 'students') loadDeletedStudents();
    else if (activeTab === 'staff') loadDeletedStaff();
    else if (activeTab === 'activity_logs') loadDeletedActivityLogs();
  };

  // ── Restore student ────────────────────────────────────────────────────
  const restoreStudent = async (id: string, isAlumni?: boolean) => {
    setProcessing(true);
    try {
      if (isAlumni) {
        if (!id.startsWith('local-')) {
          try { await api.updateResource('alumni', id, { status: 'Unverified' }); } catch {}
        }
        const saved = localStorage.getItem('kts_alumni_records');
        if (saved) {
           const all = (saved && JSON.parse(saved)) || [];
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           const updated = all.map((a: any) => String(a.id) === id ? { ...a, status: 'Unverified' } : a);
           localStorage.setItem('kts_alumni_records', JSON.stringify(updated));
        }
      } else {
        await api.updateResource('students', id, { status: 'active' });
      }
      await loadDeletedStudents();
      showToast(isAlumni ? 'Alumni restored successfully!' : 'Student restored successfully!', true);
    } catch (err) {
      console.error('Error restoring student:', err);
      showToast('Failed to restore student. Please try again.', false);
    } finally {
      setProcessing(false);
      setConfirm(null);
    }
  };

  // ── Permanently delete student ─────────────────────────────────────────
  const permanentDeleteStudent = async (id: string, isAlumni?: boolean) => {
    setProcessing(true);
    try {
      if (isAlumni) {
        if (!id.startsWith('local-')) {
          try { await api.deleteResource('alumni', id); } catch {}
        }
        const saved = localStorage.getItem('kts_alumni_records');
        if (saved) {
           const all = (saved && JSON.parse(saved)) || [];
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           const updated = all.filter((a: any) => String(a.id) !== id);
           localStorage.setItem('kts_alumni_records', JSON.stringify(updated));
        }
      } else {
        await api.deleteResource('students', id);
      }
      await loadDeletedStudents();
      showToast(isAlumni ? 'Alumni permanently deleted.' : 'Student permanently deleted.', true);
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
      const all = (saved && JSON.parse(saved)) || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const all = (saved && JSON.parse(saved)) || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isRestorableLog = (log: any) => {
    if (!log.properties || !log.properties.original_created_at) {
      return false;
    }
    const originalDate = new Date(log.properties.original_created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return originalDate >= thirtyDaysAgo;
  };

  // ── Restore Activity Log ───────────────────────────────────────────────
  const restoreActivityLog = async (id: string) => {
    setProcessing(true);
    try {
      await api.restoreActivityLog(id);
      await loadDeletedActivityLogs();
      showToast('Activity log restored successfully!', true);
    } catch (err: any) {
      console.error('Error restoring activity log:', err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errMsg = err.error || err.message || 'Failed to restore activity log.';
      showToast(errMsg, false);
      await alert(errMsg, "Error");
    } finally {
      setProcessing(false);
      setConfirm(null);
    }
  };

  // ── Permanently Delete Activity Log ────────────────────────────────────
  const permanentDeleteActivityLog = async (id: string) => {
    setProcessing(true);
    try {
      await api.deleteActivityLog(id);
      await loadDeletedActivityLogs();
      showToast('Activity log permanently deleted.', true);
    } catch (err) {
      console.error('Error permanently deleting activity log:', err);
      showToast('Failed to delete activity log.', false);
    } finally {
      setProcessing(false);
      setConfirm(null);
    }
  };

  // ── Confirm action dispatcher ──────────────────────────────────────────
  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.type === 'restore' && confirm.entity === 'student') restoreStudent(confirm.id, confirm.isAlumni);
    else if (confirm.type === 'delete' && confirm.entity === 'student') permanentDeleteStudent(confirm.id, confirm.isAlumni);
    else if (confirm.type === 'restore' && confirm.entity === 'staff') restoreStaff(confirm.id);
    else if (confirm.type === 'delete' && confirm.entity === 'staff') permanentDeleteStaff(confirm.id);
    else if (confirm.type === 'restore' && confirm.entity === 'activity_log') restoreActivityLog(confirm.id);
    else if (confirm.type === 'delete' && confirm.entity === 'activity_log') permanentDeleteActivityLog(confirm.id);
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

  const filteredActivityLogs = deletedActivityLogs.filter(l =>
    l.description.toLowerCase().includes(search.toLowerCase()) ||
    (l.causer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.event || '').toLowerCase().includes(search.toLowerCase())
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mb-3">
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
          icon={<Users size={15} />}
          iconBg="var(--amber-bg)"
          iconColor="var(--amber-tx)"
        />
        <KPICard
          label="Recycled Activity Logs"
          value={deletedActivityLogs.length}
          sub="Logs 30 to 60 days old"
          icon={<Activity size={15} />}
          iconBg="var(--blue-bg)"
          iconColor="var(--blue-tx)"
        />
        <KPICard
          label="Total Items"
          value={deletedStudents.length + deletedStaff.length + deletedActivityLogs.length}
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
            onClick={refreshAll}
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
            {activeTab === 'activity_logs' ? (
              <>
                Activity logs here are between <strong>30 and 60 days old</strong> and have been automatically archived to the Recycle Bin.
                Logs older than 60 days are permanently deleted automatically.
              </>
            ) : (
              <>
                Records here are <strong>soft-deleted</strong> — they remain in the database with a "Left" or "Resigned" status.
                You can restore them at any time, or permanently remove them. Permanent deletion cannot be undone.
              </>
            )}
          </span>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex border-b border-[var(--b)] overflow-x-auto">
            {([
              { id: 'students' as Tab, label: 'Students', icon: <GraduationCap size={13} />, count: deletedStudents.length },
              { id: 'staff' as Tab, label: 'Staff', icon: <Users size={13} />, count: deletedStaff.length },
              { id: 'activity_logs' as Tab, label: 'Activity Logs', icon: <Activity size={13} />, count: deletedActivityLogs.length },
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
              placeholder={`Search ${activeTab === 'students' ? 'students' : activeTab === 'staff' ? 'staff' : 'logs'}...`}
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
                              <div className="font-semibold text-[var(--tx)] flex items-center gap-1.5">
                                {s.name}
                                {s.isAlumni && <span className="px-1.5 py-0.5 text-[9px] bg-[var(--blue-bg)] text-[var(--blue-tx)] rounded border border-[var(--blue-tx)]/20 uppercase tracking-wider font-bold">Alumni</span>}
                              </div>
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
                          <Badge variant="red">{s.isAlumni ? 'Deleted' : 'Left'}</Badge>
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setConfirm({ type: 'restore', entity: 'student', id: s.id, name: s.name, isAlumni: s.isAlumni })}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-[var(--teal-bg)] text-[var(--teal-tx)] rounded-lg hover:opacity-80 cursor-pointer transition-opacity"
                              title={s.isAlumni ? "Restore alumni" : "Restore student"}
                            >
                              <RotateCcw size={11} /> Restore
                            </button>
                            <button
                              onClick={() => setConfirm({ type: 'delete', entity: 'student', id: s.id, name: s.name, isAlumni: s.isAlumni })}
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

        {/* Activity Logs Tab */}
        {activeTab === 'activity_logs' && (
          <>
            {loadingActivityLogs ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--tx3)]">
                <Loader2 size={22} className="animate-spin text-[var(--blue-tx)]" />
                <span className="text-[12px]">Loading recycled activity logs...</span>
              </div>
            ) : filteredActivityLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[var(--blue-bg)] flex items-center justify-center">
                  <Activity size={22} className="text-[var(--blue-tx)]" />
                </div>
                <div className="text-[13px] font-semibold text-[var(--tx)]">
                  {search ? 'No matching activity logs' : 'Recycle bin is empty'}
                </div>
                <div className="text-[11.5px] text-[var(--tx3)]">
                  {search ? 'Try a different search term.' : 'No activity logs have been auto-deleted.'}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredActivityLogs.map((log) => (
                  <div key={log.id} className="flex gap-3 py-3 border-b border-[var(--b)] last:border-0 items-start">
                    {/* Left: dot */}
                    <div className="flex-shrink-0 mt-1.5">
                      <div className={`w-2 h-2 rounded-full ${eventDotColor(log.event)}`} />
                    </div>
                    
                    {/* Center: content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
                        <div>
                          {/* User chip */}
                          <span className="text-[11px] font-semibold text-[var(--blue-tx)] bg-[var(--blue-bg)] px-2 py-0.5 rounded-full mr-2">
                            {log.causer_name}
                          </span>
                          {/* Description */}
                          <span className="text-[12px] text-[var(--tx)]">{formatDescription(log)}</span>
                        </div>
                        {/* Time */}
                        <span className="text-[10px] text-[var(--tx3)] flex-shrink-0">{log.time_ago}</span>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {log.event && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${eventBadgeStyle(log.event)}`}>
                            {log.event}
                          </span>
                        )}
                        {log.subject_type && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surf2)] text-[var(--tx3)]">
                            {log.subject_type}
                          </span>
                        )}
                        {log.properties?.ip_address && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surf2)] text-[var(--tx3)]">
                            {log.properties.ip_address}
                          </span>
                        )}
                      </div>
                      
                      {/* Show details */}
                      {Object.keys(log.properties ?? {}).length > 0 && (
                        <button
                          onClick={() => setActivityExpandedId(activityExpandedId === String(log.id) ? null : String(log.id))}
                          className="text-[10px] text-[var(--blue-tx)] mt-1 hover:underline block"
                        >
                          {activityExpandedId === String(log.id) ? 'Hide details ▲' : 'Show details ▼'}
                        </button>
                      )}
                      {activityExpandedId === String(log.id) && renderActivityProperties(log)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <button
                        onClick={async () => {
                          if (!isRestorableLog(log)) {
                            await alert("Can't restore the logs.", "Cannot Restore");
                            return;
                          }
                          setConfirm({ type: 'restore', entity: 'activity_log', id: String(log.id), name: formatDescription(log) });
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-[var(--teal-bg)] text-[var(--teal-tx)] rounded-lg hover:opacity-80 cursor-pointer transition-opacity"
                        title="Restore activity log"
                      >
                        <RotateCcw size={11} /> Restore
                      </button>
                      <button
                        onClick={() => setConfirm({ type: 'delete', entity: 'activity_log', id: String(log.id), name: formatDescription(log) })}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-[var(--red-bg)] text-[var(--red-tx)] rounded-lg hover:opacity-80 cursor-pointer transition-opacity"
                        title="Delete permanently"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loadingActivityLogs && filteredActivityLogs.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--b)] text-[11px] text-[var(--tx3)]">
                Showing {filteredActivityLogs.length} of {deletedActivityLogs.length} recycled activity log{deletedActivityLogs.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

// ── ACTIVITY LOG COLOR & ICON HELPERS ────────────────────────────────────

function eventDotColor(event: string): string {
  if (event === 'created') return 'bg-green-500';
  if (event === 'updated') return 'bg-blue-500';
  if (event === 'deleted') return 'bg-red-500';
  if (event === 'login')   return 'bg-teal-500';
  if (event === 'logout')  return 'bg-gray-400';
  return 'bg-amber-400';
}

function eventBadgeStyle(event: string): string {
  if (event === 'created') return 'bg-[var(--green-bg)] text-[var(--green-tx)]';
  if (event === 'updated') return 'bg-[var(--blue-bg)] text-[var(--blue-tx)]';
  if (event === 'deleted') return 'bg-[var(--red-bg)] text-[var(--red-tx)]';
  if (event === 'login')   return 'bg-[var(--teal-bg)] text-[var(--teal-tx)]';
  if (event === 'logout')  return 'bg-[var(--surf2)] text-[var(--tx3)]';
  return 'bg-[var(--amber-bg)] text-[var(--amber-tx)]';
}

// HELPER TO FORMAT ANY VALUE HUMAN READABLY WITHOUT BRACES
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatVal = (v: any): string => {
  if (v === null || v === undefined) return 'N/A';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(v);
        return formatVal(parsed);
      } catch (e) {}
    }
    return v;
  }

  if (Array.isArray(v)) {
    if (v.length === 0) return 'None';
    
    // If it's an array of objects
    if (typeof v[0] === 'object' && v[0] !== null) {
      // Special check: is it an attendance list?
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isAttendanceList = v.some((item: any) => item && (item.status === 'present' || item.status === 'absent'));
      if (isAttendanceList) {
        let maxMarkedAt = '';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        v.forEach((r: any) => {
          if (r && r.markedAt) {
            if (!maxMarkedAt || r.markedAt > maxMarkedAt) {
              maxMarkedAt = r.markedAt;
            }
          }
        });
        const targetRecords = maxMarkedAt 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? v.filter((r: any) => r && r.markedAt === maxMarkedAt)
          : v;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const present = targetRecords.filter((item: any) => item && item.status === 'present').length;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const absent = targetRecords.filter((item: any) => item && item.status === 'absent').length;
        return `Present: ${present}, Absent: ${absent}`;
      }

      return `${v.length} items`;
    }
    return v.map(item => formatVal(item)).join(', ');
  }

  if (typeof v === 'object') {
    const entries = Object.entries(v);
    if (entries.length === 0) return '';
    return entries
      .map(([k, val]) => {
        const formattedKey = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return `${formattedKey}: ${formatVal(val)}`;
      })
      .join(', ');
  }

  return String(v);
};

// HELPER TO DYNAMICALLY CLEAN UP ANY JSON STRING INSIDE DESCRIPTION
const cleanJsonInString = (str: string): string => {
  if (!str) return '';
  const startIdxCurly = str.indexOf('{');
  const startIdxSquare = str.indexOf('[');
  let startIdx = -1;
  let endIdx = -1;
  let isCurly = false;
  
  if (startIdxCurly !== -1 && (startIdxSquare === -1 || startIdxCurly < startIdxSquare)) {
    startIdx = startIdxCurly;
    isCurly = true;
  } else if (startIdxSquare !== -1) {
    startIdx = startIdxSquare;
  }
  
  if (startIdx !== -1) {
    const endIdxCurly = str.lastIndexOf('}');
    const endIdxSquare = str.lastIndexOf(']');
    if (isCurly && endIdxCurly > startIdx) {
      endIdx = endIdxCurly;
    } else if (!isCurly && endIdxSquare > startIdx) {
      endIdx = endIdxSquare;
    }
  }
  
  if (startIdx !== -1 && endIdx !== -1) {
    const prefix = str.substring(0, startIdx).trim();
    let suffix = str.substring(endIdx + 1).trim();
    const jsonStr = str.substring(startIdx, endIdx + 1);
    
    try {
      const parsed = JSON.parse(jsonStr);
      if (suffix === "'" || suffix === '"') suffix = '';
      let cleanPrefix = prefix;
      if (cleanPrefix.endsWith("to '") || cleanPrefix.endsWith('to "')) {
        cleanPrefix = cleanPrefix.substring(0, cleanPrefix.length - 5).trim();
      } else if (cleanPrefix.endsWith("to")) {
        cleanPrefix = cleanPrefix.substring(0, cleanPrefix.length - 2).trim();
      }
      
      let formattedJson = formatVal(parsed);
      if (formattedJson.length > 120) {
        formattedJson = formattedJson.substring(0, 120) + '...';
      }
      return `${cleanPrefix}${formattedJson ? ` to: ${formattedJson}` : ''}${suffix ? ` ${suffix}` : ''}`;
    } catch (e) {}
  }
  
  return str;
};

// FORMAT DYNAMIC DESCRIPTIONS DYNAMICALLY (e.g. attendance logs)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatDescription(log: any): string {
  const desc = log.description || '';
  if (desc.startsWith("Updated system setting 'kts student attendance records' to") || desc === "Student attendance records updated" || desc.toLowerCase().includes("attendance")) {
    const properties = log.properties || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let records: any[] = [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parseValue = (val: any) => {
      if (!val) return [];
      try {
        if (Array.isArray(val)) return val;
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return [];
    };

    records = parseValue(properties.attributes?.value || properties.value);
    
    if (records.length === 0) {
      for (const val of Object.values(properties)) {
        const arr = parseValue(val);
        if (arr.length > 0 && arr[0] && (arr[0].className || arr[0].session || arr[0].markedAt)) {
          records = arr;
          break;
        }
      }
    }

    if (records.length === 0) {
      const startIdxSquare = desc.indexOf('[');
      const endIdxSquare = desc.lastIndexOf(']');
      if (startIdxSquare !== -1 && endIdxSquare > startIdxSquare) {
        const jsonStr = desc.substring(startIdxSquare, endIdxSquare + 1);
        records = parseValue(jsonStr);
      }
    }

    if (records.length > 0) {
      let maxMarkedAt = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      records.forEach((r: any) => {
        if (r && r.markedAt) {
          if (!maxMarkedAt || r.markedAt > maxMarkedAt) {
            maxMarkedAt = r.markedAt;
          }
        }
      });

      const targetRecords = maxMarkedAt 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? records.filter((r: any) => r && r.markedAt === maxMarkedAt)
        : records;

      if (targetRecords.length > 0 && targetRecords[0]) {
        const first = targetRecords[0];
        const classSection = first.className || '';
        const session = first.session === 'first_period' ? 'morning' : 'afternoon';
        if (classSection) {
          return `marked attendance for ${classSection} in ${session}`;
        }
      }
    }
  }
  return cleanJsonInString(desc);
}

// RENDER ACTIVITY PROPERTIES IN HUMAN READABLE FORMAT
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderActivityProperties(log: any) {
  const properties = log.properties;
  const event = log.event;
  const description = log.description;

  if (!properties || Object.keys(properties).length === 0) return null;

  const formatKey = (k: string) => {
    return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const isAttendanceLog = 
    properties.present_count !== undefined ||
    (description && (
      description === 'Student attendance records updated' ||
      description.toLowerCase().includes('attendance')
    )) ||
    (properties.attributes && (properties.attributes.key === 'kts_student_attendance_records' || properties.attributes.key === 'kts student attendance records')) ||
    (properties.old && (properties.old.key === 'kts_student_attendance_records' || properties.old.key === 'kts student attendance records'));

  if (isAttendanceLog) {
    let present: number | undefined = undefined;
    let absent: number | undefined = undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let oldArr: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let newArr: any[] = [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parseValue = (val: any) => {
      if (!val) return [];
      try {
        if (Array.isArray(val)) return val;
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return [];
    };

    newArr = parseValue(properties.attributes?.value || properties.value);
    oldArr = parseValue(properties.old?.value);

    if (newArr.length === 0 && oldArr.length === 0) {
      for (const val of Object.values(properties)) {
        const arr = parseValue(val);
        if (arr.length > 0 && arr[0] && (arr[0].studentId || arr[0].status || arr[0].markedAt)) {
          newArr = arr;
          break;
        }
      }
    }

    if (newArr.length === 0 && oldArr.length === 0) {
      const startIdxSquare = description ? description.indexOf('[') : -1;
      const endIdxSquare = description ? description.lastIndexOf(']') : -1;
      if (startIdxSquare !== -1 && endIdxSquare > startIdxSquare) {
        const jsonStr = description.substring(startIdxSquare, endIdxSquare + 1);
        newArr = parseValue(jsonStr);
      }
    }

    if (newArr.length > 0) {
      let maxMarkedAt = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newArr.forEach((r: any) => {
        if (r && r.markedAt) {
          if (!maxMarkedAt || r.markedAt > maxMarkedAt) {
            maxMarkedAt = r.markedAt;
          }
        }
      });
      const targetRecords = maxMarkedAt 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? newArr.filter((r: any) => r && r.markedAt === maxMarkedAt)
        : newArr;
      present = targetRecords.filter(r => r.status === 'present').length;
      absent = targetRecords.filter(r => r.status === 'absent').length;
    } else if (oldArr.length > 0) {
      let maxMarkedAt = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      oldArr.forEach((r: any) => {
        if (r && r.markedAt) {
          if (!maxMarkedAt || r.markedAt > maxMarkedAt) {
            maxMarkedAt = r.markedAt;
          }
        }
      });
      const targetRecords = maxMarkedAt 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? oldArr.filter((r: any) => r && r.markedAt === maxMarkedAt)
        : oldArr;
      present = targetRecords.filter(r => r.status === 'present').length;
      absent = targetRecords.filter(r => r.status === 'absent').length;
    } else {
      if (properties.present_count !== undefined) present = properties.present_count;
      if (properties.absent_count !== undefined) absent = properties.absent_count;
    }

    if (present !== undefined || absent !== undefined) {
      return (
        <div className="mt-2 text-[11px] bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3 text-[var(--tx2)]">
          <div className="font-semibold text-[var(--tx)] text-[11.5px] border-b border-[var(--b)] pb-1.5 mb-1.5">
            Attendance Allotment Summary
          </div>
          <div className="space-y-1">
            <div className="flex justify-between sm:justify-start gap-2">
              <span className="font-bold text-[var(--tx)] min-w-[120px]">Present:</span>
              <span className="text-[var(--teal-tx)] font-semibold">{present ?? 0}</span>
            </div>
            <div className="flex justify-between sm:justify-start gap-2">
              <span className="font-bold text-[var(--tx)] min-w-[120px]">Absent:</span>
              <span className="text-[var(--red-tx)] font-semibold">{absent ?? 0}</span>
            </div>
          </div>
        </div>
      );
    }
  }

  const isModelLog = 'attributes' in properties || 'old' in properties;
  const excludeKeys = ['id', 'created_at', 'updated_at', 'password', 'password_confirmation', 'token', '_token', 'created_by', 'updated_by', 'academic_year_id', 'remember_token'];

  if (isModelLog) {
    const attributes = properties.attributes || {};
    const old = properties.old || {};

    if (event === 'updated' && Object.keys(old).length > 0) {
      const changes = Object.keys(attributes)
        .filter(key => !excludeKeys.includes(key))
        .map(key => {
          const oldVal = old[key];
          const newVal = attributes[key];
          if (oldVal !== newVal) {
            return {
              key,
              old: formatVal(oldVal),
              new: formatVal(newVal)
            };
          }
          return null;
        })
        .filter(Boolean) as Array<{ key: string; old: string; new: string }>;

      if (changes.length > 0) {
        return (
          <div className="mt-2 text-[11px] bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3 space-y-1.5 text-[var(--tx2)]">
            <div className="font-semibold text-[var(--tx)] text-[11.5px] border-b border-[var(--b)] pb-1.5 mb-1.5">Modified Fields</div>
            {changes.map(ch => (
              <div key={ch.key} className="flex flex-wrap gap-1 items-center">
                <span className="font-bold text-[var(--tx)]">{formatKey(ch.key)}</span>
                <span>changed from</span>
                <code className="px-1.5 py-0.5 bg-[var(--surf3)] rounded font-mono text-[10px] text-rose-500 line-through">{ch.old}</code>
                <span>to</span>
                <code className="px-1.5 py-0.5 bg-[var(--surf3)] rounded font-mono text-[10px] text-emerald-500 font-semibold">{ch.new}</code>
              </div>
            ))}
          </div>
        );
      }
    }

    const displayData = event === 'deleted' ? old : attributes;
    const items = Object.entries(displayData)
      .filter(([key]) => !excludeKeys.includes(key) && displayData[key] !== null)
      .map(([key, val]) => ({
        key,
        value: formatVal(val)
      }));

    if (items.length > 0) {
      return (
        <div className="mt-2 text-[11px] bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3 text-[var(--tx2)]">
          <div className="font-semibold text-[var(--tx)] text-[11.5px] border-b border-[var(--b)] pb-1.5 mb-1.5">
            {event === 'deleted' ? 'Deleted Record Details' : 'Record Details'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            {items.map(item => (
              <div key={item.key} className="flex justify-between sm:justify-start gap-2 border-b border-[var(--b)]/40 pb-1 last:border-0">
                <span className="font-bold text-[var(--tx)] min-w-[120px]">{formatKey(item.key)}:</span>
                <span className="text-[var(--tx2)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  const renderDevice = (ua: string) => {
    if (!ua) return 'Unknown Device';
    if (ua.includes('Edg/')) return 'Edge Browser';
    if (ua.includes('Chrome/')) return 'Chrome Browser';
    if (ua.includes('Safari/') && ua.includes('Version/')) return 'Safari Browser';
    if (ua.includes('Firefox/')) return 'Firefox Browser';
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) return 'Mobile Device';
    return 'Web Browser';
  };

  const details = [];
  if (properties.ip_address) details.push({ label: 'IP Address', value: properties.ip_address });
  if (properties.user_agent) details.push({ label: 'Device', value: renderDevice(properties.user_agent) });
  if (properties.method && properties.path) details.push({ label: 'API Route', value: `${properties.method} ${properties.path}` });
  if (properties.status_code) details.push({ label: 'HTTP Status', value: String(properties.status_code) });
  if (properties.input_keys && Array.isArray(properties.input_keys) && properties.input_keys.length > 0) {
    details.push({ label: 'Parameters Modified', value: properties.input_keys.map(formatKey).join(', ') });
  }

  const standardKeys = ['ip_address', 'user_agent', 'method', 'path', 'status_code', 'url', 'input_keys'];
  Object.entries(properties).forEach(([key, val]) => {
    if (!standardKeys.includes(key) && val !== null && val !== undefined) {
      details.push({ label: formatKey(key), value: formatVal(val) });
    }
  });

  if (details.length > 0) {
    return (
      <div className="mt-2 text-[11px] bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3 text-[var(--tx2)]">
        <div className="font-semibold text-[var(--tx)] text-[11.5px] border-b border-[var(--b)] pb-1.5 mb-1.5">Activity Details</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {details.map(d => (
            <div key={d.label} className="flex justify-between sm:justify-start gap-2 border-b border-[var(--b)]/40 pb-1 last:border-0">
              <span className="font-bold text-[var(--tx)] min-w-[120px]">{d.label}:</span>
              <span className="text-[var(--tx2)] font-mono">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
