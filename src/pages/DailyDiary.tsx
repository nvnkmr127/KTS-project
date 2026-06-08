import { useState, useEffect } from 'react';
import { BookOpen, Send, Clock, MessageCircle, Eye, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface DiaryEntry {
  id?: string;
  batch_name: string;
  teacher_name: string;
  topics: string;
  homework: string;
  notes: string;
  diary_date: string;
  parents_count: number;
}

const DEFAULT_CLASSES = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B'];

function AdminDiaryView() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await api.getResources('daily-diaries');
      setEntries(data);
    } catch (err) {
      console.error('Error loading diary entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntries = entries.filter((e) => e.diary_date === todayStr);

  // Map default classes to submission status
  const submissionList = DEFAULT_CLASSES.map((clsName) => {
    const entry = todayEntries.find((e) => e.batch_name === clsName);
    if (entry) {
      return {
        cls: `Class ${clsName}`,
        teacher: entry.teacher_name,
        time: 'Today',
        topics: entry.topics,
        homework: entry.homework,
        notes: entry.notes,
        status: 'sent' as const,
        parents: entry.parents_count,
      };
    } else {
      return {
        cls: `Class ${clsName}`,
        teacher: 'Pending update',
        time: '',
        topics: 'Not yet updated for today',
        homework: '',
        notes: '',
        status: 'pending' as const,
        parents: 0,
      };
    }
  });

  const sentCount = submissionList.filter((s) => s.status === 'sent').length;
  const pendingCount = submissionList.filter((s) => s.status === 'pending').length;
  const totalParents = submissionList.reduce((sum, s) => sum + s.parents, 0);

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        <KPICard label="Diaries Submitted" value={sentCount} sub={`Out of ${DEFAULT_CLASSES.length} classes`} icon={<BookOpen size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Messages Delivered" value={totalParents} sub="WhatsApp + SMS" icon={<Send size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Pending" value={pendingCount} sub="Classes not yet updated" icon={<Clock size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[13px] font-semibold text-[var(--tx)] flex items-center gap-2">
            Today's Diary Submissions {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
          </div>
          <div className="flex items-center gap-2 text-[11.5px] text-[var(--tx3)]">
            <Eye size={13} />
            <span>Live Sync · {todayStr}</span>
          </div>
        </div>

        <div className="space-y-2">
          {submissionList.map((entry, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl border ${
                entry.status === 'pending'
                  ? 'border-[var(--b)] opacity-60 bg-[var(--surf2)]/40'
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
                    <div className="text-[11.5px] text-[var(--tx3)]">Diary not submitted for today</div>
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
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [selectedClass, setSelectedClass] = useState('');
  const [topics, setTopics] = useState('');
  const [homework, setHomework] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await api.getResources('daily-diaries');
      setEntries(data);
    } catch (err) {
      console.error('Error loading diary entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
    if (user?.classes && user.classes.length > 0) {
      setSelectedClass(user.classes[0]);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !topics) return;
    setSubmitting(true);
    try {
      await api.createResource('daily-diaries', {
        batch_name: selectedClass,
        teacher_name: user?.name || 'Staff Member',
        topics,
        homework,
        notes,
        diary_date: new Date().toISOString().slice(0, 10),
        parents_count: 35, // Mock parent count
      });
      setTopics('');
      setHomework('');
      setNotes('');
      loadEntries();
    } catch (err) {
      console.error('Error saving diary:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const teacherClasses = user?.classes ?? [];
  const myRecent = entries.filter((e) => teacherClasses.includes(e.batch_name)).slice(0, 5);

  const sentCount = entries.filter((e) => e.diary_date === todayStr && teacherClasses.includes(e.batch_name)).length;
  const pendingCount = Math.max(0, teacherClasses.length - sentCount);
  const totalDelivered = entries.filter((e) => e.diary_date === todayStr && teacherClasses.includes(e.batch_name)).reduce((sum, e) => sum + e.parents_count, 0);

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        <KPICard label="My Diaries Sent Today" value={sentCount} sub={`Out of ${teacherClasses.length} assigned`} icon={<BookOpen size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Messages Delivered" value={totalDelivered} sub="WhatsApp + SMS" icon={<Send size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="My Pending Classes" value={pendingCount} sub="Awaiting updates" icon={<Clock size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* New Entry Form */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12.5px] font-semibold text-[var(--tx)]">New Diary Entry</div>
            <Badge variant="blue">Teacher Portal</Badge>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 mb-3">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                required
                className="flex-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx)] cursor-pointer outline-none"
              >
                <option value="">Select Class</option>
                {teacherClasses.map((cls) => (
                  <option key={cls} value={cls}>Class {cls}</option>
                ))}
              </select>
              <div className="flex-1 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx3)] text-center">
                {todayStr}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-[11px] text-[var(--tx3)] mb-1.5">Today's Topics *</label>
              <textarea
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                required
                className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx)] resize-none focus:outline-none focus:border-[var(--blue)]"
                rows={2}
                placeholder="Linear equations Ch 3, Water cycle..."
              />
            </div>

            <div className="mb-3">
              <label className="block text-[11px] text-[var(--tx3)] mb-1.5">Homework</label>
              <textarea
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx)] resize-none focus:outline-none focus:border-[var(--blue)]"
                rows={2}
                placeholder="Maths pg 56 Ex 4 · Draw diagram..."
              />
            </div>

            <div className="mb-3">
              <label className="block text-[11px] text-[var(--tx3)] mb-1.5">Special Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx)] focus:outline-none focus:border-[var(--blue)]"
                placeholder="Reminder: submission due tomorrow..."
              />
            </div>

            {selectedClass && (
              <div className="flex items-center gap-2 p-2.5 bg-[var(--teal-bg)] rounded-lg mb-3">
                <MessageCircle size={15} className="text-[var(--teal-tx)] flex-shrink-0" />
                <span className="text-[11.5px] text-[var(--teal-tx)]">
                  Will be sent to all parents of Class {selectedClass} via WhatsApp + SMS on save
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedClass || !topics}
              className="w-full flex items-center justify-center gap-1.5 bg-[var(--blue)] text-white rounded-lg py-2 text-[12px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer animate-none"
            >
              <Send size={13} /> {submitting ? 'Sending...' : 'Save & Send Diary'}
            </button>
          </form>
        </Card>

        {/* Recent entries */}
        <Card>
          <CardHeader
            title="My Recent Submissions"
            icon={loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
          />
          <div className="space-y-2">
            {myRecent.map((entry, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-[var(--b)] bg-[var(--surf2)]"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-semibold text-[var(--tx)]">Class {entry.batch_name}</span>
                  <Badge variant="teal">{entry.diary_date}</Badge>
                </div>
                <div className="text-[11.5px] text-[var(--tx2)] mb-1">
                  <strong>Topics:</strong> {entry.topics}
                </div>
                {entry.homework && (
                  <div className="text-[11.5px] text-[var(--tx2)] mb-1">
                    <strong>Homework:</strong> {entry.homework}
                  </div>
                )}
                <div className="text-[10.5px] text-[var(--tx3)]">
                  {entry.teacher_name} · {entry.parents_count} parents notified
                </div>
              </div>
            ))}
            {myRecent.length === 0 && (
              <div className="text-center py-6 text-[12px] text-[var(--tx3)]">
                No recent diary submissions.
              </div>
            )}
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
