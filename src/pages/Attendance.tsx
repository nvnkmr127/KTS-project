import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  CheckCircle, XCircle, BarChart2, AlertTriangle, Search, ArrowLeft, Calendar, BookOpen, Clock, Users, ArrowRight, User, ChevronLeft, ChevronRight, Loader2, Trash2
} from 'lucide-react';
// @ts-ignore
import * as XLSX from 'xlsx';
import { KPICard } from '../components/KPICard';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar, ProgressBar } from '../components/ui';
import { api, clearApiCache } from '../services/api';
import { useDialog } from '../context/DialogContext';

const monthlyData = [
  { month: 'Jan', pct: 90 },
  { month: 'Feb', pct: 88 },
  { month: 'Mar', pct: 93 },
  { month: 'Apr', pct: 91 },
  { month: 'May', pct: 92 },
];

const tooltipStyle = {
  backgroundColor: 'var(--surf)',
  border: '0.5px solid var(--b2)',
  borderRadius: 8,
  fontSize: 11,
  color: 'var(--tx)',
};

interface Batch {
  id: string;
  name: string;
  class_teacher_name?: string;
  class_teacher_id?: number;
  isMock?: boolean;
}

interface StudentPercentage {
  id: string;
  name: string;
  enrollment_number: string;
  total_classes: number;
  present_classes: number;
  percentage: number;
}

interface AttendanceRecord {
  id: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  attendance_date: string;
  check_in_time?: string;
  subject?: {
    name: string;
  };
  time_slot?: {
    name: string;
    start_time: string;
    end_time: string;
  };
  faculty?: {
    name: string;
  };
}

