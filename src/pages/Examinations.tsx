import { useState, useEffect, Fragment, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Plus, X, Award, TrendingUp, BookOpen, BarChart2, Calendar, ChevronLeft, ChevronRight, Trash2, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatDate } from '../utils/date';
import { StaffMember, STAFF } from './StaffManagement';
import { useDialog } from '../context/DialogContext';
import * as XLSX from 'xlsx-js-style';
import { downloadSheet } from '../utils/excel';
import { getClassWeight } from './Students';


export interface Invigilation {
  id: string;
  examId: string;
  examName: string;
  class: string;
  subject: string;
  date: string;
  timeSlot: string;
  room: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
}


interface Exam {
  id: string;
  name: string;
  subject: string;
  class: string;
  date: string;
  maxMarks: number;
  status: 'Upcoming' | 'Completed' | 'Results Published';
}

interface StudentResult {
  name: string;
  init: string;
  roll: string;
  maths: number;
  science: number;
  english: number;
  telugu: number;
  social: number;
  total: number;
  percentage: number;
  grade: string;
  rank: number;
}

interface ExamScheduleEntry {
  subject: string;
  time: string;
  duration: string;
  maxMarks: number;
}

type ClassExamSchedule = {
  [dateStr: string]: ExamScheduleEntry[];
};

const DEFAULT_EXAMS: Exam[] = [
  { id: '1', name: 'Mid-Term Examination 2026', subject: 'All Subjects', class: 'All Classes', date: '2026-06-15', maxMarks: 100, status: 'Upcoming' },
  { id: '2', name: 'Final Term Examination 2026', subject: 'All Subjects', class: 'All Classes', date: '2026-11-20', maxMarks: 100, status: 'Upcoming' },
];

const EXAMS: Exam[] = DEFAULT_EXAMS;



const tooltipStyle = { backgroundColor: 'var(--surf)', border: '0.5px solid var(--b2)', borderRadius: 8, fontSize: 11, color: 'var(--tx)' };

const GRADE_BADGE: Record<string, 'teal' | 'blue' | 'amber' | 'red' | 'purple'> = {
  'A+': 'purple', 'A': 'teal', 'B+': 'blue', 'B': 'amber', 'C': 'red',
};

const CLASSES = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Telugu', 'Hindi', 'Social Studies', 'All Subjects'];

