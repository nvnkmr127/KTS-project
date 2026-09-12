export interface ActivityDisplayDetails {
  title: string;
  description: string;
  category: string;
  categoryBadgeClass: string;
  target: string | null;
}

export interface UserDisplayDetails {
  initials: string;
  name: string;
  role: string;
  avatarBgClass: string;
  avatarTextClass: string;
}

export interface PlatformDisplayDetails {
  platform: string;
  osBrowser: string;
  isMobile: boolean;
  ipAddress: string;
}

const AVATAR_COLOR_PALETTES = [
  { bg: 'bg-blue-600', text: 'text-white' },
  { bg: 'bg-purple-100 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-300' },
  { bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300' },
  { bg: 'bg-amber-100 dark:bg-amber-950/50', text: 'text-amber-800 dark:text-amber-300' },
  { bg: 'bg-rose-100 dark:bg-rose-950/50', text: 'text-rose-700 dark:text-rose-300' },
  { bg: 'bg-teal-100 dark:bg-teal-950/50', text: 'text-teal-700 dark:text-teal-300' },
  { bg: 'bg-indigo-100 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300' },
  { bg: 'bg-cyan-100 dark:bg-cyan-950/50', text: 'text-cyan-800 dark:text-cyan-300' },
];

export const SENSITIVE_KEYS = new Set([
  'password',
  'password_confirmation',
  'token',
  '_token',
  'remember_token',
  'api_token',
  'signing_secret',
  'secret',
  'secret_key',
  'credentials',
  'bank_account_number',
  'account_number',
  'bank_ifsc',
  'ifsc_code',
  'pan_number',
  'aadhaar_number',
]);

export const SYSTEM_METADATA_KEYS = new Set([
  'created_at',
  'updated_at',
  'deleted_at',
  'original_created_at',
  'created_by',
  'updated_by',
  'ip_address',
  'user_agent',
  'method',
  'path',
  'url',
  'status_code',
  'input_keys',
]);

const FIELD_LABEL_MAP: Record<string, string> = {
  class_id: 'Class',
  section_id: 'Section',
  batch_id: 'Class / Batch',
  course_id: 'Course / Standard',
  subject_id: 'Subject',
  user_id: 'Staff / User',
  student_id: 'Student',
  parent_id: 'Parent',
  academic_year_id: 'Academic Year',
  leave_type_id: 'Leave Type',
  fee_category_id: 'Fee Category',
  fee_structure_id: 'Fee Structure',
  first_name: 'First Name',
  last_name: 'Last Name',
  name: 'Name',
  father_name: 'Father Name',
  mother_name: 'Mother Name',
  guardian_name: 'Guardian Name',
  dob: 'Date of Birth',
  date_of_birth: 'Date of Birth',
  admission_number: 'Admission Number',
  admission_no: 'Admission Number',
  phone: 'Phone',
  mobile: 'Mobile Number',
  emergency_contact: 'Emergency Contact',
  email: 'Email Address',
  address: 'Address',
  gender: 'Gender',
  blood_group: 'Blood Group',
  status: 'Status',
  is_active: 'Active Status',
  amount: 'Amount',
  fee_amount: 'Fee Amount',
  paid_amount: 'Paid Amount',
  due_amount: 'Due Amount',
  discount_amount: 'Discount / Concession Amount',
  concession_amount: 'Concession Amount',
  concession_type: 'Concession Type',
  percentage: 'Percentage',
  payment_method: 'Payment Mode',
  payment_mode: 'Payment Mode',
  receipt_number: 'Receipt Number',
  receipt_no: 'Receipt Number',
  transaction_id: 'Transaction ID',
  payment_date: 'Payment Date',
  start_date: 'Start Date',
  end_date: 'End Date',
  marks: 'Marks Obtained',
  obtained_marks: 'Marks Obtained',
  max_marks: 'Maximum Marks',
  grade: 'Grade',
  basic_salary: 'Basic Salary',
  gross_salary: 'Gross Salary',
  net_salary: 'Net Salary',
  allowances: 'Allowances',
  deductions: 'Deductions',
  payroll_month: 'Payroll Month',
  payroll_year: 'Payroll Year',
  reason: 'Reason',
  remarks: 'Remarks',
  description: 'Description',
  role: 'User Role',
  role_id: 'Role',
  assignment_date: 'Assignment Date',
  substitute_teacher: 'Substitute Teacher',
  original_teacher: 'Original Teacher',
  day: 'Day',
  period: 'Period',
  start_time: 'Start Time',
  end_time: 'End Time',
  pen: 'PEN Number',
  pen_number: 'PEN Number',
  permanent_education_number: 'PEN Number',
  father_phone: 'Father Mobile',
  mother_phone: 'Mother Mobile',
  guardian_phone: 'Guardian Mobile',
  class_teacher: 'Class Teacher',
  class_teacher_name: 'Class Teacher',
  max_strength: 'Maximum Strength',
  class_strength: 'Class Strength',
  route_name: 'Bus Route',
  pickup_point: 'Pickup Point',
  bus_fee: 'Bus / Transport Fee',
  transport_fee: 'Transport Fee',
  invigilator_name: 'Invigilator Staff',
  hall_no: 'Room / Hall Number',
  room_number: 'Room Number',
  pass_marks: 'Passing Marks',
  vendor: 'Vendor / Paid To',
  paid_to: 'Paid To',
  expense_title: 'Expense Title',
  school_start_time: 'School Start Time',
  school_end_time: 'School End Time',
  present_cutoff_morning: 'Morning Present Cutoff',
  present_cutoff_evening: 'Evening Present Cutoff',
  late_entry_cutoff: 'Morning Late Cutoff',
  early_entry_cutoff: 'Evening Early Cutoff',
  biometric_machine_cutoff: 'Biometric Machine Status Cutoff',
  min_attendance: 'Minimum Attendance (%)',
  school_name: 'School Name',
  school_email: 'School Email',
  school_phone: 'School Phone',
  school_address: 'School Physical Address',
  backup_name: 'Backup File Name',
  backup_size: 'Backup File Size',
  backup_type: 'Backup Type',
  holiday_name: 'Holiday Name',
  occasion: 'Occasion / Event',
  topics_taught: 'Lesson / Topics Taught',
  homework_given: 'Homework Assigned',
};

export function formatFieldLabel(key: string): string {
  if (!key) return '';
  const lower = key.toLowerCase();
  if (FIELD_LABEL_MAP[lower]) {
    return FIELD_LABEL_MAP[lower];
  }
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function isSensitiveKey(key: string): boolean {
  if (!key) return false;
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.has(lower) || lower.includes('password') || lower.includes('token') || lower.includes('secret');
}

export function formatAuditValue(value: any, fieldKey?: string): string {
  if (value === null || value === undefined || value === '') {
    return 'Not set';
  }

  if (fieldKey && isSensitiveKey(fieldKey)) {
    return '••••••••';
  }

  if (typeof value === 'boolean') {
    const keyLower = (fieldKey || '').toLowerCase();
    if (keyLower.includes('active') || keyLower.includes('enable')) {
      return value ? 'Active' : 'Inactive';
    }
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    const keyLower = (fieldKey || '').toLowerCase();
    if (keyLower.includes('amount') || keyLower.includes('salary') || keyLower.includes('fee') || keyLower.includes('paid') || keyLower.includes('due') || keyLower.includes('concession')) {
      return `₹${value.toLocaleString('en-IN')}`;
    }
    return String(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return 'Not set';
    if (trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') return 'Not set';

    // JSON string detection
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed);
        return formatAuditValue(parsed, fieldKey);
      } catch {}
    }

    // Number with currency context
    const keyLower = (fieldKey || '').toLowerCase();
    if (!trimmed.startsWith('₹') && !isNaN(Number(trimmed)) && Number(trimmed) >= 0 && (keyLower.includes('amount') || keyLower.includes('salary') || keyLower.includes('fee') || keyLower.includes('price'))) {
      return `₹${Number(trimmed).toLocaleString('en-IN')}`;
    }

    return trimmed;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    return value.map(item => formatAuditValue(item, fieldKey)).join(', ');
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([k]) => !isSensitiveKey(k));
    if (entries.length === 0) return 'None';
    return entries.map(([k, v]) => `${formatFieldLabel(k)}: ${formatAuditValue(v, k)}`).join('; ');
  }

  return String(value);
}

