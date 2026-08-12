import { useState, useEffect, Fragment } from 'react';
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

const EXAMS: Exam[] = [
  { id: '1', name: 'Unit Test 1', subject: 'All Subjects', class: '8A', date: '2026-06-10', maxMarks: 25, status: 'Upcoming' },
  { id: '2', name: 'Half Yearly Exam', subject: 'All Subjects', class: '8A', date: '2026-06-25', maxMarks: 100, status: 'Upcoming' },
  { id: '3', name: 'Quarterly Test', subject: 'Mathematics', class: '8A', date: '2026-05-20', maxMarks: 50, status: 'Results Published' },
  { id: '4', name: 'Unit Test 3', subject: 'All Subjects', class: '9A', date: '2026-05-15', maxMarks: 25, status: 'Completed' },
];

const RESULTS: StudentResult[] = [
  { name: 'Priya Sharma', init: 'PS', roll: '8A-002', maths: 92, science: 88, english: 85, telugu: 90, social: 78, total: 433, percentage: 86.6, grade: 'A+', rank: 1 },
  { name: 'Arjun Reddy', init: 'AR', roll: '8B-001', maths: 88, science: 82, english: 79, telugu: 85, social: 84, total: 418, percentage: 83.6, grade: 'A', rank: 2 },
  { name: 'Ananya Singh', init: 'AS', roll: '8A-008', maths: 85, science: 90, english: 82, telugu: 76, social: 82, total: 415, percentage: 83, grade: 'A', rank: 3 },
  { name: 'Vikram K', init: 'VK', roll: '8A-010', maths: 78, science: 75, english: 88, telugu: 82, social: 80, total: 403, percentage: 80.6, grade: 'A', rank: 4 },
  { name: 'Meena Nair', init: 'MN', roll: '7B-004', maths: 65, science: 70, english: 74, telugu: 79, social: 68, total: 356, percentage: 71.2, grade: 'B+', rank: 5 },
];

const AVATAR_COLORS: Record<string, { bg: string; color: string }> = {
  PS: { bg: 'var(--teal-bg)', color: 'var(--teal-tx)' },
  AR: { bg: 'var(--blue-bg)', color: 'var(--blue-tx)' },
  AS: { bg: 'var(--purple-bg)', color: 'var(--purple-tx)' },
  VK: { bg: 'var(--amber-bg)', color: 'var(--amber-tx)' },
  MN: { bg: 'var(--coral-bg)', color: 'var(--coral-tx)' },
};