function getSubjectsForClass(clsName: string): string[] {
  if (!clsName) return ['Maths', 'Science', 'English', 'Telugu', 'Hindi', 'Social'];
  const cleanClass = clsName.replace(/^Class\s*/i, '').trim();
  const match = cleanClass.match(/^(\d+)/);
  const classId = match ? match[1] : cleanClass;

  const savedExact = localStorage.getItem(`batch_subjects_${cleanClass}`);
  if (savedExact) {
    try {
      const parsed = JSON.parse(savedExact);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* empty */ }
  }

  if (match && cleanClass === classId) {
    const savedSecA = localStorage.getItem(`batch_subjects_${classId}A`);
    if (savedSecA) {
      try {
        const parsed = JSON.parse(savedSecA);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { /* empty */ }
    }
  }

  if (classId === '8') {
    return ['Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'Telugu', 'Social'];
  }
  return ['Maths', 'Science', 'English', 'Telugu', 'Hindi', 'Social', 'EVS'];
}

const INITIAL_SCHEDULES_BY_EXAM: Record<string, Record<string, ClassExamSchedule>> = {
  '1': {
    '8A': {
      '2026-06-10': [
        { subject: 'Mathematics', time: '10:00 AM', duration: '2 hrs', maxMarks: 25 },
        { subject: 'Science', time: '2:00 PM', duration: '2 hrs', maxMarks: 25 },
      ],
      '2026-06-11': [
        { subject: 'English', time: '10:00 AM', duration: '2 hrs', maxMarks: 25 },
      ],
      '2026-06-12': [
        { subject: 'Telugu', time: '10:00 AM', duration: '2 hrs', maxMarks: 25 },
        { subject: 'Social Studies', time: '2:00 PM', duration: '2 hrs', maxMarks: 25 },
      ],
    }
  },
  '2': {
    '8A': {
      '2026-06-25': [
        { subject: 'Mathematics', time: '10:00 AM', duration: '3 hrs', maxMarks: 100 },
      ]
    }
  },
  '3': {
    '8A': {
      '2026-05-20': [
        { subject: 'Mathematics', time: '10:00 AM', duration: '2 hrs', maxMarks: 50 },
      ]
    }
  },
  '4': {
    '9A': {
      '2026-05-15': [
        { subject: 'Mathematics', time: '10:00 AM', duration: '2 hrs', maxMarks: 25 },
      ]
    }
  }
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface AddExamModal {
  dateStr: string;
}

function ExamScheduleDesigner({
  isAdmin,
  selectedClass,
  setSelectedClass,
  classList,
  exam,
  schedules,
  setSchedules,
  onBack,
}: {
  isAdmin: boolean;
  selectedClass: string;
  setSelectedClass: (c: string) => void;
  classList: string[];
  exam: Exam;
  schedules: Record<string, Record<string, ClassExamSchedule>>;
  setSchedules: React.Dispatch<React.SetStateAction<Record<string, Record<string, ClassExamSchedule>>>>;
  onBack: () => void;
}) {
  const getInitialYearMonth = () => {
    if (exam.date) {
      const d = new Date(exam.date + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        return { year: d.getFullYear(), month: d.getMonth() };
      }
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  };

  const [year, setYear] = useState(() => getInitialYearMonth().year);
  const [month, setMonth] = useState(() => getInitialYearMonth().month);
  const [addModal, setAddModal] = useState<AddExamModal | null>(null);
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newDuration, setNewDuration] = useState('2 hrs');
  const [newMarks, setNewMarks] = useState(50);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (exam.date) {
      const d = new Date(exam.date + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setYear(d.getFullYear());
        setMonth(d.getMonth());
      }
    }
  }, [exam.id, exam.date]);

  const isDateBeforeExam = (dateStr: string) => {
    if (!exam.date) return false;
    return dateStr < exam.date;
  };

  const canGoPrevMonth = () => {
    if (!exam.date) return true;
    const d = new Date(exam.date + 'T00:00:00');
    if (isNaN(d.getTime())) return true;
    const examYear = d.getFullYear();
    const examMonth = d.getMonth();
    if (year > examYear) return true;
    if (year === examYear && month > examMonth) return true;
    return false;
  };

  const [isEditing, setIsEditing] = useState(() => {
    const examSchedules = schedules[exam.id] ?? {};
    const totalEntries = Object.values(examSchedules).reduce((sum, clsSched) => {
      return sum + Object.values(clsSched).reduce((s, arr) => s + arr.length, 0);
    }, 0);
    return totalEntries === 0;
  });

  const activeClassList = classList.length > 0 ? classList : CLASSES;
  const examClasses = exam.class === 'All Classes' ? activeClassList : exam.class.split(',').map((c) => c.trim());

  const [dbSubjects, setDbSubjects] = useState<string[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    setDbSubjects(null);
    const fetchClassSubjects = async () => {
      const cleanClass = selectedClass.replace(/^Class\s*/i, '').trim();
      const match = cleanClass.match(/^(\d+)/);
      const classId = match ? match[1] : cleanClass;

      try {
        const res = await api.getResources('settings', { key: `batch_subjects_${cleanClass}` });
        if (Array.isArray(res) && res.length > 0 && res[0].value) {
          const parsed = JSON.parse(res[0].value);
          if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
            localStorage.setItem(`batch_subjects_${cleanClass}`, res[0].value);
            setDbSubjects(parsed);
            return;
          }
        }
        if (match && cleanClass === classId) {
          const resSecA = await api.getResources('settings', { key: `batch_subjects_${classId}A` });
          if (Array.isArray(resSecA) && resSecA.length > 0 && resSecA[0].value) {
            const parsed = JSON.parse(resSecA[0].value);
            if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
              localStorage.setItem(`batch_subjects_${classId}A`, resSecA[0].value);
              setDbSubjects(parsed);
              return;
            }
          }
        }
      } catch (err) {
        console.error('Error fetching subjects from DB:', err);
      }
    };
    fetchClassSubjects();
    return () => { isMounted = false; };
  }, [selectedClass]);

  useEffect(() => {
    if (examClasses.length > 0 && !examClasses.includes(selectedClass)) {
      setSelectedClass(examClasses[0]);
    }
  }, [exam.id, selectedClass, examClasses, setSelectedClass]);

  const classSubjects = dbSubjects || getSubjectsForClass(selectedClass);
  const examSchedules = schedules[exam.id] ?? {};
  const classSchedule = examSchedules[selectedClass] ?? {};

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getCalendarDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const addExamEntry = () => {
    if (!addModal) return;
    if (isDateBeforeExam(addModal.dateStr)) return;
    const selectedSub = classSubjects.includes(newSubject) ? newSubject : (classSubjects[0] || newSubject);
    const entry: ExamScheduleEntry = { subject: selectedSub, time: newTime, duration: newDuration, maxMarks: newMarks };
    setSchedules((prev) => {
      const examPrev = prev[exam.id] ?? {};
      const classPrev = examPrev[selectedClass] ?? {};
      const dayPrev = classPrev[addModal.dateStr] ?? [];
      const updatedSchedules = {
        ...prev,
        [exam.id]: {
          ...examPrev,
          [selectedClass]: {
            ...classPrev,
            [addModal.dateStr]: [...dayPrev, entry],
          },
        },
      };
      localStorage.setItem('examinations_schedules', JSON.stringify(updatedSchedules));
      saveSettingToDb('examinations_schedules', updatedSchedules);
      return updatedSchedules;
    });
    setAddModal(null);
  };

  const removeEntry = (dateStr: string, idx: number) => {
    setSchedules((prev) => {
      const examPrev = prev[exam.id] ?? {};
      const classPrev = examPrev[selectedClass] ?? {};
      const dayEntries = [...(classPrev[dateStr] ?? [])];
      dayEntries.splice(idx, 1);

      const updatedClass = { ...classPrev, [dateStr]: dayEntries };
      if (dayEntries.length === 0) delete updatedClass[dateStr];

      const updatedSchedules = {
        ...prev,
        [exam.id]: {
          ...examPrev,
          [selectedClass]: updatedClass,
        },
      };
      localStorage.setItem('examinations_schedules', JSON.stringify(updatedSchedules));
      saveSettingToDb('examinations_schedules', updatedSchedules);
      return updatedSchedules;
    });
  };

  const totalExams = Object.values(classSchedule).reduce((s, arr) => s + arr.length, 0);
  const isWritable = isAdmin && isEditing;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] text-[var(--tx2)] cursor-pointer" title="Back to Exams">
            <ChevronLeft size={16} />
          </button>
          <div className="text-[12.5px] font-semibold text-[var(--tx)]">
            {isAdmin ? 'Exam Schedule Designer' : 'Exam Schedule Preview'} — <span className="text-[var(--blue-tx)] font-bold">{exam.name}</span>
            {exam.date && (
              <span className="text-[11px] text-[var(--tx3)] font-normal ml-2">
                (Start Date: <span className="font-semibold text-[var(--tx2)]">{formatDate(exam.date)}</span>)
              </span>
            )}
          </div>
          <div className="flex gap-1 flex-wrap ml-2">
            {examClasses.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-all ${selectedClass === cls
                  ? 'bg-[var(--blue)] text-white'
                  : 'bg-[var(--surf2)] border border-[var(--b)] text-[var(--tx2)] hover:border-[var(--blue)]'
                  }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-[11.5px] text-[var(--teal-tx)]">Saved!</span>}
          <Badge variant="blue">{totalExams} exams scheduled</Badge>
          {isAdmin && (
            isEditing ? (
              <button
                onClick={() => {
                  localStorage.setItem('examinations_schedules', JSON.stringify(schedules));
                  saveSettingToDb('examinations_schedules', schedules);
                  setSavedMsg(true);
                  setTimeout(() => setSavedMsg(false), 2000);
                  setIsEditing(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90 font-medium"
              >
                <Calendar size={11} /> Save Schedule
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] border border-[var(--b)] bg-[var(--surf2)] text-[var(--tx2)] rounded-lg cursor-pointer hover:border-[var(--blue)] hover:text-[var(--blue-tx)] font-medium"
              >
                Edit Schedule
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-2.5">
        {/* Calendar */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              disabled={!canGoPrevMonth()}
              onClick={() => {
                if (!canGoPrevMonth()) return;
                if (month === 0) {
                  setMonth(11);
                  setYear(y => y - 1);
                } else {
                  setMonth(m => m - 1);
                }
              }}
              className={`p-1 rounded-lg transition-colors ${!canGoPrevMonth() ? 'opacity-30 cursor-not-allowed text-[var(--tx3)]' : 'hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx)]'}`}
              title={!canGoPrevMonth() ? 'Cannot navigate before exam start month' : 'Previous Month'}
            >
              <ChevronLeft size={14} />
            </button>
            <div className="text-[12px] font-semibold text-[var(--tx)]">{MONTH_NAMES[month]} {year}</div>
            <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }} className="p-1 rounded-lg hover:bg-[var(--surf2)] cursor-pointer">
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="text-center text-[9.5px] font-semibold text-[var(--tx3)] py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = getCalendarDateStr(day);
              const isBeforeExam = isDateBeforeExam(dateStr);
              const hasExams = classSchedule[dateStr] && classSchedule[dateStr].length > 0;
              const isClickable = isWritable && !isBeforeExam;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => {
                    if (!isClickable) return;
                    const subs = getSubjectsForClass(selectedClass);
                    setAddModal({ dateStr });
                    setNewSubject(subs[0] || 'Maths');
                    setNewTime('10:00 AM');
                    setNewDuration('2 hrs');
                    setNewMarks(50);
                  }}
                  title={
                    isBeforeExam
                      ? `Dates prior to exam start date (${formatDate(exam.date)}) cannot be selected`
                      : isWritable
                        ? 'Click to schedule exam session'
                        : undefined
                  }
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-[10.5px] transition-all relative ${
                    hasExams
                      ? 'bg-[var(--blue)] text-white font-bold'
                      : isBeforeExam
                        ? 'text-[var(--tx3)] opacity-35 cursor-not-allowed bg-transparent'
                        : 'text-[var(--tx)]'
                  } ${
                    isClickable
                      ? 'cursor-pointer hover:bg-[var(--surf2)]'
                      : !hasExams
                        ? 'cursor-default'
                        : ''
                  }`}
                >
                  {day}
                  {hasExams && (
                    <div className="absolute bottom-0.5 flex gap-0.5">
                      {classSchedule[dateStr].slice(0, 3).map((_, j) => (
                        <div key={j} className="w-1 h-1 rounded-full bg-white/70" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Exam list */}
        <Card>
          <div className="text-[12px] font-semibold text-[var(--tx)] mb-3">Class {selectedClass} — Exam Schedule</div>
          {Object.keys(classSchedule).length === 0 ? (
            <div className="text-center py-8 text-[12px] text-[var(--tx3)]">
              No exams scheduled yet. {isWritable ? 'Click a date on the calendar to add.' : 'Schedule has not been set yet.'}
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
              {Object.entries(classSchedule)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dateStr, entries]) => (
                  <div key={dateStr} className="p-3 bg-[var(--surf2)] border border-[var(--b)] rounded-xl">
                    <div className="text-[11.5px] font-bold text-[var(--tx)] mb-2">
                      {`${new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}, ${formatDate(dateStr)}`}
                    </div>
                    <div className="space-y-1.5">
                      {entries.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] flex-shrink-0" />
                            <span className="text-[12px] font-semibold text-[var(--blue-tx)]">{entry.subject}</span>
                            <span className="text-[11px] text-[var(--tx3)]">{entry.time} · {entry.duration}</span>
                            <Badge variant="gray">{entry.maxMarks} marks</Badge>
                          </div>
                          {isWritable && (
                            <button
                              onClick={() => removeEntry(dateStr, idx)}
                              className="p-1 rounded hover:bg-[var(--red-bg)] text-[var(--tx3)] hover:text-[var(--red-tx)] cursor-pointer transition-colors"
                            >
                              <X size={11} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {/* Add exam modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[13.5px] font-bold text-[var(--tx)]">Add Exam</div>
                <div className="text-[11px] text-[var(--tx3)] mt-0.5">
                  Class {selectedClass} · {formatDate(addModal.dateStr)}
                </div>
              </div>
              <button onClick={() => setAddModal(null)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Subject *</label>
                <select
                  value={classSubjects.includes(newSubject) ? newSubject : (classSubjects[0] || '')}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                >
                  {classSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Start Time *</label>
                  <select value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                    {['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Duration *</label>
                  <select value={newDuration} onChange={(e) => setNewDuration(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                    {['1 hr', '1.5 hrs', '2 hrs', '2.5 hrs', '3 hrs'].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Max Marks *</label>
                <input type="number" value={newMarks} onChange={(e) => setNewMarks(Number(e.target.value))} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" min={5} max={100} />
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => setAddModal(null)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button onClick={addExamEntry} className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer hover:opacity-90">Add Exam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function extractItems(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.data?.data && Array.isArray(data.data.data)) return data.data.data;
  if (data && typeof data === 'object' && data.id) return [data];
  if (data?.data && typeof data.data === 'object' && data.data.id) return [data.data];
  return [];
}

async function saveSettingToDb(key: string, value: any) {
  try {
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    const existing = await api.getResources('settings', { key }).catch(() => []);
    const items = extractItems(existing);
    if (items.length > 0 && items[0]?.id) {
      const settingId = items[0].id;
      await api.updateResource('settings', String(settingId), {
        key,
        value: valueStr,
        group: 'exam',
        type: 'json',
        is_public: true,
      }).catch(() => { });
    } else {
      await api.createResource('settings', {
        key,
        value: valueStr,
        group: 'exam',
        type: 'json',
        is_public: true,
      }).catch(() => { });
    }
  } catch (err) {
    console.warn(`Could not sync setting ${key} to backend DB (using local storage fallback):`, err);
  }
}

export function Examinations() {
  const { user } = useAuth();
  const { alert, confirm } = useDialog();
  const roleStr = String(user?.role || '').toLowerCase();
  const isAdmin = roleStr === 'admin' || roleStr.includes('admin') || roleStr === 'principal' || roleStr === 'superadmin' || roleStr === 'super_admin';
  // Faculty/Teacher role — can enter marks for their assigned class
  const isFaculty = roleStr === 'faculty' || roleStr === 'teacher' || roleStr.includes('teacher') || roleStr.includes('faculty') || roleStr === 'staff';
  // Only admin and faculty/teacher may access marks entry/preview
  const canAccessMarks = isAdmin || isFaculty;

  type Tab = 'exams' | 'results' | 'marks' | 'designer' | 'invisilation';
  const [activeTab, setActiveTab] = useState<Tab>('exams');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClass, setSelectedClass] = useState('8A');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Record<string, Record<string, ClassExamSchedule>>>(() => {
    const saved = localStorage.getItem('examinations_schedules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
      } catch { /* empty */ }
    }
    return INITIAL_SCHEDULES_BY_EXAM;
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('examinations_exams');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { /* empty */ }
    }
    return EXAMS;
  });

  const [examSearch, setExamSearch] = useState('');
  const [examStatusFilter, setExamStatusFilter] = useState('All');
  const [examSortField, setExamSortField] = useState<'name' | 'date' | ''>('');
  const [examSortOrder, setExamSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);

  // eslint-disable-next-line unused-imports/no-unused-vars
  const handleExamSort = (field: 'name' | 'date') => {
    if (examSortField === field) {
      setExamSortOrder(examSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setExamSortField(field);
      setExamSortOrder('asc');
    }
  };

  const exportExamsToExcel = () => {
    const dataToExport = filteredExams.map(e => ({
      'Exam Name': e.name,
      'Class': e.class,
      'Subject': e.subject,
      'Date': e.date,
      'Max Marks': e.maxMarks,
      'Status': e.status
    }));
    downloadSheet(XLSX.utils.json_to_sheet(dataToExport), 'Exams', 'KTS_Exam_Schedules.xlsx');
  };

  const handleImportExamsExcel = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    if (!evt.target.files || !evt.target.files[0]) return;
    const file = evt.target.files[0];
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const bstr = e.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });

          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws) as any[];

          const parsedExams: Exam[] = data.map((row, idx) => ({
            id: 'exam-' + (Date.now() + idx),
            name: String(row['Exam Name'] || row['Name'] || 'Unit Test').trim(),
            class: String(row['Class'] || '8A').trim(),

            subject: String(row['Subject'] || 'All Subjects').trim(),
            date: String(row['Date'] || new Date().toISOString().slice(0, 10)).trim(),
            maxMarks: parseInt(row['Max Marks'] || row['Marks']) || 100,
            status: (row['Status'] || 'Upcoming') as any
          }));

          setExams(prev => {
            const next = [...parsedExams, ...prev];
            localStorage.setItem('examinations_exams', JSON.stringify(next));
            saveSettingToDb('examinations_exams', next);
            return next;
          });

          await alert(`Successfully imported ${parsedExams.length} exams!`, "Import Success");
          // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (err) {
          await alert('Failed to parse Excel rows', "Import Error");
        }
      };
      reader.readAsBinaryString(file);
      // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (err) {
      await alert('Error reading Excel file', "Read Error");
    }
  };

  const handleBulkExamStatusChange = (newStatus: 'Upcoming' | 'Completed' | 'Results Published') => {
    if (selectedExamIds.length === 0) return;
    setExams(prev => {
      const next = prev.map(e => selectedExamIds.includes(e.id) ? { ...e, status: newStatus } : e);
      localStorage.setItem('examinations_exams', JSON.stringify(next));
      saveSettingToDb('examinations_exams', next);
      return next;
    });
    setSelectedExamIds([]);
  };

  const handleBulkExamDelete = async () => {
    if (selectedExamIds.length === 0) return;
    if (await confirm(`Are you sure you want to delete the ${selectedExamIds.length} selected exams?`, 'Delete Exams', true)) {
      setExams(prev => {
        const next = prev.filter(e => !selectedExamIds.includes(e.id));
        localStorage.setItem('examinations_exams', JSON.stringify(next));
        saveSettingToDb('examinations_exams', next);
        return next;
      });
      setSelectedExamIds([]);
    }
  };

  const filteredExams = exams.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(examSearch.toLowerCase());
    const matchStatus = examStatusFilter === 'All' || e.status === examStatusFilter;
    return matchSearch && matchStatus;
  });

  const sortedExams = [...filteredExams].sort((a, b) => {
    if (!examSortField) return 0;
    let valA = a[examSortField];
    let valB = b[examSortField];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return examSortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return examSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const [invigilations, setInvigilations] = useState<Invigilation[]>(() => {

    const saved = localStorage.getItem('kts_exam_invigilations');
    return (saved && JSON.parse(saved)) || [];
  });

  const [classList, setClassList] = useState<string[]>([]);
  const [rawBatches, setRawBatches] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedMarksClass, setSelectedMarksClass] = useState('8A');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedMarksExamId, setSelectedMarksExamId] = useState<string>('');
  const [selectedResultsExamId, setSelectedResultsExamId] = useState<string>('');
  const [selectedMarksSubject, setSelectedMarksSubject] = useState<string>('Mathematics');
  const [studentMarks, setStudentMarks] = useState<Record<string, Record<string, Record<string, number | string>>>>(() => {
    const saved = localStorage.getItem('kts_student_marks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch { /* empty */ }
    }
    return {};
  });
  // draftMarks holds unsaved edits only in React state — never written to DB until Save is clicked
  const [draftMarks, setDraftMarks] = useState<Record<string, Record<string, Record<string, number | string>>>>({});
  const [savingMarks, setSavingMarks] = useState(false);
  const [expandedStudentRolls, setExpandedStudentRolls] = useState<Record<string, boolean>>({});

  const toggleStudentExpand = (roll: string) => {
    setExpandedStudentRolls((prev) => ({
      ...prev,
      [roll]: !prev[roll],
    }));
  };

  const handleUpdateStudentMark = (examId: string, subject: string, roll: string, mark: number | string | null, studentId?: string) => {
    const effectiveId = examId || selectedMarksExamId || (marksExams[0]?.id ?? 'default_exam');
    const cleanRoll = roll.replace(/^[0-9]+[A-Z]+-?/i, '');

    // Update draftMarks (pure React state — NOT saved to DB or localStorage)
    setDraftMarks((prev) => {
      const base = studentMarks[effectiveId] ?? {};
      const prevDraft = prev[effectiveId] ?? {};
      const subBase = base[subject] ?? {};
      const subDraft = prevDraft[subject] ?? {};
      const newSub = { ...subBase, ...subDraft };

      if (mark === null) {
        if (subBase[roll] !== undefined || (studentId && subBase[studentId] !== undefined) || subBase[cleanRoll] !== undefined) {
          newSub[roll] = "";
          newSub[cleanRoll] = "";
          if (studentId) newSub[studentId] = "";
        } else {
          delete newSub[roll];
          delete newSub[cleanRoll];
          if (studentId) delete newSub[studentId];
        }
      } else {
        newSub[roll] = mark;
        newSub[cleanRoll] = mark;
        if (studentId) newSub[studentId] = mark;
      }

      return {
        ...prev,
        [effectiveId]: {
          ...prevDraft,
          [subject]: newSub,
        },
      };
    });
  };

  const handleSaveMarksToDb = async () => {
    setSavingMarks(true);
    try {
      // Merge draft on top of saved marks to produce final committed marks
      const committed: Record<string, Record<string, Record<string, number | string>>> = {};
      const allExamIds = new Set([...Object.keys(studentMarks), ...Object.keys(draftMarks)]);
      allExamIds.forEach((exId) => {
        committed[exId] = {};
        const allSubs = new Set([...Object.keys(studentMarks[exId] ?? {}), ...Object.keys(draftMarks[exId] ?? {})]);
        allSubs.forEach((sub) => {
          committed[exId][sub] = {
            ...(studentMarks[exId]?.[sub] ?? {}),
            ...(draftMarks[exId]?.[sub] ?? {}),
          };
        });
      });
      // localStorage.setItem now syncs to DB for both Admin and Teacher (fixed in storage.ts)
      // Also call saveSettingToDb directly as a backup for reliability
      localStorage.setItem('kts_student_marks', JSON.stringify(committed));
      await saveSettingToDb('kts_student_marks', committed);
      // Update local state to reflect committed data and clear draft
      setStudentMarks(committed);
      setDraftMarks({});
      window.dispatchEvent(new CustomEvent('kts:student_marks_updated', { detail: committed }));
      await alert('Marks Saved Successfully', `Student marks for Class ${selectedMarksClass} have been saved to the database. They are now visible in both Admin and Faculty logins.`);
    } catch (err) {
      console.error('Error saving marks to DB:', err);
      await alert('Error', 'Failed to save student marks to database. Please try again.');
    } finally {
      setSavingMarks(false);
    }
  };

  useEffect(() => {
    const syncDb = async () => {
      try {
        let currentExams = exams;
        let currentSchedules = schedules;
        let currentInvigilations = invigilations;

        // 1. Sync exams from settings and exams table
        const examsRes = await api.getResources('settings', { key: 'examinations_exams' }).catch(() => []);
        const examsList = extractItems(examsRes);
        if (examsList.length > 0 && examsList[0].value) {
          try {
            const rawVal = examsList[0].value;
            currentExams = typeof rawVal === 'string' ? JSON.parse(rawVal) : rawVal;
          } catch (e) {
            console.error('Error parsing examinations_exams setting:', e);
          }
        }

        try {
          const directExamsRes = await api.getResources('exams', { limit: '1000' }).catch(() => []);
          const directExamsList = extractItems(directExamsRes);
          if (directExamsList.length > 0) {
            const directMapped: Exam[] = directExamsList.map((e: any) => ({
              id: String(e.id),
              name: e.name || 'Examination',
              subject: e.subject || 'All Subjects',
              class: e.class || 'All Classes',
              date: e.exam_date || e.date || new Date().toISOString().slice(0, 10),
              maxMarks: Number(e.max_marks || e.maxMarks || 100),
              status: (e.status || 'Upcoming') as any,
            }));
            const examMap = new Map<string, Exam>();
            currentExams.forEach((ex) => examMap.set(String(ex.id), ex));
            directMapped.forEach((ex) => {
              if (!examMap.has(String(ex.id))) {
                examMap.set(String(ex.id), ex);
              }
            });
            currentExams = Array.from(examMap.values());
          }
        } catch (e) {
          console.error('Error fetching direct exams table:', e);
        }

        setExams(currentExams);
        (localStorage as any).originalSetItem('examinations_exams', JSON.stringify(currentExams));

        // 2. Sync schedules
        const schedulesRes = await api.getResources('settings', { key: 'examinations_schedules' }).catch(() => []);
        const schedulesList = extractItems(schedulesRes);
        if (schedulesList.length > 0 && schedulesList[0].value) {
          try {
            const rawVal = schedulesList[0].value;
            currentSchedules = typeof rawVal === 'string' ? JSON.parse(rawVal) : rawVal;
            setSchedules(currentSchedules);
            (localStorage as any).originalSetItem('examinations_schedules', JSON.stringify(currentSchedules));
          } catch (e) {
            console.error('Error parsing examinations_schedules setting:', e);
          }
        } else if (isAdmin) {
          await saveSettingToDb('examinations_schedules', currentSchedules);
        }

        // 3. Sync invigilations
        const invigilationsRes = await api.getResources('settings', { key: 'kts_exam_invigilations' }).catch(() => []);
        const invigList = extractItems(invigilationsRes);
        if (invigList.length > 0 && invigList[0].value) {
          try {
            const rawVal = invigList[0].value;
            currentInvigilations = typeof rawVal === 'string' ? JSON.parse(rawVal) : rawVal;
            setInvigilations(currentInvigilations);
            (localStorage as any).originalSetItem('kts_exam_invigilations', JSON.stringify(currentInvigilations));
          } catch (e) {
            console.error('Error parsing kts_exam_invigilations setting:', e);
          }
        } else if (isAdmin) {
          await saveSettingToDb('kts_exam_invigilations', currentInvigilations);
        }

        // 4. Sync student marks (from kts_student_marks setting AND marks table)
        let loadedMarks: Record<string, Record<string, Record<string, number | string>>> = { ...studentMarks };

        const marksRes = await api.getResources('settings', { key: 'kts_student_marks' }).catch(() => []);
        const marksList = extractItems(marksRes);
        if (marksList.length > 0 && marksList[0].value) {
          try {
            const rawVal = marksList[0].value;
            const parsed = typeof rawVal === 'string' ? JSON.parse(rawVal) : rawVal;
            if (parsed && typeof parsed === 'object') {
              loadedMarks = { ...loadedMarks, ...parsed };
            }
          } catch (e) {
            console.error('Error parsing kts_student_marks setting:', e);
          }
        }

        // Merge from marks SQL table if populated
        try {
          const directMarksRes = await api.getResources('marks', { limit: '5000' }).catch(() => []);
          const directMarksList = extractItems(directMarksRes);
          if (directMarksList.length > 0) {
            directMarksList.forEach((m: any) => {
              const exId = String(m.exam_id || '1');
              if (!loadedMarks[exId]) loadedMarks[exId] = {};

              const studentKeys = [
                m.roll ? String(m.roll) : undefined,
                m.roll ? String(m.roll).replace(/^[0-9]+[A-Z]+-?/i, '') : undefined,
                m.student_id ? String(m.student_id) : undefined,
                m.id ? String(m.id) : undefined,
                m.student_name ? String(m.student_name).toLowerCase().trim() : undefined,
              ].filter(Boolean) as string[];

              const subjectScores: [string[], any][] = [
                [['Mathematics', 'Maths', 'Math'], m.maths],
                [['Science', 'General Science'], m.science],
                [['English'], m.english],
                [['Telugu'], m.telugu],
                [['Social Studies', 'Social'], m.social],
              ];

              subjectScores.forEach(([aliases, score]) => {
                if (score !== undefined && score !== null && score !== '') {
                  aliases.forEach((alias) => {
                    if (!loadedMarks[exId][alias]) loadedMarks[exId][alias] = {};
                    studentKeys.forEach((k) => {
                      loadedMarks[exId][alias][k] = Number(score);
                    });
                  });
                }
              });
            });
          }
        } catch (e) {
          console.error('Error fetching marks table:', e);
        }

        // Dynamically ensure every exam ID present in marks is in currentExams
        Object.keys(loadedMarks).forEach((exId) => {
          if (!currentExams.some((e) => String(e.id) === String(exId))) {
            currentExams.push({
              id: String(exId),
              name: `Examination ${exId}`,
              subject: 'All Subjects',
              class: 'All Classes',
              date: new Date().toISOString().slice(0, 10),
              maxMarks: 100,
              status: 'Upcoming',
            });
          }
        });
        setExams([...currentExams]);

        if (Object.keys(loadedMarks).length > 0) {
          setStudentMarks(loadedMarks);
          setDraftMarks({});
          (localStorage as any).originalSetItem('kts_student_marks', JSON.stringify(loadedMarks));
        }

        // 5. Sync batch subjects settings
        const allSettingsRes = await api.getResources('settings').catch(() => []);
        const allSettingsList = extractItems(allSettingsRes);
        if (allSettingsList.length > 0) {
          allSettingsList.forEach((s: any) => {
            if (s.key && s.key.startsWith('batch_subjects_') && s.value) {
              try {
                localStorage.setItem(s.key, typeof s.value === 'string' ? s.value : JSON.stringify(s.value));
              } catch { /* empty */ }
            }
          });
        }
      } catch (err) {
        console.error('Failed to sync settings from DB:', err);
      }
    };
    syncDb();

    // Load staff members
    const savedStaff = localStorage.getItem('kts_staff_members');
    if (savedStaff) {
      try {
        setStaffList(JSON.parse(savedStaff));
      } catch (e) {
        console.error(e);
        setStaffList(STAFF);
      }
    } else {
      setStaffList(STAFF);
    }

    // Load real batches & students with batch relationship
    const loadBatchesAndStudents = async () => {
      try {
        const batchesData = await api.getResources('batches').catch(() => []);
        const rawBatchesList = extractItems(batchesData);
        if (rawBatchesList.length > 0) {
          setRawBatches(rawBatchesList);
          const names = rawBatchesList.map((b: any) => b.name).filter(Boolean).sort((a: string, b: string) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) {
              if (numA !== numB) return numA - numB;
              return a.localeCompare(b);
            }
            return a.localeCompare(b);
          });
          if (names.length > 0) {
            setClassList(names);
          }
        }

        const data = await api.getResources('students', { with: 'batch.academicYear', limit: '1000' }).catch(() => []);
        const studentsList = extractItems(data);
        setStudents(studentsList || []);
      } catch (err) {
        console.error('Error loading batches or students:', err);
      }
    };
    loadBatchesAndStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen to cross-tab updates to examinations, schedules, invigilations, and student marks
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === 'examinations_exams') {
          setExams(JSON.parse(e.newValue));
        } else if (e.key === 'examinations_schedules') {
          setSchedules(JSON.parse(e.newValue));
        } else if (e.key === 'kts_exam_invigilations') {
          setInvigilations(JSON.parse(e.newValue));
        } else if (e.key === 'kts_student_marks') {
          // Another tab saved marks — update committed state and clear our draft
          setStudentMarks(JSON.parse(e.newValue));
          setDraftMarks({});
        }
      } catch (err) {
        console.error('Error parsing storage change in Examinations:', err);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  // Helper: check if an exam is related to a particular class (from exam.class or schedules)
  const isExamRelatedToClass = (
    exam: Exam,
    targetClass: string,
    allSchedules?: Record<string, Record<string, ClassExamSchedule>>
  ): boolean => {
    if (!exam) return false;
    if (!targetClass) return true;

    // If marks are saved for this exam ID in studentMarks, always include it
    if (studentMarks && (studentMarks[exam.id] || studentMarks[String(exam.id)])) {
      return true;
    }

    const cleanTarget = targetClass.replace(/^Class\s*/i, '').trim().toUpperCase();
    const examClassStr = (exam.class || '').trim();

    // 1. "All Classes" or empty means all classes are included
    if (
      !examClassStr ||
      examClassStr.toLowerCase() === 'all classes' ||
      examClassStr.toLowerCase() === 'all'
    ) {
      return true;
    }

    // 2. Comma-separated list in exam.class
    const examClasses = examClassStr
      .split(',')
      .map((c) => c.replace(/^Class\s*/i, '').trim().toUpperCase())
      .filter(Boolean);

    if (examClasses.includes(cleanTarget)) {
      return true;
    }

    // Handle grade matching if section is missing or different (e.g. target="8A", exam="8" or vice versa)
    const targetMatch = cleanTarget.match(/^(\d+)([A-Z]*)$/);
    for (const ec of examClasses) {
      if (ec === cleanTarget) return true;
      const ecMatch = ec.match(/^(\d+)([A-Z]*)$/);
      if (targetMatch && ecMatch) {
        const [, targetNum, targetSec] = targetMatch;
        const [, ecNum, ecSec] = ecMatch;
        if (targetNum === ecNum) {
          if (!targetSec || !ecSec || targetSec === ecSec) {
            return true;
          }
        }
      }
    }

    // 3. Check if schedule entries exist for this class in allSchedules
    if (allSchedules && allSchedules[exam.id]) {
      const schedClasses = Object.keys(allSchedules[exam.id]);
      for (const sc of schedClasses) {
        const cleanSc = sc.replace(/^Class\s*/i, '').trim().toUpperCase();
        if (cleanSc === cleanTarget) {
          const entriesCount = Object.values(allSchedules[exam.id][sc] || {}).reduce(
            (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
            0
          );
          if (entriesCount > 0) return true;
        }
        const scMatch = cleanSc.match(/^(\d+)([A-Z]*)$/);
        if (targetMatch && scMatch) {
          const [, targetNum, targetSec] = targetMatch;
          const [, scNum, scSec] = scMatch;
          if (targetNum === scNum && (!targetSec || !scSec || targetSec === scSec)) {
            const entriesCount = Object.values(allSchedules[exam.id][sc] || {}).reduce(
              (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
              0
            );
            if (entriesCount > 0) return true;
          }
        }
      }
    }

    return false;
  };

  const isExamCompleted = (e: Exam, classSchedule?: ClassExamSchedule): boolean => {
    if (e.status === 'Completed' || e.status === 'Results Published') return true;
    if (e.date) {
      const examDate = new Date(e.date + 'T23:59:59');
      const today = new Date();
      if (!isNaN(examDate.getTime()) && examDate <= today) {
        return true;
      }
    }
    if (classSchedule && Object.keys(classSchedule).length > 0) {
      const dates = Object.keys(classSchedule);
      const today = new Date();
      const allPast = dates.every((d) => {
        const entryDate = new Date(d + 'T23:59:59');
        return !isNaN(entryDate.getTime()) && entryDate <= today;
      });
      if (allPast && dates.length > 0) {
        return true;
      }
    }
    return false;
  };

  const marksExams = useMemo(() => {
    return exams.filter((e) => isExamRelatedToClass(e, selectedMarksClass, schedules));
  }, [exams, selectedMarksClass, schedules]);

  const resultsExams = useMemo(() => {
    return exams.filter((e) => isExamRelatedToClass(e, selectedClass, schedules));
  }, [exams, selectedClass, schedules]);

  // Initialize and validate filter selections
  useEffect(() => {
    if (marksExams.length > 0) {
      if (!selectedMarksExamId || !marksExams.some((e) => e.id === selectedMarksExamId)) {
        setSelectedMarksExamId(marksExams[0].id);
      }
    } else {
      setSelectedMarksExamId('');
    }
  }, [marksExams, selectedMarksExamId]);

  useEffect(() => {
    if (resultsExams.length > 0) {
      if (!selectedResultsExamId || !resultsExams.some((e) => e.id === selectedResultsExamId)) {
        setSelectedResultsExamId(resultsExams[0].id);
      }
    } else {
      setSelectedResultsExamId('');
    }
  }, [resultsExams, selectedResultsExamId]);

  useEffect(() => {
    if (!isAdmin && user) {
      if (user.subject && selectedMarksSubject !== user.subject) {
        setSelectedMarksSubject(user.subject);
      }
    }
  }, [user, isAdmin, selectedMarksSubject]);

  // handleSaveMarks is an alias for handleSaveMarksToDb
  const handleSaveMarks = handleSaveMarksToDb;

  // Removed automatic sync effects to prevent redundant DB writes on mount
  const [createName, setCreateName] = useState('');
  const [selectedCreateClasses, setSelectedCreateClasses] = useState<string[]>(['All Classes']);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [createSubject, setCreateSubject] = useState('All Subjects');
  const [createDate, setCreateDate] = useState('');
  const [createMaxMarks, setCreateMaxMarks] = useState(100);

  // Invigilation allotment form states
  const [showAllotModal, setShowAllotModal] = useState(false);
  const [allotExamId, setAllotExamId] = useState('');
  const [allotClass, setAllotClass] = useState('8A');
  const [allotSubject, setAllotSubject] = useState('Mathematics');
  const [allotDate, setAllotDate] = useState('');
  const [allotTimeSlot, setAllotTimeSlot] = useState('10:00 AM');
  const [allotRoom, setAllotRoom] = useState('Room 101');
  const [allotStaffId, setAllotStaffId] = useState('');


  useEffect(() => {
    const loadClasses = async () => {
      try {
        const batchesData = await api.getResources('batches');
        const defaultClasses = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        const foundClasses = new Set<string>();

        batchesData.forEach((b: any) => {
          const batchName = b.name;
          const match = batchName.match(/^(.+?)\s*([A-Z])$/i);
          if (match) {
            foundClasses.add(batchName);
          } else if (batchName === 'Default Batch') {
            foundClasses.add('8A');
          } else {
            foundClasses.add(batchName);
          }
        });

        defaultClasses.forEach((cId) => {
          foundClasses.add(`${cId}A`);
          foundClasses.add(`${cId}B`);
        });

        const sorted = Array.from(foundClasses).sort((a, b) => {
          const weightA = getClassWeight(a);
          const weightB = getClassWeight(b);
          if (weightA !== weightB) return weightA - weightB;
          return a.localeCompare(b);
        });

        setClassList(sorted);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setClassList(['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B']);
      }
    };
    loadClasses();
  }, []);

  const handleCreateExam = () => {
    if (!createName || !createDate) return;
    const newExam: Exam = {
      id: String(exams.length + 1),
      name: createName,
      class: selectedCreateClasses.join(', '),
      subject: createSubject,
      date: createDate,
      maxMarks: createMaxMarks,
      status: 'Upcoming',
    };
    const updatedExams = [...exams, newExam];
    setExams(updatedExams);
    localStorage.setItem('examinations_exams', JSON.stringify(updatedExams));
    saveSettingToDb('examinations_exams', updatedExams);

    setShowCreate(false);
    setCreateName('');
    setSelectedCreateClasses(['All Classes']);
    setShowClassDropdown(false);
    setCreateSubject('All Subjects');
    setCreateDate('');
    setCreateMaxMarks(100);
  };

  const handleDeleteExam = (id: string) => {
    const updatedExams = exams.filter((e) => e.id !== id);
    setExams(updatedExams);
    localStorage.setItem('examinations_exams', JSON.stringify(updatedExams));
    saveSettingToDb('examinations_exams', updatedExams);
  };

  const handleAddInvigilation = async () => {
    if (!allotStaffId) return;
    const selectedStaff = staffList.find((s) => s.id === allotStaffId);
    if (!selectedStaff) return;

    const selectedExam = exams.find((e) => e.id === allotExamId) || exams[0];
    const targetDate = allotDate || selectedExam?.date || new Date().toISOString().slice(0, 10);

    // Conflict Check 1: Room conflict (no other exam/invigilation in the same room at the same time)
    const roomConflict = invigilations.find(
      (inv) =>
        inv.room.trim().toLowerCase() === allotRoom.trim().toLowerCase() &&
        inv.date === targetDate &&
        inv.timeSlot === allotTimeSlot
    );

    if (roomConflict) {
      await alert(`Room Conflict: Room ${allotRoom} is already booked for "${roomConflict.examName}" (${roomConflict.subject}) on ${formatDate(targetDate)} at ${allotTimeSlot}.`, "Room Conflict");
      return;
    }

    // Conflict Check 2: Staff conflict (no other duties for this staff member at the same time)
    const staffConflict = invigilations.find(
      (inv) =>
        inv.staffId === allotStaffId &&
        inv.date === targetDate &&
        inv.timeSlot === allotTimeSlot
    );

    if (staffConflict) {
      await alert(`Staff Conflict: ${selectedStaff.name} is already assigned to "${staffConflict.examName}" in ${staffConflict.room} on ${formatDate(targetDate)} at ${allotTimeSlot}.`, "Staff Conflict");
      return;
    }

    const newInv: Invigilation = {
      id: 'inv-' + Date.now(),
      examId: selectedExam ? selectedExam.id : 'custom',
      examName: selectedExam ? selectedExam.name : 'Custom Exam',
      class: allotClass,
      subject: allotSubject,
      date: targetDate,
      timeSlot: allotTimeSlot,
      room: allotRoom,
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      staffEmail: selectedStaff.email || ''
    };

    const updated = [...invigilations, newInv];
    setInvigilations(updated);
    localStorage.setItem('kts_exam_invigilations', JSON.stringify(updated));
    saveSettingToDb('kts_exam_invigilations', updated);
    setShowAllotModal(false);
  };

  const handleDeleteInvigilation = (id: string) => {
    const updated = invigilations.filter((i) => i.id !== id);
    setInvigilations(updated);
    localStorage.setItem('kts_exam_invigilations', JSON.stringify(updated));
    saveSettingToDb('kts_exam_invigilations', updated);
  };

  const handleExamCardClick = (exam: Exam) => {
    let targetClass = '8A';
    if (exam.class !== 'All Classes') {
      const classes = exam.class.split(',').map((c) => c.trim());
      if (classes.length > 0) {
        targetClass = classes[0];
      }
    }
    setSelectedClass(targetClass);
    setSelectedExamId(exam.id);
    setActiveTab('designer');
  };

  const isTeacherAssignedToClass = (className: string): boolean => {
    if (isAdmin) return true;
    if (isFaculty) return true;
    if (!className) return false;
    return true;
  };

  const activeClassList = classList.length > 0 ? classList : CLASSES;
  const filteredClassList = activeClassList;

  const getMaxMarksForSubject = (examId: string, className: string, subjectName: string, fallbackMax: number = 100): number => {
    if (!examId || !className || !subjectName) return fallbackMax;
    const examSched = schedules[examId];
    if (!examSched) return fallbackMax;
    const classSched = examSched[className];
    if (!classSched) return fallbackMax;

    for (const dateStr in classSched) {
      const entries = classSched[dateStr];
      if (Array.isArray(entries)) {
        const found = entries.find((e) => e.subject.toLowerCase().trim() === subjectName.toLowerCase().trim());
        if (found && found.maxMarks && Number(found.maxMarks) > 0) {
          return Number(found.maxMarks);
        }
      }
    }
    return fallbackMax;
  };

  const findMarkValue = (
    marksRecord: any,
    examId: string,
    subject: string,
    studentRoll: string,
    studentId?: string,
    cleanRoll?: string,
    studentName?: string
  ): number | string | undefined => {
    if (!marksRecord) return undefined;

    // Normalize candidate student keys
    const cleanR = cleanRoll || (studentRoll ? studentRoll.replace(/^[0-9]+[A-Z]+-?/i, '') : undefined);
    const studentCandidates = [
      studentRoll,
      cleanR,
      studentId ? String(studentId) : undefined,
      studentRoll ? studentRoll.replace(/^0+/, '') : undefined,
      cleanR ? cleanR.replace(/^0+/, '') : undefined,
      studentName ? studentName.toLowerCase().trim() : undefined,
    ].filter(Boolean) as string[];

    const normalizeSub = (s: string) => {
      const clean = String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean === 'maths' || clean === 'math' || clean === 'mathematics') return 'maths';
      if (clean === 'social' || clean === 'socialstudies' || clean === 'socialscience') return 'social';
      if (clean === 'science' || clean === 'generalscience') return 'science';
      return clean;
    };
    const targetSubNorm = normalizeSub(subject);

    // If marksRecord is an array of objects
    if (Array.isArray(marksRecord)) {
      for (const row of marksRecord) {
        if (!row || typeof row !== 'object') continue;
        const rowExam = String(row.exam_id ?? row.examId ?? '');
        if (rowExam && examId && rowExam !== String(examId) && rowExam.replace(/^(exam|ex)[-_]/i, '') !== String(examId).replace(/^(exam|ex)[-_]/i, '')) {
          continue;
        }
        const rowRoll = String(row.roll ?? row.student_roll ?? row.studentId ?? row.student_id ?? row.id ?? '');
        const rowName = String(row.student_name ?? row.name ?? '').toLowerCase().trim();
        const matchesStudent = studentCandidates.some(
          (c) => c.toLowerCase() === rowRoll.toLowerCase() || (rowName && c.toLowerCase() === rowName) || rowRoll.replace(/^[0-9]+[A-Z]+-?/i, '') === c
        );
        if (!matchesStudent) continue;

        for (const [k, v] of Object.entries(row)) {
          if (v !== undefined && v !== null && v !== '' && normalizeSub(k) === targetSubNorm) {
            return v as any;
          }
        }
        if (row.subject && normalizeSub(row.subject) === targetSubNorm && (row.mark !== undefined || row.score !== undefined)) {
          return (row.mark ?? row.score) as any;
        }
      }
      return undefined;
    }

    if (typeof marksRecord !== 'object') return undefined;

    // Helper: search in an exam container (could be { subject: { student: mark } } OR { student: { subject: mark } })
    const searchInExamContainer = (container: any): number | string | undefined => {
      if (!container || typeof container !== 'object') return undefined;

      // 1. Structure: container[subject][student]
      for (const subKey of Object.keys(container)) {
        if (normalizeSub(subKey) === targetSubNorm) {
          const subObj = container[subKey];
          if (subObj && typeof subObj === 'object') {
            for (const c of studentCandidates) {
              if (subObj[c] !== undefined && subObj[c] !== null && subObj[c] !== '') return subObj[c];
              const foundK = Object.keys(subObj).find((k) => k.toLowerCase().trim() === c.toLowerCase().trim());
              if (foundK && subObj[foundK] !== undefined && subObj[foundK] !== null && subObj[foundK] !== '') return subObj[foundK];
            }
          } else if (subObj !== undefined && subObj !== null && subObj !== '' && typeof subObj !== 'object') {
            return subObj;
          }
        }
      }

      // 2. Structure: container[student][subject]
      for (const c of studentCandidates) {
        let studentObj = container[c];
        if (!studentObj) {
          const foundK = Object.keys(container).find((k) => k.toLowerCase().trim() === c.toLowerCase().trim());
          if (foundK) studentObj = container[foundK];
        }
        if (studentObj && typeof studentObj === 'object') {
          for (const subKey of Object.keys(studentObj)) {
            if (normalizeSub(subKey) === targetSubNorm) {
              const val = studentObj[subKey];
              if (val !== undefined && val !== null && val !== '') return val;
            }
          }
        }
      }

      return undefined;
    };

    // 1. Match specific exam ID
    let examObj = marksRecord[examId] ?? marksRecord[String(examId)];
    if (!examObj) {
      const cleanExamId = String(examId).replace(/^(exam|ex)[-_]/i, '').trim().toLowerCase();
      const matchExamKey = Object.keys(marksRecord).find((k) => {
        const kStr = String(k).trim().toLowerCase();
        if (kStr === String(examId).trim().toLowerCase()) return true;
        const cleanK = kStr.replace(/^(exam|ex)[-_]/i, '');
        if (cleanK === cleanExamId && cleanK !== '') return true;
        return false;
      });
      if (matchExamKey) examObj = marksRecord[matchExamKey];
    }

    if (examObj) {
      const found = searchInExamContainer(examObj);
      if (found !== undefined) return found;
    }

    // 2. Search directly in root marksRecord
    const rootFound = searchInExamContainer(marksRecord);
    if (rootFound !== undefined) return rootFound;

    // 3. Search in all child containers
    for (const subContainer of Object.values(marksRecord)) {
      if (subContainer && typeof subContainer === 'object') {
        const anyFound = searchInExamContainer(subContainer);
        if (anyFound !== undefined) return anyFound;
      }
    }

    return undefined;
  };

  const classSubjectsForMarks = useMemo(() => {
    const defaultSubs = getSubjectsForClass(selectedMarksClass);
    const set = new Set<string>(defaultSubs);
    const effectiveExamId = selectedMarksExamId || (marksExams[0]?.id ?? '');
    if (effectiveExamId && schedules[effectiveExamId]?.[selectedMarksClass]) {
      const clsSched = schedules[effectiveExamId][selectedMarksClass];
      Object.values(clsSched).forEach((entries) => {
        if (Array.isArray(entries)) {
          entries.forEach((e) => {
            if (e.subject && e.subject !== 'All Subjects') {
              set.add(e.subject);
            }
          });
        }
      });
    }
    if (studentMarks) {
      Object.values(studentMarks).forEach((exMap) => {
        if (exMap && typeof exMap === 'object') {
          Object.keys(exMap).forEach((s) => {
            if (s && s !== 'All Subjects') set.add(s);
          });
        }
      });
    }
    return Array.from(set);
  }, [selectedMarksClass, selectedMarksExamId, marksExams, schedules, studentMarks]);

  const handleClearStudentMarks = async (student: any) => {
    if (await confirm(`Are you sure you want to clear all subject marks for ${student.name}? This will put them in a cleared state, which you can save.`, 'Clear Marks')) {
      const effectiveExamId = selectedMarksExamId || (marksExams[0]?.id ?? 'default_exam');
      classSubjectsForMarks.forEach((sub) => {
        handleUpdateStudentMark(effectiveExamId, sub, student.roll, "", student.id);
      });
    }
  };


  const getDynamicAvatarColor = (init: string) => {
    const palette = [
      { bg: 'var(--teal-bg)', color: 'var(--teal-tx)' },
      { bg: 'var(--blue-bg)', color: 'var(--blue-tx)' },
      { bg: 'var(--purple-bg)', color: 'var(--purple-tx)' },
      { bg: 'var(--amber-bg)', color: 'var(--amber-tx)' },
      { bg: 'var(--coral-bg)', color: 'var(--coral-tx)' },
    ];
    let sum = 0;
    for (let i = 0; i < init.length; i++) {
      sum += init.charCodeAt(i);
    }
    return palette[sum % palette.length];
  };

  const getStudentClass = (s: any): string => {
    if (s.batch && s.batch.name) return String(s.batch.name).trim();
    if (s.batch_name) return String(s.batch_name).trim();
    if (s.className) return String(s.className).trim();
    if (s.class) {
      const clsStr = String(s.class).trim();
      if (s.section) {
        const secStr = String(s.section).trim();
        if (!clsStr.toUpperCase().endsWith(secStr.toUpperCase())) {
          return `${clsStr}${secStr}`;
        }
      }
      return clsStr;
    }
    return '';
  };

  const getFilteredStudentsForClass = (className: string) => {
    const normalizeCls = (str: string) =>
      String(str || '')
        .replace(/^(Class|Grade)\s*/i, '')
        .replace(/(\d+)(st|nd|rd|th)/i, '$1')
        .replace(/[\s\-_]/g, '')
        .toUpperCase();

    const targetClassClean = normalizeCls(className);

    let dbFiltered: any[] = [];
    if (Array.isArray(students) && students.length > 0) {
      dbFiltered = students.filter((s: any) => {
        const stClass = getStudentClass(s);
        if (!stClass) return false;
        const stClassClean = normalizeCls(stClass);

        if (stClassClean === targetClassClean) return true;

        const targetMatch = targetClassClean.match(/^(\d+)([A-Z]*)$/);
        const stMatch = stClassClean.match(/^(\d+)([A-Z]*)$/);

        if (targetMatch && stMatch) {
          const [, targetNum, targetSec] = targetMatch;
          const [, stNum, stSec] = stMatch;
          if (targetNum === stNum) {
            if (!targetSec || !stSec || targetSec === stSec) {
              return true;
            }
          }
        }
        return false;
      });
    }

    const resultList: any[] = dbFiltered.map((s: any, idx: number) => {
      const fullName = s.name || (s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : `Student ${idx + 1}`);
      const nameParts = fullName.trim().split(/\s+/);
      const initials = nameParts.length > 1
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : fullName.slice(0, 2).toUpperCase();
      const roll = s.roll || s.enrollment_number || s.roll_no || s.student_pen_no || `${targetClassClean || 'ST'}-${String(idx + 1).padStart(3, '0')}`;
      return {
        id: String(s.id || idx),
        name: fullName,
        roll: String(roll),
        init: initials || 'ST',
        idx,
      };
    });

    // Also include any students with marks present in studentMarks
    const allKnownMarksKeys = new Set<string>();
    Object.values(studentMarks).forEach((examMap) => {
      if (examMap && typeof examMap === 'object') {
        Object.values(examMap).forEach((subMap) => {
          if (subMap && typeof subMap === 'object') {
            Object.keys(subMap).forEach((k) => {
              if (k && k !== 'undefined' && k !== 'null') allKnownMarksKeys.add(k);
            });
          }
        });
      }
    });

    allKnownMarksKeys.forEach((key) => {
      const cleanKey = key.replace(/^[0-9]+[A-Z]+-?/i, '');
      const alreadyExists = resultList.some(
        (r) =>
          r.roll === key ||
          r.id === key ||
          r.roll.replace(/^[0-9]+[A-Z]+-?/i, '') === cleanKey ||
          r.name.toLowerCase().trim() === key.toLowerCase().trim()
      );

      if (!alreadyExists) {
        const matchedStudent = Array.isArray(students)
          ? students.find(
              (s: any) =>
                String(s.id) === key ||
                String(s.enrollment_number) === key ||
                String(s.roll) === key ||
                String(s.name).toLowerCase().trim() === key.toLowerCase().trim()
            )
          : null;

        const name = matchedStudent?.name || (isNaN(Number(key)) ? key : `Student ${key}`);
        const nameParts = name.trim().split(/\s+/);
        const initials = nameParts.length > 1
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase();

        resultList.push({
          id: matchedStudent ? String(matchedStudent.id) : key,
          name: name,
          roll: matchedStudent?.enrollment_number || matchedStudent?.roll || key,
          init: initials || 'ST',
          idx: resultList.length,
        });
      }
    });

    // Fallback: If still empty but students exist in the DB, return all students
    if (resultList.length === 0 && Array.isArray(students) && students.length > 0) {
      return students.map((s: any, idx: number) => {
        const fullName = s.name || (s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : `Student ${idx + 1}`);
        const nameParts = fullName.trim().split(/\s+/);
        const initials = nameParts.length > 1
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : fullName.slice(0, 2).toUpperCase();
        const roll = s.roll || s.enrollment_number || s.roll_no || s.student_pen_no || `${String(idx + 1).padStart(3, '0')}`;
        return {
          id: String(s.id || idx),
          name: fullName,
          roll: String(roll),
          init: initials || 'ST',
          idx,
        };
      });
    }

    return resultList;
  };

  const getFilteredStudentsForMarks = () => {
    return getFilteredStudentsForClass(selectedMarksClass);
  };

  const studentsToShow = getFilteredStudentsForMarks();

  const computeStudentMarksDetail = (studentRoll: string, _studentIdx: number, studentId?: string, studentName?: string) => {
    const effectiveExamId = selectedMarksExamId || (marksExams[0]?.id ?? 'default_exam');
    const selectedExamObj = exams.find((e) => e.id === effectiveExamId);
    const fallbackMax = selectedExamObj?.maxMarks || 100;
    const cleanRoll = studentRoll.replace(/^[0-9]+[A-Z]+-?/i, '');

    let hasAnyMark = false;
    let totalMarksObtained = 0;

    const subjectBreakdown = classSubjectsForMarks.map((sub) => {
      const maxMarks = getMaxMarksForSubject(effectiveExamId, selectedMarksClass, sub, fallbackMax);

      // Draft takes priority over committed DB value
      const savedDraft = findMarkValue(draftMarks, effectiveExamId, sub, studentRoll, studentId, cleanRoll, studentName);
      const savedDb = findMarkValue(studentMarks, effectiveExamId, sub, studentRoll, studentId, cleanRoll, studentName);
      const saved = savedDraft !== undefined ? savedDraft : savedDb;

      let mark: number | null = null;

      if (saved !== undefined && saved !== null && saved !== '') {
        const num = Number(saved);
        if (!isNaN(num)) {
          mark = Math.min(maxMarks, Math.max(0, num));
          hasAnyMark = true;
          totalMarksObtained += mark;
        }
      }

      const pct = mark !== null && maxMarks > 0 ? Math.round((mark / maxMarks) * 100) : null;
      const grade = pct !== null ? (pct >= 90 ? 'A+' : pct >= 75 ? 'A' : pct >= 65 ? 'B+' : pct >= 50 ? 'B' : 'C') : '--';

      return {
        subject: sub,
        mark,
        maxMarks,
        pct,
        pctDisplay: pct !== null ? `${pct}%` : '--',
        grade,
      };
    });

    const totalMaxMarks = subjectBreakdown.reduce((sum, item) => sum + item.maxMarks, 0);
    const overallPct = hasAnyMark && totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : null;
    const overallGrade = overallPct !== null ? (overallPct >= 90 ? 'A+' : overallPct >= 75 ? 'A' : overallPct >= 65 ? 'B+' : overallPct >= 50 ? 'B' : 'C') : '--';

    return {
      subjectBreakdown,
      totalMaxMarks,
      totalMarksObtained,
      totalMarksObtainedDisplay: hasAnyMark ? totalMarksObtained : '--',
      overallPct,
      overallPctDisplay: overallPct !== null ? `${overallPct}%` : '--',
      overallGrade,
      hasAnyMark,
    };
  };

  const computeStudentMarksDetailForResults = (studentRoll: string, studentId: string, className: string, examId: string, studentName?: string) => {
    const effectiveExamId = examId || (exams[0]?.id ?? 'default_exam');
    const selectedExamObj = exams.find((e) => e.id === effectiveExamId);
    const fallbackMax = selectedExamObj?.maxMarks || 100;
    const cleanRoll = studentRoll.replace(/^[0-9]+[A-Z]+-?/i, '');
    const classSubjects = getSubjectsForClass(className);

    let hasAnyMark = false;
    let totalMarksObtained = 0;

    const subjectBreakdown = classSubjects.map((sub) => {
      const maxMarks = getMaxMarksForSubject(effectiveExamId, className, sub, fallbackMax);

      const savedDraft = findMarkValue(draftMarks, effectiveExamId, sub, studentRoll, studentId, cleanRoll, studentName);
      const savedDb = findMarkValue(studentMarks, effectiveExamId, sub, studentRoll, studentId, cleanRoll, studentName);
      const saved = savedDraft !== undefined ? savedDraft : savedDb;

      let mark: number | null = null;

      if (saved !== undefined && saved !== null && saved !== '') {
        const num = Number(saved);
        if (!isNaN(num)) {
          mark = Math.min(maxMarks, Math.max(0, num));
          hasAnyMark = true;
          totalMarksObtained += mark;
        }
      }

      return {
        subject: sub,
        mark,
        maxMarks,
      };
    });

    const totalMaxMarks = subjectBreakdown.reduce((sum, item) => sum + item.maxMarks, 0);
    const overallPct = hasAnyMark && totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : null;
    const overallGrade = overallPct !== null ? (overallPct >= 90 ? 'A+' : overallPct >= 75 ? 'A' : overallPct >= 65 ? 'B+' : overallPct >= 50 ? 'B' : 'C') : '--';

    return {
      subjectBreakdown,
      totalMaxMarks,
      totalMarksObtained,
      overallPct,
      overallGrade,
      hasAnyMark,
    };
  };

  const getRealResultsForTab = () => {
    const list = getFilteredStudentsForClass(selectedClass);
    const effectiveExamId = selectedResultsExamId || (exams[0]?.id ?? 'default_exam');
    
    const resultsWithScores = list.map((st) => {
      const detail = computeStudentMarksDetailForResults(st.roll, st.id, selectedClass, effectiveExamId, st.name);
      return {
        ...st,
        detail,
        total: detail.totalMarksObtained,
        maxTotal: detail.totalMaxMarks,
        percentage: detail.overallPct ?? 0,
        grade: detail.overallGrade,
        hasAnyMark: detail.hasAnyMark,
      };
    });

    const sorted = [...resultsWithScores].sort((a, b) => {
      if (a.hasAnyMark && !b.hasAnyMark) return -1;
      if (!a.hasAnyMark && b.hasAnyMark) return 1;
      if (a.hasAnyMark && b.hasAnyMark) {
        return b.percentage - a.percentage;
      }
      return a.name.localeCompare(b.name);
    });
    
    let currentRank = 1;
    return sorted.map((item) => {
      if (item.hasAnyMark) {
        return {
          ...item,
          rank: currentRank++,
        };
      } else {
        return {
          ...item,
          rank: null,
        };
      }
    });
  };

  const getDynamicMetrics = () => {
    const list = getRealResultsForTab().filter((r) => r.hasAnyMark);
    if (list.length === 0) {
      return {
        classAvg: 0,
        topScore: 0,
        topStudent: 'N/A',
      };
    }
    const classAvg = list.reduce((sum, r) => sum + r.percentage, 0) / list.length;
    const topStudentObj = list.reduce((top, r) => (r.percentage > top.percentage ? r : top), list[0]);
    return {
      classAvg,
      topScore: topStudentObj.percentage,
      topStudent: topStudentObj.name,
    };
  };

  const getSubjectAverages = () => {
    const list = getRealResultsForTab().filter((r) => r.hasAnyMark);
    const subjects = getSubjectsForClass(selectedClass);
    if (list.length === 0) {
      return subjects.map((sub) => ({ subject: sub, avg: 0 }));
    }
    return subjects.map((sub) => {
      let sum = 0;
      let count = 0;
      list.forEach((r) => {
        const found = r.detail.subjectBreakdown.find((item: any) => item.subject === sub);
        if (found && found.mark !== null) {
          const pct = found.maxMarks > 0 ? (found.mark / found.maxMarks) * 100 : 0;
          sum += pct;
          count++;
        }
      });
      return {
        subject: sub,
        avg: count > 0 ? parseFloat((sum / count).toFixed(1)) : 0,
      };
    });
  };

  const getGradeDistribution = () => {
    const list = getRealResultsForTab().filter((r) => r.hasAnyMark);
    const counts: Record<string, number> = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0 };
    list.forEach((r) => {
      if (counts[r.grade] !== undefined) {
        counts[r.grade]++;
      }
    });
    return [
      { grade: 'A+', count: counts['A+'], color: 'var(--purple)' },
      { grade: 'A', count: counts['A'], color: 'var(--teal)' },
      { grade: 'B+', count: counts['B+'], color: 'var(--blue)' },
      { grade: 'B', count: counts['B'], color: 'var(--amber)' },
      { grade: 'C', count: counts['C'], color: 'var(--red)' },
    ];
  };

  const realResultsList = getRealResultsForTab();
  const metrics = getDynamicMetrics();
  const subjectAverages = getSubjectAverages();
  const gradeDistribution = getGradeDistribution();

  const classAvg = metrics.classAvg;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'exams', label: 'Exam Schedule' },
    { id: 'results', label: 'Results & Rankings' },
    // Marks tab is only visible to Admin and Faculty/Teacher
    ...(canAccessMarks ? [{ id: 'marks' as Tab, label: isAdmin ? 'Marks Preview' : 'Marks Entry' }] : []),
    { id: 'designer', label: isAdmin ? 'Schedule Designer' : 'Schedule Preview' },
    { id: 'invisilation', label: isAdmin ? 'Allot Invisilation' : 'Exam Invisilation' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label="Upcoming Exams" value={exams.filter((e) => e.status === 'Upcoming').length} sub="This month" icon={<BookOpen size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Class Average" value={`${classAvg.toFixed(1)}%`} sub={`Class ${selectedClass} · Selected Exam`} icon={<BarChart2 size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Top Score" value={`${metrics.topScore.toFixed(1)}%`} sub={metrics.topStudent !== 'N/A' ? metrics.topStudent : 'No score yet'} icon={<Award size={15} />} iconBg="var(--purple-bg)" iconColor="var(--purple-tx)" />
        <KPICard label="Results Published" value={exams.filter((e) => e.status === 'Results Published').length} sub="Exams" icon={<TrendingUp size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--b)] mb-3">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 text-[12px] border-b-2 -mb-px transition-colors cursor-pointer ${activeTab === tab.id ? 'text-[var(--blue-tx)] border-[var(--blue)] font-semibold' : 'text-[var(--tx3)] border-transparent hover:text-[var(--tx)]'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'exams' && (
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4 bg-[var(--surf2)]/40 p-3 border border-[var(--b)] rounded-xl">
            <div className="flex flex-1 flex-col sm:flex-row gap-2 w-full">
              <input
                type="text"
                placeholder="Search exams by name..."
                value={examSearch}
                onChange={(e) => setExamSearch(e.target.value)}
                className="px-3 py-1.5 bg-[var(--surf)] border border-[var(--b2)] rounded-lg text-[12px] text-[var(--tx)] focus:outline-none focus:border-[var(--blue)]"
              />
              <select
                value={examStatusFilter}

                onChange={(e) => setExamStatusFilter(e.target.value)}
                className="bg-[var(--surf)] border border-[var(--b2)] rounded-lg px-3 py-1.5 text-[12px] text-[var(--tx)] cursor-pointer outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
                <option value="Results Published">Results Published</option>
              </select>
              <select
                value={examSortField}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setExamSortField(val);
                  setExamSortOrder('asc');
                }}
                className="bg-[var(--surf)] border border-[var(--b2)] rounded-lg px-3 py-1.5 text-[12px] text-[var(--tx)] cursor-pointer outline-none"
              >
                <option value="">No Sorting</option>
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
              </select>
            </div>

            <div className="flex gap-2 self-end sm:self-center">
              <button onClick={exportExamsToExcel} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg cursor-pointer hover:bg-[var(--surf3)] text-[var(--tx)] font-semibold">
                Export
              </button>
              <label className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[var(--b)] bg-[var(--surf2)] rounded-lg cursor-pointer hover:bg-[var(--surf3)] text-[var(--tx)] font-semibold">
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportExamsExcel} className="hidden" />
                Import
              </label>
              {isAdmin && (
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90 font-semibold">
                  <Plus size={12} /> Create Exam
                </button>
              )}
            </div>
          </div>

          {selectedExamIds.length > 0 && (
            <div className="flex items-center justify-between bg-[var(--blue-bg)] border border-[var(--blue-tx)]/25 rounded-lg p-3 mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <span className="text-[12px] text-[var(--blue-tx)] font-semibold">{selectedExamIds.length} exams selected</span>
              <div className="flex gap-2">
                <button onClick={() => handleBulkExamStatusChange('Upcoming')} className="px-2.5 py-1 text-[11px] bg-[var(--blue-bg)] text-[var(--blue-tx)] border border-[var(--blue-tx)]/20 rounded-md font-semibold hover:opacity-90 cursor-pointer">Mark Upcoming</button>
                <button onClick={() => handleBulkExamStatusChange('Completed')} className="px-2.5 py-1 text-[11px] bg-[var(--amber-bg)] text-[var(--amber-tx)] border border-[var(--amber-tx)]/20 rounded-md font-semibold hover:opacity-90 cursor-pointer">Mark Completed</button>
                <button onClick={handleBulkExamDelete} className="px-2.5 py-1 text-[11px] bg-[var(--red-bg)] text-[var(--red-tx)] border border-[var(--red-tx)]/25 rounded-md font-semibold hover:opacity-90 cursor-pointer">Delete Exams</button>
              </div>
            </div>
          )}

          {sortedExams.map((exam) => {
            const isSelected = selectedExamIds.includes(exam.id);
            return (
              <div
                key={exam.id}
                onClick={() => handleExamCardClick(exam)}
                className={`bg-[var(--surf)] border border-[var(--b)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:border-[var(--blue)]/50 hover:shadow-md transition-all ${isSelected ? 'bg-[var(--blue-bg)]/10' : ''}`}
              >
                <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedExamIds(prev => [...prev, exam.id]);
                      } else {
                        setSelectedExamIds(prev => prev.filter(id => id !== exam.id));
                      }
                    }}
                    className="cursor-pointer rounded border-[var(--b)]"
                  />
                </div>
                <div className="w-12 h-12 rounded-xl bg-[var(--blue-bg)] flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} className="text-[var(--blue-tx)]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-bold text-[var(--tx)]">{exam.name}</span>
                    {exam.status === 'Upcoming' && <Badge variant="blue">Upcoming</Badge>}
                    {exam.status === 'Completed' && <Badge variant="amber">Completed</Badge>}
                    {exam.status === 'Results Published' && <Badge variant="teal">Results Published</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-[11.5px] text-[var(--tx3)]">
                    <span>Class {exam.class}</span>
                    <span>Subjects: {exam.subject}</span>
                    <span>Date: {formatDate(exam.date)}</span>
                    <span>Max Marks: {exam.maxMarks}</span>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0 items-center">
                  {exam.status === 'Completed' && (
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1.5 text-[11px] bg-[var(--teal-bg)] text-[var(--teal-tx)] rounded-lg cursor-pointer font-medium"
                    >
                      Enter Marks
                    </button>
                  )}
                  {exam.status === 'Results Published' && (
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1.5 text-[11px] bg-[var(--blue-bg)] text-[var(--blue-tx)] rounded-lg cursor-pointer font-medium"
                    >
                      View Results
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      disabled={exam.status !== 'Upcoming'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteExam(exam.id);
                      }}
                      className="p-1.5 rounded-lg text-[var(--tx3)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent enabled:hover:bg-[var(--red-bg)] enabled:hover:text-[var(--red-tx)] enabled:cursor-pointer"
                      title={exam.status === 'Upcoming' ? "Delete Exam" : "Cannot delete completed or published exam"}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-2.5">
          <Card>
            <div className="flex items-center justify-between mb-3 border-b border-[var(--b)] pb-3">
              <div>
                <div className="text-[13px] font-bold text-[var(--tx)]">Results — {exams.find(e => e.id === selectedResultsExamId)?.name || 'Exam Results'}</div>
                <div className="text-[10.5px] text-[var(--tx3)] mt-0.5">Rankings based on overall percentage obtained</div>
              </div>
              <div className="flex gap-2">
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[11.5px] cursor-pointer outline-none text-[var(--tx)] font-semibold">
                  {activeClassList.map((c) => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
                <select
                  value={selectedResultsExamId}
                  onChange={(e) => setSelectedResultsExamId(e.target.value)}
                  disabled={resultsExams.length === 0}
                  className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[11.5px] cursor-pointer outline-none text-[var(--tx)] font-semibold disabled:opacity-50"
                >
                  {resultsExams.length === 0 ? (
                    <option value="">No exams available</option>
                  ) : (
                    resultsExams.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              {realResultsList.length === 0 ? (
                <div className="text-center py-12 text-[12px] text-[var(--tx3)]">
                  No marks have been recorded yet for Class {selectedClass} in this exam.
                </div>
              ) : (
                <table className="w-full border-collapse text-[12px] min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[var(--b)]">
                      <th className="text-[10.5px] font-semibold text-[var(--tx3)] text-left px-2 py-2">Rank</th>
                      <th className="text-[10.5px] font-semibold text-[var(--tx3)] text-left px-2 py-2">Student</th>
                      {getSubjectsForClass(selectedClass).map((sub) => (
                        <th key={sub} className="text-[10.5px] font-semibold text-[var(--tx3)] text-left px-2 py-2">{sub}</th>
                      ))}
                      <th className="text-[10.5px] font-semibold text-[var(--tx3)] text-left px-2 py-2">Total</th>
                      <th className="text-[10.5px] font-semibold text-[var(--tx3)] text-left px-2 py-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {realResultsList.map((r) => (
                      <tr key={r.roll} className="border-b border-[var(--b)] hover:bg-[var(--surf2)] last:border-0">
                        <td className="px-2 py-2.5 font-bold text-[var(--tx3)]">
                          {r.rank !== null ? `#${r.rank}` : '--'}
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar initials={r.init} bg={getDynamicAvatarColor(r.init).bg} color={getDynamicAvatarColor(r.init).color} />
                            <span className="font-semibold text-[var(--tx)]">{r.name}</span>
                          </div>
                        </td>
                        {r.detail.subjectBreakdown.map((subItem: any, i: number) => (
                          <td key={i} className={`px-2 py-2.5 font-semibold ${subItem.mark !== null && subItem.mark >= (subItem.maxMarks * 0.85) ? 'text-[var(--teal-tx)]' : subItem.mark !== null && subItem.mark >= (subItem.maxMarks * 0.35) ? 'text-[var(--tx)]' : 'text-[var(--red-tx)]'}`}>
                            {subItem.mark !== null ? subItem.mark : '--'}
                          </td>
                        ))}
                        <td className="px-2 py-2.5 font-bold text-[var(--tx)]">
                          {r.hasAnyMark ? `${r.total}/${r.maxTotal}` : '--'}
                          {r.hasAnyMark && (
                            <span className="font-normal text-[var(--tx3)] text-[10.5px]"> ({r.percentage}%)</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5">
                          {r.hasAnyMark ? (
                            <Badge variant={r.grade === 'A+' ? 'purple' : r.grade === 'A' ? 'teal' : r.grade === 'B+' ? 'blue' : 'amber'}>
                              {r.grade}
                            </Badge>
                          ) : (
                            <span className="text-[12px] text-[var(--tx3)] font-medium">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          <div className="space-y-2.5">
            <Card>
              <div className="text-[12.5px] font-semibold text-[var(--tx)] mb-3">Subject Averages (%)</div>
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={subjectAverages} barSize={20} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--b)" />
                    <XAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Average']} cursor={{ fill: 'var(--surf2)' }} />
                    <Bar dataKey="avg" fill="var(--purple)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <div className="text-[12.5px] font-semibold text-[var(--tx)] mb-3">Grade Distribution</div>
              <div className="space-y-2">
                {gradeDistribution.map(({ grade, count, color }) => (
                  <div key={grade} className="flex items-center gap-3">
                    <span className="w-8 text-[12px] font-bold text-[var(--tx)]">{grade}</span>
                    <div className="flex-1 h-2 bg-[var(--surf2)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${realResultsList.filter(r => r.hasAnyMark).length > 0 ? (count / realResultsList.filter(r => r.hasAnyMark).length) * 100 : 0}%`, background: color }} />
                    </div>
                    <span className="text-[11px] text-[var(--tx3)] w-6">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'marks' && canAccessMarks && (
        <Card>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 border-b border-[var(--b)] pb-3">
            <div>
              <div className="text-[13.5px] font-bold text-[var(--tx)]">
                {isAdmin ? 'Marks Preview' : 'Marks Entry'}
              </div>
              <div className="text-[11px] text-[var(--tx3)] mt-0.5">
                {isAdmin ? 'Overall student results across all classes. Click any student row to view/edit subject-wise marks breakdown.' : 'View overall and subject-wise student marks.'}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {!isAdmin && !isTeacherAssignedToClass(selectedMarksClass) && (
                <div className="p-2.5 bg-[var(--amber-bg)] border border-[var(--amber)]/30 rounded-lg text-[11px] text-[var(--amber-tx)] font-semibold flex items-center gap-1.5 shadow-sm">
                  <AlertCircle size={13} />
                  <span>Read-Only mode. (Assigned class teacher only)</span>
                </div>
              )}
              <select
                value={selectedMarksClass}
                onChange={(e) => setSelectedMarksClass(e.target.value)}
                className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-1.5 text-[12px] cursor-pointer outline-none text-[var(--tx)] font-medium"
              >
                {filteredClassList.map((c) => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
              <select
                value={selectedMarksExamId}
                onChange={(e) => setSelectedMarksExamId(e.target.value)}
                disabled={marksExams.length === 0}
                className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-1.5 text-[12px] cursor-pointer outline-none text-[var(--tx)] font-medium disabled:opacity-50"
              >
                {marksExams.length === 0 ? (
                  <option value="">No completed exams</option>
                ) : (
                  marksExams.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {marksExams.length === 0 ? (
              <div className="text-center py-12 text-[12px] text-[var(--tx3)]">
                No completed exams available for Class {selectedMarksClass}.
              </div>
            ) : studentsToShow.length === 0 ? (
              <div className="text-center py-8 text-[12px] text-[var(--tx3)]">
                No students found in Class {selectedMarksClass}.
              </div>
            ) : (
              <table className="w-full border-collapse text-[12px] min-w-[680px]">
                <thead>
                  <tr className="border-b border-[var(--b)]">
                    <th className="text-[11px] font-semibold text-[var(--tx3)] text-left px-3 py-2.5">Student Name</th>
                    <th className="text-[11px] font-semibold text-[var(--tx3)] text-left px-3 py-2.5">Roll No</th>
                    <th className="text-[11px] font-semibold text-[var(--tx3)] text-left px-3 py-2.5">Max Marks</th>
                    <th className="text-[11px] font-semibold text-[var(--tx3)] text-left px-3 py-2.5">Marks Obtained</th>
                    <th className="text-[11px] font-semibold text-[var(--tx3)] text-left px-3 py-2.5">Percentage</th>
                    <th className="text-[11px] font-semibold text-[var(--tx3)] text-left px-3 py-2.5">Grade</th>
                    <th className="text-[11px] font-semibold text-[var(--tx3)] text-right px-3 py-2.5">Subject Breakdown</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsToShow.map((student) => {
                    const detail = computeStudentMarksDetail(student.roll, student.idx, student.id, student.name);
                    const isExpanded = !!expandedStudentRolls[student.roll];
                    const avatarColor = getDynamicAvatarColor(student.init);
                    const canEdit = isAdmin || isTeacherAssignedToClass(selectedMarksClass);

                    return (
                      <Fragment key={student.roll}>
                        <tr
                          onClick={() => toggleStudentExpand(student.roll)}
                          className={`border-b border-[var(--b)] transition-colors cursor-pointer ${isExpanded ? 'bg-[var(--surf2)] font-semibold' : 'hover:bg-[var(--surf2)]'
                            }`}
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar initials={student.init} bg={avatarColor.bg} color={avatarColor.color} />
                              <span className="font-bold text-[13px] text-[var(--tx)]">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-mono text-[11.5px] text-[var(--tx3)]">{student.roll}</td>
                          <td className="px-3 py-3 text-[12px] text-[var(--tx3)]">{detail.totalMaxMarks}</td>
                          <td className="px-3 py-3 font-bold text-[13px] text-[var(--tx)]">{detail.totalMarksObtainedDisplay}</td>
                          <td className="px-3 py-3 font-bold text-[13px] text-[var(--tx)]">{detail.overallPctDisplay}</td>
                          <td className="px-3 py-3">
                            {detail.hasAnyMark ? (
                              <Badge variant={detail.overallGrade === 'A+' ? 'purple' : detail.overallGrade === 'A' ? 'teal' : detail.overallGrade === 'B+' ? 'blue' : 'amber'}>
                                {detail.overallGrade}
                              </Badge>
                            ) : (
                              <span className="text-[12px] text-[var(--tx3)] font-medium">--</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStudentExpand(student.roll);
                              }}
                              className="p-1.5 rounded-lg text-[var(--tx3)] hover:bg-[var(--surf3)] transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px]"
                              title="Toggle Subject Marks"
                            >
                              <span>{isExpanded ? 'Hide Subjects' : 'View Subjects'}</span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-[var(--surf2)] border-b border-[var(--b)]">
                            <td colSpan={7} className="p-3.5">
                              <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-4 shadow-sm space-y-3">
                                <div className="flex items-center justify-between border-b border-[var(--b)] pb-2.5">
                                  <div className="text-[12.5px] font-bold text-[var(--tx)] flex items-center gap-2">
                                    <BookOpen size={14} className="text-[var(--blue-tx)]" />
                                    Subject-wise Marks for Class {selectedMarksClass} — <span className="text-[var(--blue-tx)]">{student.name}</span> (Roll: {student.roll})
                                    {canEdit && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleClearStudentMarks(student);
                                        }}
                                        className="ml-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--red-bg)] text-[var(--red-tx)] border border-[var(--red-tx)]/25 hover:opacity-90 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1"
                                        title="Clear all subject marks"
                                      >
                                        Clear Marks
                                      </button>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-[var(--tx3)] font-medium">
                                    {isAdmin ? 'Admin Edit Mode: Adjust subject marks below' : isTeacherAssignedToClass(selectedMarksClass) ? 'Faculty Marks Entry Mode: Adjust subject marks below' : 'Read-Only Mode: Unassigned Class Teacher'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                  {detail.subjectBreakdown.map((subItem) => {
                                    const canEditMarks = isAdmin || isTeacherAssignedToClass(selectedMarksClass);

                                    return (
                                      <div key={subItem.subject} className="p-3 bg-[var(--surf2)]/70 border border-[var(--b)] rounded-xl flex items-center justify-between gap-2">
                                        <div>
                                          <div className="text-[12px] font-bold text-[var(--tx)]">{subItem.subject}</div>
                                          <div className="text-[10px] text-[var(--tx3)] mt-0.5">Max Marks: {subItem.maxMarks}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {canEditMarks ? (
                                            <input
                                              type="number"
                                              value={subItem.mark !== null ? subItem.mark : ''}
                                              placeholder="--"
                                              min={0}
                                              max={subItem.maxMarks}
                                              onClick={(e) => e.stopPropagation()}
                                              onChange={(e) => {
                                                const raw = e.target.value;
                                                if (raw === '') {
                                                  handleUpdateStudentMark(selectedMarksExamId, subItem.subject, student.roll, null, student.id);
                                                } else {
                                                  let val = Number(raw);
                                                  if (isNaN(val)) return;
                                                  if (val > subItem.maxMarks) {
                                                    val = subItem.maxMarks;
                                                  }
                                                  if (val < 0) {
                                                    val = 0;
                                                  }
                                                  handleUpdateStudentMark(selectedMarksExamId, subItem.subject, student.roll, val, student.id);
                                                }
                                              }}
                                              className="w-14 bg-[var(--surf)] border border-[var(--b)] rounded-lg px-2 py-1 text-[12px] font-bold text-[var(--tx)] text-center outline-none focus:border-[var(--blue)] shadow-inner placeholder:text-[var(--tx3)] placeholder:font-bold"
                                            />
                                          ) : (
                                            <span className="font-bold text-[12.5px] text-[var(--tx)]">
                                              {subItem.mark !== null ? subItem.mark : '--'}
                                            </span>
                                          )}
                                          <span className="text-[11px] font-semibold text-[var(--tx2)]">({subItem.pctDisplay})</span>
                                          {subItem.grade !== '--' ? (
                                            <Badge variant={subItem.grade === 'A+' ? 'purple' : subItem.grade === 'A' ? 'teal' : subItem.grade === 'B+' ? 'blue' : 'amber'}>
                                              {subItem.grade}
                                            </Badge>
                                          ) : (
                                            <span className="text-[11px] text-[var(--tx3)] font-medium">--</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {studentsToShow.length > 0 && marksExams.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--b)] flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11.5px] text-[var(--tx3)] font-medium">
                {!isAdmin
                  ? isTeacherAssignedToClass(selectedMarksClass)
                    ? 'Faculty Mode: Entered numbers remain in Draft Mode. Click "Save Marks" below to commit changes to the database and update Admin Preview.'
                    : 'Read-Only Mode: Only the assigned class teacher can enter or save marks for this class.'
                  : 'Admin Mode: You can view and edit marks for any class.'}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveMarks}
                  disabled={savingMarks || !selectedMarksExamId || (!isAdmin && !isTeacherAssignedToClass(selectedMarksClass))}
                  className="px-4 py-2 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {savingMarks ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Save Marks</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'designer' && (
        selectedExamId === null ? (
          <div className="space-y-4">
            <div className="text-[13.5px] font-semibold text-[var(--tx)] mb-2">
              Select an Exam to {isAdmin ? 'design its schedule' : 'preview its schedule'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {exams.map((exam) => {
                const examSchedules = schedules[exam.id] ?? {};
                const totalScheduledExams = Object.values(examSchedules).reduce((sum, clsSched) => {
                  return sum + Object.values(clsSched).reduce((s, arr) => s + arr.length, 0);
                }, 0);

                return (
                  <Card
                    key={exam.id}
                    onClick={() => {
                      setSelectedExamId(exam.id);
                      let targetClass = '8A';
                      if (exam.class !== 'All Classes') {
                        const classes = exam.class.split(',').map((c) => c.trim());
                        if (classes.length > 0) {
                          targetClass = classes[0];
                        }
                      }
                      setSelectedClass(targetClass);
                    }}
                    className="cursor-pointer hover:border-[var(--blue)]/50 hover:shadow-md transition-all p-4 flex flex-col justify-between min-h-[140px]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-bold text-[var(--tx)]">{exam.name}</span>
                        <Badge variant={totalScheduledExams > 0 ? 'teal' : 'gray'}>
                          {totalScheduledExams > 0 ? 'Scheduled' : 'Not Scheduled'}
                        </Badge>
                      </div>
                      <div className="text-[11.5px] text-[var(--tx3)] space-y-1 mt-1.5">
                        <div><span className="font-medium text-[var(--tx2)]">Classes:</span> {exam.class}</div>
                        <div><span className="font-medium text-[var(--tx2)]">Subject:</span> {exam.subject}</div>
                        <div><span className="font-medium text-[var(--tx2)]">Date:</span> {formatDate(exam.date)}</div>
                      </div>
                    </div>
                    <div className="mt-3.5 pt-3 border-t border-[var(--b)] flex justify-between items-center text-[11px] text-[var(--blue-tx)] font-semibold">
                      <span>{totalScheduledExams} entries scheduled</span>
                      <span>{isAdmin ? 'Open Designer →' : 'View Schedule →'}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          (() => {
            const selectedExam = exams.find((e) => e.id === selectedExamId);
            if (!selectedExam) {
              setSelectedExamId(null);
              return null;
            }
            return (
              <ExamScheduleDesigner
                isAdmin={isAdmin}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                classList={classList}
                exam={selectedExam}
                schedules={schedules}
                setSchedules={setSchedules}
                onBack={() => setSelectedExamId(null)}
              />
            );
          })()
        )
      )}

      {activeTab === 'invisilation' && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-[13.5px] font-bold text-[var(--tx)]">
                {isAdmin ? 'Exam Invisilation Allotment' : 'My Exam Invisilation Duties'}
              </div>
              <div className="text-[11px] text-[var(--tx3)] mt-0.5">
                {isAdmin ? 'Manage exam invigilator assignments for all staff members' : 'List of exam invigilation duties assigned to you'}
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setShowAllotModal(true);
                  if (exams.length > 0) {
                    setAllotExamId(exams[0].id);
                    setAllotSubject(exams[0].subject === 'All Subjects' ? 'Mathematics' : exams[0].subject);
                    setAllotDate(exams[0].date);
                    let cls = '8A';
                    if (exams[0].class !== 'All Classes') {
                      cls = exams[0].class.split(',')[0].trim();
                    }
                    setAllotClass(cls);
                  }
                  if (staffList.length > 0) {
                    setAllotStaffId(staffList[0].id);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[var(--blue)] text-white rounded-lg cursor-pointer hover:opacity-90 font-semibold"
              >
                <Plus size={12} /> Allot Invisilator
              </button>
            )}
          </div>

          {(() => {
            const displayList = isAdmin
              ? invigilations
              : invigilations.filter(
                (inv) =>
                  inv.staffName.toLowerCase() === (user?.name || '').toLowerCase() ||
                  inv.staffEmail.toLowerCase() === (user?.email || '').toLowerCase()
              );

            if (displayList.length === 0) {
              return (
                <div className="text-center py-12 text-[12px] text-[var(--tx3)]">
                  {isAdmin ? 'No invigilation duties scheduled.' : 'You have no exam invigilation duties assigned.'}
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px] min-w-[750px]">
                  <thead>
                    <tr className="border-b border-[var(--b)] text-[var(--tx3)]">
                      {['Date', 'Time Slot', 'Exam Name', 'Class', 'Subject', 'Room No', isAdmin ? 'Assigned Invisilator' : '', isAdmin ? 'Action' : ''].filter(Boolean).map((h) => (
                        <th key={h} className="text-[10.5px] font-medium text-left px-3 py-2 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayList.map((inv) => (
                      <tr key={inv.id} className="border-b border-[var(--b)] hover:bg-[var(--surf2)]/40 transition-colors last:border-0">
                        <td className="px-3 py-2.5 text-[var(--tx)] font-medium">{formatDate(inv.date)}</td>
                        <td className="px-3 py-2.5 text-[var(--tx2)]">{inv.timeSlot}</td>
                        <td className="px-3 py-2.5 text-[var(--tx)] font-semibold">{inv.examName}</td>
                        <td className="px-3 py-2.5 text-[var(--tx2)]">Class {inv.class}</td>
                        <td className="px-3 py-2.5 text-[var(--blue-tx)] font-semibold">{inv.subject}</td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-[var(--tx)]">{inv.room}</td>
                        {isAdmin && (
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <Avatar initials={inv.staffName.split(' ').map((n) => n[0]).join('').slice(0, 2)} bg="var(--purple-bg)" color="var(--purple-tx)" />
                              <div>
                                <span className="font-semibold text-[var(--tx)]">{inv.staffName}</span>
                                {inv.staffEmail && <div className="text-[9.5px] text-[var(--tx3)]">{inv.staffEmail}</div>}
                              </div>
                            </div>
                          </td>
                        )}
                        {isAdmin && (
                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => handleDeleteInvigilation(inv.id)}
                              className="p-1 rounded-lg hover:bg-[var(--red-bg)] text-[var(--tx3)] hover:text-[var(--red-tx)] cursor-pointer transition-colors"
                              title="Remove Assignment"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </Card>
      )}

      {/* Allot Invisilation Modal */}
      {showAllotModal && isAdmin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[445px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">Allot Exam Invisilator</div>
                <div className="text-[11px] text-[var(--tx3)] mt-0.5 font-medium">Assign a staff member to examination duty</div>
              </div>
              <button onClick={() => setShowAllotModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer text-[var(--tx3)]"><X size={16} /></button>
            </div>

            <div className="p-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Select Scheduled Exam *</label>
                <select
                  value={allotExamId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setAllotExamId(selectedId);
                    const selectedExam = exams.find((ex) => ex.id === selectedId);
                    if (selectedExam) {
                      setAllotSubject(selectedExam.subject === 'All Subjects' ? 'Mathematics' : selectedExam.subject);
                      setAllotDate(selectedExam.date);
                      let cls = '8A';
                      if (selectedExam.class !== 'All Classes') {
                        cls = selectedExam.class.split(',')[0].trim();
                      }
                      setAllotClass(cls);
                    }
                  }}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                >
                  <option value="">-- Choose Exam --</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} (Class {ex.class} · {formatDate(ex.date)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class Room *</label>
                  <select
                    value={allotClass}
                    onChange={(e) => setAllotClass(e.target.value)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none"
                  >
                    {classList.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Exam Subject *</label>
                  <select
                    value={allotSubject}
                    onChange={(e) => setAllotSubject(e.target.value)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none"
                  >
                    {SUBJECTS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={allotDate}
                    onChange={(e) => setAllotDate(e.target.value)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5 font-semibold">Time Slot *</label>
                  <select
                    value={allotTimeSlot}
                    onChange={(e) => setAllotTimeSlot(e.target.value)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none"
                  >
                    {['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Room Number *</label>
                  <input
                    type="text"
                    value={allotRoom}
                    onChange={(e) => setAllotRoom(e.target.value)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                    placeholder="Room 101"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5 font-semibold text-[var(--blue-tx)]">Assigned Invisilator *</label>
                  <select
                    value={allotStaffId}
                    onChange={(e) => setAllotStaffId(e.target.value)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none font-semibold focus:border-[var(--blue)]"
                  >
                    <option value="">-- Select Staff Member --</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.category || 'Teaching'} · {st.designation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => setShowAllotModal(false)} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] cursor-pointer">Cancel</button>
              <button
                onClick={handleAddInvigilation}
                disabled={!allotStaffId}
                className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-bold cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                Allot Duty
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[440px] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
              <div className="text-[14px] font-bold text-[var(--tx)]">Create Exam</div>
              <button onClick={() => { setShowCreate(false); setSelectedCreateClasses(['All Classes']); setShowClassDropdown(false); }} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Exam Name *</label>
                <input value={createName} onChange={(e) => setCreateName(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Unit Test 2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Class *</label>
                  <button
                    type="button"
                    onClick={() => setShowClassDropdown(!showClassDropdown)}
                    className="w-full flex items-center justify-between bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none text-left"
                  >
                    <span className="truncate pr-2">{selectedCreateClasses.join(', ')}</span>
                    <span className="text-[10px] text-[var(--tx3)]">▼</span>
                  </button>
                  {showClassDropdown && (
                    <div className="absolute left-0 right-0 mt-1 bg-[var(--surf)] border border-[var(--b)] rounded-lg shadow-lg max-h-[160px] overflow-y-auto z-[60] p-1.5 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCreateClasses(['All Classes']);
                          setShowClassDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-[12px] cursor-pointer transition-colors ${selectedCreateClasses.includes('All Classes')
                          ? 'bg-[var(--blue-bg)] text-[var(--blue-tx)] font-semibold'
                          : 'text-[var(--tx)] hover:bg-[var(--surf2)]'
                          }`}
                      >
                        All Classes
                      </button>
                      <div className="h-px bg-[var(--b)] my-1" />
                      {classList.map((c) => {
                        const isChecked = selectedCreateClasses.includes(c);
                        return (
                          <label
                            key={c}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[var(--surf2)] cursor-pointer text-[12px] text-[var(--tx)]"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  const updated = selectedCreateClasses.filter((item) => item !== c);
                                  setSelectedCreateClasses(updated.length === 0 ? ['All Classes'] : updated);
                                } else {
                                  const updated = selectedCreateClasses.filter((item) => item !== 'All Classes');
                                  setSelectedCreateClasses([...updated, c]);
                                }
                              }}
                              className="rounded border-[var(--b)] text-[var(--blue)] focus:ring-0 cursor-pointer"
                            />
                            Class {c}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Subject *</label>
                  <select value={createSubject} onChange={(e) => setCreateSubject(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none">
                    {['All Subjects', 'Mathematics', 'Science', 'English', 'Telugu', 'Hindi', 'Social Studies', 'Physics', 'Chemistry', 'Biology', 'EVS'].map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Exam Date *</label>
                  <input type="date" value={createDate} onChange={(e) => createDate !== e.target.value && setCreateDate(e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
                <div><label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Max Marks *</label>
                  <input type="number" value={createMaxMarks} onChange={(e) => setCreateMaxMarks(Number(e.target.value))} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button onClick={() => { setShowCreate(false); setSelectedCreateClasses(['All Classes']); setShowClassDropdown(false); }} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] text-[var(--tx)] cursor-pointer">Cancel</button>
              <button onClick={handleCreateExam} className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer">Create Exam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