export function getUserDisplayDetails(log: any): UserDisplayDetails {
  const name = (log.causer_name || log.causer?.name || 'System').trim();
  
  // Extract initials
  let initials = 'SA';
  if (name.toLowerCase() === 'system') {
    initials = 'SY';
  } else {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      initials = parts[0].substring(0, 2).toUpperCase();
    } else if (parts.length === 1) {
      initials = parts[0][0].toUpperCase();
    }
  }

  // Consistent color hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % AVATAR_COLOR_PALETTES.length;
  const palette = name.toLowerCase().includes('admin') || name.toLowerCase().includes('super')
    ? { bg: 'bg-blue-600', text: 'text-white' }
    : AVATAR_COLOR_PALETTES[colorIndex];

  // Derive role
  let role = log.causer_role || log.properties?.user_role || '';
  if (!role) {
    const lower = name.toLowerCase();
    if (lower.includes('super admin') || lower.includes('superadmin')) role = 'Super Admin';
    else if (lower.includes('admin')) role = 'Admin';
    else if (lower.includes('principal')) role = 'Principal';
    else if (lower.includes('teacher') || lower.includes('faculty')) role = 'Teacher';
    else if (lower.includes('accountant')) role = 'Accountant';
    else if (lower.includes('librarian')) role = 'Librarian';
    else if (lower.includes('support')) role = 'IT Support';
    else if (name.toLowerCase() === 'system') role = 'System';
    else role = 'Staff';
  }

  return {
    initials,
    name,
    role,
    avatarBgClass: palette.bg,
    avatarTextClass: palette.text,
  };
}

