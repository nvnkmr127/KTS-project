import { useState, useEffect } from 'react';
import { BookOpen, Send, Clock, Eye, CheckCircle2, AlertCircle, Loader2, Calendar, User, ArrowLeft } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatDate } from '../utils/date';
import { useApp } from '../context/AppContext';

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
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedClassDetail, setSelectedClassDetail] = useState<string | null>(null);

  const { timetable, periodTimings } = useApp();

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

  const activeEntries = entries.filter((e) => e.diary_date === selectedDate);

  // Helper to match teacher names loosely
  const matchTeacher = (t1: string, t2: string) => {
    const clean1 = t1.toLowerCase().replace(/^(mr\.|mrs\.|ms\.|dr\.)\s+/g, '').trim();
    const clean2 = t2.toLowerCase().replace(/^(mr\.|mrs\.|ms\.|dr\.)\s+/g, '').trim();
    return clean1.includes(clean2) || clean2.includes(clean1);
  };

  // Map default classes to submission status, entries, and scheduled teachers counts
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dateObj = new Date(selectedDate);
  const dayName = daysOfWeek[dateObj.getDay()];

  const submissionList = DEFAULT_CLASSES.map((clsName) => {
    const classEntries = activeEntries.filter((e) => e.batch_name === clsName);
    const classTimetable = timetable[clsName] ?? {};
    const dayTimetable = classTimetable[dayName] ?? {};

    // Get unique teachers scheduled for today (excluding breaks)
    const scheduledTeachers = Array.from(new Set(
      Object.keys(dayTimetable)
        .map(p => dayTimetable[Number(p)])
        .filter((slot): slot is NonNullable<typeof slot> => !!slot && !!slot.teacher)
        .map(slot => slot.teacher)
    ));

    const submittedTeachers = scheduledTeachers.filter(st =>
      classEntries.some(e => matchTeacher(e.teacher_name, st))
    );

    const submittedCount = submittedTeachers.length;
    const pendingCountForClass = Math.max(0, scheduledTeachers.length - submittedCount);

    // If timetable is empty, fallback to activeEntries count
    const finalSubmitted = scheduledTeachers.length === 0 ? classEntries.length : submittedCount;
    const finalPending = scheduledTeachers.length === 0 ? 0 : pendingCountForClass;

    const isSubmitted = finalSubmitted > 0;
    const isFullySubmitted = scheduledTeachers.length > 0 ? finalPending === 0 : isSubmitted;

    return {
      cls: `Class ${clsName}`,
      clsName,
      status: isFullySubmitted ? 'sent' as const : 'pending' as const,
      submittedCount: finalSubmitted,
      pendingCount: finalPending,
      totalScheduled: scheduledTeachers.length,
      entries: classEntries,
    };
  });

  const sentCount = submissionList.filter((s) => s.submittedCount > 0).length;
  const pendingCount = submissionList.filter((s) => s.pendingCount > 0).length;
  const totalParents = activeEntries.reduce((sum, e) => sum + e.parents_count, 0);

  // If a class is clicked, render the detailed period-wise teacher screen
  if (selectedClassDetail) {
    const classTimetable = timetable[selectedClassDetail] ?? {};
    const dayTimetable = classTimetable[dayName] ?? {};

    // Get all daily diary entries submitted for this class on the selected date
    const classEntriesForDate = activeEntries.filter((e) => e.batch_name === selectedClassDetail);

    // Keep track of which entries are displayed in the timeline so we can show unmatched ones at the bottom
    const matchedEntryIds = new Set<string>();

    return (
      <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setSelectedClassDetail(null)}
            className="p-1.5 hover:bg-[var(--surf2)] rounded-lg text-[var(--tx2)] hover:text-[var(--tx)] cursor-pointer border border-[var(--b)] bg-[var(--surf)]"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <h2 className="text-[14px] font-bold text-[var(--tx)]">Class {selectedClassDetail} Submissions</h2>
            <p className="text-[10.5px] text-[var(--tx3)]">Period-wise breakdown of scheduled teachers and diaries</p>
          </div>
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--b)]">
            <div className="text-[12px] font-semibold text-[var(--tx)] flex items-center gap-2">
              Timeline for {dayName}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2 py-1">
                <Calendar size={12} className="text-[var(--tx3)]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none text-[11px] text-[var(--tx)] focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {dayName === 'Sunday' ? (
              <div className="text-center py-6 text-[12px] text-[var(--tx3)]">
                Sunday - No scheduled classes.
              </div>
            ) : (
              periodTimings.map((timing, p) => {
                if (timing.isBreak) {
                  return (
                    <div key={p} className="p-2.5 bg-[var(--surf3)]/20 border border-[var(--b)] border-dashed rounded-xl text-center text-[10.5px] text-[var(--tx3)] font-semibold">
                      {timing.label || 'Break'} ({timing.start} - {timing.end})
                    </div>
                  );
                }

                const displayPeriodIndex = periodTimings.slice(0, p).filter(t => !t.isBreak).length + 1;
                const slot = dayTimetable[p];

                if (!slot) {
                  return (
                    <div key={p} className="p-3 bg-[var(--surf2)]/20 border border-[var(--b)] rounded-xl text-[11px] text-[var(--tx3)]">
                      Period {displayPeriodIndex} ({timing.start} - {timing.end}) : No subject scheduled
                    </div>
                  );
                }

                // Find the entry that matches this teacher
                const entry = classEntriesForDate.find((e) => matchTeacher(e.teacher_name, slot.teacher));
                if (entry && entry.id) {
                  matchedEntryIds.add(entry.id);
                }

                return (
                  <div key={p} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-[var(--tx3)] pl-1 flex items-center justify-between">
                      <span>Period {displayPeriodIndex} ({timing.start} - {timing.end}) · {slot.subject}</span>
                      <span className="text-[10px] bg-[var(--blue-bg)] text-[var(--blue-tx)] px-2 py-0.5 rounded-full font-semibold">Scheduled</span>
                    </div>

                    {entry ? (
                      <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-4 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[var(--blue-bg)] text-[var(--blue-tx)] flex items-center justify-center">
                              <User size={15} />
                            </div>
                            <div>
                              <span className="text-[12.5px] font-bold text-[var(--tx)]">{entry.teacher_name}</span>
                              <div className="text-[10px] text-[var(--tx3)]">{slot.subject} · Scheduled Teacher</div>
                            </div>
                          </div>
                          <span className="text-[11px] text-[var(--tx3)] font-medium">
                            {formatDate(entry.diary_date).split('-').reverse().join('-')}
                          </span>
                        </div>

                        <div className="space-y-2 text-[12px] pl-1.5 pt-1">
                          <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                            <span className="text-[11.5px] font-semibold text-[var(--tx3)]">Topics:</span>
                            <span className="text-[12px] text-[var(--tx)]">{entry.topics}</span>
                          </div>
                          {entry.homework && (
                            <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                              <span className="text-[11.5px] font-semibold text-[var(--tx3)]">Homework:</span>
                              <span className="text-[12px] text-[var(--tx)]">{entry.homework}</span>
                            </div>
                          )}
                          {entry.notes && (
                            <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                              <span className="text-[11.5px] font-semibold text-[var(--tx3)]">Notes:</span>
                              <span className="text-[12px] text-[var(--amber-tx)]">{entry.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[var(--surf2)]/40 border border-[var(--b)] border-dashed rounded-xl p-4 opacity-70">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[var(--surf3)] text-[var(--tx3)] flex items-center justify-center">
                              <User size={15} />
                            </div>
                            <div>
                              <span className="text-[12.5px] font-semibold text-[var(--tx2)]">{slot.teacher}</span>
                              <div className="text-[10px] text-[var(--tx3)]">{slot.subject} · Awaiting diary update</div>
                            </div>
                          </div>
                          <Badge variant="amber">
                            <AlertCircle size={9} className="inline mr-0.5" />Pending
                          </Badge>
                        </div>
                        <div className="text-[11px] text-[var(--tx3)] mt-2 pl-1.5 border-l-2 border-[var(--b)]/60">
                          Diary not yet submitted for this scheduled period
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* List unmatched submissions */}
            {classEntriesForDate.filter((e) => !e.id || !matchedEntryIds.has(e.id)).length > 0 && (
              <div className="mt-6 pt-4 border-t border-[var(--b)] space-y-3">
                <div className="text-[11px] font-bold text-[var(--tx3)] pl-1">
                  Additional Diary Submissions (Non-scheduled periods)
                </div>
                {classEntriesForDate
                  .filter((e) => !e.id || !matchedEntryIds.has(e.id))
                  .map((entry, idx) => (
                    <div key={idx} className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[var(--blue-bg)] text-[var(--blue-tx)] flex items-center justify-center">
                            <User size={15} />
                          </div>
                          <div>
                            <span className="text-[12.5px] font-bold text-[var(--tx)]">{entry.teacher_name}</span>
                            <div className="text-[10px] text-[var(--tx3)]">General Diary Submission</div>
                          </div>
                        </div>
                        <span className="text-[11px] text-[var(--tx3)] font-medium">
                          {formatDate(entry.diary_date).split('-').reverse().join('-')}
                        </span>
                      </div>

                      <div className="space-y-2 text-[12px] pl-1.5 pt-1">
                        <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                          <span className="text-[11.5px] font-semibold text-[var(--tx3)]">Topics:</span>
                          <span className="text-[12px] text-[var(--tx)]">{entry.topics}</span>
                        </div>
                        {entry.homework && (
                          <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                            <span className="text-[11.5px] font-semibold text-[var(--tx3)]">Homework:</span>
                            <span className="text-[12px] text-[var(--tx)]">{entry.homework}</span>
                          </div>
                        )}
                        {entry.notes && (
                          <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                            <span className="text-[11.5px] font-semibold text-[var(--tx3)]">Notes:</span>
                            <span className="text-[12px] text-[var(--amber-tx)]">{entry.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        <KPICard label="Diaries Submitted" value={sentCount} sub={`Out of ${DEFAULT_CLASSES.length} classes`} icon={<BookOpen size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Messages Delivered" value={totalParents} sub="WhatsApp + SMS" icon={<Send size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Pending" value={pendingCount} sub="Classes not yet updated" icon={<Clock size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="text-[13px] font-semibold text-[var(--tx)] flex items-center gap-2">
            Diary Submissions {loading && <Loader2 size={13} className="animate-spin text-[var(--tx3)]" />}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2 py-1">
              <Calendar size={12} className="text-[var(--tx3)]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                }}
                className="bg-transparent border-none text-[11px] text-[var(--tx)] focus:outline-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--tx3)]">
              <Eye size={12} />
              <span>Live Sync</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {submissionList.map((entry, i) => {
            const hasSubmissions = entry.submittedCount > 0;


            return (
              <div
                key={i}
                onClick={() => {
                  setSelectedClassDetail(entry.clsName);
                }}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer border-[var(--b)] bg-[var(--surf2)] hover:border-[var(--blue-tx)] hover:shadow-sm`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[12.5px] font-bold text-[var(--tx)]">{entry.cls}</span>
                      {entry.totalScheduled > 0 ? (
                        <Badge variant={entry.pendingCount === 0 ? "teal" : "amber"}>
                          {entry.pendingCount === 0 ? "All Submitted" : "In Progress"}
                        </Badge>
                      ) : (
                        <Badge variant={hasSubmissions ? "teal" : "gray"}>
                          {hasSubmissions ? "Submitted" : "No Schedule"}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px]">
                      <span className="text-[var(--teal-tx)] font-semibold flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        {entry.submittedCount} {entry.submittedCount === 1 ? "Teacher" : "Teachers"} Submitted
                      </span>
                      {entry.totalScheduled > 0 && entry.pendingCount > 0 && (
                        <span className="text-[var(--amber-tx)] font-semibold flex items-center gap-1">
                          <AlertCircle size={11} />
                          {entry.pendingCount} {entry.pendingCount === 1 ? "Teacher" : "Teachers"} Pending
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right flex-shrink-0 text-[10.5px] text-[var(--blue-tx)] font-semibold">
                    Click to view details &rarr;
                  </div>
                </div>
              </div>
            );
          })}
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
                {formatDate(todayStr)}
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

            <button
              type="submit"
              disabled={submitting || !selectedClass || !topics}
              className="w-full flex items-center justify-center gap-1.5 bg-[var(--blue)] text-white rounded-lg py-2 text-[12px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer animate-none"
            >
              <Send size={13} /> {submitting ? 'Saving...' : 'Save Diary'}
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
                  <Badge variant="teal">{formatDate(entry.diary_date)}</Badge>
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
                  {entry.teacher_name}
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
