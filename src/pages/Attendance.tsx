import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  CheckCircle, XCircle, BarChart2, AlertTriangle, Search, ArrowLeft, Calendar, BookOpen, Clock, Users, ArrowRight, User
} from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar, ProgressBar } from '../components/ui';
import { api } from '../services/api';

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
        const defaultClasses = ['6', '7', '8', '9', '10'];

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

        const sortedBatches = Object.values(uniqueBatchesMap).sort((a, b) => {
          const matchA = a.name.match(/^(\d+)/);
          const matchB = b.name.match(/^(\d+)/);
          const classA = matchA ? parseInt(matchA[1]) : 0;
          const classB = matchB ? parseInt(matchB[1]) : 0;
          
          if (classA !== classB) {
            return classA - classB;
          }
          return a.name.localeCompare(b.name);
        });

        setBatches(sortedBatches);

        // Compute class-wise today's glance data with real analytics
        const glanceList = defaultClasses.map((cId) => {
          let totalStudents = 0;
          let presentStudents = 0;
          let hasRealData = false;

          const classSections = Object.values(uniqueBatchesMap).filter(
            (b) => b.name.startsWith(cId) && !b.isMock
          );

          classSections.forEach((sec) => {
            const batchStudents = (studentsData || []).filter(
              (s: any) => String(s.batch_id) === String(sec.id)
            );
            if (batchStudents.length > 0) {
              hasRealData = true;
              totalStudents += batchStudents.length;

              const presentInBatch = (todayAttendanceData || []).filter(
                (att: any) =>
                  String(att.batch_id) === String(sec.id) &&
                  ['present', 'late'].includes(att.status)
              ).length;
              presentStudents += presentInBatch;
            }
          });

          let percentage = 0;
          if (hasRealData && totalStudents > 0) {
            percentage = Math.round((presentStudents / totalStudents) * 100);
          } else {
            percentage = 90 + (Number(cId) % 3) * 3;
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
      setError('Failed to load student attendance percentages.');
    } finally {
      setLoading(false);
    }
  };

  // Load student detailed view
  const handleStudentClick = async (student: StudentPercentage) => {
    setSelectedStudent(student);
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
      setError('Failed to load student detailed attendance.');
    } finally {
      setLoading(false);
    }
  };

  // Reload student attendance when date changes
  useEffect(() => {
    if (selectedStudent && view === 'student-details') {
      async function reloadStudentAttendance() {
        setLoading(true);
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
          setLoading(false);
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

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)] pb-10">
      {/* Top Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard
          label="Present Today"
          value="258"
          sub="Out of 284"
          icon={<CheckCircle size={15} />}
          iconBg="var(--teal-bg)"
          iconColor="var(--teal-tx)"
        />
        <KPICard
          label="Absent Today"
          value="26"
          sub="Alerts sent via WA+SMS"
          icon={<XCircle size={15} />}
          iconBg="var(--red-bg)"
          iconColor="var(--red-tx)"
        />
        <KPICard
          label="Monthly Avg"
          value={<>92<span className="text-[13px] font-normal text-[var(--tx3)]">%</span></>}
          sub="May 2026"
          icon={<BarChart2 size={15} />}
          iconBg="var(--blue-bg)"
          iconColor="var(--blue-tx)"
        />
        <KPICard
          label="Low Attendance"
          value="8"
          sub="Below 75% this month"
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
                    {filteredBatches.map((batch) => (
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
                            <div className="text-[10px] text-[var(--tx3)] mt-0.5">Teacher: {batch.class_teacher_name || 'Not assigned'}</div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-end text-[10px] text-[var(--blue-tx)] font-semibold gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          View Attendance <ArrowRight size={10} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Monthly Attendance Chart */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader title="Monthly Attendance" />
                <div className="h-[175px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--b)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: 'var(--tx3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
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
          <div className="flex items-center gap-2.5 mb-4 border-b border-[var(--b)] pb-3">
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="text-[10.5px] text-[var(--tx3)]">
              Showing <span className="font-semibold text-[var(--tx)]">{filteredStudents.length}</span> students in this class
            </div>
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--tx3)]" size={12} />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[var(--surf)] border border-[var(--b2)] rounded-lg text-[11px] text-[var(--tx)] focus:outline-none focus:border-[var(--blue)]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11.5px] min-w-[500px]">
              <thead>
                <tr className="border-b border-[var(--b)] bg-[var(--surf2)]">
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-3 py-2 border-b border-[var(--b)]">Student</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-3 py-2 border-b border-[var(--b)]">Enrollment</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-3 py-2 border-b border-[var(--b)] w-24">Total Lectures</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-3 py-2 border-b border-[var(--b)] w-24">Attended</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-3 py-2 border-b border-[var(--b)] w-36">Overall %</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-[var(--tx3)]">
                      {selectedBatch?.isMock 
                        ? 'No registered students yet; assign teacher or add students first in the Classes tab.'
                        : 'No student records found.'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() => handleStudentClick(student)}
                      className="hover:bg-[var(--surf2)] border-b border-[var(--b)] transition-colors cursor-pointer group"
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
                  ))
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

            {studentAttendance.length === 0 ? (
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
                            {record.time_slot ? `${record.time_slot.start_time.substring(0,5)} - ${record.time_slot.end_time.substring(0,5)}` : (record.check_in_time ? record.check_in_time.substring(0,5) : 'Time slots not set')}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <User size={11} /> Faculty: {record.faculty?.name || 'Assigned teacher'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-center">
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
