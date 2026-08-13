import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Card } from '../components/Card';
import { KPICard } from '../components/KPICard';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, TrendingUp, Users, Percent } from 'lucide-react';

const CLASSES = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Telugu', 'Hindi', 'Social Studies'];



const AVATAR_COLORS: Record<string, { bg: string; color: string }> = {
  PS: { bg: 'var(--teal-bg)', color: 'var(--teal-tx)' },
  AR: { bg: 'var(--blue-bg)', color: 'var(--blue-tx)' },
  AS: { bg: 'var(--purple-bg)', color: 'var(--purple-tx)' },
  VK: { bg: 'var(--amber-bg)', color: 'var(--amber-tx)' },
  MN: { bg: 'var(--coral-bg)', color: 'var(--coral-tx)' },
};

const tooltipStyle = { backgroundColor: 'var(--surf)', border: '0.5px solid var(--b2)', borderRadius: 8, fontSize: 11, color: 'var(--tx)' };

const normalizeSubjectName = (subject: string): string => {
  if (!subject) return '';
  const clean = subject.toLowerCase().trim();
  if (clean === 'mathematics' || clean === 'maths' || clean === 'math') {
    return 'maths';
  }
  if (clean === 'social studies' || clean === 'social' || clean === 'social science') {
    return 'social';
  }
  if (clean === 'general science' || clean === 'science') {
    return 'science';
  }
  return clean;
};

