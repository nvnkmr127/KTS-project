import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Users, Calendar, Clock, Save, Loader2, Search, Check, AlertCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

interface Student {
  id: string;
  name: string;
  roll: string;
  class: string;
  section: string;
}

interface Batch {
  id: string;
  name: string;
  class_teacher_id?: number;
  class_teacher_name?: string;
}

// Custom interface for local storage/database synced attendance entries
export interface StudentPeriodAttendance {
  studentId: string;
  studentName: string;
  roll: string;
  className: string;
  date: string; // YYYY-MM-DD
  session: 'first_period' | 'lunch_period';
  status: 'present' | 'absent';
  markedBy: string;
  markedById: string;
  markedAt: string;
}

async function saveSettingToDb(key: string, value: any) {
  try {
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    const existing = await api.getResources('settings', { key });
    if (Array.isArray(existing) && existing.length > 0) {
      const settingId = existing[0].id;
      await api.updateResource('settings', String(settingId), { value: valueStr });
    } else {
      await api.createResource('settings', {
        key,
        value: valueStr,
        group: 'attendance',
        type: 'json',
        is_public: true,
      });
    }
  } catch (err) {
    console.error(`Error saving setting ${key} to DB:`, err);
  }
}

export function AllotAttendance() {
  const { user } = useAuth();
  const { timetable, periodTimings } = useApp();

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState<string>(getLocalDateString());
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<StudentPeriodAttendance[]>([]);
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [session, setSession] = useState<'first_period' | 'lunch_period'>('first_period');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Student selection state (studentId -> present/absent)
  const [statusMap, setStatusMap] = useState<Record<string, 'present' | 'absent'>>({});

  // Day of week from selected date
  const getDayName = (dateStr: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateStr + 'T00:00:00');
    return days[d.getDay()] || 'Monday';
  };

  const dayOfWeek = getDayName(date);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [batchesData, studentsData] = await Promise.all([
          api.getResources('batches', { limit: '1000' }).catch(() => []),
          api.getResources('students', { limit: '1000' }).catch(() => [])
        ]);

        setBatches(batchesData.map((b: any) => ({
          id: String(b.id),
          name: b.name,
          class_teacher_id: b.class_teacher_id || undefined,
          class_teacher_name: b.class_teacher_name || undefined
        })));

        setStudents(studentsData.map((s: any) => ({
          id: String(s.id),
          name: s.name,
          roll: s.enrollment_number || 'N/A',
          class: s.class || '8',
          section: s.section || 'A'
        })));

        // Load and sync attendance records from settings
        const settingsRes = await api.getResources('settings', { key: 'kts_student_attendance_records' });
        if (Array.isArray(settingsRes) && settingsRes.length > 0 && settingsRes[0].value) {
          try {
            const parsed = JSON.parse(settingsRes[0].value);
            setAttendanceRecords(parsed);
            localStorage.setItem('kts_student_attendance_records', JSON.stringify(parsed));
          } catch (e) {
            console.error('Error parsing kts_student_attendance_records:', e);
          }
        } else {
          const local = localStorage.getItem('kts_student_attendance_records');
          if (local) {
            setAttendanceRecords(JSON.parse(local));
          }
        }
      } catch (err) {
        console.error('Error loading data for allotment:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Determine first period after lunch index
  const getLunchPeriodIndex = () => {
    const lunchIdx = periodTimings.findIndex(t => t.isBreak && t.label?.toLowerCase().includes('lunch'));
    if (lunchIdx === -1) return 7; // fallback default
    
    // Find next non-break period
    for (let i = lunchIdx + 1; i < periodTimings.length; i++) {
      if (!periodTimings[i].isBreak) {
        return i; // Return direct index in periodTimings
      }
    }
    return 7;
  };

  const lunchPeriodIndex = getLunchPeriodIndex();

  // Determine teacher access: which classes can they take attendance for today?
  const allowedClasses = batches.filter(batch => {
    // 1. Is class teacher? (First period access)
    const isClassTeacher = String(batch.class_teacher_id) === String(user?.id) || 
      (batch.class_teacher_name && batch.class_teacher_name.toLowerCase() === user?.name?.toLowerCase());
    
    // 2. Teaches first period after lunch today? (Lunch period access)
    const classTimetable = timetable[batch.name] ?? {};
    const todaySlots = classTimetable[dayOfWeek] ?? {};
    
    // Find the slot for the first period after lunch (no offset subtraction since lunchPeriodIndex is the raw slot index)
    const lunchSlot = todaySlots[lunchPeriodIndex]; 
    const teachesAfterLunch = lunchSlot && (
      String(lunchSlot.teacherId) === String(user?.id) || 
      (lunchSlot.teacher && lunchSlot.teacher.toLowerCase() === user?.name?.toLowerCase())
    );

    return isClassTeacher || teachesAfterLunch;
  }).map(b => b.name);

  // Set default class if not set or not in allowed classes
  useEffect(() => {
    if (allowedClasses.length > 0 && (!selectedClass || !allowedClasses.includes(selectedClass))) {
      setSelectedClass(allowedClasses[0]);
    }
  }, [allowedClasses, selectedClass]);

  // Determine available sessions for selected class today
  const selectedBatchObj = batches.find(b => b.name === selectedClass);
  const isClassTeacherForSelected = selectedBatchObj && (
    String(selectedBatchObj.class_teacher_id) === String(user?.id) || 
    (selectedBatchObj.class_teacher_name && selectedBatchObj.class_teacher_name.toLowerCase() === user?.name?.toLowerCase())
  );

  const classTimetable = timetable[selectedClass] ?? {};
  const todaySlots = classTimetable[dayOfWeek] ?? {};
  const lunchSlot = todaySlots[lunchPeriodIndex];
  const teachesAfterLunchForSelected = lunchSlot && (
    String(lunchSlot.teacherId) === String(user?.id) || 
    (lunchSlot.teacher && lunchSlot.teacher.toLowerCase() === user?.name?.toLowerCase())
  );

  useEffect(() => {
    if (selectedClass) {
      if (isClassTeacherForSelected && !teachesAfterLunchForSelected) {
        setSession('first_period');
      } else if (!isClassTeacherForSelected && teachesAfterLunchForSelected) {
        setSession('lunch_period');
      }
    }
  }, [selectedClass, isClassTeacherForSelected, teachesAfterLunchForSelected]);

  // Filter students in selected class
  const classStudents = students.filter(s => {
    const studentClassFormatted = `${s.class}${s.section}`;
    return studentClassFormatted.toLowerCase() === selectedClass.toLowerCase();
  });

  // Load existing attendance status if already marked
  useEffect(() => {
    if (selectedClass && session && date) {
      const initialMap: Record<string, 'present' | 'absent'> = {};
      classStudents.forEach(s => {
        initialMap[s.id] = 'present'; // default to present
      });

      const records = attendanceRecords.filter(
        r => r.className.toLowerCase() === selectedClass.toLowerCase() &&
             r.session === session &&
             r.date === date
      );

      records.forEach(r => {
        initialMap[r.studentId] = r.status;
      });

      setStatusMap(initialMap);
    }
  }, [selectedClass, session, date, attendanceRecords, students]);

  // Search filter
  const filteredStudents = classStudents.filter(
    s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.roll.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const timestamp = new Date().toISOString();
      const newEntries: StudentPeriodAttendance[] = classStudents.map(s => ({
        studentId: s.id,
        studentName: s.name,
        roll: s.roll,
        className: selectedClass,
        date: date,
        session: session,
        status: statusMap[s.id] || 'present',
        markedBy: user?.name || 'Teacher',
        markedById: user?.id || '1',
        markedAt: timestamp
      }));

      // Filter out old records for the same class, session, and date
      const otherRecords = attendanceRecords.filter(
        r => !(r.className.toLowerCase() === selectedClass.toLowerCase() &&
               r.session === session &&
               r.date === date)
      );

      const updatedRecords = [...otherRecords, ...newEntries];
      setAttendanceRecords(updatedRecords);
      localStorage.setItem('kts_student_attendance_records', JSON.stringify(updatedRecords));
      await saveSettingToDb('kts_student_attendance_records', updatedRecords);

      // Trigger cache invalidation so the changes show up in admin dashboards immediately
      try {
        await api.createResource('attendance/invalidate-cache', { timestamp });
      } catch (e) {
        // ignore if endpoint doesn't exist
      }

      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch (err) {
      console.error('Failed to save student attendance:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setStatusMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const markAll = (status: 'present' | 'absent') => {
    const updated = { ...statusMap };
    classStudents.forEach(s => {
      updated[s.id] = status;
    });
    setStatusMap(updated);
  };

  const presentCount = Object.values(statusMap).filter(s => s === 'present').length;
  const absentCount = Object.values(statusMap).filter(s => s === 'absent').length;

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--purple)] to-[#7c3aed] rounded-2xl p-4 mb-3.5 text-white relative overflow-hidden">
        <div className="absolute right-4 top-4 opacity-10">
          <Users size={64} />
        </div>
        <div className="relative z-10">
          <div className="text-[11px] font-medium opacity-70 uppercase tracking-wider mb-1">Teacher Portal</div>
          <div className="text-[18px] font-bold mb-1">Student Attendance Allotment</div>
          <div className="text-[12px] opacity-80">Mark daily attendance for your class-teacher sections and lunch break periods.</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 size={24} className="animate-spin text-[var(--blue-tx)]" />
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Controls Panel */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Date selector */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--tx3)] uppercase mb-1.5 flex items-center gap-1">
                  <Calendar size={11} /> Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] cursor-pointer"
                />
              </div>

              {/* Class selector */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--tx3)] uppercase mb-1.5 flex items-center gap-1">
                  <Users size={11} /> Class / Section
                </label>
                {allowedClasses.length === 0 ? (
                  <div className="text-[11.5px] text-[var(--red-tx)] bg-[var(--red-bg)] px-3 py-2 rounded-lg border border-[var(--red-tx)]/10 font-medium">
                    No classes assigned today
                  </div>
                ) : (
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                  >
                    {allowedClasses.map(c => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Session selector */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--tx3)] uppercase mb-1.5 flex items-center gap-1">
                  <Clock size={11} /> Session / Attendance Type
                </label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value as any)}
                  className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                >
                  {isClassTeacherForSelected && (
                    <option value="first_period">Morning (1st Period - Class Teacher)</option>
                  )}
                  {teachesAfterLunchForSelected && (
                    <option value="lunch_period">Afternoon (1st Period After Lunch)</option>
                  )}
                  {!isClassTeacherForSelected && !teachesAfterLunchForSelected && (
                    <option value="">No access for selected class today</option>
                  )}
                </select>
              </div>

              {/* Search */}
              <div className="flex flex-col justify-end">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--tx3)]" size={12} />
                  <input
                    type="text"
                    placeholder="Search student name/roll..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-[var(--surf2)] border border-[var(--b)] rounded-lg text-[12px] text-[var(--tx)] focus:outline-none focus:border-[var(--blue)]"
                  />
                </div>
              </div>
            </div>

            {allowedClasses.length > 0 && !isClassTeacherForSelected && !teachesAfterLunchForSelected && (
              <div className="mt-3 p-3 bg-[var(--amber-bg)] border border-[var(--amber-tx)]/10 text-[var(--amber-tx)] rounded-xl text-[11.5px] flex items-center gap-2">
                <AlertCircle size={13} />
                <span>You do not teach the lunch period slot nor are you the class teacher for Class {selectedClass} on {dayOfWeek}s.</span>
              </div>
            )}
          </Card>

          {allowedClasses.length > 0 && (isClassTeacherForSelected || teachesAfterLunchForSelected) && (
            <Card>
              {/* Stats & Bulk Operations */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b border-[var(--b)] pb-3.5">
                <div className="flex items-center gap-3.5 flex-wrap">
                  <div className="text-[12.5px] font-bold text-[var(--tx)]">
                    Class {selectedClass} Attendance List
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="teal">{presentCount} Present</Badge>
                    <Badge variant="red">{absentCount} Absent</Badge>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => markAll('present')}
                    className="flex-1 sm:flex-none px-2.5 py-1.5 text-[11.5px] border border-[var(--b)] bg-[var(--surf2)] text-[var(--tx2)] rounded-lg cursor-pointer hover:border-[var(--blue)] hover:text-[var(--blue-tx)] font-medium transition-all"
                  >
                    Mark All Present
                  </button>
                  <button
                    onClick={() => markAll('absent')}
                    className="flex-1 sm:flex-none px-2.5 py-1.5 text-[11.5px] border border-[var(--b)] bg-[var(--surf2)] text-[var(--tx2)] rounded-lg cursor-pointer hover:border-[var(--red)] hover:text-[var(--red-tx)] font-medium transition-all"
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px] min-w-[500px]">
                  <thead>
                    <tr className="border-b border-[var(--b)] text-[var(--tx3)]">
                      <th className="text-[10.5px] font-medium text-left px-3 py-2 w-12">Init</th>
                      <th className="text-[10.5px] font-medium text-left px-3 py-2">Student Name</th>
                      <th className="text-[10.5px] font-medium text-left px-3 py-2">Roll No</th>
                      <th className="text-[10.5px] font-medium text-center px-3 py-2 w-32">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-[var(--tx3)]">
                          No students found in this class.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => {
                        const isPresent = statusMap[s.id] === 'present';
                        const initials = s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        return (
                          <tr
                            key={s.id}
                            className="border-b border-[var(--b)] hover:bg-[var(--surf2)]/40 transition-colors last:border-0"
                          >
                            <td className="px-3 py-2.5">
                              <Avatar initials={initials} bg={isPresent ? 'var(--teal-bg)' : 'var(--red-bg)'} color={isPresent ? 'var(--teal-tx)' : 'var(--red-tx)'} />
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-[var(--tx)]">{s.name}</td>
                            <td className="px-3 py-2.5 font-mono text-[11px] text-[var(--tx3)]">{s.roll}</td>
                            <td className="px-3 py-2.5 text-center">
                              <button
                                onClick={() => toggleStudent(s.id)}
                                className={`w-24 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1 mx-auto ${
                                  isPresent
                                    ? 'bg-[var(--teal-bg)] text-[var(--teal-tx)] border border-[var(--teal-tx)]/20 hover:opacity-85'
                                    : 'bg-[var(--red-bg)] text-[var(--red-tx)] border border-[var(--red-tx)]/20 hover:opacity-85'
                                }`}
                              >
                                {isPresent ? <Check size={11} /> : <XCircle size={11} />}
                                {isPresent ? 'Present' : 'Absent'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Submit Footer */}
              <div className="mt-4 pt-4 border-t border-[var(--b)] flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-[11.5px] text-[var(--tx3)] font-medium">
                  {savedMsg && (
                    <span className="text-[var(--teal-tx)] flex items-center gap-1">
                      <CheckCircle size={13} /> Student Attendance saved and synced successfully!
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={saving || classStudents.length === 0}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-bold cursor-pointer hover:opacity-95 disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  {saving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  {saving ? 'Submitting...' : 'Submit Attendance'}
                </button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