const subjectAvgData = [
  { subject: 'Maths', avg: 81.6 },
  { subject: 'Science', avg: 81 },
  { subject: 'English', avg: 81.6 },
  { subject: 'Telugu', avg: 82.4 },
  { subject: 'Social', avg: 78.4 },
];

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
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [addModal, setAddModal] = useState<AddExamModal | null>(null);
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newDuration, setNewDuration] = useState('2 hrs');
  const [newMarks, setNewMarks] = useState(50);
  const [savedMsg, setSavedMsg] = useState(false);

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
            <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }} className="p-1 rounded-lg hover:bg-[var(--surf2)] cursor-pointer">
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
              const hasExams = classSchedule[dateStr] && classSchedule[dateStr].length > 0;
              return (
                <button
                  key={i}
                  disabled={!isWritable}
                  onClick={() => {
                    if (!isWritable) return;
                    const subs = getSubjectsForClass(selectedClass);
                    setAddModal({ dateStr });
                    setNewSubject(subs[0] || 'Maths');
                    setNewTime('10:00 AM');
                    setNewDuration('2 hrs');
                    setNewMarks(50);
                  }}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-[10.5px] transition-all relative ${hasExams
                    ? 'bg-[var(--blue)] text-white font-bold'
                    : 'text-[var(--tx)]'
                    } ${isWritable ? 'cursor-pointer hover:bg-[var(--surf2)]' : 'cursor-default'}`}
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


async function saveSettingToDb(key: string, value: any) {
  try {
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    const existing = await api.getResources('settings', { key }).catch(() => []);
    if (Array.isArray(existing) && existing.length > 0) {
      const settingId = existing[0].id;
      await api.updateResource('settings', String(settingId), { value: valueStr }).catch(() => {});
    } else {
      await api.createResource('settings', {
        key,
        value: valueStr,
        group: 'exam',
        type: 'json',
        is_public: true,
      }).catch(() => {});
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

  type Tab = 'exams' | 'results' | 'marks' | 'designer' | 'invisilation';
  const [activeTab, setActiveTab] = useState<Tab>('exams');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClass, setSelectedClass] = useState('8A');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Record<string, Record<string, ClassExamSchedule>>>(() => {
    const saved = localStorage.getItem('examinations_schedules');
    return (saved && JSON.parse(saved)) || INITIAL_SCHEDULES_BY_EXAM;
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('examinations_exams');
    return (saved && JSON.parse(saved)) || EXAMS;
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
  const [selectedMarksSubject, setSelectedMarksSubject] = useState<string>('Mathematics');
  const [studentMarks, setStudentMarks] = useState<Record<string, Record<string, Record<string, number | string>>>>(() => {
    const draft = localStorage.getItem('kts_student_marks_draft');
    if (draft) {
      try { return JSON.parse(draft); } catch { /* empty */ }
    }
    const saved = localStorage.getItem('kts_student_marks');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* empty */ }
    }
    return {};
  });
  const [savingMarks, setSavingMarks] = useState(false);
  const [expandedStudentRolls, setExpandedStudentRolls] = useState<Record<string, boolean>>({});

  const toggleStudentExpand = (roll: string) => {
    setExpandedStudentRolls((prev) => ({
      ...prev,
      [roll]: !prev[roll],
    }));
  };

  const handleUpdateStudentMark = (examId: string, subject: string, roll: string, mark: number | null, studentId?: string) => {
    const effectiveId = examId || selectedMarksExamId || (marksExams[0]?.id ?? 'default_exam');
    const cleanRoll = roll.replace(/^[0-9]+[A-Z]+-?/i, '');

    setStudentMarks((prev) => {
      const examPrev = prev[effectiveId] ?? {};
      const subPrev = examPrev[subject] ?? {};
      const newSub = { ...subPrev };

      if (mark === null) {
        delete newSub[roll];
        delete newSub[cleanRoll];
        if (studentId) delete newSub[studentId];
      } else {
        newSub[roll] = mark;
        newSub[cleanRoll] = mark;
        if (studentId) newSub[studentId] = mark;
      }

      const updated = {
        ...prev,
        [effectiveId]: {
          ...examPrev,
          [subject]: newSub,
        },
      };
      localStorage.setItem('kts_student_marks_draft', JSON.stringify(updated));
      localStorage.setItem('kts_student_marks', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSaveMarksToDb = async () => {
    setSavingMarks(true);
    try {
      localStorage.setItem('kts_student_marks', JSON.stringify(studentMarks));
      localStorage.removeItem('kts_student_marks_draft');
      await saveSettingToDb('kts_student_marks', studentMarks);
      await alert('Marks Saved Successfully', `Student marks for Class ${selectedMarksClass} have been saved to the database. They are now updated and live in Admin login as well.`);
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

        // Sync exams
        const examsRes = await api.getResources('settings', { key: 'examinations_exams' }).catch(() => []);
        if (Array.isArray(examsRes) && examsRes.length > 0 && examsRes[0].value) {
          try {
            currentExams = JSON.parse(examsRes[0].value);
            setExams(currentExams);
            (localStorage as any).originalSetItem('examinations_exams', JSON.stringify(currentExams));
          } catch (e) {
            console.error('Error parsing examinations_exams setting:', e);
          }
        } else if (isAdmin) {
          await saveSettingToDb('examinations_exams', currentExams);
        }

        // Sync schedules
        const schedulesRes = await api.getResources('settings', { key: 'examinations_schedules' }).catch(() => []);
        if (Array.isArray(schedulesRes) && schedulesRes.length > 0 && schedulesRes[0].value) {
          try {
            currentSchedules = JSON.parse(schedulesRes[0].value);
            setSchedules(currentSchedules);
            (localStorage as any).originalSetItem('examinations_schedules', JSON.stringify(currentSchedules));
          } catch (e) {
            console.error('Error parsing examinations_schedules setting:', e);
          }
        } else if (isAdmin) {
          await saveSettingToDb('examinations_schedules', currentSchedules);
        }

        // Sync invigilations
        const invigilationsRes = await api.getResources('settings', { key: 'kts_exam_invigilations' }).catch(() => []);
        if (Array.isArray(invigilationsRes) && invigilationsRes.length > 0 && invigilationsRes[0].value) {
          try {
            currentInvigilations = JSON.parse(invigilationsRes[0].value);
            setInvigilations(currentInvigilations);
            (localStorage as any).originalSetItem('kts_exam_invigilations', JSON.stringify(currentInvigilations));
          } catch (e) {
            console.error('Error parsing kts_exam_invigilations setting:', e);
          }
        } else if (isAdmin) {
          await saveSettingToDb('kts_exam_invigilations', currentInvigilations);
        }

        // Sync student marks
        const marksRes = await api.getResources('settings', { key: 'kts_student_marks' }).catch(() => []);
        if (Array.isArray(marksRes) && marksRes.length > 0 && marksRes[0].value) {
          try {
            const parsed = JSON.parse(marksRes[0].value);
            setStudentMarks((prev) => {
              if (!prev || Object.keys(prev).length === 0) {
                return parsed;
              }
              const merged = { ...parsed };
              for (const exId in prev) {
                merged[exId] = { ...(merged[exId] || {}), ...prev[exId] };
                for (const sub in prev[exId]) {
                  merged[exId][sub] = { ...(merged[exId][sub] || {}), ...prev[exId][sub] };
                }
              }
              return merged;
            });
            (localStorage as any).originalSetItem('kts_student_marks', JSON.stringify(parsed));
          } catch (e) {
            console.error('Error parsing kts_student_marks setting:', e);
          }
        }

        // Sync batch subjects settings
        const allSettingsRes = await api.getResources('settings').catch(() => []);
        if (Array.isArray(allSettingsRes)) {
          allSettingsRes.forEach((s: any) => {
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
        if (Array.isArray(batchesData) && batchesData.length > 0) {
          setRawBatches(batchesData);
          const names = batchesData.map((b: any) => b.name).filter(Boolean).sort((a: string, b: string) => {
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
        setStudents(data || []);
      } catch (err) {
        console.error('Error loading batches or students:', err);
      }
    };
    loadBatchesAndStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen to cross-tab updates to examinations, schedules, and invigilations
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
        }
      } catch (err) {
        console.error('Error parsing storage change in Examinations:', err);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  // Initialize and validate filter selections
  useEffect(() => {
    const availableExams = isAdmin
      ? exams.filter((e) => e.status !== 'Results Published')
      : exams.filter((e) => isExamCompleted(e));
    if (availableExams.length > 0) {
      if (!selectedMarksExamId || !availableExams.some(e => e.id === selectedMarksExamId)) {
        setSelectedMarksExamId(availableExams[0].id);
      }
    } else {
      setSelectedMarksExamId('');
    }
  }, [exams, selectedMarksExamId, isAdmin]);

  useEffect(() => {
    if (!isAdmin && user) {
      const teacherClasses = user.classes || [];
      if (teacherClasses.length > 0 && !teacherClasses.includes(selectedMarksClass)) {
        setSelectedMarksClass(teacherClasses[0]);
      }
      if (user.subject && selectedMarksSubject !== user.subject) {
        setSelectedMarksSubject(user.subject);
      }
    }
  }, [user, isAdmin, selectedMarksClass, selectedMarksSubject]);

  const handleSaveMarks = async () => {
    setSavingMarks(true);
    try {
      localStorage.setItem('kts_student_marks', JSON.stringify(studentMarks));
      await saveSettingToDb('kts_student_marks', studentMarks);
      await alert('Marks saved successfully!', 'Saved');
    } catch (err) {
      console.error('Error saving marks:', err);
      await alert('Failed to save marks.', 'Error');
    } finally {
      setSavingMarks(false);
    }
  };

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
        const defaultClasses = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        const foundClasses = new Set<string>();

        batchesData.forEach((b: any) => {
          const batchName = b.name;
          const match = batchName.match(/^(.+?)([A-Z])$/);
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
          const numA = parseInt(a, 10);
          const numB = parseInt(b, 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            if (numA !== numB) return numA - numB;
            return a.localeCompare(b);
          }
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

  const isExamCompleted = (e: Exam): boolean => {
    if (e.status === 'Completed' || e.status === 'Results Published') return true;
    if (e.date) {
      const examDate = new Date(e.date + 'T23:59:59');
      const today = new Date();
      return examDate <= today;
    }
    return false;
  };

  const isTeacherAssignedToClass = (className: string): boolean => {
    if (isAdmin) return true;
    if (!className) return false;

    const targetClean = className.replace(/^Class\s*/i, '').trim().toUpperCase();

    // In a teacher login, the teacher must be the class teacher (assigned in classes/batches tab) to allot/edit marks.
    // 1. Check rawBatches database records for class_teacher_id, class_teacher_name, or email
    if (rawBatches.length > 0) {
      const matchedBatch = rawBatches.find((b: any) =>
        String(b.name || '').replace(/^Class\s*/i, '').trim().toUpperCase() === targetClean
      );
      if (matchedBatch) {
        const teacherId = String(matchedBatch.class_teacher_id || '').trim();
        const teacherName = String(matchedBatch.class_teacher_name || '').toLowerCase().trim();
        const userId = String(user?.id || '').trim();
        const userEmail = String(user?.email || '').trim();
        const userName = String(user?.name || '').toLowerCase().trim();

        if (teacherId && (teacherId === userId || teacherId === userEmail)) {
          return true;
        }
        if (teacherName && userName && (teacherName === userName || userName.includes(teacherName) || teacherName.includes(userName))) {
          return true;
        }
        // If teacher details matched, but it wasn't the class teacher, we return false here.
      }
    }

    // 2. Fallback check local storage batch configurations
    const savedStaffStr = localStorage.getItem('kts_staff_members');
    try {
      const localBatches = rawBatches.length > 0 ? rawBatches : (() => {
        // Fallback to searching active batches from local/mock if needed
        return [];
      })();
    } catch { /* empty */ }

    // 3. Fallback check user.class or user.assignedClass ONLY if no rawBatches are found
    if (rawBatches.length === 0) {
      const userClassSingle = user?.class || user?.assignedClass;
      if (userClassSingle) {
        const cleanUserSingle = String(userClassSingle).replace(/^Class\s*/i, '').trim().toUpperCase();
        if (cleanUserSingle === targetClean || targetClean.startsWith(cleanUserSingle) || cleanUserSingle.startsWith(targetClean)) return true;
      }

      if (Array.isArray(user?.classes) && user.classes.length > 0) {
        const match = user.classes.some((c: string) => {
          const cClean = String(c).replace(/^Class\s*/i, '').trim().toUpperCase();
          return cClean === targetClean || targetClean.startsWith(cClean) || cClean.startsWith(targetClean);
        });
        if (match) return true;
      }
    }

    // Default assigned class fallback for demo teacher login if profile has no assigned classes configured and no batches loaded
    if (rawBatches.length === 0 && (!user?.classes || user.classes.length === 0) && !user?.class && !user?.assignedClass) {
      if (targetClean === '8A') return true;
    }

    return false;
  };

  const activeClassList = classList.length > 0 ? classList : CLASSES;
  const filteredClassList = activeClassList;

  const marksExams = isAdmin
    ? exams.filter((e) => e.status !== 'Results Published')
    : exams.filter((e) => isExamCompleted(e));

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

  const classSubjectsForMarks = getSubjectsForClass(selectedMarksClass);

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

  const getFilteredStudentsForMarks = () => {
    const targetClassClean = selectedMarksClass.replace(/^Class\s*/i, '').trim().toUpperCase();

    const dbFiltered = students.filter((s: any) => {
      const stClass = getStudentClass(s).toUpperCase();
      if (!stClass) return false;
      const stClassClean = stClass.replace(/^Class\s*/i, '').trim();

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

    if (dbFiltered.length > 0) {
      return dbFiltered.map((s: any, idx: number) => {
        const fullName = s.name || (s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : `Student ${idx + 1}`);
        const nameParts = fullName.trim().split(/\s+/);
        const initials = nameParts.length > 1
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : fullName.slice(0, 2).toUpperCase();
        const roll = s.roll || s.enrollment_number || s.roll_no || s.student_pen_no || `${targetClassClean}-${String(idx + 1).padStart(3, '0')}`;
        return {
          id: String(s.id || idx),
          name: fullName,
          roll: String(roll),
          init: initials || 'ST',
          idx,
        };
      });
    }

    const resultsFiltered = RESULTS.filter((r) => {
      const rollClass = r.roll.split('-')[0];
      return rollClass.toUpperCase() === targetClassClean;
    });

    if (resultsFiltered.length > 0) {
      return resultsFiltered.map((r, idx) => ({
        id: `res-${idx}`,
        name: r.name,
        roll: r.roll,
        init: r.init,
        idx,
      }));
    }

    return [];
  };

  const studentsToShow = getFilteredStudentsForMarks();

  const computeStudentMarksDetail = (studentRoll: string, _studentIdx: number, studentId?: string) => {
    const effectiveExamId = selectedMarksExamId || (marksExams[0]?.id ?? 'default_exam');
    const selectedExamObj = exams.find((e) => e.id === effectiveExamId);
    const fallbackMax = selectedExamObj?.maxMarks || 100;
    const cleanRoll = studentRoll.replace(/^[0-9]+[A-Z]+-?/i, '');

    let hasAnyMark = false;
    let totalMarksObtained = 0;

    const subjectBreakdown = classSubjectsForMarks.map((sub) => {
      const maxMarks = getMaxMarksForSubject(effectiveExamId, selectedMarksClass, sub, fallbackMax);

      const saved = studentMarks[effectiveExamId]?.[sub]?.[studentRoll]
                 ?? (studentId ? studentMarks[effectiveExamId]?.[sub]?.[studentId] : undefined)
                 ?? studentMarks[effectiveExamId]?.[sub]?.[cleanRoll];

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

  const classAvg = RESULTS.reduce((s, r) => s + r.percentage, 0) / RESULTS.length;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'exams', label: 'Exam Schedule' },
    { id: 'results', label: 'Results & Rankings' },
    { id: 'marks', label: isAdmin ? 'Marks Preview' : 'Marks Entry' },
    { id: 'designer', label: isAdmin ? 'Schedule Designer' : 'Schedule Preview' },
    { id: 'invisilation', label: isAdmin ? 'Allot Invisilation' : 'Exam Invisilation' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard label="Upcoming Exams" value={exams.filter((e) => e.status === 'Upcoming').length} sub="This month" icon={<BookOpen size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Class Average" value={`${classAvg.toFixed(1)}%`} sub="Class 8A · Last exam" icon={<BarChart2 size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Top Score" value={`${Math.max(...RESULTS.map((r) => r.percentage))}%`} sub={RESULTS[0].name} icon={<Award size={15} />} iconBg="var(--purple-bg)" iconColor="var(--purple-tx)" />
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
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] font-semibold text-[var(--tx)]">Results — {EXAMS[2].name}</div>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[11.5px] cursor-pointer outline-none text-[var(--tx)]">
                {activeClassList.map((c) => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[600px]">
                <thead>
                  <tr className="border-b border-[var(--b)]">
                    {['Rank', 'Student', 'Math', 'Sci', 'Eng', 'Tel', 'Social', 'Total', 'Grade'].map((h) => (
                      <th key={h} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RESULTS.map((r) => (
                    <tr key={r.roll} className="border-b border-[var(--b)] hover:bg-[var(--surf2)] last:border-0">
                      <td className="px-2 py-2.5 font-bold text-[var(--tx3)]">#{r.rank}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar initials={r.init} bg={AVATAR_COLORS[r.init]?.bg ?? 'var(--surf3)'} color={AVATAR_COLORS[r.init]?.color ?? 'var(--tx2)'} />
                          <span className="font-semibold text-[var(--tx)]">{r.name}</span>
                        </div>
                      </td>
                      {[r.maths, r.science, r.english, r.telugu, r.social].map((mark, i) => (
                        <td key={i} className={`px-2 py-2.5 font-medium ${mark >= 85 ? 'text-[var(--teal-tx)]' : mark >= 70 ? 'text-[var(--tx)]' : 'text-[var(--red-tx)]'}`}>{mark}</td>
                      ))}
                      <td className="px-2 py-2.5 font-bold text-[var(--tx)]">{r.total}/500 <span className="font-normal text-[var(--tx3)] text-[10.5px]">({r.percentage}%)</span></td>
                      <td className="px-2 py-2.5"><Badge variant={GRADE_BADGE[r.grade] ?? 'gray'}>{r.grade}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="space-y-2.5">
            <Card>
              <div className="text-[12.5px] font-semibold text-[var(--tx)] mb-3">Subject Averages</div>
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={subjectAvgData} barSize={20} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--b)" />
                    <XAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Average']} cursor={{ fill: 'var(--surf2)' }} />
                    <Bar dataKey="avg" fill="var(--purple)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <div className="text-[12.5px] font-semibold text-[var(--tx)] mb-3">Grade Distribution</div>
              <div className="space-y-2">
                {[['A+', 1, 'var(--purple)'], ['A', 3, 'var(--teal)'], ['B+', 1, 'var(--blue)']].map(([grade, count, color]) => (
                  <div key={String(grade)} className="flex items-center gap-3">
                    <span className="w-8 text-[12px] font-bold text-[var(--tx)]">{grade}</span>
                    <div className="flex-1 h-2 bg-[var(--surf2)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(Number(count) / RESULTS.length) * 100}%`, background: String(color) }} />
                    </div>
                    <span className="text-[11px] text-[var(--tx3)] w-6">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'marks' && (
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
                className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-1.5 text-[12px] cursor-pointer outline-none text-[var(--tx)] font-medium"
              >
                {marksExams.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {marksExams.length === 0 ? (
              <div className="text-center py-12 text-[12px] text-[var(--tx3)]">
                No completed exams available for marks entry.
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
                    const detail = computeStudentMarksDetail(student.roll, student.idx, student.id);
                    const isExpanded = !!expandedStudentRolls[student.roll];
                    const avatarColor = getDynamicAvatarColor(student.init);

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
                                  </div>
                                  <span className="text-[11px] text-[var(--tx3)] font-medium">
                                    {isAdmin ? 'Admin Edit Mode: Adjust subject marks below' : isTeacherAssignedToClass(selectedMarksClass) ? 'Faculty Marks Entry Mode: Adjust subject marks below' : 'Read-Only Mode: Unassigned Class Teacher'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                  {detail.subjectBreakdown.map((subItem) => {
                                    const currentExamObj = exams.find((e) => e.id === selectedMarksExamId);
                                    const canEditMarks = isAdmin || (isTeacherAssignedToClass(selectedMarksClass) && (currentExamObj ? isExamCompleted(currentExamObj) : false));

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
          {studentsToShow.length > 0 && (
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
                  onClick={handleSaveMarksToDb}
                  disabled={savingMarks || (!isAdmin && !isTeacherAssignedToClass(selectedMarksClass))}
                  className="px-4 py-2 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {savingMarks ? (
                    <span>Saving to DB...</span>
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