export function Performance() {
  const { user } = useAuth();
  const { timetable } = useApp();
  const isAdmin = user?.role === 'admin';

  // Filters State
  const [selectedClass, setSelectedClass] = useState('8A');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');

  // Loaded DB data
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<Record<string, any>>({});
  const [studentMarks, setStudentMarks] = useState<Record<string, Record<string, Record<string, any>>>>({});
  const [classList, setClassList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Load Students
        const studentsData = await api.getResources('students', { limit: '1000' });
        setStudents(studentsData || []);

        // Load Batches
        const batchesData = await api.getResources('batches');
        if (batchesData && batchesData.length > 0) {
          const names = batchesData.map((b: any) => b.name).sort((a: string, b: string) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) {
              if (numA !== numB) return numA - numB;
              return a.localeCompare(b);
            }
            return a.localeCompare(b);
          });
          setClassList(names);
        }

        // Load Exams
        const examsRes = await api.getResources('settings', { key: 'examinations_exams' });
        if (Array.isArray(examsRes) && examsRes.length > 0 && examsRes[0].value) {
          try {
            setExams(JSON.parse(examsRes[0].value));
          } catch (e) {
            console.error('Error parsing examinations_exams:', e);
          }
        }

        // Load Schedules
        const schedulesRes = await api.getResources('settings', { key: 'examinations_schedules' });
        if (Array.isArray(schedulesRes) && schedulesRes.length > 0 && schedulesRes[0].value) {
          try {
            setSchedules(JSON.parse(schedulesRes[0].value));
          } catch (e) {
            console.error('Error parsing examinations_schedules:', e);
          }
        }

        // Load Student Marks
        const marksRes = await api.getResources('settings', { key: 'kts_student_marks' });
        if (Array.isArray(marksRes) && marksRes.length > 0 && marksRes[0].value) {
          try {
            setStudentMarks(JSON.parse(marksRes[0].value));
          } catch (e) {
            console.error('Error parsing kts_student_marks:', e);
          }
        }
      } catch (err) {
        console.error('Error loading performance page data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Listen to cross-tab updates and same-tab updates to student marks
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kts_student_marks' && e.newValue) {
        try {
          setStudentMarks(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Error parsing storage change in Performance:', err);
        }
      }
    };
    const handleCustomUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setStudentMarks(customEvent.detail);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('kts:student_marks_updated', handleCustomUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('kts:student_marks_updated', handleCustomUpdate);
    };
  }, []);

  // Compute teacher-specific classes and subject from timetable and profile
  const classesFromTimetable = new Set<string>();
  let teacherSubject = user?.subject || '';

  if (timetable) {
    Object.entries(timetable).forEach(([cls, daysObj]: [string, any]) => {
      if (daysObj) {
        Object.values(daysObj).forEach((slots: any) => {
          if (slots) {
            Object.values(slots).forEach((period: any) => {
              if (period && (
                String(period.teacherId) === String(user?.id) ||
                period.teacher?.toLowerCase() === user?.name?.toLowerCase()
              )) {
                classesFromTimetable.add(cls);
                if (period.subject && !teacherSubject) {
                  teacherSubject = period.subject;
                }
              }
            });
          }
        });
      }
    });
  }

  const teacherClasses = Array.from(new Set([...(user?.classes || []), ...classesFromTimetable]));
  const finalClassList = isAdmin ? (classList.length > 0 ? classList : CLASSES) : teacherClasses;

  // For the selected class, find all subjects taught by the teacher
  const getAvailableSubjects = () => {
    if (isAdmin) {
      const clsSubjects = new Set<string>();
      if (timetable && timetable[selectedClass]) {
        Object.values(timetable[selectedClass]).forEach((daysObj: any) => {
          if (daysObj) {
            Object.values(daysObj).forEach((period: any) => {
              if (period && period.subject) {
                clsSubjects.add(period.subject);
              }
            });
          }
        });
      }
      if (clsSubjects.size > 0) {
        return Array.from(clsSubjects);
      }
      return SUBJECTS;
    } else {
      const subjects = new Set<string>();
      if (timetable && timetable[selectedClass]) {
        Object.values(timetable[selectedClass]).forEach((daysObj: any) => {
          if (daysObj) {
            Object.values(daysObj).forEach((period: any) => {
              if (period && (
                String(period.teacherId) === String(user?.id) ||
                period.teacher?.toLowerCase() === user?.name?.toLowerCase()
              )) {
                if (period.subject) {
                  subjects.add(period.subject);
                }
              }
            });
          }
        });
      }
      if (user?.subject) {
        subjects.add(user.subject);
      }
      if (subjects.size > 0) {
        return Array.from(subjects);
      }
      return ['Mathematics'];
    }
  };

  const availableSubjects = getAvailableSubjects();

  const getMaxMarksForSubject = (examId: string, className: string, subjectName: string, fallbackMax: number = 100): number => {
    if (!examId || !className || !subjectName) return fallbackMax;
    const examSched = schedules[examId];
    if (!examSched) return fallbackMax;
    const classSched = examSched[className];
    if (!classSched) return fallbackMax;

    for (const dateStr in classSched) {
      const entries = classSched[dateStr];
      if (Array.isArray(entries)) {
        const found = entries.find((e) => normalizeSubjectName(e.subject) === normalizeSubjectName(subjectName));
        if (found && found.maxMarks && Number(found.maxMarks) > 0) {
          return Number(found.maxMarks);
        }
      }
    }
    return fallbackMax;
  };

  const getMarksForSubject = (examId: string, subjectName: string) => {
    const examMarks = studentMarks[examId];
    if (!examMarks) return null;
    
    // Direct match first
    if (examMarks[subjectName]) {
      return examMarks[subjectName];
    }
    
    // Normalized match
    const targetNorm = normalizeSubjectName(subjectName);
    const matchedKey = Object.keys(examMarks).find(
      (k) => normalizeSubjectName(k) === targetNorm
    );
    
    return matchedKey ? examMarks[matchedKey] : null;
  };

  // Handle default selector values on role validation
  useEffect(() => {
    if (finalClassList.length > 0 && !finalClassList.includes(selectedClass)) {
      setSelectedClass(finalClassList[0]);
    }
  }, [user, isAdmin, finalClassList]);

  // Adjust selectedSubject when class or available subjects change
  useEffect(() => {
    const subjects = getAvailableSubjects();
    if (subjects.length > 0 && !subjects.includes(selectedSubject)) {
      setSelectedSubject(subjects[0]);
    }
  }, [selectedClass, user, timetable]);

  // Retrieve exams relevant to the class
  const activeExams = exams.filter((e: any) => {
    const isClassMatch = e.class === 'All Classes' || e.class.split(',').map((c: string) => c.trim()).includes(selectedClass);
    return isClassMatch && e.status !== 'Upcoming';
  });

  // Calculate student performance details
  const getStudentPerformance = () => {
    // 1. Filter students of the selected class
    const classStudents = students.filter((s: any) => {
      const studentClass = s.batch?.name || (s.class && s.section ? `${s.class}${s.section}` : s.class || '');
      return studentClass.toUpperCase() === selectedClass.toUpperCase();
    });

    const calculateStudentStats = (name: string, roll: string, init: string, id: string) => {
      let totalScore = 0;
      let totalMaxMarks = 0;
      const examScores: Record<string, number> = {};
      const cleanRoll = roll.replace(/^[0-9]+[A-Z]+-?/i, '');

      activeExams.forEach((exam) => {
        // Find saved marks using keys: roll, id, cleanRoll via getMarksForSubject helper
        let savedMark = undefined;
        const examMarks = getMarksForSubject(exam.id, selectedSubject);
        if (examMarks) {
          savedMark = examMarks[roll] ?? (id ? examMarks[id] : undefined) ?? examMarks[cleanRoll];
        }

        if (savedMark !== undefined && savedMark !== null && savedMark !== '') {
          const markNum = Number(savedMark);
          if (!isNaN(markNum)) {
            // Get correct maxMarks for the subject
            const selectedExamObj = exams.find((e) => e.id === exam.id);
            const fallbackMax = selectedExamObj?.maxMarks || 100;
            const maxMarks = getMaxMarksForSubject(exam.id, selectedClass, selectedSubject, fallbackMax);

            examScores[exam.id] = markNum;
            totalScore += markNum;
            totalMaxMarks += Number(maxMarks);
          }
        }
      });

      const average = totalMaxMarks > 0 ? Math.round((totalScore / totalMaxMarks) * 100) : 0;
      return {
        name,
        roll,
        init,
        examScores,
        average,
        hasMarks: totalMaxMarks > 0,
      };
    };

    let calculatedList: any[] = [];

    if (classStudents.length > 0) {
      calculatedList = classStudents.map((s: any, idx: number) => {
        const fullName = s.name || (s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : `Student ${idx + 1}`);
        const nameParts = fullName.trim().split(/\s+/);
        const initials = nameParts.length > 1
          ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
          : fullName.slice(0, 2).toUpperCase();
        const roll = s.roll || s.enrollment_number || s.roll_no || s.student_pen_no || `${selectedClass}-${String(idx + 1).padStart(3, '0')}`;
        const id = String(s.id || idx);
        return calculateStudentStats(fullName, String(roll), initials || 'ST', id);
      });
    }

    // Rank students by average percentage
    const sorted = [...calculatedList].sort((a, b) => b.average - a.average);
    return sorted.map((student, idx) => ({
      ...student,
      rank: idx + 1,
    }));
  };

  const studentData = getStudentPerformance();

  // Metrics calculations
  const totalStudents = studentData.length;
  const scoredStudents = studentData.filter(s => s.hasMarks);
  const classAvg = scoredStudents.length > 0 ? Math.round(scoredStudents.reduce((sum, s) => sum + s.average, 0) / scoredStudents.length) : 0;
  const highestScore = scoredStudents.length > 0 ? Math.max(...scoredStudents.map(s => s.average)) : 0;
  const passingRate = scoredStudents.length > 0 ? Math.round((scoredStudents.filter(s => s.average >= 35).length / scoredStudents.length) * 100) : 0;

  // Chart data (performance ranges)
  const rangeCounts = { '90-100 (A+)': 0, '75-89 (A)': 0, '60-74 (B)': 0, '50-59 (C)': 0, '<50 (D/F)': 0 };
  scoredStudents.forEach((s) => {
    if (s.average >= 90) rangeCounts['90-100 (A+)']++;
    else if (s.average >= 75) rangeCounts['75-89 (A)']++;
    else if (s.average >= 60) rangeCounts['60-74 (B)']++;
    else if (s.average >= 50) rangeCounts['50-59 (C)']++;
    else rangeCounts['<50 (D/F)']++;
  });

  const chartData = Object.entries(rangeCounts).map(([range, count]) => ({
    range,
    students: count,
  }));

  const getPerformanceBadge = (avg: number) => {
    if (avg >= 90) return { label: 'Excellent', variant: 'purple' as const };
    if (avg >= 75) return { label: 'Good', variant: 'teal' as const };
    if (avg >= 50) return { label: 'Satisfactory', variant: 'blue' as const };
    return { label: 'Needs Help', variant: 'amber' as const };
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)] space-y-3">
      {/* Header filter controls */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
        <div>
          <div className="text-[13px] font-semibold text-[var(--tx)]">Student Performance Dashboard</div>
          <div className="text-[11px] text-[var(--tx3)] mt-0.5">
            Subject academic standing, average grades, and class rank distributions
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {finalClassList.length === 0 ? (
            <div className="text-[11.5px] text-[var(--red-tx)] bg-[var(--red-bg)] px-3 py-1.5 rounded-lg font-medium">
              No classes assigned.
            </div>
          ) : (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[11.5px] cursor-pointer outline-none text-[var(--tx)] focus:border-[var(--blue)]"
            >
              {finalClassList.map((c) => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          )}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2.5 py-1.5 text-[11.5px] cursor-pointer outline-none text-[var(--tx)] focus:border-[var(--blue)]"
          >
            {availableSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
 
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <KPICard label="Class Average" value={`${classAvg}%`} sub={`Class ${selectedClass} · ${selectedSubject}`} icon={<TrendingUp size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Highest Score" value={`${highestScore}%`} sub="Top standing" icon={<Award size={15} />} iconBg="var(--purple-bg)" iconColor="var(--purple-tx)" />
        <KPICard label="Passing Rate (>=35%)" value={`${passingRate}%`} sub="Students passing" icon={<Percent size={15} />} iconBg="var(--teal-bg)" iconColor="var(--teal-tx)" />
        <KPICard label="Total Students" value={totalStudents} sub="Enrolled in class" icon={<Users size={15} />} iconBg="var(--amber-bg)" iconColor="var(--amber-tx)" />
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-2.5">
        {/* Performance rankings list */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13px] font-semibold text-[var(--tx)]">Student Rankings & Marks</div>
            <Badge variant="blue">{selectedSubject}</Badge>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12 text-[12px] text-[var(--tx3)]">
                Loading student performance data directly from DB...
              </div>
            ) : studentData.length === 0 ? (
              <div className="text-center py-12 text-[12px] text-[var(--tx3)]">
                No student details found for Class {selectedClass}.
              </div>
            ) : (
              <table className="w-full border-collapse text-[12px] min-w-[650px]">
                <thead>
                  <tr className="border-b border-[var(--b)] text-[var(--tx3)]">
                    <th className="text-[10.5px] font-medium text-left px-2 py-2">Rank</th>
                    <th className="text-[10.5px] font-medium text-left px-2 py-2">Student</th>
                    <th className="text-[10.5px] font-medium text-left px-2 py-2">Roll No</th>
                    {activeExams.map((exam) => (
                      <th key={exam.id} className="text-[10.5px] font-medium text-left px-2 py-2">{exam.name}</th>
                    ))}
                    <th className="text-[10.5px] font-medium text-left px-2 py-2">Avg %</th>
                    <th className="text-[10.5px] font-medium text-left px-2 py-2">Standing</th>
                  </tr>
                </thead>
                <tbody>
                  {studentData.map((student) => {
                    const badge = getPerformanceBadge(student.average);
                    return (
                      <tr key={student.roll} className="border-b border-[var(--b)] hover:bg-[var(--surf2)] last:border-0">
                        <td className="px-2 py-2.5 font-bold text-[var(--tx3)]">#{student.rank}</td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar initials={student.init} bg={AVATAR_COLORS[student.init]?.bg ?? 'var(--surf3)'} color={AVATAR_COLORS[student.init]?.color ?? 'var(--tx2)'} />
                            <span className="font-semibold text-[var(--tx)]">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 font-mono text-[11px] text-[var(--tx3)]">{student.roll}</td>
                        {activeExams.map((exam) => {
                          const selectedExamObj = exams.find((e) => e.id === exam.id);
                          const fallbackMax = selectedExamObj?.maxMarks || 100;
                          const maxMarks = getMaxMarksForSubject(exam.id, selectedClass, selectedSubject, fallbackMax);
                          return (
                            <td key={exam.id} className="px-2 py-2.5 text-[var(--tx2)] font-medium">
                              {student.examScores[exam.id] !== undefined ? `${student.examScores[exam.id]}/${maxMarks}` : '-'}
                            </td>
                          );
                        })}
                        <td className="px-2 py-2.5 font-bold text-[var(--tx)]">{student.average}%</td>
                        <td className="px-2 py-2.5">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Visual Chart - Ranges Distribution */}
        <div className="space-y-2.5">
          <Card>
            <div className="text-[12.5px] font-semibold text-[var(--tx)] mb-3">Score Ranges Distribution</div>
            <div className="h-[210px]">
              {loading ? (
                <div className="h-full flex items-center justify-center text-[12px] text-[var(--tx3)]">
                  Loading statistics...
                </div>
              ) : scoredStudents.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[12px] text-[var(--tx3)]">
                  No distribution statistics available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={chartData} barSize={24} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--b)" />
                    <XAxis dataKey="range" tick={{ fontSize: 9.5, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9.5, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [v, 'Students']} cursor={{ fill: 'var(--surf2)' }} />
                    <Bar dataKey="students" fill="var(--teal)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Top Performers list card */}
          <Card>
            <div className="text-[12.5px] font-semibold text-[var(--tx)] mb-3">Top Performers</div>
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-6 text-[12px] text-[var(--tx3)]">
                  Loading...
                </div>
              ) : studentData.length === 0 ? (
                <div className="text-center py-6 text-[12px] text-[var(--tx3)]">
                  No records.
                </div>
              ) : (
                studentData.slice(0, 3).map((st) => (
                  <div key={st.roll} className="flex items-center justify-between p-2.5 bg-[var(--surf2)] rounded-xl border border-[var(--b)]">
                    <div className="flex items-center gap-2">
                      <Avatar initials={st.init} bg={AVATAR_COLORS[st.init]?.bg ?? 'var(--purple-bg)'} color={AVATAR_COLORS[st.init]?.color ?? 'var(--purple-tx)'} />
                      <div>
                        <span className="text-[12px] font-bold text-[var(--tx)]">{st.name}</span>
                        <div className="text-[9.5px] text-[var(--tx3)] font-mono">{st.roll}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[12.5px] font-bold text-[var(--blue-tx)]">{st.average}%</span>
                      <div className="text-[9px] text-[var(--tx3)]">Overall Average</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
