import { BookOpen, Send, Clock, MessageCircle, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

const ALL_DIARY_ENTRIES = [
  { cls: 'Class 6A', teacher: 'Mr. Venkat Rao', time: '8:30 AM', topics: 'Parts of speech, Nouns · Plants and their parts', homework: 'Grammar ex. pg 18 · Draw a plant diagram', notes: '', status: 'sent' as const, parents: 38 },
  { cls: 'Class 6B', teacher: 'Mrs. Suma Reddy', time: '9:10 AM', topics: 'English grammar, EVS plants', homework: 'Read chapter 4', notes: 'Parent-teacher meeting next Friday', status: 'sent' as const, parents: 32 },
  { cls: 'Class 7A', teacher: 'Mr. Raju Sharma', time: '9:30 AM', topics: 'Fractions — addition, subtraction · Water and its properties', homework: 'Maths pg 42 Ex 3 · Science Q&A pg 58', notes: '', status: 'sent' as const, parents: 40 },
  { cls: 'Class 7B', teacher: 'Mrs. Savitha Kumar', time: '8:45 AM', topics: 'Simple and compound sentences · History of India Ch 3', homework: 'Write 5 compound sentences · Learn dates', notes: '', status: 'sent' as const, parents: 36 },
  { cls: 'Class 8A', teacher: 'Mrs. Lakshmi Devi', time: '8:45 AM', topics: 'Fractions, Water cycle', homework: 'Maths pg 56 · Diagram of water cycle', notes: '', status: 'sent' as const, parents: 38 },
  { cls: 'Class 8B', teacher: 'Mrs. Lakshmi Devi', time: '9:20 AM', topics: 'Linear equations · Photosynthesis', homework: 'Solve 10 equations', notes: '', status: 'sent' as const, parents: 34 },
  { cls: 'Class 9A', teacher: 'Mrs. Lakshmi Devi', time: '10:00 AM', topics: 'Quadratic equations — factoring method', homework: 'Ex 4.2 Q1–10', notes: '', status: 'sent' as const, parents: 42 },
  { cls: 'Class 9B', teacher: 'Reminder sent to teacher', time: '', topics: 'Not yet updated for today', homework: '', notes: '', status: 'pending' as const, parents: 0 },
  { cls: 'Class 10A', teacher: 'Reminder sent to teacher', time: '', topics: 'Not yet updated for today', homework: '', notes: '', status: 'pending' as const, parents: 0 },
];

const recentEntries = [
  { cls: 'Class 8A', topics: 'Fractions, Water cycle', teacher: 'Mrs. Lakshmi', time: '8:45 AM', sent: 38, status: 'sent' as const },
  { cls: 'Class 6B', topics: 'English grammar, EVS plants', teacher: 'Mr. Venkat', time: '9:10 AM', sent: 32, status: 'sent' as const },
  { cls: 'Class 9B', topics: 'Not yet updated for today', teacher: 'Reminder sent to teacher', time: '', sent: 0, status: 'pending' as const },
];

function AdminDiaryView() {
  const sent = ALL_DIARY_ENTRIES.filter((e) => e.status === 'sent').length;
  const pending = ALL_DIARY_ENTRIES.filter((e) => e.status === 'pending').length;

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        <KPICard label="Diaries Submitted" value={sent} sub={`Out of ${ALL_DIARY_ENTRIES.length} classes`} icon={<BookOpen size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Messages Delivered" value="847" sub="WhatsApp + SMS" icon={<Send size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Pending" value={pending} sub="Classes not yet updated" icon={<Clock size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[13px] font-semibold text-[var(--tx)]">Today's Diary Submissions</div>
          <div className="flex items-center gap-2 text-[11.5px] text-[var(--tx3)]">
            <Eye size={13} />
            <span>Read-only preview · June 5, 2026</span>
          </div>
        </div>

        <div className="space-y-2">
          {ALL_DIARY_ENTRIES.map((entry, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl border ${
                entry.status === 'pending'
                  ? 'border-[var(--amber)] bg-[var(--amber-bg)]/40'
                  : 'border-[var(--b)] bg-[var(--surf2)]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[12.5px] font-bold text-[var(--tx)]">{entry.cls}</span>
                    {entry.status === 'sent' ? (
                      <Badge variant="teal">
                        <CheckCircle2 size={9} className="inline mr-0.5" />Submitted
                      </Badge>
                    ) : (
                      <Badge variant="amber">
                        <AlertCircle size={9} className="inline mr-0.5" />Pending
                      </Badge>
                    )}
                  </div>

                  {entry.status === 'sent' ? (
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <span className="text-[10.5px] font-semibold text-[var(--tx3)] w-20 flex-shrink-0">Topics:</span>
                        <span className="text-[11.5px] text-[var(--tx)]">{entry.topics}</span>
                      </div>
                      {entry.homework && (
                        <div className="flex gap-2">
                          <span className="text-[10.5px] font-semibold text-[var(--tx3)] w-20 flex-shrink-0">Homework:</span>
                          <span className="text-[11.5px] text-[var(--tx)]">{entry.homework}</span>
                        </div>
                      )}
                      {entry.notes && (
                        <div className="flex gap-2">
                          <span className="text-[10.5px] font-semibold text-[var(--tx3)] w-20 flex-shrink-0">Notes:</span>
                          <span className="text-[11.5px] text-[var(--amber-tx)]">{entry.notes}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11.5px] text-[var(--amber-tx)]">Diary not submitted for today</div>
                  )}
                </div>

                <div className="text-left sm:text-right flex-shrink-0 space-y-1">
                  <div className="text-[12px] font-medium text-[var(--tx2)]">{entry.teacher}</div>
                  {entry.time && (
                    <div className="text-[10.5px] text-[var(--tx3)]">{entry.time}</div>
                  )}
                  {entry.parents > 0 && (
                    <div className="flex items-center gap-1 text-[10.5px] text-[var(--teal-tx)] justify-start sm:justify-end">
                      <MessageCircle size={9} /> {entry.parents} sent
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TeacherDiaryView() {
  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        <KPICard label="Diaries Sent Today" value="9" sub="Out of 12 classes" icon={<BookOpen size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Messages Delivered" value="847" sub="WhatsApp + SMS" icon={<Send size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Pending" value="3" sub="Classes not yet updated" icon={<Clock size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* New Entry Form */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12.5px] font-semibold text-[var(--tx)]">New Diary Entry</div>
            <Badge variant="blue">Teacher View</Badge>
          </div>

          <div className="flex gap-2 mb-3">
            <select className="flex-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx)] cursor-pointer">
              <option>Class 8A</option>
              <option>Class 8B</option>
              <option>Class 9A</option>
            </select>
            <div className="flex-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx3)]">
              05 Jun 2026
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-[11px] text-[var(--tx3)] mb-1.5">Today's Topics</label>
            <textarea
              className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx3)] resize-none focus:outline-none focus:border-[var(--blue)]"
              rows={2}
              placeholder="Fractions — Ch 4 · Water cycle — Ch 6..."
            />
          </div>

          <div className="mb-3">
            <label className="block text-[11px] text-[var(--tx3)] mb-1.5">Homework</label>
            <textarea
              className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx3)] resize-none focus:outline-none focus:border-[var(--blue)]"
              rows={2}
              placeholder="Maths pg 42 Ex 3 · Science Q&A pg 58..."
            />
          </div>

          <div className="mb-3">
            <label className="block text-[11px] text-[var(--tx3)] mb-1.5">Special Notes (optional)</label>
            <input
              type="text"
              className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx3)] focus:outline-none focus:border-[var(--blue)]"
              placeholder="PTM next Friday..."
            />
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-[var(--teal-bg)] rounded-lg mb-3">
            <MessageCircle size={15} className="text-[var(--teal-tx)] flex-shrink-0" />
            <span className="text-[11.5px] text-[var(--teal-tx)]">
              Will be sent to all 38 parents of Class 8A via WhatsApp + SMS on save
            </span>
          </div>

          <button className="w-full flex items-center justify-center gap-1.5 bg-[var(--blue)] text-white rounded-lg py-2 text-[12px] font-medium hover:opacity-90 transition-opacity cursor-pointer">
            <Send size={13} /> Save & Send Diary
          </button>
        </Card>

        {/* Recent entries */}
        <Card>
          <CardHeader
            title="Recent Entries"
            action={<button className="text-[11px] text-[var(--blue-tx)] hover:underline cursor-pointer">View all</button>}
          />
          <div className="space-y-2">
            {recentEntries.map((entry, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border ${
                  entry.status === 'pending'
                    ? 'border-[var(--amber-bg)] bg-[var(--amber-bg)]/30'
                    : 'border-[var(--b)] bg-[var(--surf2)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-semibold text-[var(--tx)]">{entry.cls}</span>
                  {entry.status === 'sent' ? <Badge variant="teal">Sent</Badge> : <Badge variant="amber">Pending</Badge>}
                </div>
                <div className="text-[11.5px] text-[var(--tx2)] mb-1">
                  {entry.status === 'sent' ? `Topics: ${entry.topics}` : entry.topics}
                </div>
                <div className="text-[11px] text-[var(--tx3)]">
                  {entry.status === 'sent' ? `${entry.teacher} · ${entry.time} · ${entry.sent} sent` : entry.teacher}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function DailyDiary() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <AdminDiaryView /> : <TeacherDiaryView />;
}
