import { useState, useEffect } from 'react';
import { Plus, X, Calendar, Clock, Users, CheckCircle, Trash2 } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';

interface Meeting {
  id: string;
  title: string;
  class: string;
  date: string;
  time: string;
  venue: string;
  agenda?: string;
  createdBy?: string;
}

const STORAGE_KEY = 'kts_parent_meetings';

function loadMeetings(): Meeting[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function Meetings() {
  const { user } = useAuth();
  const { confirm } = useDialog();
  const isAdmin = user?.role === 'admin';

  const [meetings, setMeetings] = useState<Meeting[]>(loadMeetings);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  const [fTitle, setFTitle] = useState('');
  const [fClass, setFClass] = useState('All Classes');
  const [fVenue, setFVenue] = useState('');
  const [fDate, setFDate] = useState('');
  const [fTime, setFTime] = useState('');
  const [fAgenda, setFAgenda] = useState('');

  // Pick up cross-user updates delivered by the background settings sync
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setMeetings(loadMeetings());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const persist = (next: Meeting[]) => {
    setMeetings(next);
    // localStorage.setItem is monkey-patched (utils/storage.ts) to sync this
    // key to the backend settings table for all users.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = meetings.filter((m) => m.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
  const completed = meetings.filter((m) => m.date < todayStr).sort((a, b) => b.date.localeCompare(a.date));

  const resetForm = () => {
    setFTitle(''); setFClass('All Classes'); setFVenue(''); setFDate(''); setFTime(''); setFAgenda('');
  };

  const handleCreate = () => {
    if (!fTitle.trim() || !fDate || !fTime) return;
    persist([
      {
        id: String(Date.now()),
        title: fTitle.trim(),
        class: fClass,
        venue: fVenue.trim() || 'School Campus',
        date: fDate,
        time: fTime,
        agenda: fAgenda.trim(),
        createdBy: user?.name,
      },
      ...meetings,
    ]);
    resetForm();
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm('Delete this meeting?', 'Delete Meeting');
    if (ok) persist(meetings.filter((m) => m.id !== id));
  };

  const list = activeTab === 'upcoming' ? upcoming : completed;

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        <KPICard label="Upcoming Meetings" value={upcoming.length} sub="Scheduled" icon={<Calendar size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Completed" value={completed.length} sub="Past meetings" icon={<CheckCircle size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Total Meetings" value={meetings.length} sub="All time" icon={<Users size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="text-[13px] font-semibold text-[var(--tx)]">Parent Meeting Management</div>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90 w-full sm:w-auto">
              <Plus size={12} /> Schedule Meeting
            </button>
          )}
        </div>

        <div className="flex border-b border-[var(--b)] mb-4 overflow-x-auto whitespace-nowrap scrollbar-none">
          {(['upcoming', 'completed'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-[12px] border-b-2 -mb-px capitalize cursor-pointer flex-shrink-0 ${activeTab === tab ? 'text-[var(--blue-tx)] border-[var(--blue)] font-semibold' : 'text-[var(--tx3)] border-transparent'}`}>
              {tab} ({tab === 'upcoming' ? upcoming.length : completed.length})
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <EmptyState
            title={activeTab === 'upcoming' ? 'No upcoming meetings' : 'No completed meetings'}
            description={
              activeTab === 'upcoming'
                ? isAdmin
                  ? 'Schedule a parent meeting to see it here for all staff.'
                  : 'Meetings scheduled by the administration will appear here.'
                : 'Past meetings will appear here after their date has passed.'
            }
            icon={<Calendar size={20} />}
            actionLabel={activeTab === 'upcoming' && isAdmin ? 'Schedule Meeting' : undefined}
            onAction={activeTab === 'upcoming' && isAdmin ? () => setShowCreate(true) : undefined}
          />
        ) : (
          <div className="space-y-3">
            {list.map((meeting) => (
              <div key={meeting.id} className="p-4 bg-[var(--surf2)] border border-[var(--b)] rounded-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-[13px] font-bold text-[var(--tx)] mb-1">{meeting.title}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--tx3)]">
                      <span className="flex items-center gap-1"><Calendar size={11} />{meeting.date}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{meeting.time}</span>
                      <span>Venue: {meeting.venue}</span>
                      <span>Class: {meeting.class}</span>
                    </div>
                    {meeting.agenda && (
                      <div className="text-[11.5px] text-[var(--tx2)] mt-1.5">{meeting.agenda}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {activeTab === 'upcoming' ? <Badge variant="blue">Scheduled</Badge> : <Badge variant="teal">Completed</Badge>}
                    {isAdmin && (
                      <button onClick={() => handleDelete(meeting.id)} className="p-1.5 rounded-lg text-[var(--red-tx)] hover:bg-[var(--red-bg)] cursor-pointer" title="Delete meeting">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Schedule Meeting Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[460px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div className="text-[14px] font-bold text-[var(--tx)]">Schedule Meeting</div>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Meeting Title *</label>
                <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="e.g. Mid-Term Progress Discussion" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class *</label>
                  <select value={fClass} onChange={(e) => setFClass(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                    <option>All Classes</option>
                    {['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B'].map((c) => <option key={c}>Class {c}</option>)}
                  </select>
                </div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Venue</label>
                  <input value={fVenue} onChange={(e) => setFVenue(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="School Auditorium" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Date *</label>
                  <input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Time *</label>
                  <input type="time" value={fTime} onChange={(e) => setFTime(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Agenda / Notes</label>
                <textarea value={fAgenda} onChange={(e) => setFAgenda(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none resize-none focus:border-[var(--blue)]" rows={2} placeholder="Meeting agenda..." />
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={!fTitle.trim() || !fDate || !fTime}
                className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
