import { useState } from 'react';
import { Plus, X, Calendar, Clock, Users, CheckCircle, Bell } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

interface Meeting {
  id: string;
  title: string;
  class: string;
  date: string;
  time: string;
  venue: string;
  invitedCount: number;
  confirmedCount: number;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notificationSent: boolean;
}

const MEETINGS: Meeting[] = [
  { id: '1', title: 'Class 10 Board Exam Parent Meeting', class: '10A', date: '2026-06-15', time: '10:00 AM', venue: 'School Auditorium', invitedCount: 48, confirmedCount: 32, status: 'Scheduled', notificationSent: true },
  { id: '2', title: 'Mid-Term Progress Discussion', class: 'All Classes', date: '2026-06-20', time: '9:00 AM', venue: 'Respective Classrooms', invitedCount: 284, confirmedCount: 0, status: 'Scheduled', notificationSent: false },
  { id: '3', title: 'Class 8 Weak Students Meeting', class: '8A, 8B', date: '2026-05-25', time: '11:00 AM', venue: 'Conference Room', invitedCount: 15, confirmedCount: 13, status: 'Completed', notificationSent: true },
  { id: '4', title: 'Annual Day Planning Meeting', class: 'All Classes', date: '2026-05-10', time: '2:00 PM', venue: 'School Auditorium', invitedCount: 284, confirmedCount: 201, status: 'Completed', notificationSent: true },
  { id: '5', title: 'Fee Defaulters Parent Meeting', class: 'Multiple', date: '2026-06-28', time: '3:00 PM', venue: 'Principal\'s Office', invitedCount: 18, confirmedCount: 0, status: 'Scheduled', notificationSent: false },
];

export function Meetings() {
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  const upcoming = MEETINGS.filter((m) => m.status === 'Scheduled');
  const completed = MEETINGS.filter((m) => m.status === 'Completed');
  const totalInvited = MEETINGS.reduce((s, m) => s + m.invitedCount, 0);

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label="Upcoming Meetings" value={upcoming.length} sub="This month" icon={<Calendar size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Completed" value={completed.length} sub="This term" icon={<CheckCircle size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Total Parents Invited" value={totalInvited} sub="Across all meetings" icon={<Users size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
        <KPICard label="Notifications Sent" value={MEETINGS.filter((m) => m.notificationSent).length} sub="Via WhatsApp" icon={<Bell size={15} />} iconBg="var(--green-bg)" iconColor="var(--green-tx)" />
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="text-[13px] font-semibold text-[var(--tx)]">Parent Meeting Management</div>
          <button onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90 w-full sm:w-auto">
            <Plus size={12} /> Schedule Meeting
          </button>
        </div>

        <div className="flex border-b border-[var(--b)] mb-4 overflow-x-auto whitespace-nowrap scrollbar-none">
          {(['upcoming', 'completed'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-[12px] border-b-2 -mb-px capitalize cursor-pointer flex-shrink-0 ${activeTab === tab ? 'text-[var(--blue-tx)] border-[var(--blue)] font-semibold' : 'text-[var(--tx3)] border-transparent'}`}>
              {tab} ({tab === 'upcoming' ? upcoming.length : completed.length})
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {(activeTab === 'upcoming' ? upcoming : completed).map((meeting) => (
            <div key={meeting.id} className="p-4 bg-[var(--surf2)] border border-[var(--b)] rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                <div>
                  <div className="text-[13px] font-bold text-[var(--tx)] mb-1">{meeting.title}</div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--tx3)]">
                    <span className="flex items-center gap-1"><Calendar size={11} />{meeting.date}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{meeting.time}</span>
                    <span>Venue: {meeting.venue}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {meeting.status === 'Scheduled' && <Badge variant="blue">Scheduled</Badge>}
                  {meeting.status === 'Completed' && <Badge variant="teal">Completed</Badge>}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-[var(--b)] sm:border-t-0 sm:pt-0">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px]">
                  <span className="flex items-center gap-1 text-[var(--tx3)]">
                    <Users size={11} />
                    <span className="font-medium text-[var(--tx)]">{meeting.invitedCount}</span> invited
                  </span>
                  {meeting.confirmedCount > 0 && (
                    <span className="flex items-center gap-1 text-[var(--teal-tx)]">
                      <CheckCircle size={11} />
                      <span className="font-medium">{meeting.confirmedCount}</span> confirmed
                    </span>
                  )}
                  <span className="text-[var(--tx3)]">Class: {meeting.class}</span>
                </div>
                <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                  {!meeting.notificationSent && meeting.status === 'Scheduled' && (
                    <button className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] bg-[var(--teal-bg)] text-[var(--teal-tx)] rounded-lg cursor-pointer font-medium flex-1 sm:flex-initial">
                      <Bell size={10} /> Send Invite
                    </button>
                  )}
                  {meeting.notificationSent && (
                    <span className="flex items-center gap-1 text-[11px] text-[var(--teal-tx)]">
                      <CheckCircle size={11} /> Notified
                    </span>
                  )}
                  {meeting.status === 'Scheduled' && (
                    <button className="px-2.5 py-1.5 text-[11px] border border-[var(--b)] bg-[var(--surf)] rounded-lg cursor-pointer hover:bg-[var(--surf3)] flex-1 sm:flex-initial text-center">Edit</button>
                  )}
                </div>
              </div>

              {meeting.confirmedCount > 0 && meeting.invitedCount > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-[10.5px] text-[var(--tx3)] mb-1">
                    <span>Attendance confirmation</span>
                    <span>{Math.round((meeting.confirmedCount / meeting.invitedCount) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-[var(--surf)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--teal)] rounded-full" style={{ width: `${(meeting.confirmedCount / meeting.invitedCount) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
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
                <input className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="e.g. Mid-Term Progress Discussion" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class *</label>
                  <select className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                    <option>All Classes</option>
                    {['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A'].map((c) => <option key={c}>Class {c}</option>)}
                  </select>
                </div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Venue</label>
                  <input className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="School Auditorium" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Date *</label>
                  <input type="date" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Time *</label>
                  <input type="time" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
              </div>
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Agenda / Notes</label>
                <textarea className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none resize-none focus:border-[var(--blue)]" rows={2} placeholder="Meeting agenda..." />
              </div>
              <div className="flex items-center gap-2 p-3 bg-[var(--teal-bg)] rounded-xl">
                <Bell size={13} className="text-[var(--teal-tx)] flex-shrink-0" />
                <span className="text-[11.5px] text-[var(--teal-tx)]">WhatsApp invitations will be sent to all parents immediately</span>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer">Schedule & Notify</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