export function sanitizeLogDescription(desc: string): string {
  if (!desc) return '';
  let cleaned = desc;
  
  // Remove backend URL / path fragments
  cleaned = cleaned.replace(/backend\s+public\s+/gi, '');
  cleaned = cleaned.replace(/backend\/public\//gi, '');
  cleaned = cleaned.replace(/public\//gi, '');
  cleaned = cleaned.replace(/api\/v1\//gi, '');
  cleaned = cleaned.replace(/resources\//gi, '');
  cleaned = cleaned.replace(/\bindex\.php\b/gi, '');
  
  // Clean pluralized / concatenated entity names
  cleaned = cleaned.replace(/dailydiaries/gi, 'Daily Diary');
  cleaned = cleaned.replace(/daily-diaries/gi, 'Daily Diary');
  cleaned = cleaned.replace(/dailydiary/gi, 'Daily Diary');
  cleaned = cleaned.replace(/daily-diary/gi, 'Daily Diary');
  cleaned = cleaned.replace(/daily diaries/gi, 'Daily Diary');
  cleaned = cleaned.replace(/feecategories/gi, 'Fee Categories');
  cleaned = cleaned.replace(/fee-categories/gi, 'Fee Categories');
  cleaned = cleaned.replace(/feestructures/gi, 'Fee Structures');
  cleaned = cleaned.replace(/fee-structures/gi, 'Fee Structures');
  cleaned = cleaned.replace(/leaveapplications/gi, 'Leave Applications');
  cleaned = cleaned.replace(/leave-applications/gi, 'Leave Applications');
  cleaned = cleaned.replace(/componentpayments/gi, 'Component Payments');
  cleaned = cleaned.replace(/component-payments/gi, 'Component Payments');
  cleaned = cleaned.replace(/studentfees/gi, 'Student Fees');
  cleaned = cleaned.replace(/student-fees/gi, 'Student Fees');
  
  return cleaned.trim();
}

/**
 * Safely extracts real student name without placeholder words or misplaced amounts
 */
export function extractStudentName(properties: any, rawDesc?: string, fallbackTarget?: string | null): string | null {
  if (!properties) properties = {};
  const attributes = properties.attributes || {};
  const old = properties.old || {};

  const candidates = [
    properties.student_name,
    properties.student,
    attributes.student_name,
    attributes.name,
    old.student_name,
    old.name,
    properties.name,
  ];

  for (const c of candidates) {
    if (c && typeof c === 'string') {
      const trimmed = c.trim();
      const lower = trimmed.toLowerCase();
      if (
        trimmed &&
        !['student', 'record', 'student record', 'undefined', 'null', 'tuition fee', 'fee'].includes(lower) &&
        !lower.startsWith('class ') &&
        !lower.startsWith('batch ') &&
        !trimmed.startsWith('₹') &&
        isNaN(Number(trimmed))
      ) {
        return trimmed;
      }
    }
  }

  if (rawDesc) {
    // 1. Match 'for student <Name>' or 'for <Name> via' or 'for <Name> on' or 'for <Name> was' or "for '<Name>'"
    const matchQuote = rawDesc.match(/for\s+['"]([^'"]+)['"]/i);
    if (matchQuote && matchQuote[1]) {
      const val = matchQuote[1].trim();
      const lower = val.toLowerCase();
      if (val && !['student', 'record', 'student record', 'class', 'tuition fee'].includes(lower) && !val.startsWith('₹') && !lower.startsWith('class ') && isNaN(Number(val))) {
        return val;
      }
    }

    const matchFor = rawDesc.match(/for\s+(?:student\s+)?([A-Za-z\s\.\-_]+?)(?:\s+via|\s+on|\s+was|\s+in|\.|$)/i);
    if (matchFor && matchFor[1]) {
      const val = matchFor[1].trim();
      const lower = val.toLowerCase();
      if (val && !['student', 'record', 'student record', 'class', 'tuition fee'].includes(lower) && !val.startsWith('₹') && !lower.startsWith('class ') && isNaN(Number(val))) {
        return val;
      }
    }

    const matchColon = rawDesc.match(/:\s*([A-Za-z\s\.\-_]+)$/i);
    if (matchColon && matchColon[1]) {
      const val = matchColon[1].trim();
      const lower = val.toLowerCase();
      if (val && !['student', 'record', 'student record'].includes(lower) && !val.startsWith('₹') && !lower.startsWith('class ') && isNaN(Number(val))) {
        return val;
      }
    }
  }

  if (fallbackTarget) {
    const cleanTarget = fallbackTarget.replace(/^Student:\s*/i, '').trim();
    const lower = cleanTarget.toLowerCase();
    if (cleanTarget && !['student', 'record', 'student record', 'undefined', 'null'].includes(lower) && !cleanTarget.startsWith('₹') && !lower.startsWith('class ') && isNaN(Number(cleanTarget))) {
      return cleanTarget;
    }
  }

  return null;
}

export function parseActivityDetails(log: any): ActivityDisplayDetails {
  const rawDesc = String(log.description || '').trim();
  const cleanedDesc = sanitizeLogDescription(rawDesc);
  const event = String(log.event || '').toLowerCase();
  const subjectType = String(log.subject_type || '').toLowerCase();
  const lowerDesc = cleanedDesc.toLowerCase();
  const lowerRaw = rawDesc.toLowerCase();

  // 1. Auth Events
  if (event === 'login' || lowerDesc === 'login success' || lowerRaw.includes('logged in') || lowerRaw === 'login') {
    return {
      title: 'User Login',
      description: 'User logged in to the system.',
      category: 'AUTHENTICATION',
      categoryBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
      target: null,
    };
  }
  if (event === 'logout' || lowerDesc === 'signed out' || lowerRaw.includes('logout') || lowerRaw.includes('signed out')) {
    return {
      title: 'User Signed Out',
      description: 'User logged out of the application session.',
      category: 'AUTHENTICATION',
      categoryBadgeClass: 'bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      target: null,
    };
  }

  // 2. Fees & Payments (Must precede Student to handle 'student fees' and 'payment for student')
  if (
    lowerDesc.includes('payment') ||
    lowerDesc.includes('fee') ||
    lowerDesc.includes('concession') ||
    subjectType.includes('payment') ||
    subjectType.includes('feecategory') ||
    subjectType.includes('feestructure') ||
    subjectType.includes('studentfee')
  ) {
    const studentName = extractStudentName(log.properties, rawDesc);
    const amountMatch = rawDesc.match(/₹([0-9,\.]+)/) || rawDesc.match(/of\s+₹?([0-9,\.]+)/i);
    const amountStr = amountMatch ? `₹${amountMatch[1]}` : (log.properties?.amount !== undefined ? `₹${Number(log.properties.amount).toLocaleString('en-IN')}` : '');

    let target: string | null = null;
    if (studentName) {
      target = `Student: ${studentName}`;
    } else if (amountStr) {
      target = `Fee Payment: ${amountStr}`;
    } else {
      target = 'Fee Record';
    }

    const isConcession = lowerDesc.includes('concession');
    const isCategory = lowerDesc.includes('fee category') || subjectType.includes('feecategory');
    const isStructure = lowerDesc.includes('fee structure') || subjectType.includes('feestructure');
    
    let title = 'Fee Payment Recorded';
    if (isConcession) title = 'Fee Concession Applied';
    else if (isCategory) title = event === 'created' ? 'Fee Category Created' : (event === 'deleted' ? 'Fee Category Deleted' : 'Fee Category Updated');
    else if (isStructure) title = event === 'created' ? 'Fee Structure Created' : (event === 'deleted' ? 'Fee Structure Deleted' : 'Fee Structure Updated');
    else if (lowerDesc.includes('student fee')) title = event === 'created' ? 'Student Fees Generated' : (event === 'deleted' ? 'Student Fee Deleted' : 'Student Fee Updated');

    return {
      title,
      description: cleanedDesc || 'Processed fee transaction and updated records.',
      category: 'FEES',
      categoryBadgeClass: 'bg-amber-50 text-amber-800 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
      target,
    };
  }

  // 3. Attendance (Must precede Student)
  if (lowerDesc.includes('attendance') || subjectType.includes('attendance')) {
    const classMatch = rawDesc.match(/for\s+([^in\s]+(?:\s+[^in\s]+)?)/i);
    const targetClass = classMatch ? classMatch[1] : 'Class Attendance';
    return {
      title: 'Student Attendance Marked',
      description: rawDesc || 'Marked and verified student roll call attendance record.',
      category: 'ATTENDANCE',
      categoryBadgeClass: 'bg-teal-50 text-teal-700 border-teal-200/60 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/40',
      target: targetClass,
    };
  }

  // 4. Daily Diary & Homework (Must precede Student)
  if (
    lowerDesc.includes('daily diary') ||
    lowerDesc.includes('dailydiar') ||
    lowerDesc.includes('daily diaries') ||
    lowerRaw.includes('dailydiaries') ||
    lowerRaw.includes('daily-diaries') ||
    subjectType.includes('dailydiary') ||
    subjectType.includes('diary')
  ) {
    const isCreate = event === 'created' || lowerDesc.includes('created') || lowerDesc.includes('posted') || lowerDesc.includes('added');
    const isDelete = event === 'deleted' || lowerDesc.includes('deleted');
    const classMatch = rawDesc.match(/for Class '([^']+)'/) || rawDesc.match(/for Class\s*([^,\s]+)/i) || rawDesc.match(/in Class\s*([^,\s]+)/i);
    const targetClass = classMatch ? `Class ${classMatch[1]}` : (log.properties?.batch_name ? `Class ${log.properties.batch_name}` : 'Daily Diary');

    return {
      title: isDelete ? 'Daily Diary Entry Deleted' : (isCreate ? 'Daily Diary Entry Created' : 'Daily Diary Entry Updated'),
      description: isDelete
        ? `Deleted daily diary lesson notes from the class log.`
        : (isCreate
          ? `Created new daily diary lesson notes and teaching log entry for ${targetClass}.`
          : `Updated class lesson notes and daily teaching log for ${targetClass}.`),
      category: 'ACADEMICS',
      categoryBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
      target: targetClass,
    };
  }

  // 5. Student Actions
  if (
    lowerDesc.includes('student profile created') ||
    (lowerDesc.includes('student') && (event === 'created' || lowerDesc.startsWith('added student'))) ||
    (subjectType.includes('student') && event === 'created')
  ) {
    const studentName = extractStudentName(log.properties, rawDesc);
    return {
      title: 'Student Profile Created',
      description: studentName ? `Added new student record and profile for ${studentName}.` : 'Added new student record and profile.',
      category: 'ADMISSIONS',
      categoryBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40',
      target: studentName ? `Student: ${studentName}` : 'Student Record',
    };
  }

  if (
    lowerDesc.includes('student profile updated') ||
    (lowerDesc.includes('student') && (event === 'updated' || lowerDesc.startsWith('updated student'))) ||
    (subjectType.includes('student') && event === 'updated')
  ) {
    const studentName = extractStudentName(log.properties, rawDesc);
    return {
      title: 'Student Profile Updated',
      description: studentName ? `Updated profile information, contact details, or academic records for student ${studentName}.` : 'Updated student profile information and contact details.',
      category: 'STUDENTS',
      categoryBadgeClass: 'bg-pink-50 text-pink-700 border-pink-200/60 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/40',
      target: studentName ? `Student: ${studentName}` : 'Student Record',
    };
  }

  if (
    lowerDesc.includes('student record deleted') ||
    lowerDesc.includes('deleted student') ||
    (lowerDesc.includes('student') && event === 'deleted') ||
    (subjectType.includes('student') && event === 'deleted')
  ) {
    const studentName = extractStudentName(log.properties, rawDesc);
    return {
      title: 'Student Record Deleted',
      description: studentName ? `Deleted student record for ${studentName} from the system.` : 'Deleted student record from the system.',
      category: 'STUDENTS',
      categoryBadgeClass: 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40',
      target: studentName ? `Student: ${studentName}` : 'Student Record',
    };
  }

  if (lowerDesc.includes('dropout')) {
    return {
      title: 'Student Dropout Processed',
      description: 'Processed and marked student dropout status.',
      category: 'STUDENTS',
      categoryBadgeClass: 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40',
      target: 'Student Dropout',
    };
  }

  // 6. Staff & Faculty
  if (lowerDesc.includes('staff account') || lowerDesc.includes('faculty') || (subjectType.includes('user') && !lowerDesc.includes('login'))) {
    const staffMatch = rawDesc.match(/'([^']+)'/) || rawDesc.match(/:\s*(.+)$/);
    const staffName = staffMatch ? staffMatch[1] : (log.properties?.name || log.properties?.attributes?.name || 'Staff Member');
    const isCreate = event === 'created' || lowerDesc.includes('created') || lowerDesc.includes('added');
    const isDelete = event === 'deleted' || lowerDesc.includes('deleted') || lowerDesc.includes('removed');
    
    return {
      title: isDelete ? 'Staff Account Removed' : (isCreate ? 'Staff Account Created' : 'Staff Profile Updated'),
      description: isDelete 
        ? `Removed staff member ${staffName} from portal access.`
        : (isCreate ? `Onboarded and created staff profile for ${staffName}.` : `Updated profile and credentials for staff ${staffName}.`),
      category: 'STAFF',
      categoryBadgeClass: 'bg-violet-50 text-violet-700 border-violet-200/60 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/40',
      target: `Staff: ${staffName}`,
    };
  }

  // 7. Timetable
  if (lowerDesc.includes('timetable') || subjectType.includes('timetable')) {
    const isCreate = event === 'created' || lowerDesc.includes('created') || lowerDesc.includes('entry');
    return {
      title: isCreate ? 'Timetable Entry Created' : 'Timetable Modified',
      description: isCreate ? 'Created schedule and period slot in class timetable.' : 'Updated class periods, timings, or assigned faculty in timetable.',
      category: 'ACADEMICS',
      categoryBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
      target: 'Class Timetable',
    };
  }

  // 8. Courses & Subjects
  if (lowerDesc.includes('subject') || subjectType.includes('subject')) {
    const subjMatch = rawDesc.match(/'([^']+)'/);
    const subjName = subjMatch ? subjMatch[1] : 'Subject';
    const isCreate = event === 'created' || lowerDesc.includes('created');
    return {
      title: isCreate ? 'Academic Subject Created' : 'Academic Subject Updated',
      description: isCreate ? `Created new subject syllabus item: ${subjName}.` : `Updated academic curriculum for ${subjName}.`,
      category: 'ACADEMICS',
      categoryBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
      target: `Subject: ${subjName}`,
    };
  }

  if (lowerDesc.includes('course') || subjectType.includes('course')) {
    const courseMatch = rawDesc.match(/'([^']+)'/);
    const courseName = courseMatch ? courseMatch[1] : 'Course';
    return {
      title: 'Academic Course Managed',
      description: `Managed course configuration for ${courseName}.`,
      category: 'ACADEMICS',
      categoryBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
      target: `Course: ${courseName}`,
    };
  }

  if (lowerDesc.includes('homework') || subjectType.includes('homework')) {
    return {
      title: 'Homework Assigned',
      description: rawDesc || 'Published homework assignment to students.',
      category: 'ACADEMICS',
      categoryBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
      target: 'Homework',
    };
  }

  if (
    lowerDesc.includes('daily diary') ||
    lowerDesc.includes('dailydiar') ||
    lowerDesc.includes('daily diaries') ||
    lowerRaw.includes('dailydiaries') ||
    lowerRaw.includes('daily-diaries') ||
    subjectType.includes('dailydiary') ||
    subjectType.includes('diary')
  ) {
    const isCreate = event === 'created' || lowerDesc.includes('created') || lowerDesc.includes('added') || lowerDesc.includes('posted') || lowerRaw.includes('created');
    const isDelete = event === 'deleted' || lowerDesc.includes('deleted') || lowerRaw.includes('deleted');
    const classMatch = rawDesc.match(/for Class '([^']+)'/) || rawDesc.match(/for Class\s*([^,\s]+)/i) || rawDesc.match(/in Class\s*([^,\s]+)/i);
    const targetClass = classMatch ? `Class ${classMatch[1]}` : (log.properties?.batch_name ? `Class ${log.properties.batch_name}` : 'Daily Diary');

    return {
      title: isDelete ? 'Daily Diary Entry Deleted' : (isCreate ? 'Daily Diary Entry Created' : 'Daily Diary Entry Updated'),
      description: isDelete
        ? `Deleted daily diary lesson notes from the class log.`
        : (isCreate
          ? `Created new daily diary lesson notes and teaching log entry for ${targetClass}.`
          : `Updated class lesson notes and daily teaching log for ${targetClass}.`),
      category: 'ACADEMICS',
      categoryBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
      target: targetClass,
    };
  }

  // 9. Leave Applications
  if (lowerDesc.includes('leave') || subjectType.includes('leave')) {
    const isApprove = lowerDesc.includes('approved');
    const isReject = lowerDesc.includes('rejected');
    return {
      title: isApprove ? 'Leave Request Approved' : (isReject ? 'Leave Request Rejected' : 'Leave Request Submitted'),
      description: cleanedDesc || 'Processed staff leave application.',
      category: 'LEAVE',
      categoryBadgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200/60 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/40',
      target: 'Leave Application',
    };
  }

  // 10. Library / Books
  if (lowerDesc.includes('book') || lowerDesc.includes('library')) {
    const bookMatch = rawDesc.match(/for '([^']+)'/) || rawDesc.match(/:\s*(.+)$/);
    const bookName = bookMatch ? bookMatch[1] : 'Book Record';
    return {
      title: 'Book Details Updated',
      description: cleanedDesc || 'Updated library catalog and book availability status.',
      category: 'LIBRARY',
      categoryBadgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40',
      target: `Book: ${bookName}`,
    };
  }

  // 11. Examinations & Marks
  if (lowerDesc.includes('exam') || lowerDesc.includes('mark') || subjectType.includes('exam')) {
    return {
      title: 'Examination Record Updated',
      description: cleanedDesc || 'Configured exam schedule or entered student evaluation marks.',
      category: 'EXAMINATIONS',
      categoryBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40',
      target: 'Exams & Marks',
    };
  }

  // 12. Webhook & System Tools
  if (lowerDesc.includes('webhook') || subjectType.includes('webhook')) {
    return {
      title: 'Webhook Configuration Updated',
      description: cleanedDesc || 'Updated webhook endpoints or dispatched event notification.',
      category: 'SYSTEM',
      categoryBadgeClass: 'bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      target: 'Webhook',
    };
  }

  if (lowerDesc.includes('biometric')) {
    return {
      title: 'Biometric Integration Synchronized',
      description: cleanedDesc || 'Synchronized biometric attendance machine logs.',
      category: 'SYSTEM',
      categoryBadgeClass: 'bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      target: 'Biometric Sync',
    };
  }

  // Default fallback
  const cleanTitle = cleanedDesc
    .replace(/^created\s+/i, 'Created ')
    .replace(/^updated\s+/i, 'Updated ')
    .replace(/^deleted\s+/i, 'Deleted ')
    .trim();
  const fallbackTitle = cleanTitle.length > 40 ? cleanTitle.substring(0, 37) + '...' : cleanTitle;
  return {
    title: fallbackTitle || 'User Action',
    description: cleanedDesc || 'Performed system operation.',
    category: event.toUpperCase() || 'ACTION',
    categoryBadgeClass: 'bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    target: null,
  };
}

