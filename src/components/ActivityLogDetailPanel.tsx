import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Clock,
  Globe,
  Monitor,
  Smartphone,
  Shield,
  Activity,
  ArrowRight,
  Hash,
  CreditCard,
  Percent,
  CalendarCheck,
  GraduationCap,
  Briefcase,
  FileText,
  BookOpen,
  Trash2,
  PlusCircle,
  Edit3,
  Info,
  UserCheck,
  Users,
  Bus,
  Database,
  DollarSign,
  Layers,
  Settings,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock3,
  History,
  LogIn,
} from 'lucide-react';
import {
  getUserDisplayDetails,
  parseActivityDetails,
  parsePlatformInfo,
  formatExactDateTime,
  formatFieldLabel,
  formatAuditValue,
  formatDateOnly,
  formatExamTimingsWithEnd,
  generateActionSummary,
  extractStudentName,
  extractClassSection,
  extractAdmissionNo,
  extractPenNumber,
  findCachedStudent,
  isSensitiveKey,
  SYSTEM_METADATA_KEYS,
} from '../utils/activityLogFormatter';

interface ActivityLogDetailPanelProps {
  log: any;
}

export const ActivityLogDetailPanel: React.FC<ActivityLogDetailPanelProps> = ({ log }) => {
  const userDisplay = getUserDisplayDetails(log);
  const user = userDisplay;
  const activity = parseActivityDetails(log);
  const platform = parsePlatformInfo(log);
  const actionSummary = generateActionSummary(log);
  const properties = log.properties || {};
  const event = String(log.event || '').toLowerCase();
  const rawDesc = String(log.description || '').toLowerCase();
  const subjectType = String(log.subject_type || '').toLowerCase();
  const attributes = properties.attributes || {};
  const old = properties.old || {};
  const cachedStudent = findCachedStudent(properties, log.description, activity.target);
  const studentName = extractStudentName(properties, log.description, activity.target) || cachedStudent?.name;

  // Extract changed fields for updates (model diffs or top-level diffs)
  const hasModelDiff = event === 'updated' && Object.keys(old).length > 0;
  const changedKeys: string[] = [];

  if (hasModelDiff) {
    const allKeys = Array.from(new Set([...Object.keys(attributes), ...Object.keys(old)]));
    for (const key of allKeys) {
      if (
        !SYSTEM_METADATA_KEYS.has(key) &&
        !isSensitiveKey(key)
      ) {
        const oldVal = old[key];
        const newVal = attributes[key];
        const oldFmt = formatAuditValue(oldVal, key);
        const newFmt = formatAuditValue(newVal, key);

        // Only include if formatted values actually differ and are not both 'Not set' / empty
        if (oldFmt !== newFmt && !(oldFmt === 'Not set' && (newFmt === 'Not set' || newFmt === ''))) {
          changedKeys.push(key);
        }
      }
    }
  }

  // --- DOMAIN DETECTION GUARDS FOR ALL 21 MODULES ---

  // 9. Fee Categories
  const isFeeCategory =
    (rawDesc.includes('fee category') || rawDesc.includes('fee categories') || subjectType.includes('feecategory')) &&
    !rawDesc.includes('payment') &&
    !rawDesc.includes('concession');

  // Concession Detection
  const isConcession =
    (rawDesc.includes('concession') || properties.type === 'concession') &&
    Boolean(properties.concession_amount !== undefined || properties.percentage !== undefined || properties.concession !== undefined || attributes.concession_amount !== undefined);

  // 10. Fee Management / Payments / Bus Fee / Student Fee Records
  const isPayment =
    !isFeeCategory &&
    !isConcession &&
    (
      subjectType.includes('payment') ||
      subjectType.includes('feestructure') ||
      properties.type === 'payment' ||
      properties.type === 'fee' ||
      rawDesc.includes('fee payment') ||
      rawDesc.includes('payment recorded') ||
      rawDesc.includes('payment of') ||
      rawDesc.includes('collected fee') ||
      Boolean(properties.receipt_number || properties.receipt_no || (properties.amount !== undefined && properties.payment_method))
    );

  // 4. Examination, Schedule, Marks & Invigilation Guards
  const isInvigilation =
    rawDesc.includes('invigilat') ||
    Boolean(properties.invigilator_name || properties.hall_no || properties.room_number || attributes.invigilator_name);

  const isExamMarks =
    !isInvigilation &&
    (
      log.log_name === 'marks' ||
      properties.type === 'exam_marks' ||
      rawDesc.includes('evaluation marks') ||
      rawDesc.includes('saved student evaluation marks') ||
      rawDesc.includes('student evaluation marks') ||
      rawDesc.includes('marks entered') ||
      rawDesc.includes('marks recorded') ||
      rawDesc.includes('marks allotted') ||
      (rawDesc.includes('mark') && !rawDesc.includes('attendance') && !rawDesc.includes('remark') && !rawDesc.includes('bookmark') && !rawDesc.includes('marked attendance')) ||
      Boolean(properties.students_marks || properties.marks_list || properties.marks_data || properties.marks !== undefined || properties.obtained_marks !== undefined || properties.new_marks !== undefined || attributes.marks !== undefined)
    );

  const isDeleted =
    event === 'deleted' ||
    properties.status === 'Deleted' ||
    String(log.event || '').toLowerCase() === 'deleted' ||
    rawDesc.includes('deleted');

  const isExamSchedule =
    !isInvigilation &&
    !isExamMarks &&
    (rawDesc.includes('exam') || subjectType.includes('exam') || subjectType.includes('examination') || log.log_name === 'exam' || activity.category === 'EXAMINATION' || activity.category === 'EXAMINATIONS' || properties.type === 'exam_schedule' || Array.isArray(properties.schedule_list)) &&
    Boolean(properties.exam_name || properties.subject_name || properties.max_marks || properties.schedule || properties.schedule_list || attributes.exam_name || attributes.max_marks || properties.type === 'exam_schedule' || isDeleted || rawDesc.includes('deleted exam') || rawDesc.includes('created new exam'));

  // 2. Attendance / Allot Attendance
  const isAttendance =
    (rawDesc.includes('attendance') || subjectType.includes('attendance') || log.log_name === 'attendance' || activity.category === 'ATTENDANCE') &&
    (properties.present_count !== undefined ||
      properties.absent_count !== undefined ||
      properties.count !== undefined ||
      properties.student_name !== undefined ||
      properties.class_name !== undefined ||
      properties.batch_name !== undefined ||
      Array.isArray(properties.present_students) ||
      Array.isArray(properties.absent_students) ||
      Array.isArray(properties.students) ||
      properties.attributes?.key === 'kts_student_attendance_records' ||
      properties.old?.key === 'kts_student_attendance_records');

  // 3. Daily Diary
  const isDailyDiary =
    rawDesc.includes('daily diary') ||
    rawDesc.includes('dailydiary') ||
    rawDesc.includes('diary') ||
    subjectType.includes('dailydiary') ||
    Boolean(properties.topics_taught || properties.homework_given || attributes.topics_taught || attributes.homework_given);

  // 5. Timetable Designing
  const isTimetable =
    !isExamSchedule &&
    !isExamMarks &&
    !rawDesc.includes('exam') &&
    (
      log.log_name === 'timetable' ||
      activity.category === 'TIMETABLE' ||
      properties.type === 'timetable_period' ||
      properties.type === 'timetable_schedule' ||
      properties.type === 'timetable_period_timings' ||
      properties.action_type === 'period_assigned' ||
      properties.action_type === 'period_updated' ||
      properties.action_type === 'period_cleared' ||
      properties.action_type === 'timings_updated' ||
      properties.action_type === 'schedule_saved' ||
      rawDesc.includes('timetable') ||
      subjectType.includes('timetable') ||
      Boolean(properties.period !== undefined || properties.day || properties.substitute_teacher || properties.previous_teacher || properties.new_teacher || attributes.period !== undefined)
    );

  // 0. Authentication / Login Management
  const isAuth =
    log.event === 'login' ||
    log.event === 'logout' ||
    log.log_name === 'login' ||
    activity.category === 'AUTHENTICATION' ||
    properties.type === 'auth' ||
    properties.action_type === 'login' ||
    rawDesc.includes('logged in') ||
    rawDesc.includes('login success') ||
    rawDesc.includes('signed out');

  // 6. Classes & Sections Management
  const isClasses =
    !isAuth &&
    !isTimetable &&
    !isAttendance &&
    !isDailyDiary &&
    !isExamMarks &&
    !isExamSchedule &&
    !isInvigilation &&
    (
      log.log_name === 'classes' ||
      log.log_name === 'course' ||
      log.log_name === 'batch' ||
      properties.type === 'class_section' ||
      properties.type === 'batch' ||
      properties.type === 'course' ||
      subjectType.includes('batch') ||
      subjectType.includes('course') ||
      properties.action_type === 'section_created' ||
      properties.action_type === 'section_updated' ||
      properties.action_type === 'section_deleted' ||
      properties.action_type === 'teacher_assigned' ||
      activity.category === 'CLASSES' ||
      activity.category === 'CLASSES_SECTIONS' ||
      rawDesc.includes('created new section') ||
      rawDesc.includes('updated section') ||
      rawDesc.includes('deleted section') ||
      rawDesc.includes('created batch') ||
      rawDesc.includes('updated batch') ||
      rawDesc.includes('deleted batch') ||
      rawDesc.includes('batch:') ||
      (rawDesc.includes('record for') && (subjectType.includes('batch') || subjectType.includes('course') || /nursery|lkg|ukg|[0-9]+[a-z]/i.test(rawDesc))) ||
      (rawDesc.includes('section') && (rawDesc.includes('created') || rawDesc.includes('updated') || rawDesc.includes('deleted') || rawDesc.includes('assigned'))) ||
      (rawDesc.includes('assigned') && (rawDesc.includes('as class teacher') || rawDesc.includes('to class'))) ||
      ((rawDesc.includes('class') || rawDesc.includes('section') || rawDesc.includes('batch') || subjectType.includes('batch') || subjectType.includes('course')) &&
        Boolean(properties.class_teacher || properties.max_strength || properties.capacity || properties.section || properties.section_name || attributes.class_teacher || attributes.max_strength || attributes.capacity || attributes.course_id || attributes.section_name || attributes.name || properties.name))
    );

  // 1. Student Management (Student Profile & Admission Details)
  const isStudent =
    !isClasses &&
    !isTimetable &&
    !isAttendance &&
    !isDailyDiary &&
    !isFeeCategory &&
    !isConcession &&
    !isExamMarks &&
    !isExamSchedule &&
    !isInvigilation &&
    log.log_name !== 'marks' &&
    log.log_name !== 'classes' &&
    log.log_name !== 'batch' &&
    !subjectType.includes('batch') &&
    !subjectType.includes('course') &&
    activity.category !== 'EXAMINATION' &&
    activity.category !== 'CLASSES' &&
    activity.category !== 'CLASSES_SECTIONS' &&
    !rawDesc.includes('section') &&
    !rawDesc.includes('batch') &&
    !rawDesc.includes('evaluation marks') &&
    !rawDesc.includes('saved student evaluation marks') &&
    !rawDesc.includes('student evaluation marks') &&
    (
      log.log_name === 'student' ||
      subjectType === 'student' ||
      subjectType.includes('student') ||
      rawDesc.includes('student profile') ||
      rawDesc.includes('registered new student') ||
      rawDesc.includes('student record') ||
      rawDesc.includes('added student') ||
      rawDesc.includes('updated student') ||
      rawDesc.includes('deleted student') ||
      rawDesc.includes('student') ||
      properties.type === 'student' ||
      activity.category === 'ADMISSIONS' ||
      activity.category === 'STUDENTS' ||
      Boolean(
        properties.student_name ||
        properties.admission_no ||
        properties.admission_number ||
        properties.enrollment_number ||
        properties.pen ||
        properties.pen_number ||
        properties.student_pen_no ||
        properties.father_name ||
        attributes.student_name ||
        attributes.admission_no ||
        attributes.enrollment_number ||
        attributes.pen ||
        attributes.student_pen_no ||
        attributes.father_name
      )
    ) &&
    !(isPayment && properties.amount !== undefined && !properties.student_name && !attributes.name && !attributes.student_name);

  // Dynamic student marks resolution for Examination & Marks logs
  const [dynamicallyLoadedMarks, setDynamicallyLoadedMarks] = useState<any[] | null>(null);

  useEffect(() => {
    if (isExamMarks && (!properties.students_marks || !Array.isArray(properties.students_marks) || properties.students_marks.length === 0)) {
      const rawClass = properties.class_name || properties.class || properties.batch_name || (() => {
        const m = rawDesc.match(/for Class\s+([A-Za-z0-9-]+(?:\s*[- ]\s*[A-Za-z])?)/i) || rawDesc.match(/in Class\s+([A-Za-z0-9-]+(?:\s*[- ]\s*[A-Za-z])?)/i);
        return m ? m[1] : '';
      })();
      const cleanClass = String(rawClass || '').replace(/^Class\s*/i, '').toLowerCase().replace(/[^a-z0-9]/g, '');

      const examName = properties.exam_name || properties.exam || attributes.exam_name || (() => {
        const m = rawDesc.match(/in\s+([A-Za-z0-9\s-]+?)(?:\.|$)/i);
        return m ? m[1].trim() : '';
      })();

      const examId = properties.exam_id || attributes.exam_id;

      try {
        const rawMarks = localStorage.getItem('kts_student_marks');
        const allMarks = rawMarks ? JSON.parse(rawMarks) : {};
        const rawStudents = localStorage.getItem('kts_students') || localStorage.getItem('students');
        let studentsList: any[] = rawStudents ? JSON.parse(rawStudents) : [];

        let matchedExamId = examId;
        if (!matchedExamId && examName) {
          const rawExams = localStorage.getItem('examinations_exams');
          const examList: any[] = rawExams ? JSON.parse(rawExams) : [];
          const foundEx = examList.find((e: any) => e.name?.toLowerCase().trim() === examName.toLowerCase().trim() || String(e.id) === String(examId));
          if (foundEx) matchedExamId = foundEx.id;
        }

        const targetExamMarks = (matchedExamId && allMarks[matchedExamId]) || (Object.keys(allMarks).length > 0 ? allMarks[Object.keys(allMarks)[0]] : null);

        const buildRows = (stList: any[]) => {
          if (!targetExamMarks || typeof targetExamMarks !== 'object') return;
          const subjects = Object.keys(targetExamMarks);
          const filteredSt = cleanClass
            ? stList.filter((s: any) => {
              const sC = String(s.class || s.class_name || s.batch_name || '').replace(/^Class\s*/i, '').toLowerCase().replace(/[^a-z0-9]/g, '');
              const sS = String(s.section || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              return sC === cleanClass || `${sC}${sS}` === cleanClass || cleanClass.includes(sC);
            })
            : stList;

          const rows: any[] = [];
          filteredSt.forEach((st: any) => {
            const cleanRoll = String(st.roll || '').replace(/^[0-9]+[A-Z]+-?/i, '');
            const stMarks: Record<string, any> = {};
            let totalObt = 0;
            let hasAny = false;

            subjects.forEach((sub: string) => {
              const m = targetExamMarks[sub]?.[st.id] ?? targetExamMarks[sub]?.[st.roll] ?? targetExamMarks[sub]?.[cleanRoll];
              if (m !== undefined && m !== null && m !== '') {
                stMarks[sub] = m;
                const num = Number(m);
                if (!isNaN(num)) totalObt += num;
                hasAny = true;
              }
            });

            if (hasAny) {
              rows.push({
                student_id: st.id,
                name: st.name,
                roll_no: st.roll || '—',
                admission_no: st.admission_no || st.admission_number || '—',
                subjects: stMarks,
                total_obtained: totalObt,
                has_marks: true,
              });
            }
          });

          if (rows.length > 0) {
            setDynamicallyLoadedMarks(rows);
          }
        };

        if (studentsList.length > 0) {
          buildRows(studentsList);
        } else {
          api.getResources('students').then((res) => {
            if (Array.isArray(res)) buildRows(res);
          }).catch(() => { });
        }
      } catch (err) {
        console.warn('Error resolving marks dynamically:', err);
      }
    }
  }, [isExamMarks, properties, rawDesc]);

  // Live Student asynchronous lookup if missing profile details
  const [liveStudent, setLiveStudent] = useState<any>(null);

  useEffect(() => {
    if (isStudent && !isClasses) {
      const subjectId = log.subject_id || properties.student_id || attributes.student_id;
      const targetName = studentName || (activity.target ? activity.target.replace(/^Student:\s*/i, '').trim() : '');
      if (subjectId) {
        api.getResource('students', subjectId).then(res => {
          if (res && res.name) setLiveStudent(res);
        }).catch(() => { });
      } else if (targetName && targetName !== '—' && !['student', 'record', 'student record'].includes(targetName.toLowerCase())) {
        api.getResources('students', { search: targetName }).then(res => {
          if (Array.isArray(res) && res.length > 0) {
            const found = res.find((s: any) => (s.name || '').toLowerCase().trim() === targetName.toLowerCase().trim()) || res[0];
            if (found) setLiveStudent(found);
          }
        }).catch(() => { });
      }
    }
  }, [log.id, log.subject_id, isStudent, isClasses, studentName]);

  const student = !isClasses ? (liveStudent || cachedStudent) : null;

  // 7. Promotion Management
  const isPromotion =
    rawDesc.includes('promot') ||
    rawDesc.includes('retain') ||
    rawDesc.includes('dropout') ||
    properties.type === 'batch_change' ||
    properties.type === 'status_change' ||
    properties.type === 'student_dropout' ||
    properties.type === 'student_reactivation' ||
    (rawDesc.includes('transferred') && Boolean(properties.old_batch_name || properties.new_batch_name || properties.from_class || properties.to_class));

  // 8. Alumni Management
  const isAlumni =
    rawDesc.includes('alumni') ||
    subjectType.includes('alumni') ||
    Boolean(properties.graduation_year || attributes.graduation_year);

  // 11. Salary Categories
  const isSalaryCategory =
    (rawDesc.includes('salary category') ||
      rawDesc.includes('salary categories') ||
      subjectType.includes('salarycategory') ||
      properties.type === 'salary_category') &&
    !rawDesc.includes('payslip');

  // 12. Salary / Payroll Processing
  const isPayroll =
    !isSalaryCategory &&
    (rawDesc.includes('payslip') || rawDesc.includes('salary') || rawDesc.includes('payroll') || subjectType.includes('payslip') || properties.type === 'payroll') &&
    Boolean(properties.basic_salary !== undefined || properties.gross_salary !== undefined || properties.net_salary !== undefined || properties.payroll_month || attributes.basic_salary !== undefined);

  // 13. Expenses Management
  const isExpense =
    rawDesc.includes('expense') ||
    subjectType.includes('expense') ||
    Boolean(properties.vendor || properties.expense_title || properties.category === 'Expense' || attributes.vendor);

  // 14. Staff Access & Permissions
  const isStaffAccess =
    (rawDesc.includes('role') || rawDesc.includes('permission') || rawDesc.includes('staff access') || rawDesc.includes('access status') || rawDesc.includes('deactivate') || rawDesc.includes('activate')) &&
    Boolean(properties.old_status || properties.new_status || properties.from || properties.to || properties.role || attributes.role);

  // 15. Staff Management
  const isStaff =
    (rawDesc.includes('staff') || rawDesc.includes('teacher') || rawDesc.includes('faculty') || subjectType.includes('user')) &&
    !isPayroll &&
    !isStaffAccess &&
    !isAttendance &&
    !isTimetable &&
    Boolean(properties.designation || properties.department || properties.qualification || attributes.designation || attributes.department || attributes.phone);

  // 16. Staff Attendance & Biometric
  const isStaffAttendance =
    rawDesc.includes('staff attendance') ||
    rawDesc.includes('biometric') ||
    subjectType.includes('staffattendance') ||
    subjectType.includes('biometric') ||
    Boolean(properties.punch_time || properties.check_in || properties.biometric_status || attributes.punch_time);

  // 17. Leaves & Holiday Calendar
  const isLeave =
    (rawDesc.includes('leave') || subjectType.includes('leaveapplication') || properties.type === 'leave') &&
    Boolean(properties.leave_type || properties.applicant_name || properties.start_date || attributes.leave_type_id !== undefined || attributes.start_date);

  const isHoliday =
    rawDesc.includes('holiday') ||
    subjectType.includes('holiday') ||
    Boolean(properties.holiday_name || properties.occasion || attributes.holiday_name);

  // 18. Substitute Teacher Allocation
  const isSubstitute =
    rawDesc.includes('substitute') ||
    subjectType.includes('substitute') ||
    Boolean(properties.substitute_teacher || properties.substitute_user_id || properties.original_user_id);

  // 19. Reports & Exports
  const isReport =
    rawDesc.includes('report') ||
    rawDesc.includes('export') ||
    rawDesc.includes('download') ||
    Boolean(properties.report_type || properties.export_format || properties.file_format);

  // 20. Settings, Profile & Webhooks
  const isSettings =
    rawDesc.includes('setting') ||
    rawDesc.includes('school profile') ||
    rawDesc.includes('academic year') ||
    rawDesc.includes('webhook') ||
    subjectType.includes('setting') ||
    subjectType.includes('webhook') ||
    Boolean(properties.school_name || properties.academic_year_name || properties.webhook_url || attributes.school_name);

  // 21. Backups & Database
  const isBackup =
    rawDesc.includes('backup') ||
    subjectType.includes('backup') ||
    Boolean(properties.backup_name || properties.backup_size || properties.backup_type);

  // Helper for Event badge style
  const getEventBadgeClass = (evt: string) => {
    switch (evt) {
      case 'created':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40';
      case 'updated':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/40';
      case 'deleted':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/40';
      case 'login':
        return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/40';
      case 'logout':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/40';
    }
  };

  return (
    <div className="p-4 sm:p-5 my-2 bg-white dark:bg-[var(--surf)] border border-slate-200/80 dark:border-[var(--b)] rounded-2xl shadow-sm text-slate-800 dark:text-slate-200 space-y-5 animate-in fade-in-50 duration-200">

      {/* 1. ACTION SUMMARY HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-2xs mt-0.5 shrink-0">
            <Info size={15} />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
              Audit Action Summary
            </div>
            <p className="text-[13px] font-semibold text-slate-900 dark:text-white mt-0.5 leading-snug">
              {actionSummary}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center shrink-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getEventBadgeClass(event)}`}>
            {event || 'ACTION'}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${activity.categoryBadgeClass}`}>
            {activity.category}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            #{log.id}
          </span>
        </div>
      </div>

      {/* 2. GENERAL AUDIT METADATA GRID */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2 flex items-center gap-1.5">
          <Activity size={13} className="text-blue-500" />
          <span>General Audit Details</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-[var(--surf2)]/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-[var(--b)]/60 text-[11.5px]">
          {/* Action Performed */}
          <div className="space-y-0.5">
            <div className="text-slate-400 dark:text-slate-400 text-[10.5px] font-medium">Action Performed</div>
            <div className="font-semibold text-slate-900 dark:text-white truncate" title={activity.title}>
              {activity.title}
            </div>
          </div>

          {/* User & Role */}
          <div className="space-y-0.5">
            <div className="text-slate-400 dark:text-slate-400 text-[10.5px] font-medium">Performed By</div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 dark:text-white truncate">{user.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                {user.role}
              </span>
            </div>
          </div>

          {/* Date & Exact Time */}
          <div className="space-y-0.5">
            <div className="text-slate-400 dark:text-slate-400 text-[10.5px] font-medium">Date & Exact Time</div>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1 truncate" title={formatExactDateTime(log.created_at)}>
              <Clock size={11} className="text-slate-400 shrink-0" />
              <span>{formatExactDateTime(log.created_at)}</span>
            </div>
          </div>

          {/* Target / Entity */}
          <div className="space-y-0.5">
            <div className="text-slate-400 dark:text-slate-400 text-[10.5px] font-medium">Target / Entity</div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={activity.target || log.subject_type || '—'}>
              {activity.target || (log.subject_type ? `${log.subject_type}${log.subject_id ? ` #${log.subject_id}` : ''}` : '—')}
            </div>
          </div>

          {/* Module / Category */}
          <div className="space-y-0.5">
            <div className="text-slate-400 dark:text-slate-400 text-[10.5px] font-medium">Module / Category</div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {activity.category}
            </div>
          </div>

          {/* Event Type */}
          <div className="space-y-0.5">
            <div className="text-slate-400 dark:text-slate-400 text-[10.5px] font-medium">Event Type</div>
            <div className="font-semibold capitalize text-slate-800 dark:text-slate-200">
              {event || 'Standard Action'}
            </div>
          </div>

          {/* Platform & OS */}
          <div className="space-y-0.5">
            <div className="text-slate-400 dark:text-slate-400 text-[10.5px] font-medium">Platform & Device</div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 truncate" title={platform.osBrowser}>
              {platform.isMobile ? <Smartphone size={11} className="shrink-0 text-slate-500" /> : <Monitor size={11} className="shrink-0 text-slate-500" />}
              <span className="truncate">{platform.platform} • {platform.osBrowser}</span>
            </div>
          </div>

          {/* IP Address */}
          <div className="space-y-0.5">
            <div className="text-slate-400 dark:text-slate-400 text-[10.5px] font-medium">IP Address</div>
            <div className="font-mono font-medium text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
              <Globe size={11} className="text-slate-400 shrink-0" />
              <span>{platform.ipAddress}</span>
            </div>
          </div>

          {/* Activity Log ID */}
          <div className="space-y-0.5">
            <div className="text-slate-400 dark:text-slate-400 text-[10.5px] font-medium">Activity Log ID</div>
            <div className="font-mono font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Hash size={11} className="text-slate-400 shrink-0" />
              <span>#{log.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MODIFIED RECORDS — BEFORE vs AFTER COMPARISON TABLE */}
      {hasModelDiff && changedKeys.length > 0 && !isTimetable && !isExamMarks && !isStudent && !isAttendance && !isClasses && (
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Edit3 size={13} className="text-blue-500" />
            <span>Modified Records — Before vs After Comparison</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-[var(--b)] rounded-xl">
            <table className="w-full text-left text-[12px] border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-[var(--surf2)] text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-[var(--b)]">
                  <th className="py-2.5 px-4 w-1/4">Field</th>
                  <th className="py-2.5 px-4 w-3/8 text-rose-700 dark:text-rose-400">Before (Old Value)</th>
                  <th className="py-2.5 px-4 w-3/8 text-emerald-700 dark:text-emerald-400">After (New Value)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[var(--b)]/60 bg-white dark:bg-[var(--surf)]">
                {changedKeys.map(key => {
                  const oldVal = old[key];
                  const newVal = attributes[key];
                  const formattedOld = formatAuditValue(oldVal, key);
                  const formattedNew = formatAuditValue(newVal, key);

                  return (
                    <tr key={key} className="hover:bg-slate-50/50 dark:hover:bg-[var(--surf2)]/20 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200 align-top">
                        {formatFieldLabel(key)}
                      </td>
                      <td className="py-2.5 px-4 align-top">
                        <span className="inline-block px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/50 font-mono text-[11px] line-through">
                          {formattedOld}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 align-top">
                        <span className="inline-block px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/50 font-mono text-[11px] font-semibold">
                          {formattedNew}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DOMAIN-SPECIFIC SPECIALIZED CARDS */}

      {/* 0. AUTHENTICATION & LOGIN DETAILS CARD */}
      {isAuth && (
        <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-[12.5px] border-b border-emerald-200/50 dark:border-emerald-900/40 pb-2">
            <LogIn size={15} />
            <span>User Authentication & Session Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">User Account</span>
              <span className="font-bold text-slate-900 dark:text-white text-[12.5px]">
                {userDisplay.name}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Role / Designation</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {userDisplay.role}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Session Event</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {event === 'logout' ? 'User Signed Out' : 'Active Login Session'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Portal Interface</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                {properties.portal || (userDisplay.role?.toLowerCase().includes('admin') ? 'Admin Portal' : 'Teacher Portal')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 0. CLASSES & SECTIONS MANAGEMENT CARD */}
      {isClasses && (() => {
        // Dynamic & fallback extraction for class name, section, batch name, teacher, capacity, subjects
        const rawClassName = properties.class_name || properties.class || attributes.class_name || attributes.class || old.class_name || (() => {
          const rawName = properties.name || attributes.name || properties.batch_name || attributes.batch_name || '';
          if (rawName) {
            const splitMatch = rawName.match(/^(.+?)\s*([A-Z])$/i);
            if (splitMatch) return splitMatch[1];
            return rawName;
          }
          const m = rawDesc.match(/Class\s+([A-Za-z0-9-]+?)(?:[A-Z]\b|\s*-\s*[A-Z]|\.|$)/i) || rawDesc.match(/section\s+Class\s+([A-Za-z0-9-]+)/i) || rawDesc.match(/batch:\s*([A-Za-z0-9-]+)/i) || rawDesc.match(/for\s+([A-Za-z0-9-]+)/i);
          if (m) {
            let cl = m[1].trim();
            const splitMatch = cl.match(/^(.+?)\s*([A-Z])$/i);
            if (splitMatch) return splitMatch[1];
            return cl;
          }
          return '—';
        })();

        const rawSectionName = properties.section_name || properties.section || attributes.section_name || attributes.section || old.section_name || (() => {
          const rawName = properties.name || attributes.name || properties.batch_name || attributes.batch_name || '';
          if (rawName) {
            const splitMatch = rawName.match(/^(.+?)\s*([A-Z])$/i);
            if (splitMatch) return `Section ${splitMatch[2].toUpperCase()}`;
          }
          const m = rawDesc.match(/Section\s+([A-Za-z0-9-]+)/i) || rawDesc.match(/Class\s+[A-Za-z0-9-]+?([A-Z])\b/i) || rawDesc.match(/batch:\s*[A-Za-z0-9-]+?([A-Z])\b/i);
          return m ? (m[1].startsWith('Section') ? m[1] : `Section ${m[1]}`) : 'Section A';
        })();

        const cleanSectionLetter = rawSectionName.replace(/^Section\s*/i, '').toUpperCase().trim();
        const displaySection = cleanSectionLetter ? `Section ${cleanSectionLetter}` : rawSectionName;

        const batchIdentifier = properties.batch_name || attributes.batch_name || properties.name || attributes.name || (rawClassName !== '—' ? `${rawClassName}${cleanSectionLetter}` : '—');

        let classTeacher = properties.class_teacher || properties.class_teacher_name || properties.teacher_name || attributes.class_teacher || attributes.class_teacher_name || '';
        if (!classTeacher || classTeacher === '—') {
          classTeacher = user?.name || 'Super Admin';
        }

        const maxCapacity = properties.capacity || properties.max_strength || properties.class_strength || attributes.capacity || attributes.max_strength || (() => {
          if (batchIdentifier && batchIdentifier !== '—') {
            const stored = localStorage.getItem(`batch_capacity_${batchIdentifier}`);
            if (stored) return stored;
          }
          return '40';
        })();

        const academicYear = properties.academic_year || attributes.academic_year || '2026-2027';
        const currentStatus = properties.status || attributes.status || (isDeleted ? 'Deleted' : 'Active');

        // Extract subjects list
        let subjectsList: string[] = [];
        if (Array.isArray(properties.subjects) && properties.subjects.length > 0) {
          subjectsList = properties.subjects;
        } else if (Array.isArray(attributes.subjects) && attributes.subjects.length > 0) {
          subjectsList = attributes.subjects;
        } else if (batchIdentifier && batchIdentifier !== '—') {
          try {
            const saved = localStorage.getItem(`batch_subjects_${batchIdentifier}`);
            if (saved) subjectsList = JSON.parse(saved);
          } catch { /* empty */ }
        }
        if (subjectsList.length === 0) {
          const classIdStr = String(rawClassName || '').trim();
          subjectsList = classIdStr === '8'
            ? ['Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'Telugu', 'Social']
            : ['Maths', 'Science', 'English', 'Telugu', 'Hindi', 'Social', 'EVS'];
        }

        // Before vs After detection for Class & Section updates
        const isClassUpdate = event === 'updated' || properties.action_type === 'section_updated' || rawDesc.includes('updated') || Boolean(old.class_teacher || old.capacity || old.batch_name || properties.previous);
        const oldTeacher = old.class_teacher || old.class_teacher_name || properties.previous?.class_teacher || '—';
        const newTeacher = classTeacher;
        const oldCap = old.capacity || old.max_strength || properties.previous?.capacity || '—';
        const newCap = maxCapacity;
        const oldSec = old.section_name ? `Section ${old.section_name}` : (properties.previous?.section_name ? `Section ${properties.previous.section_name}` : '—');
        const newSec = displaySection;

        const isTeacherChanged = oldTeacher !== '—' && oldTeacher !== newTeacher;
        const isCapChanged = oldCap !== '—' && String(oldCap) !== String(newCap);
        const isSecChanged = oldSec !== '—' && oldSec !== newSec;

        return (
          <div className="space-y-4">
            {/* Primary Configuration Card */}
            <div className="bg-sky-50/40 dark:bg-sky-950/20 border border-sky-200/70 dark:border-sky-900/40 rounded-xl p-4 text-[12px] space-y-3">
              <div className="flex items-center justify-between border-b border-sky-200/50 dark:border-sky-900/40 pb-2">
                <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold text-[12.5px]">
                  <Layers size={15} />
                  <span>Class & Section Configuration Details</span>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${currentStatus === 'Active'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40'
                  }`}>
                  {currentStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Class Name</span>
                  <span className="font-bold text-slate-900 dark:text-white text-[12.5px]">
                    {rawClassName.startsWith('Class ') ? rawClassName : `Class ${rawClassName}`}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Section</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {displaySection}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Batch Identifier</span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {batchIdentifier}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Allotted Class Teacher</span>
                  <span className="font-semibold text-sky-700 dark:text-sky-300">
                    {classTeacher}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Maximum Class Strength</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {maxCapacity} Students
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Academic Year</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {academicYear}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Configured Curriculum</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {subjectsList.length} Subjects Active
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Current Status</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {currentStatus}
                  </span>
                </div>
              </div>

              {/* Configured Subjects List */}
              {subjectsList.length > 0 && (
                <div className="pt-2 border-t border-sky-200/40 dark:border-sky-900/30">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block font-medium mb-1.5">
                    Configured Subjects / Curriculum:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {subjectsList.map((sub, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white dark:bg-slate-900 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 shadow-xs"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Before vs After Comparison Table for Class & Section Updates */}
            {isClassUpdate && (isTeacherChanged || isCapChanged || isSecChanged || oldTeacher !== '—') && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Edit3 size={13} className="text-blue-500" />
                  <span>Modified Records — Before vs After Comparison</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                  <table className="w-full text-left text-[12px] border-collapse bg-white dark:bg-slate-950">
                    <thead>
                      <tr className="bg-slate-100/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2 px-3.5 w-24 text-center">State</th>
                        <th className="py-2 px-3.5">Class & Section</th>
                        <th className="py-2 px-3.5">Allotted Class Teacher</th>
                        <th className="py-2 px-3.5">Capacity</th>
                        <th className="py-2 px-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                      {/* Row 1: BEFORE */}
                      <tr className="bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/30 transition-colors">
                        <td className="py-2.5 px-3.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                            BEFORE
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className={isSecChanged ? 'line-through text-rose-700 dark:text-rose-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}>
                            {rawClassName.startsWith('Class ') ? rawClassName : `Class ${rawClassName}`} {oldSec !== '—' ? `(${oldSec})` : ''}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className={isTeacherChanged ? 'line-through text-rose-700 dark:text-rose-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}>
                            {oldTeacher}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 font-mono">
                          <span className={isCapChanged ? 'line-through text-rose-700 dark:text-rose-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}>
                            {oldCap !== '—' ? `${oldCap} Students` : '—'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            Previous
                          </span>
                        </td>
                      </tr>

                      {/* Row 2: AFTER */}
                      <tr className="bg-emerald-50/25 dark:bg-emerald-950/15 hover:bg-emerald-50/35 transition-colors">
                        <td className="py-2.5 px-3.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                            AFTER
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5">
                          {isSecChanged ? (
                            <span className="inline-block px-2 py-0.5 rounded font-bold text-[11.5px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                              {rawClassName.startsWith('Class ') ? rawClassName : `Class ${rawClassName}`} ({displaySection})
                            </span>
                          ) : (
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {rawClassName.startsWith('Class ') ? rawClassName : `Class ${rawClassName}`} ({displaySection})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5">
                          {isTeacherChanged ? (
                            <span className="inline-block px-2 py-0.5 rounded font-bold text-[11.5px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                              {newTeacher}
                            </span>
                          ) : (
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {newTeacher}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono">
                          {isCapChanged ? (
                            <span className="inline-block px-2 py-0.5 rounded font-bold text-[11.5px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                              {newCap} Students
                            </span>
                          ) : (
                            <span className="font-medium text-slate-900 dark:text-white">
                              {newCap} Students
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                            Active
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* 1. STUDENT MANAGEMENT CARD */}
      {!isClasses && isStudent && (
        <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-[12.5px] border-b border-indigo-200/50 dark:border-indigo-900/40 pb-2">
            <UserCheck size={15} />
            <span>Student Profile & Admission Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Student Name</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.student_name || properties.name || attributes.student_name || attributes.name || studentName || student?.name || (activity.target ? activity.target.replace(/^Student:\s*/i, '') : '—')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Admission Number</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {extractAdmissionNo(log, student)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">PEN Number</span>
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                {extractPenNumber(log, student)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Class & Section</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {extractClassSection(log, student)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Father's Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.father_name || properties.parent || attributes.father_name || attributes.parent || old.father_name || student?.parent || student?.father_name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Primary Mobile</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {properties.mobile || properties.student_mobile || properties.phone || properties.father_mobile || attributes.student_mobile || attributes.mobile || attributes.phone || attributes.father_mobile || old.mobile || old.phone || old.student_mobile || old.father_mobile || student?.phone || student?.student_mobile || student?.father_mobile || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Gender & DOB</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {properties.gender || attributes.gender || old.gender || student?.gender || '—'} {(() => {
                  const rawDob = properties.dob || properties.date_of_birth || attributes.dob || attributes.date_of_birth || old.dob || old.date_of_birth || student?.dob;
                  const formatted = formatDateOnly(rawDob);
                  return formatted ? `(${formatted})` : '';
                })()}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Current Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {properties.status || attributes.status || old.status || student?.status || 'Active'}
              </span>
            </div>

            {(properties.mother_name || attributes.mother_name || properties.village || attributes.village || properties.address || attributes.address || student?.mother_name || student?.address || student?.village) && (
              <>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Mother's Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {properties.mother_name || attributes.mother_name || old.mother_name || student?.mother_name || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Address / Village</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {properties.village || properties.address || attributes.village || attributes.address || old.village || student?.address || student?.village || '—'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. STUDENT ATTENDANCE & ALLOT ATTENDANCE CARD */}
      {isAttendance && (
        <div className="bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-[12.5px] border-b border-teal-200/50 dark:border-teal-900/40 pb-2">
            <CalendarCheck size={15} />
            <span>Student Attendance Record & Class Breakdown</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Class & Section</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.class_name || properties.batch_name || attributes.className || activity.target || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Attendance Date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatDateOnly(properties.date || properties.attendance_date) || formatExactDateTime(log.created_at)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Session</span>
              <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                {properties.session === 'first_period' ? 'Morning Session' : (properties.session ? `${properties.session} Session` : 'Full Day')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Marked / Verified By</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {user.name} {user.role ? `(${user.role})` : ''}
              </span>
            </div>
          </div>

          {/* Attendance KPI Cards */}
          {(properties.present_count !== undefined || properties.absent_count !== undefined) && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {properties.present_count !== undefined && (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">Present:</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-200 text-[13px]">
                    {properties.present_count}
                  </span>
                </div>
              )}

              {properties.absent_count !== undefined && (
                <div className="px-3 py-1.5 rounded-lg bg-rose-100/70 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/40 flex items-center gap-2">
                  <XCircle size={13} className="text-rose-600" />
                  <span className="text-rose-700 dark:text-rose-300 font-semibold text-[11px]">Absent:</span>
                  <span className="font-bold text-rose-800 dark:text-rose-200 text-[13px]">
                    {properties.absent_count}
                  </span>
                </div>
              )}

              {properties.late_count !== undefined && (
                <div className="px-3 py-1.5 rounded-lg bg-amber-100/70 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40 flex items-center gap-2">
                  <Clock3 size={13} className="text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-300 font-semibold text-[11px]">Late:</span>
                  <span className="font-bold text-amber-800 dark:text-amber-200 text-[13px]">
                    {properties.late_count}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Student-wise present / absent breakdown lists if present */}
          {Array.isArray(properties.absent_students) && properties.absent_students.length > 0 && (
            <div className="mt-2 pt-2 border-t border-teal-200/50 dark:border-teal-900/40">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block mb-1.5">
                Absent Students List ({properties.absent_students.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {properties.absent_students.map((st: any, i: number) => (
                  <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                    {typeof st === 'string' ? st : (st.name || st.student_name || `Roll ${st.roll_no}`)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(properties.present_students) && properties.present_students.length > 0 && (
            <div className="mt-2 pt-2 border-t border-teal-200/50 dark:border-teal-900/40">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block mb-1.5">
                Present Students List ({properties.present_students.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {properties.present_students.map((st: any, i: number) => (
                  <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                    {typeof st === 'string' ? st : (st.name || st.student_name || `Roll ${st.roll_no}`)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(properties.students) && properties.students.length > 0 && (
            <div className="mt-2 pt-2 border-t border-teal-200/50 dark:border-teal-900/40">
              <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 block mb-1.5">
                Affected Students List ({properties.students.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {properties.students.map((st: any, i: number) => (
                  <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50">
                    {typeof st === 'string' ? st : (st.name || st.student_name || `Roll ${st.roll_no}`)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. DAILY DIARY CARD */}
      {isDailyDiary && (
        <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-[12.5px] border-b border-amber-200/50 dark:border-amber-900/40 pb-2">
            <BookOpen size={15} />
            <span>Daily Diary Submission & Teaching Progress</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Class & Section</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.class_name || properties.batch_name || attributes.batch_name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Subject</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.subject_name || properties.subject || attributes.subject_name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Teacher Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.teacher_name || user.name}
              </span>
            </div>

            <div className="sm:col-span-3">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Lesson / Topics Taught</span>
              <div className="mt-0.5 p-2.5 bg-white dark:bg-[var(--surf)] rounded-lg border border-amber-200/60 dark:border-amber-900/40 font-medium text-slate-900 dark:text-white">
                {properties.topics_taught || properties.lesson_taught || attributes.topics_taught || properties.title || '—'}
              </div>
            </div>

            <div className="sm:col-span-3">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Homework Assigned</span>
              <div className="mt-0.5 p-2.5 bg-white dark:bg-[var(--surf)] rounded-lg border border-amber-200/60 dark:border-amber-900/40 font-medium text-slate-900 dark:text-white">
                {properties.homework_given || properties.homework || attributes.homework_given || 'No homework assigned'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. EXAMINATION, SCHEDULE & MARKS CARD */}
      {(isExamSchedule || isExamMarks || isInvigilation) && (() => {
        const examName =
          properties.exam_name ||
          properties.exam ||
          attributes.exam_name ||
          (activity.target?.startsWith('Exam:') ? activity.target.replace(/^Exam:\s*/i, '') : '') ||
          (activity.target?.includes('•') ? activity.target.split('•')[1]?.trim() : '') ||
          (() => {
            const m = rawDesc.match(/deleted exam\s+["']([^"']+)["']/i) || rawDesc.match(/exam\s+["']([^"']+)["']/i);
            return m ? m[1] : '';
          })() ||
          '';

        const rawClass =
          properties.class_name ||
          properties.class ||
          properties.batch_name ||
          attributes.class_name ||
          (activity.target?.includes('•') ? activity.target.split('•')[0]?.trim() : '') ||
          '';
        const targetClassName = rawClass ? (rawClass.toLowerCase().startsWith('class') ? rawClass : `Class ${rawClass}`) : '';

        const finalStudentMarks: any[] = (Array.isArray(properties.students_marks) && properties.students_marks.length > 0)
          ? properties.students_marks
          : (Array.isArray(properties.marks_list) && properties.marks_list.length > 0)
            ? properties.marks_list
            : (Array.isArray(dynamicallyLoadedMarks) && dynamicallyLoadedMarks.length > 0)
              ? dynamicallyLoadedMarks
              : [];

        const allSubjects: string[] = Array.from(
          new Set(
            finalStudentMarks.flatMap((st: any) =>
              st.subjects ? Object.keys(st.subjects) : (st.marks && typeof st.marks === 'object' ? Object.keys(st.marks) : [])
            )
          )
        );

        const examScheduleList: Array<{ class_name?: string; subject?: string; timings?: string; time?: string; duration?: string; max_marks?: any; date?: string; status?: string }> = (() => {
          if (Array.isArray(properties.schedule_list) && properties.schedule_list.length > 0) {
            return properties.schedule_list.map((item: any) => ({
              ...item,
              timings: item.timings || (item.time ? `${item.time}${item.duration ? ` (${item.duration})` : ''}` : item.duration) || properties.timings || properties.time_slot || '—',
              status: isDeleted ? 'Deleted' : (item.status || properties.status || 'Upcoming'),
            }));
          }
          if (Array.isArray(properties.schedules) && properties.schedules.length > 0) {
            return properties.schedules.map((item: any) => ({
              ...item,
              timings: item.timings || (item.time ? `${item.time}${item.duration ? ` (${item.duration})` : ''}` : item.duration) || properties.timings || properties.time_slot || '—',
              status: isDeleted ? 'Deleted' : (item.status || properties.status || 'Upcoming'),
            }));
          }
          if (properties.schedule && typeof properties.schedule === 'object') {
            const list: any[] = [];
            Object.entries(properties.schedule).forEach(([cls, dates]: [string, any]) => {
              if (dates && typeof dates === 'object') {
                Object.entries(dates).forEach(([dateStr, entries]: [string, any]) => {
                  if (Array.isArray(entries)) {
                    entries.forEach((e: any) => {
                      list.push({
                        class_name: cls,
                        subject: e.subject || e.subject_name,
                        date: dateStr,
                        timings: e.timings || (e.time ? `${e.time}${e.duration ? ` (${e.duration})` : ''}` : (e.duration || '—')),
                        max_marks: e.maxMarks || e.max_marks || 100,
                        status: isDeleted ? 'Deleted' : (e.status || properties.status || 'Upcoming'),
                      });
                    });
                  }
                });
              }
            });
            if (list.length > 0) return list;
          }
          if (
            !isInvigilation &&
            !isExamMarks &&
            (properties.exam_name ||
              properties.exam ||
              properties.subject_name ||
              properties.subject ||
              properties.class_name ||
              properties.class ||
              attributes.exam_name ||
              isDeleted ||
              rawDesc.includes('exam'))
          ) {
            return [
              {
                class_name: properties.class_name || properties.class || attributes.class_name || 'All Classes',
                subject: properties.subject_name || properties.subject || attributes.subject_name || 'All Subjects',
                timings: properties.timings || properties.time_slot || properties.time || (properties.duration ? `${properties.duration}` : '—'),
                max_marks: properties.max_marks || properties.maximum_marks || attributes.max_marks || 100,
                date: properties.exam_date || properties.date || attributes.exam_date || attributes.date,
                status: isDeleted ? 'Deleted' : (properties.status || attributes.status || 'Upcoming'),
              },
            ];
          }
          return [];
        })();

        return (
          <div className="bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40 rounded-xl p-4 text-[12px] space-y-3">
            <div className="flex items-center justify-between text-purple-800 dark:text-purple-300 font-bold text-[12.5px] border-b border-purple-200/50 dark:border-purple-900/40 pb-2">
              <div className="flex items-center gap-2">
                <GraduationCap size={15} />
                <span>
                  {isInvigilation
                    ? (isDeleted ? 'Exam Invigilation Removed' : 'Exam Invigilation Assignment')
                    : isExamMarks
                      ? 'Exam Evaluation & Marks Allotment'
                      : isDeleted
                        ? 'Examination Deleted & Schedule'
                        : 'Examination Creation & Schedule'}
                </span>
              </div>
              {isDeleted && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                  Deleted
                </span>
              )}
            </div>

            {/* Centered Examination Title Banner in the middle of the card */}
            {examName && (
              <div className="text-center py-2.5 px-4 rounded-xl bg-purple-100/70 dark:bg-purple-900/40 border border-purple-200/80 dark:border-purple-800/40 shadow-xs">
                <span className="text-[10.5px] uppercase tracking-wider font-semibold text-purple-600 dark:text-purple-300 block">
                  Examination Name
                </span>
                <span className="text-[15.5px] sm:text-[17px] font-extrabold text-purple-950 dark:text-purple-100 tracking-tight">
                  {examName}
                </span>
              </div>
            )}

            {/* Invigilation details */}
            {isInvigilation && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Invigilator Staff</span>
                  <span className="font-semibold text-purple-700 dark:text-purple-300">
                    {properties.invigilator_name || properties.staff_name || attributes.invigilator_name || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Room / Hall No</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {properties.hall_no || properties.room_number || attributes.hall_no || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Date & Time</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDateOnly(properties.exam_date || properties.date) || '—'} {properties.time_slot ? `(${properties.time_slot})` : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Marks Allotment Header Summary */}
            {isExamMarks && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white/70 dark:bg-[var(--surf)] p-3 rounded-xl border border-purple-200/60 dark:border-purple-900/40 text-[11.5px]">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10.5px] block font-medium">Class & Section</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {targetClassName || 'All Classes'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10.5px] block font-medium">Allotted / Evaluated By</span>
                  <span className="font-semibold text-purple-700 dark:text-purple-300">
                    {properties.marked_by || properties.actor_name || user.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10.5px] block font-medium">Evaluation Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDateOnly(log.created_at)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10.5px] block font-medium">Students Evaluated</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded font-bold text-[11px] bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
                    {finalStudentMarks.length > 0 ? `${finalStudentMarks.length} Students` : (properties.total_students_evaluated ? `${properties.total_students_evaluated} Students` : 'Recorded')}
                  </span>
                </div>
              </div>
            )}

            {/* 4.A — Student Marks Breakdown Table */}
            {isExamMarks && finalStudentMarks.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-purple-600 dark:text-purple-400" />
                    Student-wise Marks Allotted ({finalStudentMarks.length} {finalStudentMarks.length === 1 ? 'Student' : 'Students'})
                  </span>
                  {targetClassName && (
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Class: <strong className="text-slate-800 dark:text-slate-200">{targetClassName}</strong>
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-purple-200/80 dark:border-purple-800/40 bg-white dark:bg-[var(--surf)] shadow-xs">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead className="bg-purple-100/70 dark:bg-purple-900/50 text-purple-950 dark:text-purple-200 font-bold border-b border-purple-200 dark:border-purple-800/40">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3.5 min-w-[140px]">Student Name</th>
                        <th className="py-2.5 px-3 font-mono text-[11px]">Roll / Adm</th>
                        {allSubjects.map((sub: string) => (
                          <th key={sub} className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">
                            {sub}
                          </th>
                        ))}
                        <th className="py-2.5 px-3 text-center font-bold">Total</th>
                        <th className="py-2.5 px-3 text-center font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100 dark:divide-purple-900/30 text-slate-800 dark:text-slate-200">
                      {finalStudentMarks.map((st: any, idx: number) => {
                        const marksMap = st.subjects || st.marks || {};
                        let rowTotal = 0;
                        return (
                          <tr key={idx} className="hover:bg-purple-50/40 dark:hover:bg-purple-900/20 transition-colors">
                            <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white">
                              {st.name || `Student #${st.student_id || idx + 1}`}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                              {st.roll_no || st.roll || st.admission_no || '—'}
                            </td>
                            {allSubjects.map((sub: string) => {
                              const val = marksMap[sub];
                              const markVal = typeof val === 'object' && val !== null ? val.obtained : val;
                              const maxVal = typeof val === 'object' && val !== null ? val.max : null;
                              const numVal = Number(markVal);
                              if (!isNaN(numVal) && markVal !== null && markVal !== undefined && markVal !== '') {
                                rowTotal += numVal;
                              }
                              return (
                                <td key={sub} className="py-2.5 px-3 text-center">
                                  {markVal !== undefined && markVal !== null && markVal !== '' ? (
                                    <span className="inline-block px-2 py-0.5 rounded-md font-mono font-bold text-[11.5px] bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/40">
                                      {markVal} {maxVal ? <span className="text-[10px] font-normal text-slate-400">/{maxVal}</span> : ''}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-mono text-[11px]">--</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="py-2.5 px-3 text-center font-mono font-extrabold text-purple-900 dark:text-purple-200 text-[12.5px]">
                              {rowTotal || st.total_obtained || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                Evaluated
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Schedule Table containing class, subject, starting date, timings, max marks, and status */}
            {examScheduleList.length > 0 && !isExamMarks && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Calendar size={13} className="text-purple-600 dark:text-purple-400" />
                    Examination Timetable & Subject Breakdown ({examScheduleList.length} {examScheduleList.length === 1 ? 'entry' : 'entries'})
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-purple-200/80 dark:border-purple-800/40 bg-white dark:bg-[var(--surf)] shadow-xs">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead className="bg-purple-100/70 dark:bg-purple-900/50 text-purple-950 dark:text-purple-200 font-bold border-b border-purple-200 dark:border-purple-800/40">
                      <tr>
                        <th className="py-2.5 px-3.5">Class</th>
                        <th className="py-2.5 px-3.5">Subject</th>
                        <th className="py-2.5 px-3.5">Starting Date</th>
                        <th className="py-2.5 px-3.5">Timings</th>
                        <th className="py-2.5 px-3.5">Max Marks</th>
                        <th className="py-2.5 px-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100 dark:divide-purple-900/30 text-slate-800 dark:text-slate-200">
                      {examScheduleList.map((item, idx) => {
                        const rawItemDate = item.date || properties.exam_date || properties.date || attributes.exam_date;
                        const formattedDate = formatDateOnly(rawItemDate);
                        const timingStr = formatExamTimingsWithEnd(item.time, item.duration, item.timings || properties.timings || properties.time_slot);
                        const itemStatus = isDeleted ? 'Deleted' : (item.status || properties.status || attributes.status || 'Upcoming');
                        const isRowDeleted = itemStatus.toLowerCase() === 'deleted' || isDeleted;

                        return (
                          <tr key={idx} className="hover:bg-purple-50/40 dark:hover:bg-purple-900/20 transition-colors">
                            <td className="py-2.5 px-3.5 font-semibold text-purple-900 dark:text-purple-300">
                              {item.class_name || '—'}
                            </td>
                            <td className="py-2.5 px-3.5 font-medium text-slate-900 dark:text-white">
                              {item.subject || '—'}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono text-slate-700 dark:text-slate-300">
                              {formattedDate || '—'}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono text-slate-700 dark:text-slate-300">
                              {timingStr !== '—' ? (
                                <span className="inline-block px-2 py-0.5 rounded font-mono text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/40">
                                  {timingStr}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-[11px]">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono font-bold text-purple-700 dark:text-purple-300">
                              {item.max_marks ?? '100'}
                            </td>
                            <td className="py-2.5 px-3.5 text-center">
                              {isRowDeleted ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                                  Deleted
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  {itemStatus}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Fallback info when not invigilation, no schedule table, and no marks table */}
            {examScheduleList.length === 0 && finalStudentMarks.length === 0 && !isInvigilation && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Class / Batch</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {targetClassName || properties.class_name || properties.batch_name || attributes.class_name || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Subject</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {properties.subject_name || properties.subject || attributes.subject_name || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Maximum Marks</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {properties.max_marks || properties.maximum_marks || attributes.max_marks || '—'}
                  </span>
                </div>
                {properties.pass_marks && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Passing Marks</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {properties.pass_marks || attributes.pass_marks}
                    </span>
                  </div>
                )}
                {isExamMarks && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Grade / Evaluation</span>
                    <span className="font-bold text-purple-700 dark:text-purple-300">
                      {properties.grade || attributes.grade || '—'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Exam Marks Comparison for single-mark updates */}
            {(properties.marks !== undefined || properties.obtained_marks !== undefined || properties.new_marks !== undefined || properties.old?.marks !== undefined || attributes.marks !== undefined) && (
              <div className="pt-2 border-t border-purple-200/50 dark:border-purple-900/40">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block mb-1">Marks Comparison</span>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 font-mono line-through font-semibold">
                    Before: {properties.old?.marks ?? properties.previous_marks ?? '—'}
                  </span>
                  <ArrowRight size={13} className="text-slate-400" />
                  <span className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 font-mono font-bold">
                    After: {properties.attributes?.marks ?? properties.marks ?? properties.obtained_marks ?? properties.new_marks ?? '—'}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* 5. TIMETABLE DESIGNING CARD */}
      {isTimetable && (() => {
        const actionType = properties.action_type;

        // Extract slots list for published schedule
        let slotsList: any[] = [];
        try {
          if (Array.isArray(properties.slots) && properties.slots.length > 0) {
            slotsList = properties.slots;
          } else if (Array.isArray(attributes.slots) && attributes.slots.length > 0) {
            slotsList = attributes.slots;
          } else if (typeof properties.slots === 'string' && properties.slots.startsWith('[')) {
            slotsList = JSON.parse(properties.slots);
          } else if (typeof attributes.slots === 'string' && attributes.slots.startsWith('[')) {
            slotsList = JSON.parse(attributes.slots);
          }
        } catch { /* empty */ }

        // Extract class and section
        const rawClass =
          properties.class ||
          properties.class_name ||
          properties.batch_name ||
          attributes.batch_name ||
          attributes.class_name ||
          (rawDesc.match(/for Class\s+([A-Za-z0-9-]+(?:\s*[- ]\s*[A-Za-z])?)/i)?.[1]) ||
          (rawDesc.match(/in Class\s+([A-Za-z0-9-]+(?:\s*[- ]\s*[A-Za-z])?)/i)?.[1]) ||
          '';
        const formattedClass = rawClass ? (rawClass.toLowerCase().startsWith('class') ? rawClass : `Class ${rawClass}`) : 'Class Schedule';

        const isSinglePeriodAction =
          actionType === 'period_assigned' ||
          actionType === 'period_updated' ||
          actionType === 'period_cleared' ||
          properties.type === 'timetable_period' ||
          properties.period !== undefined ||
          attributes.period !== undefined ||
          Boolean(properties.cleared_subject) ||
          Boolean(properties.subject) ||
          Boolean(attributes.subject);

        const isScheduleSaved =
          !isSinglePeriodAction &&
          (
            actionType === 'schedule_saved' ||
            properties.type === 'timetable_schedule' ||
            (Array.isArray(properties.slots) && properties.slots.length > 0) ||
            (Array.isArray(attributes.slots) && attributes.slots.length > 0) ||
            rawDesc.toLowerCase().includes('saved and published weekly timetable') ||
            rawDesc.toLowerCase().includes('published weekly timetable schedule')
          );

        // Fallback reconstruction of slots from local storage if schedule saved but slots not in payload
        if (isScheduleSaved && slotsList.length === 0) {
          try {
            const rawTt = localStorage.getItem('kts_school_timetable');
            if (rawTt) {
              const fullTt = JSON.parse(rawTt);
              const cleanC = formattedClass.replace(/^Class\s*/i, '').trim();
              const classTt = fullTt[cleanC] || fullTt[rawClass] || {};
              const timings = JSON.parse(localStorage.getItem('timetable_period_timings') || '[]');
              const reconstructed: any[] = [];
              Object.keys(classTt).forEach((d) => {
                Object.keys(classTt[d] || {}).forEach((pIdxStr) => {
                  const pIdx = Number(pIdxStr);
                  const cell = classTt[d][pIdx];
                  if (cell) {
                    const t = timings[pIdx];
                    reconstructed.push({
                      day: d,
                      period: pIdx,
                      subject: cell.subject,
                      teacher: cell.teacher,
                      room: cell.room,
                      start_time: t?.start,
                      end_time: t?.end,
                      timings: t ? formatExamTimingsWithEnd(t.start, t.end, `${t.start} - ${t.end}`) : undefined,
                    });
                  }
                });
              });
              if (reconstructed.length > 0) {
                slotsList = reconstructed;
              }
            }
          } catch { /* empty */ }
        }

        const isTimingsUpdate =
          !isScheduleSaved &&
          (
            actionType === 'timings_updated' ||
            properties.type === 'timetable_period_timings' ||
            (Array.isArray(properties.timings) && properties.timings.length > 0) ||
            rawDesc.includes('period timings')
          );

        const isClearing =
          !isScheduleSaved &&
          !isTimingsUpdate &&
          (
            actionType === 'period_cleared' ||
            (event === 'deleted' && (properties.period || properties.cleared_subject)) ||
            rawDesc.includes('cleared period') ||
            rawDesc.includes('timetable slot')
          );

        // Extract day
        let rawDay =
          properties.day ||
          attributes.day ||
          properties.day_name ||
          attributes.day_name ||
          properties.weekday ||
          attributes.weekday ||
          old.day ||
          (rawDesc.match(/\((Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\)/i)?.[1]) ||
          (rawDesc.match(/on\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i)?.[1]) ||
          properties.schedule_date ||
          attributes.schedule_date ||
          '';

        let day = '—';
        if (rawDay) {
          const dayStr = String(rawDay).trim();
          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const matchedName = dayNames.find(d => d.toLowerCase() === dayStr.toLowerCase());
          if (matchedName) {
            day = matchedName;
          } else {
            const parsedDate = new Date(dayStr);
            if (!isNaN(parsedDate.getTime())) {
              day = parsedDate.toLocaleDateString('en-US', { weekday: 'long' });
            } else {
              day = dayStr;
            }
          }
        }
        if (day === '—' && log.created_at) {
          const parsedDate = new Date(log.created_at);
          if (!isNaN(parsedDate.getTime())) {
            day = parsedDate.toLocaleDateString('en-US', { weekday: 'long' });
          }
        }

        // Extract period
        let periodNum: number | string | undefined =
          properties.period ??
          attributes.period ??
          properties.period_number ??
          attributes.period_number ??
          properties.period_no ??
          attributes.period_no ??
          properties.slot ??
          attributes.slot ??
          old.period ??
          (rawDesc.match(/Period\s+(\d+)/i)?.[1]);

        if (periodNum === undefined || periodNum === null || periodNum === '') {
          if (properties.period_index !== undefined && properties.period_index !== null) {
            periodNum = Number(properties.period_index) + 1;
          } else if (attributes.period_index !== undefined && attributes.period_index !== null) {
            periodNum = Number(attributes.period_index) + 1;
          }
        }

        // Extract timing
        let rawTiming =
          properties.period_time ||
          properties.time ||
          properties.time_range ||
          attributes.time_range ||
          properties.time_slot ||
          attributes.time_slot ||
          properties.timings ||
          attributes.timings ||
          properties.timing_str ||
          attributes.timing_str ||
          attributes.period_time ||
          '';

        if (!rawTiming && properties.start_time && properties.end_time) {
          rawTiming = `${properties.start_time} - ${properties.end_time}`;
        }
        if (!rawTiming && attributes.start_time && attributes.end_time) {
          rawTiming = `${attributes.start_time} - ${attributes.end_time}`;
        }

        let timingStr = rawTiming ? formatExamTimingsWithEnd(undefined, undefined, rawTiming) : '—';

        if ((timingStr === '—' || !timingStr) && periodNum !== undefined && Number(periodNum) > 0) {
          try {
            const rawTimings = localStorage.getItem('timetable_period_timings');
            if (rawTimings) {
              const parsedTimings = JSON.parse(rawTimings);
              const pTiming = parsedTimings[Number(periodNum) - 1];
              if (pTiming && pTiming.start && pTiming.end) {
                timingStr = formatExamTimingsWithEnd(pTiming.start, pTiming.end, `${pTiming.start} - ${pTiming.end}`);
              }
            }
          } catch { /* empty */ }
        }

        const normalizeTimeForMatch = (str: string) =>
          String(str || '')
            .replace(/:00\b/g, '')
            .replace(/\s*(AM|PM)\b/gi, '')
            .trim();

        if (periodNum === undefined && timingStr !== '—') {
          try {
            const rawTimings = localStorage.getItem('timetable_period_timings');
            if (rawTimings) {
              const parsedTimings = JSON.parse(rawTimings);
              const normTiming = normalizeTimeForMatch(timingStr);
              const idx = parsedTimings.findIndex((pt: any) => {
                const normStart = normalizeTimeForMatch(pt.start);
                const normEnd = normalizeTimeForMatch(pt.end);
                return (
                  timingStr.includes(pt.start) ||
                  timingStr.includes(pt.end) ||
                  (normStart && normTiming.includes(normStart)) ||
                  (normEnd && normTiming.includes(normEnd))
                );
              });
              if (idx >= 0) {
                periodNum = idx + 1;
              }
            }
          } catch { /* empty */ }
        }

        const periodLabel = periodNum !== undefined ? `Period ${periodNum}` : (timingStr !== '—' ? 'Class Period' : '—');

        // Extract subject & faculty & room
        const subject =
          properties.subject ||
          properties.subject_name ||
          properties.cleared_subject ||
          attributes.subject ||
          attributes.subject_name ||
          (rawDesc.match(/to\s+([A-Za-z\s]+?)\s+\(Faculty:/i)?.[1]) ||
          (rawDesc.match(/assigned\s+([A-Za-z\s]+?)\s+to/i)?.[1]) ||
          (rawDesc.match(/was\s+([A-Za-z\s]+?)(?:\s+with|\))/i)?.[1]) ||
          '—';

        let teacher =
          properties.teacher_name ||
          properties.teacher ||
          properties.faculty_name ||
          properties.cleared_teacher ||
          properties.new_teacher ||
          properties.user_name ||
          attributes.teacher_name ||
          attributes.teacher ||
          attributes.faculty_name ||
          attributes.user_name ||
          (rawDesc.match(/Faculty:\s*([^,\)]+)/i)?.[1]) ||
          (rawDesc.match(/with\s+([A-Za-z\s]+?)\)/i)?.[1]) ||
          '—';

        const teacherId = properties.teacher_id || attributes.teacher_id || properties.user_id || attributes.user_id;
        if ((!teacher || teacher === '—' || /^\d+$/.test(teacher.trim())) && teacherId) {
          try {
            const rawStaff = localStorage.getItem('kts_staff_members');
            if (rawStaff) {
              const staffList = JSON.parse(rawStaff);
              const found = staffList.find((s: any) => String(s.id) === String(teacherId) || String(s.user_id) === String(teacherId));
              if (found && found.name) {
                teacher = found.name;
              }
            }
          } catch { /* empty */ }
        }
        if ((!teacher || teacher === '—') && subject !== '—') {
          teacher = 'Unassigned';
        }

        let room =
          properties.room ||
          properties.classroom_name ||
          properties.cleared_room ||
          attributes.room ||
          attributes.classroom_name ||
          properties.room_number ||
          attributes.room_number ||
          properties.room_name ||
          attributes.room_name ||
          (rawDesc.match(/Room:\s*([^,\)]+)/i)?.[1]) ||
          (rawDesc.match(/in\s+(Room\s*\d+|Lab\s*\d+|Sports Ground)/i)?.[1]) ||
          '—';

        if (room === '—' && (subject !== '—' || teacher !== '—')) {
          room = 'Room 12';
        }

        // Previous state (if updated)
        const prev = properties.previous || properties.old || attributes.previous || attributes.old || {};
        const prevSubject =
          prev.subject ||
          prev.subject_name ||
          properties.old_subject ||
          properties.previous_subject ||
          (rawDesc.match(/from\s+([A-Za-z\s]+?)\s+\(/i)?.[1]) ||
          (rawDesc.match(/from\s+([A-Za-z\s]+?)\s+to/i)?.[1]) ||
          (rawDesc.match(/was\s+([A-Za-z\s]+?)(?:\s+with|\))/i)?.[1]) ||
          '';

        let prevTeacher =
          prev.teacher ||
          prev.teacher_name ||
          prev.faculty_name ||
          properties.old_teacher ||
          properties.previous_teacher ||
          (rawDesc.match(/from\s+.*?\((?:Faculty:\s*)?([A-Za-z\s]+?)(?:,|\))/i)?.[1]) ||
          (rawDesc.match(/\(([A-Za-z\s]+?)\)\s+to/i)?.[1]) ||
          (rawDesc.match(/with\s+([A-Za-z\s]+?)\)/i)?.[1]) ||
          '';

        const prevTeacherId = prev.teacher_id || prev.teacherId || properties.old_teacher_id || properties.previous_teacher_id;
        if ((!prevTeacher || prevTeacher === '—' || /^\d+$/.test(String(prevTeacher).trim())) && prevTeacherId) {
          try {
            const rawStaff = localStorage.getItem('kts_staff_members');
            if (rawStaff) {
              const staffList = JSON.parse(rawStaff);
              const found = staffList.find((s: any) => String(s.id) === String(prevTeacherId) || String(s.user_id) === String(prevTeacherId));
              if (found && found.name) {
                prevTeacher = found.name;
              }
            }
          } catch { /* empty */ }
        }

        const prevRoom =
          prev.room ||
          prev.classroom_name ||
          properties.old_room ||
          properties.previous_room ||
          (rawDesc.match(/from\s+.*?(?:Room:\s*|in\s+)([A-Za-z0-9\s]+?)(?:\)|to)/i)?.[1]) ||
          '';

        const isPeriodUpdated =
          actionType === 'period_updated' ||
          (event === 'updated' && !isScheduleSaved && !isTimingsUpdate && !isClearing) ||
          Boolean(prevSubject || prevTeacher || prevRoom) ||
          rawDesc.toLowerCase().includes('updated period') ||
          rawDesc.toLowerCase().includes('updated timetable') ||
          (rawDesc.toLowerCase().includes('timetable') && rawDesc.toLowerCase().includes('update'));

        const isSubjectChanged = Boolean(prevSubject && subject && prevSubject !== '—' && subject !== '—' && prevSubject.toLowerCase().trim() !== subject.toLowerCase().trim());
        const isTeacherChanged = Boolean(prevTeacher && teacher && prevTeacher !== '—' && teacher !== '—' && prevTeacher.toLowerCase().trim() !== teacher.toLowerCase().trim());
        const isRoomChanged = Boolean(prevRoom && room && prevRoom !== '—' && room !== '—' && prevRoom.toLowerCase().trim() !== room.toLowerCase().trim());

        const effectivePrevSubject = prevSubject || (isPeriodUpdated ? subject : '');
        const effectivePrevTeacher = prevTeacher || (isPeriodUpdated ? teacher : '');
        const effectivePrevRoom = prevRoom || (isPeriodUpdated ? (room !== '—' ? room : 'Room 12') : 'Room 12');

        const showBeforeAfterTable = Boolean(
          isPeriodUpdated ||
          actionType === 'period_updated' ||
          event === 'updated' ||
          isSubjectChanged ||
          isTeacherChanged ||
          isRoomChanged ||
          prevSubject ||
          prevTeacher ||
          prevRoom
        );

        // Timings list for timings update
        let timingsList: any[] = [];
        if (isTimingsUpdate) {
          if (Array.isArray(properties.timings) && properties.timings.length > 0) {
            timingsList = properties.timings;
          } else {
            try {
              const saved = localStorage.getItem('timetable_period_timings');
              if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                  timingsList = parsed.map((t: any, idx: number) => ({
                    period: t.isBreak ? (t.label || 'Break') : `Period ${idx + 1}`,
                    start: t.start,
                    end: t.end,
                    timings: formatExamTimingsWithEnd(t.start, t.end, `${t.start} - ${t.end}`),
                    is_break: Boolean(t.isBreak),
                    label: t.label,
                  }));
                }
              }
            } catch { /* empty */ }
          }
        }

        return (
          <div className="space-y-3">
            {/* 1. FULL WEEKLY TIMETABLE SCHEDULE BREAKDOWN TABLE */}
            {isScheduleSaved && (
              <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/40 rounded-xl p-4 text-[12px] space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-200/50 dark:border-indigo-900/40 pb-2.5">
                  <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 font-bold text-[13px]">
                    <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Weekly Timetable Schedule • {formattedClass}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60">
                    {slotsList.length > 0 ? `${slotsList.length} Period Allocations` : 'Published Schedule'}
                  </span>
                </div>

                {slotsList.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-indigo-200/80 dark:border-indigo-800/40 bg-white dark:bg-[var(--surf)] shadow-xs">
                    <table className="w-full text-left text-[12px] border-collapse">
                      <thead className="bg-indigo-100/70 dark:bg-indigo-900/50 text-indigo-950 dark:text-indigo-200 font-bold border-b border-indigo-200 dark:border-indigo-800/40">
                        <tr>
                          <th className="py-2.5 px-3.5 text-center">#</th>
                          <th className="py-2.5 px-3.5">Day</th>
                          <th className="py-2.5 px-3.5">Period & Timings</th>
                          <th className="py-2.5 px-3.5">Subject</th>
                          <th className="py-2.5 px-3.5">Assigned Faculty</th>
                          <th className="py-2.5 px-3.5">Room</th>
                          <th className="py-2.5 px-3.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-100 dark:divide-indigo-900/30 text-slate-800 dark:text-slate-200">
                        {slotsList.map((slot: any, idx: number) => {
                          const timing = slot.timings || formatExamTimingsWithEnd(slot.start_time, slot.end_time, `${slot.start_time || ''} - ${slot.end_time || ''}`);
                          const pNum = slot.period !== undefined ? Number(slot.period) + 1 : idx + 1;

                          return (
                            <tr key={idx} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 transition-colors">
                              <td className="py-2.5 px-3.5 text-center font-mono text-[11px] text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3.5 font-bold text-indigo-950 dark:text-indigo-200">
                                {slot.day || '—'}
                              </td>
                              <td className="py-2.5 px-3.5 font-mono">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11.5px]">
                                    Period {pNum}
                                  </span>
                                  {timing !== '—' && (
                                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                                      {timing}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3.5">
                                <span className="inline-block px-2 py-0.5 rounded font-semibold text-[11.5px] bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/40">
                                  {slot.subject || '—'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 font-semibold text-slate-900 dark:text-white">
                                {slot.teacher || 'Unassigned'}
                              </td>
                              <td className="py-2.5 px-3.5 font-mono text-slate-700 dark:text-slate-300">
                                {slot.room || '—'}
                              </td>
                              <td className="py-2.5 px-3.5 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                  Active
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Target Class</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formattedClass}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Schedule Status</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Saved & Published</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. PERIOD TIMINGS UPDATE VIEW */}
            {isTimingsUpdate && (
              <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-xl p-4 text-[12px] space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/50 dark:border-amber-900/40 pb-2.5">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-[13px]">
                    <Clock3 size={16} className="text-amber-600 dark:text-amber-400" />
                    <span>Daily Timetable Period Timings Configuration</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60">
                    {timingsList.length > 0 ? `${timingsList.length} Periods Configured` : 'Timings Updated'}
                  </span>
                </div>

                {timingsList.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-amber-200/80 dark:border-amber-800/40 bg-white dark:bg-[var(--surf)] shadow-xs">
                    <table className="w-full text-left text-[12px] border-collapse">
                      <thead className="bg-amber-100/70 dark:bg-amber-900/50 text-amber-950 dark:text-amber-200 font-bold border-b border-amber-200 dark:border-amber-800/40">
                        <tr>
                          <th className="py-2.5 px-3.5 text-center">#</th>
                          <th className="py-2.5 px-3.5">Period / Slot</th>
                          <th className="py-2.5 px-3.5">Start Time</th>
                          <th className="py-2.5 px-3.5">End Time</th>
                          <th className="py-2.5 px-3.5">Period Duration</th>
                          <th className="py-2.5 px-3.5 text-center">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100 dark:divide-amber-900/30 text-slate-800 dark:text-slate-200">
                        {timingsList.map((t: any, idx: number) => {
                          const isBreak = Boolean(t.is_break || t.isBreak);
                          const periodName = t.period || (isBreak ? (t.label || 'Break') : `Period ${idx + 1}`);
                          const timingFormatted = t.timings || t.timing_str || formatExamTimingsWithEnd(t.start, t.end, `${t.start} - ${t.end}`);

                          return (
                            <tr key={idx} className="hover:bg-amber-50/40 dark:hover:bg-amber-900/20 transition-colors">
                              <td className="py-2.5 px-3.5 text-center font-mono text-[11px] text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Clock size={13} className={isBreak ? 'text-amber-500' : 'text-blue-500'} />
                                <span>{periodName}</span>
                              </td>
                              <td className="py-2.5 px-3.5 font-mono text-slate-700 dark:text-slate-300">
                                {t.start || '—'}
                              </td>
                              <td className="py-2.5 px-3.5 font-mono text-slate-700 dark:text-slate-300">
                                {t.end || '—'}
                              </td>
                              <td className="py-2.5 px-3.5 font-mono">
                                <span className={`inline-block px-2 py-0.5 rounded font-mono text-[11px] font-semibold border ${isBreak
                                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/40'
                                    : 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/40'
                                  }`}>
                                  {timingFormatted}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 text-center">
                                {isBreak ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                                    Break / Recess
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                                    Class Period
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Configuration Event</span>
                      <span className="font-semibold text-slate-900 dark:text-white">Daily Timetable Period Timings Updated</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Total Periods / Breaks</span>
                      <span className="font-mono font-bold text-amber-800 dark:text-amber-300">{properties.total_periods || 'Updated'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. PERIOD CLEARED NOTICE CARD */}
            {isClearing && (
              <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 rounded-xl p-4 text-[12px] space-y-3">
                <div className="flex items-center justify-between border-b border-rose-200/50 dark:border-rose-900/40 pb-2.5">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-[13px]">
                    <XCircle size={16} className="text-rose-600 dark:text-rose-400" />
                    <span>Period Timetable Slot Cleared & Unassigned</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10.5px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                    Slot Cleared
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Class & Section</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formattedClass}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Weekday</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {day}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Period Slot</span>
                    <span className="font-semibold text-rose-700 dark:text-rose-300 font-mono">
                      {periodLabel}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Period Timing</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {timingStr !== '—' ? (
                        <span className="inline-block px-2 py-0.5 rounded font-mono text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/40">
                          {timingStr}
                        </span>
                      ) : '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Cleared Subject</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 line-through">
                      {subject}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Cleared Faculty</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 line-through">
                      {teacher}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Cleared Room</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 line-through">
                      {room}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Slot Status</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      Empty / Available
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. PERIOD ASSIGNED / UPDATED CARD */}
            {!isClearing && !isTimingsUpdate && !isScheduleSaved && (
              <div className="space-y-3">
                <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 rounded-xl p-4 text-[12px] space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-200/50 dark:border-blue-900/40 pb-2.5">
                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-[13px]">
                      <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                      <span>Class Timetable • Period Allocation</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold border ${actionType === 'period_assigned' || (!isPeriodUpdated && event === 'created')
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40'
                      }`}>
                      {actionType === 'period_assigned' || (!isPeriodUpdated && event === 'created') ? 'Period Assigned' : 'Period Updated'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Class & Section</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formattedClass}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Weekday</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {day}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Period Slot</span>
                      <span className="font-semibold text-blue-700 dark:text-blue-300 font-mono">
                        {periodLabel}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Period Timing</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {timingStr !== '—' ? (
                          <span className="inline-block px-2 py-0.5 rounded font-mono text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/40">
                            {timingStr}
                          </span>
                        ) : '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Subject</span>
                      <span className="inline-block px-2.5 py-0.5 rounded font-bold text-[12px] bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/40 mt-0.5">
                        {subject}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Assigned Faculty</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {teacher}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Classroom / Lab</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {room}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Allocation Status</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={13} />
                        <span>Scheduled</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* SEPARATE TABLE BELOW CARD: Before vs After Changes Breakdown Table */}
                {showBeforeAfterTable && (
                  <div className="bg-white dark:bg-[var(--surf)] border border-blue-200/80 dark:border-blue-900/50 rounded-xl p-4 text-[12px] space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-[12.5px]">
                        <History size={15} className="text-blue-600 dark:text-blue-400" />
                        <span>Period Allocation Changes Breakdown (Before vs After)</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/40">
                        {isSubjectChanged && isTeacherChanged
                          ? 'Subject & Faculty Changed'
                          : isSubjectChanged
                            ? 'Subject Changed'
                            : isTeacherChanged
                              ? 'Faculty Changed'
                              : isRoomChanged
                                ? 'Room Changed'
                                : 'Period Updated'}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                      <table className="w-full text-left text-[12px] border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="py-2.5 px-3.5 w-36">Change State</th>
                            <th className="py-2.5 px-3.5">Subject</th>
                            <th className="py-2.5 px-3.5">Assigned Faculty</th>
                            <th className="py-2.5 px-3.5">Classroom / Lab</th>
                            <th className="py-2.5 px-3.5">Period & Weekday</th>
                            <th className="py-2.5 px-3.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                          {/* Row 1: BEFORE (Previous) */}
                          <tr className="bg-rose-50/30 dark:bg-rose-950/10 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 transition-colors">
                            <td className="py-2.5 px-3.5 font-bold">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Before (Previous)
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5">
                              {isSubjectChanged ? (
                                <span className="inline-block px-2 py-0.5 rounded font-semibold text-[11.5px] bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 line-through">
                                  {effectivePrevSubject}
                                </span>
                              ) : (
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {effectivePrevSubject}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5">
                              {isTeacherChanged ? (
                                <span className="inline-block px-2 py-0.5 rounded font-semibold text-[11.5px] bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 line-through">
                                  {effectivePrevTeacher}
                                </span>
                              ) : (
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {effectivePrevTeacher}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono">
                              {isRoomChanged ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[11.5px] bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 line-through">
                                  {effectivePrevRoom}
                                </span>
                              ) : (
                                <span className="text-slate-700 dark:text-slate-300">
                                  {effectivePrevRoom}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono text-slate-600 dark:text-slate-400">
                              {periodLabel} • {day}
                            </td>
                            <td className="py-2.5 px-3.5 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                Replaced
                              </span>
                            </td>
                          </tr>

                          {/* Row 2: AFTER (Updated) */}
                          <tr className="bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 transition-colors">
                            <td className="py-2.5 px-3.5 font-bold">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                After (Updated)
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5">
                              {isSubjectChanged ? (
                                <span className="inline-block px-2 py-0.5 rounded font-bold text-[11.5px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                                  {subject}
                                </span>
                              ) : (
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {subject}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5">
                              {isTeacherChanged ? (
                                <span className="inline-block px-2 py-0.5 rounded font-bold text-[11.5px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                                  {teacher}
                                </span>
                              ) : (
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {teacher}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono">
                              {isRoomChanged ? (
                                <span className="inline-block px-2 py-0.5 rounded font-bold text-[11.5px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                                  {room}
                                </span>
                              ) : (
                                <span className="font-medium text-slate-900 dark:text-white">
                                  {room}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono text-slate-800 dark:text-slate-200 font-semibold">
                              {periodLabel} • {day}
                            </td>
                            <td className="py-2.5 px-3.5 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                Active
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}
      {/* 7. PROMOTION & RETENTION MANAGEMENT CARD */}
      {isPromotion && (
        <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-[12.5px] border-b border-indigo-200/50 dark:border-indigo-900/40 pb-2">
            <GraduationCap size={15} />
            <span>Student Promotion, Retention & Status Transition</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Student</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.student_name || properties.name || attributes.name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Class / Academic Transition</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 font-semibold text-[10.5px]">
                  {properties.old_batch_name || properties.from_class || old.batch_name || '—'}
                </span>
                <ArrowRight size={11} className="text-slate-400" />
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 font-bold text-[10.5px]">
                  {properties.new_batch_name || properties.to_class || attributes.batch_name || '—'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Academic Year</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.academic_year || attributes.academic_year || '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 8. ALUMNI MANAGEMENT CARD */}
      {isAlumni && (
        <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-[12.5px] border-b border-emerald-200/50 dark:border-emerald-900/40 pb-2">
            <GraduationCap size={15} />
            <span>Alumni Record & Graduation Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Student Name</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.student_name || properties.name || attributes.name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Admission Number</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {properties.admission_no || properties.admission_number || attributes.admission_no || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Graduation Year</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {properties.graduation_year || attributes.graduation_year || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Final Class Completed</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.final_class || attributes.final_class || 'Class 10'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 9. FEE CATEGORIES CARD */}
      {isFeeCategory && (
        <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-[12.5px] border-b border-amber-200/50 dark:border-amber-900/40 pb-2">
            <CreditCard size={15} />
            <span>Fee Category Master Configuration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Category Name</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.name || attributes.name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Default Amount</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[13px]">
                {properties.amount !== undefined ? formatAuditValue(properties.amount, 'amount') : (attributes.amount !== undefined ? formatAuditValue(attributes.amount, 'amount') : '—')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Frequency / Billing Cycle</span>
              <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                {properties.frequency || attributes.frequency || 'Term-wise'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 10. FEE MANAGEMENT, PAYMENT & TRANSPORT/BUS FEE CARD */}
      {isPayment && !isFeeCategory && (
        <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-[12.5px] border-b border-amber-200/50 dark:border-amber-900/40 pb-2">
            <CreditCard size={15} />
            <span>Fee Payment, Collection & Transport Allotment</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Student Name</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {studentName || (properties.student_id ? `Student #${properties.student_id}` : '—')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Admission Number</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {properties.admission_number || properties.admission_no || attributes.admission_number || attributes.admission_no || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Fee Category</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.fee_category || properties.category || attributes.fee_category || 'Tuition Fee'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Amount Collected</span>
              <span className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {properties.amount !== undefined ? formatAuditValue(properties.amount, 'amount') : (attributes.amount !== undefined ? formatAuditValue(attributes.amount, 'amount') : (rawDesc.match(/₹([0-9,\.]+)/) ? `₹${rawDesc.match(/₹([0-9,\.]+)/)![1]}` : '—'))}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Payment Mode</span>
              <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                {properties.payment_method || properties.payment_mode || attributes.payment_method || (rawDesc.match(/via\s+([A-Za-z]+)/i) ? rawDesc.match(/via\s+([A-Za-z]+)/i)![1] : 'Cash')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Receipt Number</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {properties.receipt_number || properties.receipt_no || properties.transaction_id || attributes.receipt_number || attributes.receipt_no || '—'}
              </span>
            </div>

            {/* Bus / Transport Details */}
            {(properties.route_name || properties.pickup_point || properties.bus_fee || attributes.bus_fee) && (
              <>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block flex items-center gap-1">
                    <Bus size={11} className="text-amber-600" /> Bus Route & Pickup
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {properties.route_name || 'Route 1'} ({properties.pickup_point || 'Main Gate'})
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Bus Fee Amount</span>
                  <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                    {formatAuditValue(properties.bus_fee || attributes.bus_fee || 0, 'amount')}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 11. FEE CONCESSION DETAILS */}
      {isConcession && !isPayment && (
        <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-[12.5px] border-b border-amber-200/50 dark:border-amber-900/40 pb-2">
            <Percent size={15} />
            <span>Fee Concession & Discount Breakdown</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Student Name</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.student_name || properties.name || attributes.name || (activity.target ? activity.target.replace(/^Student:\s*/, '') : '—')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Fee Category</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.fee_category || properties.category || attributes.fee_category || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Concession Value</span>
              <span className="font-bold text-amber-700 dark:text-amber-300">
                {properties.percentage ? `${properties.percentage}%` : (properties.concession || (properties.concession_amount ? formatAuditValue(properties.concession_amount, 'amount') : '—'))}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Reason / Assistance</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {properties.reason || properties.remarks || 'Sibling Concession / Merit'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 12. SALARY CATEGORIES CARD */}
      {isSalaryCategory && (
        <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-[12.5px] border-b border-blue-200/50 dark:border-blue-900/40 pb-2">
            <Briefcase size={15} />
            <span>Salary Category & Pay Structure</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Category Name</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.name || attributes.name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Base Pay / Salary</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatAuditValue(properties.base_salary || attributes.base_salary || 0, 'salary')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 13. SALARY & PAYROLL PROCESSING CARD */}
      {isPayroll && (
        <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-[12.5px] border-b border-blue-200/50 dark:border-blue-900/40 pb-2">
            <Briefcase size={15} />
            <span>Staff Payroll & Compensation Processing</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Staff Name</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.staff_name || properties.user_name || attributes.name || (activity.target ? activity.target.replace(/^Staff:\s*/, '') : '—')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Payroll Period</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {(properties.payroll_month || properties.month) ? `${properties.payroll_month || properties.month} ${properties.payroll_year || properties.year || ''}` : 'Current Month'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Basic Salary</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {properties.basic_salary !== undefined ? formatAuditValue(properties.basic_salary, 'salary') : (attributes.basic_salary !== undefined ? formatAuditValue(attributes.basic_salary, 'salary') : '—')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Net Payable Salary</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-[14px]">
                {properties.net_salary !== undefined ? formatAuditValue(properties.net_salary, 'salary') : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 14. EXPENSES MANAGEMENT CARD */}
      {isExpense && (
        <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-[12.5px] border-b border-rose-200/50 dark:border-rose-900/40 pb-2">
            <DollarSign size={15} />
            <span>School Expense Voucher & Approval Status</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Expense Title</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.title || properties.expense_title || attributes.title || 'School Expense'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Category</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.category || attributes.category || 'Operations'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Amount</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-[13px]">
                {properties.amount !== undefined ? formatAuditValue(properties.amount, 'amount') : '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Paid To / Vendor</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.paid_to || properties.vendor || attributes.paid_to || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Approval Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {properties.status || attributes.status || 'Approved'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 15. STAFF MANAGEMENT CARD */}
      {isStaff && (
        <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-[12.5px] border-b border-blue-200/50 dark:border-blue-900/40 pb-2">
            <Users size={15} />
            <span>Staff Profile & Faculty Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Staff Name</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.name || attributes.name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Designation</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.designation || attributes.designation || 'Teacher'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Department</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.department || attributes.department || 'Academics'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Contact Phone</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {properties.phone || attributes.phone || '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 16. STAFF ATTENDANCE & BIOMETRIC CARD */}
      {isStaffAttendance && (
        <div className="bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-[12.5px] border-b border-teal-200/50 dark:border-teal-900/40 pb-2">
            <Clock size={15} />
            <span>Staff Attendance & Biometric Synchronization</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Attendance Date</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatDateOnly(properties.date) || formatExactDateTime(log.created_at)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Capture Source</span>
              <span className="font-semibold text-teal-700 dark:text-teal-300">
                {properties.source || 'Biometric Machine Sync'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 17. LEAVES & HOLIDAY CALENDAR CARD */}
      {isLeave && (
        <div className="bg-cyan-50/40 dark:bg-cyan-950/20 border border-cyan-200/70 dark:border-cyan-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-300 font-bold text-[12.5px] border-b border-cyan-200/50 dark:border-cyan-900/40 pb-2">
            <FileText size={15} />
            <span>Leave Application & Administrative Approval</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Staff Member</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.applicant_name || properties.staff_name || properties.user_name || attributes.name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Leave Type</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.leave_type || attributes.leave_type || 'Casual Leave'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Duration</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {(properties.start_date || properties.end_date || attributes.start_date)
                  ? `${formatDateOnly(properties.start_date || attributes.start_date) || '—'} to ${formatDateOnly(properties.end_date || attributes.end_date) || '—'}`
                  : '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Reason</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {properties.reason || properties.remarks || attributes.reason || 'Personal'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {properties.status || attributes.status || (rawDesc.includes('approved') ? 'Approved' : 'Submitted')}
              </span>
            </div>
          </div>
        </div>
      )}

      {isHoliday && (
        <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-[12.5px] border-b border-emerald-200/50 dark:border-emerald-900/40 pb-2">
            <Calendar size={15} />
            <span>School Holiday & Event Calendar</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Holiday Name</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.holiday_name || properties.name || attributes.holiday_name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Date(s)</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatDateOnly(properties.date || properties.start_date) || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Occasion</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {properties.occasion || properties.description || 'General Holiday'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 18. SUBSTITUTE TEACHER ALLOCATION CARD */}
      {isSubstitute && (
        <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-[12.5px] border-b border-amber-200/50 dark:border-amber-900/40 pb-2">
            <Users size={15} />
            <span>Substitute Teacher Class Allocation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Absent Teacher</span>
              <span className="font-semibold text-rose-700 dark:text-rose-300">
                {properties.original_teacher || properties.absent_teacher || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Allotted Substitute</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                {properties.substitute_teacher || properties.substitute_name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Class & Period</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.class_name || properties.batch_name || 'Class 5'} {properties.period ? `(Period ${properties.period})` : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 19. STAFF ACCESS & PERMISSIONS CARD */}
      {isStaffAccess && (
        <div className="bg-violet-50/40 dark:bg-violet-950/20 border border-violet-200/70 dark:border-violet-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-violet-800 dark:text-violet-300 font-bold text-[12.5px] border-b border-violet-200/50 dark:border-violet-900/40 pb-2">
            <Shield size={15} />
            <span>Staff Portal Access & Role Management</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Staff Account</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.staff_name || properties.name || attributes.name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Assigned Role</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.role || attributes.role || 'Teacher'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Access Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {properties.status || properties.new_status || attributes.status || 'Active Access'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 20. REPORTS & EXPORTS CARD */}
      {isReport && (
        <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-[12.5px] border-b border-blue-200/50 dark:border-blue-900/40 pb-2">
            <FileText size={15} />
            <span>Report Generation & Export Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Report Type</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.report_type || properties.title || activity.title}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Export Format</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {properties.export_format || properties.format || 'Excel / PDF'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 21. SETTINGS & BACKUPS CARD */}
      {(isSettings || isBackup) && (
        <div className="bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-[12.5px] border-b border-slate-200 dark:border-slate-700 pb-2">
            {isBackup ? <Database size={15} /> : <Settings size={15} />}
            <span>{isBackup ? 'Database Backup & System Recovery' : 'System Configuration & Profile Settings'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {isBackup ? (
              <>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Backup File</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {properties.backup_name || properties.file_name || attributes.backup_name || 'kts_db_backup.sql'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Backup Size</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {properties.backup_size || 'Full SQL Export'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Setting Updated</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {properties.setting_name || activity.title}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 5. GENERIC CREATED RECORD DETAILS (Fallback if no specialized card matched) */}
      {(event === 'created' || rawDesc.startsWith('added') || rawDesc.startsWith('created')) &&
        Object.keys(attributes).length > 0 &&
        !isStudent &&
        !isAttendance &&
        !isDailyDiary &&
        !isExamSchedule &&
        !isExamMarks &&
        !isTimetable &&
        !isPayment &&
        !isExpense &&
        !isStaff &&
        !isLeave && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
              <PlusCircle size={13} />
              <span>Created Record Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 bg-emerald-50/30 dark:bg-emerald-950/10 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-[11.5px]">
              {Object.entries(attributes)
                .filter(([k]) => !SYSTEM_METADATA_KEYS.has(k) && !isSensitiveKey(k))
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between sm:justify-start gap-2 border-b border-emerald-100/50 dark:border-emerald-900/20 pb-1.5 last:border-0">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 min-w-[120px]">{formatFieldLabel(k)}:</span>
                    <span className="text-slate-900 dark:text-white font-medium">{formatAuditValue(v, k)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

      {/* 6. GENERIC DELETED RECORD DETAILS (Fallback if no specialized card matched) */}
      {(event === 'deleted' || rawDesc.startsWith('deleted') || rawDesc.startsWith('removed')) &&
        Object.keys(old).length > 0 &&
        !isTimetable && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1.5">
              <Trash2 size={13} />
              <span>Deleted Record Snapshot (Immediately prior to deletion)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 bg-rose-50/30 dark:bg-rose-950/10 p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/30 text-[11.5px]">
              {Object.entries(old)
                .filter(([k]) => !SYSTEM_METADATA_KEYS.has(k) && !isSensitiveKey(k))
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between sm:justify-start gap-2 border-b border-rose-100/50 dark:border-rose-900/20 pb-1.5 last:border-0">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 min-w-[120px]">{formatFieldLabel(k)}:</span>
                    <span className="text-slate-900 dark:text-white font-medium">{formatAuditValue(v, k)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
    </div>
  );
};
