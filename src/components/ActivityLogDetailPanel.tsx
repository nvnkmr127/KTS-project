import React from 'react';
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
} from 'lucide-react';
import {
  getUserDisplayDetails,
  parseActivityDetails,
  parsePlatformInfo,
  formatExactDateTime,
  formatFieldLabel,
  formatAuditValue,
  generateActionSummary,
  extractStudentName,
  isSensitiveKey,
  SYSTEM_METADATA_KEYS,
} from '../utils/activityLogFormatter';

interface ActivityLogDetailPanelProps {
  log: any;
}

export const ActivityLogDetailPanel: React.FC<ActivityLogDetailPanelProps> = ({ log }) => {
  const user = getUserDisplayDetails(log);
  const activity = parseActivityDetails(log);
  const platform = parsePlatformInfo(log);
  const actionSummary = generateActionSummary(log);
  const properties = log.properties || {};
  const event = String(log.event || '').toLowerCase();
  const rawDesc = String(log.description || '').toLowerCase();
  const subjectType = String(log.subject_type || '').toLowerCase();
  const attributes = properties.attributes || {};
  const old = properties.old || {};
  const studentName = extractStudentName(properties, log.description, activity.target);

  // Extract changed fields for updates (model diffs or top-level diffs)
  const hasModelDiff = event === 'updated' && (Object.keys(old).length > 0 || Object.keys(attributes).length > 0);
  const changedKeys: string[] = [];

  if (hasModelDiff) {
    const allKeys = Array.from(new Set([...Object.keys(attributes), ...Object.keys(old)]));
    for (const key of allKeys) {
      if (
        !SYSTEM_METADATA_KEYS.has(key) &&
        !isSensitiveKey(key) &&
        attributes[key] !== old[key]
      ) {
        changedKeys.push(key);
      }
    }
  }

  // --- DOMAIN DETECTION GUARDS FOR ALL 21 MODULES ---

  // 9. Fee Categories
  const isFeeCategory =
    (rawDesc.includes('fee category') || rawDesc.includes('fee categories') || subjectType.includes('feecategory')) &&
    !rawDesc.includes('payment') &&
    !rawDesc.includes('concession');

  // 10. Fee Management / Payments / Bus Fee / Student Fee Records
  const isPayment =
    (rawDesc.includes('payment') ||
      subjectType.includes('payment') ||
      properties.type === 'payment' ||
      rawDesc.includes('student fee') ||
      rawDesc.includes('fee structure') ||
      rawDesc.includes('fee record') ||
      (rawDesc.includes('fee') && !isFeeCategory)) &&
    Boolean(
      properties.amount !== undefined ||
      properties.payment_method ||
      properties.receipt_number ||
      properties.receipt_no ||
      properties.bus_fee ||
      attributes.amount !== undefined ||
      rawDesc.includes('fee')
    );

  const isConcession =
    (rawDesc.includes('concession') || properties.type === 'concession') &&
    Boolean(properties.concession_amount !== undefined || properties.percentage !== undefined || properties.concession !== undefined || attributes.concession_amount !== undefined);

  // 1. Student Management (Strictly non-fee student actions)
  const isStudent =
    !isPayment &&
    !isFeeCategory &&
    !isConcession &&
    !rawDesc.includes('student fee') &&
    !rawDesc.includes('fee') &&
    (subjectType.includes('student') ||
      rawDesc.includes('student') ||
      properties.type === 'student' ||
      Boolean(properties.admission_no || properties.admission_number || properties.pen || properties.pen_number || attributes.admission_no || attributes.pen));

  // 2. Attendance / Allot Attendance
  const isAttendance =
    (rawDesc.includes('attendance') || subjectType.includes('attendance')) &&
    (properties.present_count !== undefined ||
      properties.absent_count !== undefined ||
      properties.student_name !== undefined ||
      properties.class_name !== undefined ||
      properties.batch_name !== undefined ||
      Array.isArray(properties.present_students) ||
      Array.isArray(properties.absent_students) ||
      properties.attributes?.key === 'kts_student_attendance_records' ||
      properties.old?.key === 'kts_student_attendance_records');

  // 3. Daily Diary
  const isDailyDiary =
    rawDesc.includes('daily diary') ||
    rawDesc.includes('dailydiary') ||
    rawDesc.includes('diary') ||
    subjectType.includes('dailydiary') ||
    Boolean(properties.topics_taught || properties.homework_given || attributes.topics_taught || attributes.homework_given);

  // 4. Examination, Schedule, Marks & Invigilation
  const isInvigilation =
    rawDesc.includes('invigilat') ||
    Boolean(properties.invigilator_name || properties.hall_no || properties.room_number || attributes.invigilator_name);

  const isExamMarks =
    !isInvigilation &&
    (rawDesc.includes('mark') || properties.type === 'exam_marks') &&
    Boolean(properties.marks !== undefined || properties.obtained_marks !== undefined || properties.new_marks !== undefined || attributes.marks !== undefined);

  const isExamSchedule =
    !isInvigilation &&
    !isExamMarks &&
    (rawDesc.includes('exam') || subjectType.includes('exam') || subjectType.includes('examination')) &&
    Boolean(properties.exam_name || properties.subject_name || properties.max_marks || properties.schedule || attributes.exam_name || attributes.max_marks);

  // 5. Timetable Designing
  const isTimetable =
    (rawDesc.includes('timetable') || subjectType.includes('timetable')) &&
    Boolean(properties.period !== undefined || properties.day || properties.substitute_teacher || properties.previous_teacher || properties.new_teacher || attributes.period !== undefined);

  // 6. Classes & Sections Management
  const isClasses =
    (rawDesc.includes('class') || rawDesc.includes('batch') || subjectType.includes('batch') || subjectType.includes('course')) &&
    !isTimetable &&
    !isAttendance &&
    !isDailyDiary &&
    Boolean(properties.class_teacher || properties.max_strength || properties.section || attributes.class_teacher || attributes.max_strength || attributes.course_id);

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
      {hasModelDiff && changedKeys.length > 0 && (
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

      {/* 1. STUDENT MANAGEMENT CARD */}
      {isStudent && (
        <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-[12.5px] border-b border-indigo-200/50 dark:border-indigo-900/40 pb-2">
            <UserCheck size={15} />
            <span>Student Profile & Admission Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Student Name</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {studentName || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Admission Number</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {properties.admission_number || properties.admission_no || attributes.admission_number || attributes.admission_no || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">PEN Number</span>
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                {properties.pen || properties.pen_number || properties.permanent_education_number || attributes.pen || attributes.student_pen_no || attributes.pen_number || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Class & Section</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.class_name || properties.batch_name || attributes.class_name || attributes.batch_name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Father's Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.father_name || attributes.father_name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Primary Mobile</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {properties.mobile || properties.phone || properties.father_mobile || properties.student_mobile || attributes.mobile || attributes.phone || attributes.student_mobile || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Gender & DOB</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {properties.gender || attributes.gender || '—'} {properties.dob || properties.date_of_birth || attributes.dob ? `(${properties.dob || properties.date_of_birth || attributes.dob})` : ''}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Current Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {properties.status || attributes.status || 'Active'}
              </span>
            </div>
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
                {properties.date || properties.attendance_date || formatExactDateTime(log.created_at)}
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
      {(isExamSchedule || isExamMarks || isInvigilation) && (
        <div className="bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold text-[12.5px] border-b border-purple-200/50 dark:border-purple-900/40 pb-2">
            <GraduationCap size={15} />
            <span>
              {isInvigilation ? 'Exam Invigilation Assignment' : isExamMarks ? 'Exam Evaluation & Marks Allotment' : 'Examination Creation & Schedule'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Examination</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.exam_name || properties.exam || attributes.exam_name || '—'}
              </span>
            </div>

            {isInvigilation && (
              <>
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
              </>
            )}

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Class / Batch</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.class_name || properties.batch_name || attributes.class_name || '—'}
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

          {/* Exam Marks Comparison */}
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
      )}

      {/* 5. TIMETABLE DESIGNING CARD */}
      {isTimetable && (
        <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-[12.5px] border-b border-blue-200/50 dark:border-blue-900/40 pb-2">
            <Clock size={15} />
            <span>Class Timetable & Period Allocation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Class & Section</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.class_name || properties.batch_name || attributes.batch_name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Day & Period</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.day ? `${properties.day}${properties.period !== undefined ? `, Period ${properties.period}` : ''}` : '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Period Timings</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                {properties.time || (properties.start_time && properties.end_time ? `${properties.start_time} - ${properties.end_time}` : '—')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Subject</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.subject_name || properties.subject || attributes.subject_name || '—'}
              </span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Assigned Faculty</span>
              <span className="font-semibold text-blue-700 dark:text-blue-300">
                {properties.teacher_name || properties.new_teacher || attributes.teacher_name || '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6. CLASSES & SECTIONS MANAGEMENT CARD */}
      {isClasses && (
        <div className="bg-sky-50/40 dark:bg-sky-950/20 border border-sky-200/70 dark:border-sky-900/40 rounded-xl p-4 text-[12px] space-y-3">
          <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold text-[12.5px] border-b border-sky-200/50 dark:border-sky-900/40 pb-2">
            <Layers size={15} />
            <span>Class & Section Configuration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Class Name</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {properties.class_name || properties.name || attributes.name || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Section</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {properties.section || attributes.section || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Allotted Class Teacher</span>
              <span className="font-semibold text-sky-700 dark:text-sky-300">
                {properties.class_teacher || properties.class_teacher_name || attributes.class_teacher || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Maximum Class Strength</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {properties.max_strength || properties.class_strength || attributes.max_strength || '—'} Students
              </span>
            </div>
          </div>
        </div>
      )}

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
                {properties.date || formatExactDateTime(log.created_at)}
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
                  ? `${properties.start_date || attributes.start_date || '—'} to ${properties.end_date || attributes.end_date || '—'}`
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
                {properties.date || properties.start_date || '—'}
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
        Object.keys(old).length > 0 && (
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