export function Attendance() {
  const { alert, confirm } = useDialog();
  const [view, setView] = useState<'cards' | 'class-details' | 'student-details'>('cards');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Drill-down states
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [studentsList, setStudentsList] = useState<StudentPercentage[]>([]);

  const [selectedStudent, setSelectedStudent] = useState<StudentPercentage | null>(null);
  const [studentAttendance, setStudentAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [classGlanceData, setClassGlanceData] = useState<{ cls: string; pct: number; color: string }[]>([]);

  // Calendar states
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingPeriods, setLoadingPeriods] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [students, setStudents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);

  // Additional states for bulk actions, sorting, and Excel import
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'name' | 'enrollment_number' | 'percentage' | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [excelImportLoading, setExcelImportLoading] = useState(false);

  const saveSettingToDb = async (key: string, value: string) => {
    try {
      const settings = await api.getResources('settings');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = settings.find((s: any) => s.key === key);
      if (existing) {
        await api.updateResource('settings', existing.id, { key, value });
      } else {
        await api.createResource('settings', { key, value, group: 'general', type: 'json', is_public: false, is_encrypted: false });
      }
    } catch (err) {
      console.error(`Error saving setting ${key} to DB:`, err);
    }
  };

  const handleSort = (field: 'name' | 'enrollment_number' | 'percentage') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleBulkAttendanceUpdate = async (status: 'present' | 'absent') => {
    if (selectedStudentIds.length === 0 || !selectedBatch) return;
    setLoading(true);
    try {
      const local = localStorage.getItem('kts_student_attendance_records');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let records = (local && JSON.parse(local)) as any[] || [];

      selectedStudentIds.forEach((studentId) => {
        // Mark both morning and lunch period
        ['first_period', 'lunch_period'].forEach((session) => {
          const idx = records.findIndex(r =>
            String(r.studentId) === String(studentId) && r.date === selectedDate && r.session === session
          );
          if (idx !== -1) {
            records[idx].status = status;
          } else {
            records.push({
              studentId,
              className: selectedBatch.name,
              date: selectedDate,
              session,
              status,
              markedBy: 'Admin'
            });
          }
        });
      });

      localStorage.setItem('kts_student_attendance_records', JSON.stringify(records));
      setAttendanceRecords(records);
      await saveSettingToDb('kts_student_attendance_records', JSON.stringify(records));
      setSelectedStudentIds([]);

      // Reload batch percentages
      const response = await api.getBatchStudentPercentages(selectedBatch.id);
      if (response.success && response.data) {
        setStudentsList(response.data.students || []);
      }
      await alert(`Bulk marked ${status} successfully!`, 'Success');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteAttendance = async () => {
    if (selectedStudentIds.length === 0 || !selectedBatch) return;
    if (await confirm(`Are you sure you want to delete all attendance records on ${selectedDate} for the ${selectedStudentIds.length} selected students?`, 'Delete Attendance', true)) {
      setLoading(true);
      try {
        const local = localStorage.getItem('kts_student_attendance_records');
        if (local) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const records = (local && JSON.parse(local) as any[]) || [];
          const filteredRecords = records.filter(r =>
            !(selectedStudentIds.includes(String(r.studentId)) && r.date === selectedDate)
          );
          localStorage.setItem('kts_student_attendance_records', JSON.stringify(filteredRecords));
          setAttendanceRecords(filteredRecords);
          await saveSettingToDb('kts_student_attendance_records', JSON.stringify(filteredRecords));
        }
        setSelectedStudentIds([]);
        // Reload batch percentages
        const response = await api.getBatchStudentPercentages(selectedBatch.id);
        if (response.success && response.data) {
          setStudentsList(response.data.students || []);
        }
        await alert('Deleted records successfully!', 'Deleted');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const exportClassAttendanceToExcel = () => {
    if (!selectedBatch) return;
    const dataToExport = filteredStudents.map(s => ({
      'Student Name': s.name,
      'Enrollment Number': s.enrollment_number,
      'Total Classes': s.total_classes,
      'Present Classes': s.present_classes,
      'Overall Attendance %': s.percentage
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Attendance Class ${selectedBatch.name}`);
    XLSX.writeFile(wb, `KTS_Attendance_Class_${selectedBatch.name}.xlsx`);
  };

  const handleImportExcelAttendance = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedBatch) return;
    const file = e.target.files[0];
    setExcelImportLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = XLSX.utils.sheet_to_json(ws) as any[];

          const local = localStorage.getItem('kts_student_attendance_records');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let records = (local && JSON.parse(local)) as any[] || [];

          let count = 0;
          data.forEach(row => {
            const enrollment = String(row['Enrollment Number'] || row['EnrollmentNumber'] || '').trim();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const status = String(row['Status'] || 'present').trim().toLowerCase() as any;

            if (enrollment && ['present', 'absent', 'late', 'excused'].includes(status)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const stud = students.find((s: any) => String(s.enrollment_number).trim() === enrollment);
              if (stud) {
                ['first_period', 'lunch_period'].forEach((session) => {
                  const idx = records.findIndex(r =>
                    String(r.studentId) === String(stud.id) && r.date === selectedDate && r.session === session
                  );
                  if (idx !== -1) {
                    records[idx].status = status;
                  } else {
                    records.push({
                      studentId: String(stud.id),
                      className: selectedBatch.name,
                      date: selectedDate,
                      session,
                      status,
                      markedBy: 'Excel Import'
                    });
                  }
                });
                count++;
              }
            }
          });

          localStorage.setItem('kts_student_attendance_records', JSON.stringify(records));
          setAttendanceRecords(records);
          await saveSettingToDb('kts_student_attendance_records', JSON.stringify(records));

          const response = await api.getBatchStudentPercentages(selectedBatch.id);
          if (response.success && response.data) {
            setStudentsList(response.data.students || []);
          }
          await alert(`Successfully imported attendance for ${count} students!`, "Import Success");
        } catch (err) {
          console.error(err);
          await alert('Failed to parse spreadsheet file rows', "Parse Error");
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      await alert('Error reading spreadsheet file', "Read Error");
    } finally {
      setExcelImportLoading(false);
    }
  };

  // Load batches on mount
  useEffect(() => {
    async function loadBatches() {
      setLoading(true);
      setError(null);
      try {
        const [batchesData, studentsData, todayAttendanceRes] = await Promise.all([
          api.getResources('batches').catch((err) => {
            console.warn('Failed to fetch batches list:', err);
            return [];
          }),
          api.getResources('students').catch((err) => {
            console.warn('Failed to fetch students list:', err);
            return [];
          }),
          api.getTodayAttendance('students').catch((err) => {
            console.warn('Failed to fetch today\'s attendance stats:', err);
            return { success: false, data: { attendances: [] } };
          })
        ]);

        const todayAttendanceData = todayAttendanceRes?.success && todayAttendanceRes?.data?.attendances
          ? todayAttendanceRes.data.attendances
          : [];

        const parseBatchName = (name: string) => {
          const str = name.toUpperCase().trim();

          // Match format "LKG SECTION C" or "LKG SEC C"
          const sectionWordMatch = str.match(/^(.*?)\s*(?:SECTION|SEC)\s*([A-Z])$/i);
          if (sectionWordMatch) {
            return { classId: sectionWordMatch[1].trim(), sectionLetter: sectionWordMatch[2] };
          }

          // Match standard format "8A", "LKGA", "PP1A", "LKG A"
          const standardMatch = str.match(/^([A-Z0-9-]+)\s*([A-Z])$/i);
          if (standardMatch) {
            return { classId: standardMatch[1], sectionLetter: standardMatch[2] };
          }

          // Fallback to number extraction or default to '8'
          const classMatch = str.match(/^(\d+)/) || str.match(/CLASS\s*(\d+)/i);
          const classId = classMatch ? classMatch[1] : '8';

          let sectionLetter = 'A';
          const stdMatch = str.match(/^(\d+)\s*([A-Z])$/i);
          if (stdMatch) {
            sectionLetter = stdMatch[2];
          } else {
            const sectionMatch = str.match(/(?:SECTION|SEC)\s*([A-Z])/i) || str.match(/\s+([A-Z])$/i);
            if (sectionMatch) {
              sectionLetter = sectionMatch[1];
            }
          }

          return { classId, sectionLetter };
        };

        const uniqueBatchesMap: Record<string, Batch> = {};
        const defaultClasses = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (batchesData || []).forEach((b: any) => {
          const { classId, sectionLetter } = parseBatchName(b.name);
          const mappedName = `${classId}${sectionLetter}`;
          const existing = uniqueBatchesMap[mappedName];
          const isExactMatch = b.name.toUpperCase().trim() === mappedName;

          if (!existing || isExactMatch) {
            uniqueBatchesMap[mappedName] = {
              id: String(b.id),
              name: mappedName,
              class_teacher_name: b.class_teacher_name || undefined,
              isMock: false,
            };
          }
        });

        // Add mock sections for default classes if not present
        defaultClasses.forEach((cId) => {
          const hasSectionA = uniqueBatchesMap[`${cId}A`] !== undefined;
          const hasSectionB = uniqueBatchesMap[`${cId}B`] !== undefined;

          if (!hasSectionA && !hasSectionB) {
            uniqueBatchesMap[`${cId}A`] = { id: `mock-${cId}A`, name: `${cId}A`, isMock: true };
            uniqueBatchesMap[`${cId}B`] = { id: `mock-${cId}B`, name: `${cId}B`, isMock: true };
          }
        });

        const getClassWeight = (batchName: string): number => {
          const str = batchName.toUpperCase().trim();
          const parsed = parseBatchName(str);
          const cls = parsed.classId;
          const weights: Record<string, number> = {
            'NURSERY': 1,
            'PP1': 2,
            'PP2': 3,
            'LKG': 4,
            'UKG': 5
          };
          if (weights[cls] !== undefined) {
            return weights[cls];
          }
          const num = parseInt(cls, 10);
          if (!isNaN(num)) {
            return num + 10;
          }
          return 999;
        };

        const sortedBatches = Object.values(uniqueBatchesMap).sort((a, b) => {
          const weightA = getClassWeight(a.name);
          const weightB = getClassWeight(b.name);

          if (weightA !== weightB) {
            return weightA - weightB;
          }
          return a.name.localeCompare(b.name);
        });

        // Filter students list to include active students only
        const activeStudents = (studentsData || []).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (s: any) => (s.status || '').toLowerCase() === 'active'
        );

        // Filter today's attendance to only include records for active students
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activeStudentIds = new Set(activeStudents.map((s: { id: any; }) => String(s.id)));
        const activeTodayAttendance = (todayAttendanceData || []).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (att: any) => activeStudentIds.has(String(att.student_id))
        );

        setBatches(sortedBatches);
        setStudents(activeStudents);
        setTodayAttendance(activeTodayAttendance);

        // Compute class-wise today's glance data with real analytics using active students only
        const glanceList = defaultClasses.map((cId) => {
          let totalStudents = 0;
          let presentStudents = 0;
          let hasRealData = false;

          const classSections = Object.values(uniqueBatchesMap).filter(
            (b) => b.name.startsWith(cId) && !b.isMock
          );

          classSections.forEach((sec) => {
            const batchStudents = activeStudents.filter(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (s: any) => String(s.batch_id) === String(sec.id)
            );
            if (batchStudents.length > 0) {
              hasRealData = true;
              totalStudents += batchStudents.length;

              // Avoid double counting and check if student is marked present in any period today
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const presentInBatch = batchStudents.filter((student: { id: any; }) =>
                activeTodayAttendance.some(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (att: any) => String(att.student_id) === String(student.id) && ['present', 'late'].includes(att.status)
                )
              ).length;
              presentStudents += presentInBatch;
            }
          });

          let percentage = 0;
          if (hasRealData && totalStudents > 0) {
            percentage = Math.round((presentStudents / totalStudents) * 100);
          } else {
            percentage = 0;
          }

          const color = percentage >= 90 ? 'var(--teal)' : percentage >= 75 ? 'var(--blue)' : 'var(--amber)';

          return {
            cls: `Class ${cId}`,
            pct: percentage,
            color: color,
          };
        });

        setClassGlanceData(glanceList);

      } catch (err: any) {
        console.error('Error fetching batches:', err);
        setError(`Failed to load classes: ${err.message || err.toString()}`);
      } finally {
        setLoading(false);
      }
    }
    loadBatches();
  }, []);

  // Load class student percentages
  const handleClassClick = async (batch: Batch) => {
    setSelectedBatch(batch);
    setSearchQuery('');
    if (batch.isMock || batch.id.startsWith('mock-')) {
      setStudentsList([]);
      setView('class-details');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.getBatchStudentPercentages(batch.id);
      if (response.success && response.data) {
        setStudentsList(response.data.students || []);
        setView('class-details');
      } else {
        setError('Failed to retrieve class details.');
      }
    } catch (err: any) {
      console.error('Error fetching batch percentages:', err);
      clearApiCache('batches');
      setError(err.message || 'Failed to load student attendance percentages.');
    } finally {
      setLoading(false);
    }
  };

  // Load student detailed view
  const handleStudentClick = async (student: StudentPercentage) => {
    setSelectedStudent(student);
    setCurrentMonth(new Date());
    setLoading(true);
    setError(null);
    try {
      const response = await api.getStudentAttendanceForDate(student.id, selectedDate);
      if (response.success && response.data) {
        setStudentAttendance(response.data.attendances || []);
        setView('student-details');
      } else {
        setError('Failed to retrieve student attendance.');
      }
    } catch (err: any) {
      console.error('Error fetching student attendance:', err);
      setError(err.message || 'Failed to load student detailed attendance.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch kts_student_attendance_records when selectedStudent changes
  useEffect(() => {
    if (selectedStudent && view === 'student-details') {
      setLoadingAttendance(true);
      api.getResources('settings', { key: 'kts_student_attendance_records' })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((res: any) => {
          if (Array.isArray(res) && res.length > 0 && res[0].value) {
            try {
              const parsed = (res[0].value && JSON.parse(res[0].value)) || [];
              setAttendanceRecords(parsed);
              localStorage.setItem('kts_student_attendance_records', JSON.stringify(parsed));
            } catch (e) {
              console.error('Error parsing kts_student_attendance_records:', e);
              const local = localStorage.getItem('kts_student_attendance_records');
              if (local) {
                const parsedLocal = JSON.parse(local);
                if (parsedLocal) setAttendanceRecords(parsedLocal);
              }
            }
          } else {
            const local = localStorage.getItem('kts_student_attendance_records');
            if (local) {
              const parsedLocal = local && JSON.parse(local);
              if (parsedLocal) setAttendanceRecords(parsedLocal);
            }
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch((err: any) => {
          console.error('Error loading attendance settings:', err);
          const local = localStorage.getItem('kts_student_attendance_records');
          if (local) {
            const parsedLocal = JSON.parse(local);
            if (parsedLocal) setAttendanceRecords(parsedLocal);
          }
        })
        .finally(() => {
          setLoadingAttendance(false);
        });
    } else {
      setAttendanceRecords([]);
    }
  }, [selectedStudent, view]);

  // Reload student attendance when date changes
  useEffect(() => {
    if (selectedStudent && view === 'student-details') {
      async function reloadStudentAttendance() {
        setLoadingPeriods(true);
        setError(null);
        try {
          const response = await api.getStudentAttendanceForDate(selectedStudent!.id, selectedDate);
          if (response.success && response.data) {
            setStudentAttendance(response.data.attendances || []);
          }
        } catch (err) {
          console.error('Error reloading student attendance:', err);
          setError('Failed to update student attendance for selected date.');
        } finally {
          setLoadingPeriods(false);
        }
      }
      reloadStudentAttendance();
    }
  }, [selectedDate, selectedStudent, view]);

  // Filters for classes & students
  const filteredBatches = batches.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = studentsList.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.enrollment_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedFilteredStudents = [...filteredStudents].sort((a, b) => {
    if (!sortField) return 0;
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Status Badge Mapper
  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return <Badge variant="teal">Present</Badge>;
      case 'absent': return <Badge variant="red">Absent</Badge>;
      case 'late': return <Badge variant="amber">Late</Badge>;
      case 'excused': return <Badge variant="blue">Excused</Badge>;
      default: return <Badge variant="gray">{status}</Badge>;
    }
  };

  // Avatar Initials Helper
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getDayAttendanceInfo = (dateStr: string) => {
    if (!selectedStudent) return null;
    const dayRecords = attendanceRecords.filter(
      r => String(r.studentId) === String(selectedStudent.id) && r.date === dateStr
    );
    if (dayRecords.length === 0) return null;

    const presentCount = dayRecords.filter(r => r.status?.toLowerCase() === 'present' || r.status?.toLowerCase() === 'late').length;
    const absentCount = dayRecords.filter(r => r.status?.toLowerCase() === 'absent').length;

    if (presentCount > 0 && absentCount > 0) {
      return {
        status: 'partial' as const,
        className: 'bg-[var(--purple-bg)] text-[var(--purple-tx)] border-[var(--purple-tx)]/25',
        label: 'Partial',
        details: `${presentCount} P / ${absentCount} A`
      };
    } else if (presentCount > 0) {
      return {
        status: 'present' as const,
        className: 'bg-[var(--green-bg)] text-[var(--green-tx)] border-[var(--green-tx)]/25',
        label: 'Present',
        details: `${presentCount} Present`
      };
    } else if (absentCount > 0) {
      return {
        status: 'absent' as const,
        className: 'bg-[var(--red-bg)] text-[var(--red-tx)] border-[var(--red-tx)]/25',
        label: 'Absent',
        details: `${absentCount} Absent`
      };
    }
    return null;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const totalSchoolStudents = students.length;
  let totalPresent = 0;
  let totalAbsent = 0;

  students.forEach(student => {
    const studentAtt = todayAttendance.filter(
      (att: any) => String(att.student_id) === String(student.id)
    );
    if (studentAtt.length > 0) {
      const hasPresent = studentAtt.some(att => ['present', 'late'].includes(att.status));
      if (hasPresent) {
        totalPresent++;
      } else {
        const hasAbsent = studentAtt.some(att => att.status === 'absent');
        if (hasAbsent) {
          totalAbsent++;
        }
      }
    }
  });

  const presentPercentage = totalSchoolStudents > 0 
    ? Math.round((totalPresent / totalSchoolStudents) * 100) 
    : 0;
    
  const currentMonthName = monthNames[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)] pb-10">
      {/* Top Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard
          label="Present Today"
          value={totalPresent}
          sub={`Out of ${totalSchoolStudents}`}
          icon={<CheckCircle size={15} />}
          iconBg="var(--teal-bg)"
          iconColor="var(--teal-tx)"
        />
        <KPICard
          label="Absent Today"
          value={totalAbsent}
          sub="Alerts sent via WA+SMS"
          icon={<XCircle size={15} />}
          iconBg="var(--red-bg)"
          iconColor="var(--red-tx)"
        />
        <KPICard
          label="Today's Avg"
          value={<>{presentPercentage}<span className="text-[13px] font-normal text-[var(--tx3)]">%</span></>}
          sub={`${currentMonthName} ${currentYear}`}
          icon={<BarChart2 size={15} />}
          iconBg="var(--blue-bg)"
          iconColor="var(--blue-tx)"
        />
        <KPICard
          label="Low Attendance"
          value="-"
          sub="Requires monthly data"
          icon={<AlertTriangle size={15} />}
          iconBg="var(--amber-bg)"
          iconColor="var(--amber-tx)"
        />
      </div>

      {error && (
        <div className="mb-3 p-3 bg-[var(--red-bg)] border border-[var(--red)] text-[var(--red-tx)] rounded-xl text-[12px] flex items-center gap-2">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--blue)]"></div>
        </div>
      )}

      {/* VIEW: CLASSES CARDS AND DASHBOARD CHART */}
      {!loading && view === 'cards' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
            {/* Class Cards Grid */}
            <div className="lg:col-span-2">
              <Card>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-[13px] font-bold text-[var(--tx)]">School Directory — Classes</h2>
                    <p className="text-[10.5px] text-[var(--tx3)]">Select a class card to inspect student overall percentages</p>
                  </div>
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--tx3)]" size={12} />
                    <input
                      type="text"
                      placeholder="Search classes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[var(--surf)] border border-[var(--b2)] rounded-lg text-[11px] text-[var(--tx)] focus:outline-none focus:border-[var(--blue)]"
                    />
                  </div>
                </div>

                {filteredBatches.length === 0 ? (
                  <div className="text-center py-12 text-[var(--tx3)] text-[12px]">
                    No classes found matching search query.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filteredBatches.map((batch) => {
                      const batchStudents = students.filter(s => String(s.batch_id) === String(batch.id));
                      const totalStudents = batchStudents.length;

                      // Count unique students marked present or absent today (avoid double-counting across periods)
                      let presentCount = 0;
                      let absentCount = 0;

                      batchStudents.forEach(student => {
                        const studentAtt = todayAttendance.filter(
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (att: any) => String(att.student_id) === String(student.id)
                        );
                        if (studentAtt.length > 0) {
                          const hasPresent = studentAtt.some(att => ['present', 'late'].includes(att.status));
                          if (hasPresent) {
                            presentCount++;
                          } else {
                            const hasAbsent = studentAtt.some(att => att.status === 'absent');
                            if (hasAbsent) {
                              absentCount++;
                            }
                          }
                        }
                      });

                      return (
                        <div
                          key={batch.id}
                          onClick={() => handleClassClick(batch)}
                          className="group relative overflow-hidden bg-[var(--surf2)] hover:bg-[var(--surf)] border border-[var(--b)] hover:border-[var(--blue-tx)] rounded-xl p-3.5 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                        >
                          <div className="absolute right-0 top-0 w-20 h-20 bg-gradient-to-br from-[var(--blue-bg)] to-transparent opacity-20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />

                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--blue-bg)] text-[var(--blue-tx)] rounded-lg">
                              <Users size={14} />
                            </div>
                            <div>
                              <div className="text-[12.5px] font-bold text-[var(--tx)] group-hover:text-[var(--blue)] transition-colors">Class {batch.name}</div>
                              <div className="text-[10px] text-[var(--tx3)] mt-0.5">Teacher: {batch.class_teacher_name || 'Not assigned'} · {totalStudents} Students</div>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            {totalStudents > 0 ? (
                              <div className="flex gap-1.5">
                                <Badge variant="teal">{presentCount} Present</Badge>
                                <Badge variant="red">{absentCount} Absent</Badge>
                              </div>
                            ) : (
                              <Badge variant="gray">No students</Badge>
                            )}
                            <div className="flex items-center text-[10px] text-[var(--blue-tx)] font-semibold gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              View Attendance <ArrowRight size={10} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Monthly Attendance Chart */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader title="Monthly Attendance" />
                <div className="h-[175px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--b)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Attendance']} />
                      <Line type="monotone" dataKey="pct" stroke="var(--blue)" strokeWidth={2} dot={{ r: 3, fill: 'var(--blue)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>

          {/* Class-wise overview */}
          <Card>
            <CardHeader title="Class-wise Today at a Glance" />
            <div className="overflow-x-auto pb-1">
              <div className="flex gap-2 min-w-max">
                {classGlanceData.map((c) => (
                  <div
                    key={c.cls}
                    className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-2.5 text-center flex-1 min-w-[120px]"
                  >
                    <div className="text-[11px] font-semibold text-[var(--tx)] mb-1">{c.cls}</div>
                    <div className="text-[18px] font-semibold mb-1.5" style={{ color: c.color }}>
                      {c.pct}%
                    </div>
                    <ProgressBar value={c.pct} color={c.color} />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* VIEW: CLASS DETAIL STUDENT PERCENTAGES */}
      {!loading && view === 'class-details' && selectedBatch && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-[var(--b)] pb-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setView('cards')}
                className="p-1.5 hover:bg-[var(--surf2)] rounded-lg text-[var(--tx2)] hover:text-[var(--tx)] cursor-pointer"
              >
                <ArrowLeft size={13} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[13.5px] font-bold text-[var(--tx)]">Class {selectedBatch.name} — Student Attendance</h2>
                  <Badge variant="teal">Overall Percentages</Badge>
                </div>
                <p className="text-[10px] text-[var(--tx3)]">Click on a student to see their period-wise attendance for a selected date</p>
              </div>
            </div>
          </div>

          {/* Read-only Alert Notice */}
          <div className="mb-4 p-3.5 bg-[var(--amber-bg)]/20 border border-[var(--amber-tx)]/15 rounded-xl flex items-start gap-2.5 text-[11.5px] text-[var(--tx2)]">
            <AlertTriangle className="text-[var(--amber-tx)] shrink-0 mt-0.5" size={14} />
            <div>
              <span className="font-bold text-[var(--tx)]">Attendance is Read-only:</span> Submissions and status edits of student attendance records must be performed by teachers in the <span className="font-semibold text-[var(--blue-tx)]">Attendance Allot</span> tab.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="text-[10.5px] text-[var(--tx3)]">
              Showing <span className="font-semibold text-[var(--tx)]">{sortedFilteredStudents.length}</span> students in this class
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11.5px] min-w-[500px]">
              <thead>
                <tr className="border-b border-[var(--b)] bg-[var(--surf2)]">
                  <th onClick={() => handleSort('name')} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-3 py-2 border-b border-[var(--b)] cursor-pointer hover:text-[var(--tx)]">
                    Student {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSort('enrollment_number')} className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-3 py-2 border-b border-[var(--b)] cursor-pointer hover:text-[var(--tx)]">
                    Enrollment {sortField === 'enrollment_number' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-3 py-2 border-b border-[var(--b)] w-24">Total Lectures</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-3 py-2 border-b border-[var(--b)] w-24">Attended</th>
                  <th onClick={() => handleSort('percentage')} className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-3 py-2 border-b border-[var(--b)] w-36 cursor-pointer hover:text-[var(--tx)]">
                    Overall % {sortField === 'percentage' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedFilteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-[var(--tx3)]">
                      {selectedBatch?.isMock
                        ? 'No registered students yet; assign teacher or add students first in the Classes tab.'
                        : 'No student records found.'}
                    </td>
                  </tr>
                ) : (
                  sortedFilteredStudents.map((student) => {
                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-[var(--surf2)] border-b border-[var(--b)] transition-colors cursor-pointer group"
                        onClick={() => handleStudentClick(student)}
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar initials={getInitials(student.name)} bg="var(--blue-bg)" color="var(--blue-tx)" />
                            <span className="font-semibold text-[var(--tx)] group-hover:text-[var(--blue)] transition-colors">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[var(--tx2)] font-mono">{student.enrollment_number}</td>
                        <td className="px-3 py-2 text-center text-[var(--tx)]">{student.total_classes}</td>
                        <td className="px-3 py-2 text-center text-[var(--tx)]">{student.present_classes}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-2.5">
                            <span className={`font-bold text-[12px] ${student.percentage >= 75 ? 'text-[var(--teal)]' : student.percentage >= 60 ? 'text-[var(--amber)]' : 'text-[var(--red)]'}`}>
                              {student.percentage}%
                            </span>
                            <div className="w-16 hidden sm:block">
                              <ProgressBar value={student.percentage} color={student.percentage >= 75 ? 'var(--teal)' : student.percentage >= 60 ? 'var(--amber)' : 'var(--red)'} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* VIEW: STUDENT PERIOD-WISE DAILY ATTENDANCE */}
      {!loading && view === 'student-details' && selectedStudent && selectedBatch && (
        <Card>
          <div className="flex items-center gap-2.5 mb-4 border-b border-[var(--b)] pb-3">
            <button
              onClick={() => {
                setError(null);
                setView('class-details');
              }}
              className="p-1.5 hover:bg-[var(--surf2)] rounded-lg text-[var(--tx2)] hover:text-[var(--tx)] cursor-pointer"
            >
              <ArrowLeft size={13} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[13.5px] font-bold text-[var(--tx)]">{selectedStudent.name}</h2>
                <Badge variant="teal">{selectedStudent.percentage}% Overall</Badge>
              </div>
              <p className="text-[10px] text-[var(--tx3)]">Roll: {selectedStudent.enrollment_number} | Class: {selectedBatch.name}</p>
            </div>
          </div>

          {/* Monthly Attendance Calendar */}
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-4.5 mb-4 space-y-4">
            {/* Calendar Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--b)]">
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-bold text-[var(--tx)]">Monthly Attendance Grid</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                  className="p-1.5 rounded-lg border border-[var(--b)] bg-[var(--surf2)] text-[var(--tx)] hover:bg-[var(--surf3)] transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft size={13} />
                </button>

                <select
                  value={month}
                  onChange={(e) => setCurrentMonth(new Date(year, parseInt(e.target.value), 1))}
                  className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2 py-1 text-[11.5px] font-bold text-[var(--tx)] cursor-pointer outline-none hover:bg-[var(--surf3)] transition-all"
                  title="Select Month"
                >
                  {monthNames.map((name, idx) => (
                    <option key={name} value={idx}>{name}</option>
                  ))}
                </select>

                <select
                  value={year}
                  onChange={(e) => setCurrentMonth(new Date(parseInt(e.target.value), month, 1))}
                  className="bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-2 py-1 text-[11.5px] font-bold text-[var(--tx)] cursor-pointer outline-none hover:bg-[var(--surf3)] transition-all"
                  title="Select Year"
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <button
                  onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                  className="p-1.5 rounded-lg border border-[var(--b)] bg-[var(--surf2)] text-[var(--tx)] hover:bg-[var(--surf3)] transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight size={13} />
                </button>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px] font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-[var(--green-bg)] border border-[var(--green-tx)]/20 inline-block"></span>
                  <span className="text-[var(--tx2)]">Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-[var(--purple-bg)] border border-[var(--purple-tx)]/20 inline-block"></span>
                  <span className="text-[var(--tx2)]">Partial</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-[var(--red-bg)] border border-[var(--red-tx)]/20 inline-block"></span>
                  <span className="text-[var(--tx2)]">Absent</span>
                </div>
              </div>
            </div>

            {/* Calendar Loader or Grid */}
            {loadingAttendance ? (
              <div className="flex flex-col justify-center items-center py-12 text-[var(--tx3)] gap-2">
                <Loader2 className="animate-spin text-[var(--blue-tx)]" size={20} />
                <span className="text-xs">Loading attendance details...</span>
              </div>
            ) : (
              /* Calendar Grid */
              <div className="grid grid-cols-7 gap-1.5">
                {/* Weekday headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-[var(--tx3)] uppercase py-1">
                    {d}
                  </div>
                ))}

                {/* Empty slots for starting offset */}
                {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square bg-transparent rounded-lg"></div>
                ))}

                {/* Active month days */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayRecords = attendanceRecords.filter(
                    r => String(r.studentId) === String(selectedStudent.id) && r.date === dateStr
                  );
                  const att = getDayAttendanceInfo(dateStr);

                  const tooltipText = att
                    ? `${dayNum} ${monthNames[month]}: ${att.label}\n${dayRecords.map(r => `${r.session === 'first_period' ? 'Morning' : 'Afternoon'}: ${r.status}`).join('\n')}`
                    : `${dayNum} ${monthNames[month]}: No attendance marked`;

                  const isSelectedDate = dateStr === selectedDate;

                  return (
                    <div
                      key={`day-${dayNum}`}
                      title={tooltipText}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`aspect-square p-2 rounded-xl flex flex-col justify-between border cursor-pointer transition-all ${isSelectedDate
                          ? 'ring-2 ring-[var(--blue)] scale-[1.02] shadow-sm z-10'
                          : ''
                        } ${att
                          ? att.className
                          : 'bg-[var(--surf2)] border-[var(--b)] text-[var(--tx2)] hover:bg-[var(--surf3)]'
                        }`}
                    >
                      <span className="text-[11px] font-bold">{dayNum}</span>
                      {att && (
                        <span className="text-[9px] font-bold opacity-90 text-right truncate">
                          {att.status === 'present' ? 'P' : att.status === 'absent' ? 'A' : '1/2'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date Selector Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[var(--surf2)] border border-[var(--b)] rounded-xl mb-4">
            <div className="flex items-center gap-2 text-[11px] text-[var(--tx)]">
              <Calendar size={13} className="text-[var(--blue-tx)]" />
              <span className="font-semibold">Filter Attendance Date:</span>
            </div>
            <div className="relative w-full sm:w-48">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-1 bg-[var(--surf)] border border-[var(--b2)] rounded-lg text-[11.5px] text-[var(--tx)] focus:outline-none focus:border-[var(--blue)] cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-[11.5px] font-bold text-[var(--tx)] mb-3 flex items-center gap-1.5">
              <Clock size={12} className="text-[var(--tx3)]" /> Period-wise breakdown on {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </h3>

            {loadingPeriods ? (
              <div className="flex flex-col justify-center items-center py-12 text-[var(--tx3)] gap-2">
                <Loader2 className="animate-spin text-[var(--blue-tx)]" size={20} />
                <span className="text-xs">Updating breakdown details...</span>
              </div>
            ) : studentAttendance.length === 0 ? (
              <div className="text-center py-10 bg-[var(--surf2)] border border-dashed border-[var(--b)] rounded-xl">
                <BookOpen size={18} className="mx-auto mb-2 text-[var(--tx3)]" />
                <p className="text-[11px] text-[var(--tx3)]">No attendance marked on this date.</p>
                <p className="text-[9.5px] text-[var(--tx3)] mt-1">This class might not have been scheduled, or attendance is yet to be marked by teachers.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {studentAttendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-[var(--surf2)] hover:bg-[var(--surf)] border border-[var(--b)] rounded-xl transition-all gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[var(--blue-bg)] text-[var(--blue-tx)] rounded-lg mt-0.5">
                        <BookOpen size={13} />
                      </div>
                      <div>
                        <div className="text-[12px] font-bold text-[var(--tx)]">
                          {record.subject?.name || 'General Subject'}
                        </div>
                        <div className="flex items-center gap-2.5 text-[10px] text-[var(--tx3)] mt-1">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {record.time_slot ? `${record.time_slot.start_time.substring(0, 5)} - ${record.time_slot.end_time.substring(0, 5)}` : (record.check_in_time ? record.check_in_time.substring(0, 5) : 'Time slots not set')}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <User size={11} /> Faculty: {record.faculty?.name || 'Assigned teacher'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {getStatusBadge(record.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
