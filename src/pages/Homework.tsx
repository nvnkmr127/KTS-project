import { useState, useEffect } from 'react';
import { Plus, X, BookOpen, Clock, CheckCircle, Paperclip, Loader2, Trash2 } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatDate } from '../utils/date';

interface HomeworkEntry {
  id?: string;
  batch_name: string;
  subject: string;
  title: string;
  description: string;
  due_date: string;
  assigned_date: string;
  has_attachment: boolean;
  submissions_received: number;
  total_students: number;
}

const DEFAULT_CLASSES = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B'];

/* ── Admin View ── */
function AdminHomeworkView() {
  const [entries, setEntries] = useState<HomeworkEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [fClass, setFClass] = useState(DEFAULT_CLASSES[0]);
  const [fSubject, setFSubject] = useState('');
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fDue, setFDue] = useState('');

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await api.getResources('homework');
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading homework:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEntries(); }, []);

  const handleCreate = async () => {
    if (!fTitle || !fSubject || !fDue) return;
    setSubmitting(true);
    try {
      await api.createResource('homework', {
        batch_name: fClass,
        subject: fSubject,
        title: fTitle,
        description: fDesc,
        due_date: fDue,
        assigned_date: new Date().toISOString().slice(0, 10),
        has_attachment: false,
        submissions_received: 0,
        total_students: 35,
      });
      setFTitle(''); setFSubject(''); setFDesc(''); setFDue('');
      setShowCreate(false);
      loadEntries();
    } catch (err) {
      console.error('Error creating homework:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this homework assignment?')) return;
    try {
      await api.deleteResource('homework', id);
      loadEntries();
    } catch (err) {
      console.error('Error deleting homework:', err);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const total = entries.reduce((s, h) => s + (h.submissions_received || 0), 0);
  const totalStudents = entries.reduce((s, h) => s + (h.total_students || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label="Assignments Posted" value={entries.length} sub="Total" icon={<BookOpen size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Submissions" value={total} sub={`of ${totalStudents} total`} icon={<CheckCircle size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Pending Submission" value={Math.max(0, totalStudents - total)} sub="Students pending" icon={<Clock size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
        <KPICard label="Due Today" value={entries.filter((h) => h.due_date === todayStr).length} sub="Assignments" icon={<Clock size={15} />} iconBg="var(--red-bg)" iconColor="var(--red-tx)" />
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="text-[13px] font-semibold text-[var(--tx)] flex items-center gap-2">
            Homework Assignments {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90 w-full sm:w-auto">
            <Plus size={12} /> Create Homework
          </button>
        </div>

        {entries.length === 0 && !loading && (
          <div className="text-center py-10 text-[12px] text-[var(--tx3)]">
            No homework assignments yet. Click "Create Homework" to add one.
          </div>
        )}

        <div className="space-y-3">
          {entries.map((hw) => (
            <div key={hw.id} className="p-4 bg-[var(--surf2)] border border-[var(--b)] rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-bold text-[var(--tx)]">{hw.title}</span>
                    {hw.has_attachment && (
                      <span className="flex items-center gap-0.5 text-[10.5px] text-[var(--tx3)]"><Paperclip size={10} /> Attachment</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--tx3)]">
                    <Badge variant="blue">{hw.subject}</Badge>
                    <span>Class {hw.batch_name}</span>
                    <span>Due: {formatDate(hw.due_date)}</span>
                    <span>Assigned: {formatDate(hw.assigned_date)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left sm:text-right">
                    <div className="text-[12px] font-semibold text-[var(--tx)]">{hw.submissions_received}/{hw.total_students} <span className="sm:hidden text-[10.5px] font-normal text-[var(--tx3)]">submissions</span></div>
                    <div className="hidden sm:block text-[10.5px] text-[var(--tx3)]">submissions</div>
                  </div>
                  <button onClick={() => handleDelete(String(hw.id))} className="p-1.5 rounded-lg hover:bg-[var(--red-bg)] text-[var(--tx3)] hover:text-[var(--red-tx)] cursor-pointer transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="text-[12px] text-[var(--tx2)] mb-3">{hw.description}</div>
              <div className="h-1.5 bg-[var(--surf)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${hw.total_students > 0 ? (hw.submissions_received / hw.total_students) * 100 : 0}%`,
                    background: hw.submissions_received === hw.total_students ? 'var(--teal)' : 'var(--blue)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[460px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div className="text-[14px] font-bold text-[var(--tx)]">Create Homework</div>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class *</label>
                  <select value={fClass} onChange={(e) => setFClass(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]">
                    {DEFAULT_CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Subject *</label>
                  <input value={fSubject} onChange={(e) => setFSubject(e.target.value)} placeholder="e.g. Mathematics" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Title *</label>
                <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="e.g. Exercise 3 — Fractions" />
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Description</label>
                <textarea value={fDesc} onChange={(e) => setFDesc(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none resize-none focus:border-[var(--blue)]" rows={3} placeholder="Homework instructions..." />
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Due Date *</label>
                <input type="date" value={fDue} onChange={(e) => setFDue(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button onClick={handleCreate} disabled={submitting || !fTitle || !fSubject || !fDue} className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer disabled:opacity-50">
                {submitting ? 'Posting...' : 'Post Homework'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Teacher View ── */
function TeacherHomeworkView() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<HomeworkEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const teacherClasses = user?.classes ?? [];

  // form state
  const [fClass, setFClass] = useState('');
  const [fSubject, setFSubject] = useState(user?.subject || '');
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fDue, setFDue] = useState('');

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await api.getResources('homework');
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading homework:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
    if (teacherClasses.length > 0 && !fClass) {
      setFClass(teacherClasses[0]);
    }
  }, [user]);

  const handleCreate = async () => {
    if (!fTitle || !fSubject || !fDue || !fClass) return;
    setSubmitting(true);
    try {
      await api.createResource('homework', {
        batch_name: fClass,
        subject: fSubject,
        title: fTitle,
        description: fDesc,
        due_date: fDue,
        assigned_date: new Date().toISOString().slice(0, 10),
        has_attachment: false,
        submissions_received: 0,
        total_students: 35,
      });
      setFTitle(''); setFDesc(''); setFDue('');
      setShowCreate(false);
      loadEntries();
    } catch (err) {
      console.error('Error creating homework:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Show only homework for teacher's assigned classes
  const myEntries = entries.filter((e) => teacherClasses.includes(e.batch_name));
  const todayStr = new Date().toISOString().slice(0, 10);
  const total = myEntries.reduce((s, h) => s + (h.submissions_received || 0), 0);
  const totalStudents = myEntries.reduce((s, h) => s + (h.total_students || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label="My Assignments" value={myEntries.length} sub="Posted by me" icon={<BookOpen size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Submissions" value={total} sub={`of ${totalStudents} total`} icon={<CheckCircle size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Pending" value={Math.max(0, totalStudents - total)} sub="Students pending" icon={<Clock size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
        <KPICard label="Due Today" value={myEntries.filter((h) => h.due_date === todayStr).length} sub="Assignments" icon={<Clock size={15} />} iconBg="var(--red-bg)" iconColor="var(--red-tx)" />
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="text-[13px] font-semibold text-[var(--tx)] flex items-center gap-2">
            My Homework Assignments {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90 w-full sm:w-auto">
            <Plus size={12} /> Create Homework
          </button>
        </div>

        {myEntries.length === 0 && !loading && (
          <div className="text-center py-10 text-[12px] text-[var(--tx3)]">
            No homework assignments for your classes yet.
          </div>
        )}

        <div className="space-y-3">
          {myEntries.map((hw) => (
            <div key={hw.id} className="p-4 bg-[var(--surf2)] border border-[var(--b)] rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-bold text-[var(--tx)]">{hw.title}</span>
                    {hw.has_attachment && (
                      <span className="flex items-center gap-0.5 text-[10.5px] text-[var(--tx3)]"><Paperclip size={10} /> Attachment</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--tx3)]">
                    <Badge variant="blue">{hw.subject}</Badge>
                    <span>Class {hw.batch_name}</span>
                    <span>Due: {formatDate(hw.due_date)}</span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-[12px] font-semibold text-[var(--tx)]">{hw.submissions_received}/{hw.total_students}</div>
                  <div className="text-[10.5px] text-[var(--tx3)]">submissions</div>
                </div>
              </div>
              <div className="text-[12px] text-[var(--tx2)] mb-3">{hw.description}</div>
              <div className="h-1.5 bg-[var(--surf)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${hw.total_students > 0 ? (hw.submissions_received / hw.total_students) * 100 : 0}%`,
                    background: hw.submissions_received === hw.total_students ? 'var(--teal)' : 'var(--blue)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[460px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div className="text-[14px] font-bold text-[var(--tx)]">Create Homework</div>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class *</label>
                  <select value={fClass} onChange={(e) => setFClass(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]">
                    {teacherClasses.map((c) => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Subject *</label>
                  <input value={fSubject} onChange={(e) => setFSubject(e.target.value)} placeholder="e.g. Mathematics" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Title *</label>
                <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="e.g. Exercise 3 — Fractions" />
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Description</label>
                <textarea value={fDesc} onChange={(e) => setFDesc(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none resize-none focus:border-[var(--blue)]" rows={3} placeholder="Homework instructions..." />
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Due Date *</label>
                <input type="date" value={fDue} onChange={(e) => setFDue(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button onClick={handleCreate} disabled={submitting || !fTitle || !fSubject || !fDue} className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer disabled:opacity-50">
                {submitting ? 'Posting...' : 'Post Homework'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Homework() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <AdminHomeworkView /> : <TeacherHomeworkView />;
}