export function formatDateTime(isoString: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';

    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  } catch {
    return '—';
  }
}

export function formatExactDateTime(isoString: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';

    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
  } catch {
    return '—';
  }
}

export function parsePlatformInfo(log: any): PlatformDisplayDetails {
  const ua = String(log.properties?.user_agent || '');
  const ipAddress = log.properties?.ip_address || '—';
  const isMobile = ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone') || ua.includes('iPad');

  let os = 'Windows';
  if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  let browser = 'Web Browser';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';

  const osBrowser = isMobile ? `${browser} (${os} Mobile)` : `${browser} (${os})`;
  const platform = isMobile ? 'Mobile App' : 'Web Portal';

  return {
    platform,
    osBrowser,
    isMobile,
    ipAddress,
  };
}

/**
 * Generate a concise, human-readable summary sentence describing the complete action (Requirement 16)
 */
export function generateActionSummary(log: any): string {
  const user = getUserDisplayDetails(log);
  const userName = user.name;
  const rawDesc = String(log.description || '').trim();
  const event = String(log.event || '').toLowerCase();
  const properties = log.properties || {};
  const attributes = properties.attributes || {};
  const old = properties.old || {};
  const lowerDesc = rawDesc.toLowerCase();

  // 1. Fee Payments
  if (lowerDesc.includes('payment') || lowerDesc.includes('fee payment')) {
    const amountMatch = rawDesc.match(/₹([0-9,\.]+)/) || rawDesc.match(/of\s+₹?([0-9,\.]+)/i);
    const amount = properties.amount !== undefined ? `₹${Number(properties.amount).toLocaleString('en-IN')}` : (amountMatch ? `₹${amountMatch[1]}` : '');
    const student = extractStudentName(properties, rawDesc);
    const methodMatch = rawDesc.match(/via\s+([A-Za-z]+)/i);
    const method = properties.payment_method || properties.payment_mode || attributes.payment_method || (methodMatch ? methodMatch[1] : 'Cash');
    const category = properties.fee_category || properties.category || attributes.fee_category || '';

    if (amount && student) {
      return `${userName} recorded a ${amount} ${category ? `${category} ` : ''}payment for ${student} via ${method}.`;
    } else if (amount) {
      return `${userName} recorded a ${amount} payment via ${method}.`;
    }
    return `${userName} recorded a fee payment.`;
  }

  // 2. Student Fees (Generation / Modification) & Fee Structure / Categories
  if (
    lowerDesc.includes('student fee') ||
    lowerDesc.includes('fee structure') ||
    lowerDesc.includes('fee category') ||
    (log.subject_type || '').toLowerCase().includes('feecategory') ||
    (log.subject_type || '').toLowerCase().includes('feestructure')
  ) {
    const batchMatch = rawDesc.match(/for\s+(.+)$/i);
    const targetClass = properties.batch_name || (batchMatch ? batchMatch[1].trim() : '');
    if (event === 'created' || lowerDesc.includes('created') || lowerDesc.includes('generated')) {
      return `${userName} generated fee schedule${targetClass ? ` for ${targetClass}` : ''}.`;
    }
    if (event === 'deleted' || lowerDesc.includes('deleted')) {
      return `${userName} removed fee record${targetClass ? ` for ${targetClass}` : ''}.`;
    }
    return `${userName} updated student fee record${targetClass ? ` for ${targetClass}` : ''}.`;
  }

  // 3. Concessions
  if (lowerDesc.includes('concession')) {
    const student = extractStudentName(properties, rawDesc) || 'the student';
    const concessionVal = properties.percentage ? `${properties.percentage}%` : (properties.concession ? `${properties.concession}` : 'a');
    const amount = properties.concession_amount ? ` (₹${Number(properties.concession_amount).toLocaleString('en-IN')})` : '';
    const feeCategory = properties.fee_category || attributes.fee_category || 'tuition fee';
    return `${userName} applied a ${concessionVal} concession${amount} to ${student}'s ${feeCategory}.`;
  }

  // 4. Student Actions
  if (lowerDesc.includes('student') || (log.subject_type || '').toLowerCase().includes('student')) {
    const studentName = extractStudentName(properties, rawDesc);

    if (event === 'created' || lowerDesc.includes('created') || lowerDesc.includes('added')) {
      return studentName ? `${userName} created student profile for ${studentName}.` : `${userName} added a new student record.`;
    }
    if (event === 'updated' || lowerDesc.includes('updated')) {
      return studentName ? `${userName} updated student profile for ${studentName}.` : `${userName} updated student profile information.`;
    }
    if (event === 'deleted' || lowerDesc.includes('deleted') || lowerDesc.includes('removed')) {
      return studentName ? `${userName} deleted student record for ${studentName}.` : `${userName} deleted student record from the system.`;
    }
  }

  // 4. Attendance
  if (lowerDesc.includes('attendance')) {
    if (properties.old_status && properties.new_status && properties.student_name) {
      return `${userName} changed ${properties.student_name}'s attendance from ${properties.old_status} to ${properties.new_status}.`;
    }
    const classSection = properties.class_name || properties.batch_name || attributes.class_name || 'the class';
    const session = properties.session === 'first_period' ? 'morning' : (properties.session || 'morning');
    const present = properties.present_count !== undefined ? properties.present_count : null;
    const absent = properties.absent_count !== undefined ? properties.absent_count : null;
    const counts = present !== null && absent !== null ? ` (${present} Present, ${absent} Absent)` : '';
    return `${userName} marked ${session} attendance for ${classSection}${counts}.`;
  }

  // 5. Exams & Marks
  if (lowerDesc.includes('mark') || lowerDesc.includes('exam')) {
    const student = properties.student_name || attributes.student_name || properties.name || attributes.name || 'student';
    const subject = properties.subject_name || properties.subject || attributes.subject_name || 'subject';
    const exam = properties.exam_name || properties.exam || attributes.exam_name || 'examination';
    const oldMarks = old.marks ?? properties.previous_marks;
    const newMarks = attributes.marks ?? properties.marks ?? properties.new_marks;
    if (oldMarks !== undefined && newMarks !== undefined) {
      return `${userName} updated ${student}'s ${subject} marks from ${oldMarks} to ${newMarks} in ${exam}.`;
    }
    return `${userName} updated examination evaluation records for ${student}.`;
  }

  // 6. Leave
  if (lowerDesc.includes('leave')) {
    const applicant = properties.applicant_name || properties.staff_name || properties.user_name || attributes.name || 'staff member';
    const leaveType = properties.leave_type || attributes.leave_type || 'Leave';
    if (lowerDesc.includes('approved')) {
      return `${userName} approved ${leaveType} for ${applicant}.`;
    }
    if (lowerDesc.includes('rejected')) {
      return `${userName} rejected ${leaveType} request for ${applicant}.`;
    }
    return `${userName} submitted a ${leaveType} request for ${applicant}.`;
  }

  // 7. Student Promotion / Transfer / Batch Changes
  if (lowerDesc.includes('transfer') || lowerDesc.includes('promot') || properties.type === 'batch_change') {
    const student = properties.student_name || attributes.student_name || properties.name || attributes.name || 'Student';
    const oldBatch = properties.old_batch_name || old.batch_name || 'previous class';
    const newBatch = properties.new_batch_name || attributes.batch_name || 'new class';
    return `${userName} transferred ${student} from ${oldBatch} to ${newBatch}.`;
  }

  // 8. Daily Diary
  if (
    lowerDesc.includes('daily diary') ||
    lowerDesc.includes('dailydiar') ||
    lowerDesc.includes('daily diaries') ||
    rawDesc.toLowerCase().includes('dailydiaries') ||
    rawDesc.toLowerCase().includes('daily-diaries') ||
    (log.subject_type || '').toLowerCase().includes('dailydiary') ||
    (log.subject_type || '').toLowerCase().includes('diary')
  ) {
    const classMatch = rawDesc.match(/for Class '([^']+)'/) || rawDesc.match(/for Class\s*([^,\s]+)/i) || rawDesc.match(/in Class\s*([^,\s]+)/i);
    const targetClass = classMatch ? `Class ${classMatch[1]}` : (properties.batch_name ? `Class ${properties.batch_name}` : 'the class');
    if (event === 'deleted' || lowerDesc.includes('deleted')) {
      return `${userName} deleted a Daily Diary entry for ${targetClass}.`;
    }
    if (event === 'created' || lowerDesc.includes('created') || lowerDesc.includes('posted') || lowerDesc.includes('added')) {
      return `${userName} posted a new Daily Diary entry for ${targetClass}.`;
    }
    return `${userName} updated the Daily Diary notes for ${targetClass}.`;
  }

  // 9. General Updates with attributes/old
  if (event === 'updated' && old && attributes) {
    const subject = properties.name || properties.title || attributes.name || log.subject_type || 'record';
    const changedKeys = Object.keys(attributes).filter(k => !SYSTEM_METADATA_KEYS.has(k) && !isSensitiveKey(k) && old[k] !== attributes[k]);
    if (changedKeys.length === 1) {
      const key = changedKeys[0];
      const oldVal = formatAuditValue(old[key], key);
      const newVal = formatAuditValue(attributes[key], key);
      return `${userName} updated ${subject}'s ${formatFieldLabel(key).toLowerCase()} from ${oldVal} to ${newVal}.`;
    }
    if (changedKeys.length > 1) {
      const fieldNames = changedKeys.slice(0, 3).map(k => formatFieldLabel(k).toLowerCase()).join(', ');
      return `${userName} updated ${subject}'s details (${fieldNames}${changedKeys.length > 3 ? ` and ${changedKeys.length - 3} other fields` : ''}).`;
    }
  }

  // 10. Creations
  if (event === 'created' || lowerDesc.startsWith('added') || lowerDesc.startsWith('created')) {
    const subject = properties.name || attributes.name || properties.title || '';
    const entityType = (log.subject_type || '').toLowerCase().includes('user') ? 'staff account' : 'record';
    return subject ? `${userName} created ${entityType} for ${subject}.` : `${userName} created a new ${entityType}.`;
  }

  // 11. Deletions
  if (event === 'deleted' || lowerDesc.startsWith('deleted') || lowerDesc.startsWith('removed')) {
    const subject = properties.name || old.name || properties.title || '';
    return subject ? `${userName} deleted ${subject} from the system.` : `${userName} deleted a record from the system.`;
  }

  // Fallback
  const cleanedDesc = sanitizeLogDescription(rawDesc);
  return `${userName} performed: ${cleanedDesc || 'action'}.`;
}
