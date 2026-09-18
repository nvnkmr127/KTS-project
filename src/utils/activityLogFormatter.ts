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

export function formatDateOnly(dateStr: any): string {
  if (!dateStr || dateStr === 'Not set' || dateStr === '—' || dateStr === 'null' || dateStr === 'undefined') return '';
  const str = String(dateStr).trim();
  if (!str) return '';

  // Match YYYY-MM-DD (optionally followed by T or space and time)
  const matchIso = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (matchIso) {
    const [, yyyy, mm, dd] = matchIso;
    return `${dd}-${mm}-${yyyy}`;
  }

  // Match DD-MM-YYYY or DD/MM/YYYY
  const matchDdMmYyyy = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})(?:[T\s].*)?$/);
  if (matchDdMmYyyy) {
    const [, dd, mm, yyyy] = matchDdMmYyyy;
    return `${dd}-${mm}-${yyyy}`;
  }

  // Fallback to Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = parsed.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  return str;
}

export function formatExamTimingsWithEnd(timeStr?: any, durationStr?: any, fallbackTimings?: any): string {
  const rawTime = String(timeStr || '').trim();
  const rawDuration = String(durationStr || '').trim();
  const rawFallback = String(fallbackTimings || '').trim();

  let timeInput = rawTime;
  let durationInput = rawDuration;

  if (!timeInput && rawFallback && rawFallback !== '—' && rawFallback !== 'Not set') {
    // If rawFallback already matches "10:00 AM - 12:00 PM (2 hrs)"
    if (rawFallback.includes('-') && rawFallback.includes('(') && rawFallback.includes(')')) {
      return rawFallback;
    }
    // Check if fallback has format "10:00 AM (2 hrs)"
    const parenMatch = rawFallback.match(/^([^(]+)\s*\(([^)]+)\)$/);
    if (parenMatch) {
      timeInput = parenMatch[1].trim();
      if (!durationInput) durationInput = parenMatch[2].trim();
    } else {
      timeInput = rawFallback;
    }
  }

  if (!timeInput && !durationInput) return '—';

  // If timeInput already contains a full range like "10:00 AM - 12:00 PM"
  if (timeInput.includes('-')) {
    if (durationInput && !timeInput.includes('(')) {
      return `${timeInput} (${durationInput})`;
    }
    return timeInput;
  }

  // Parse duration in minutes
  let durationMinutes = 0;
  if (durationInput) {
    const hoursMatch = durationInput.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)/i);
    const minsMatch = durationInput.match(/(\d+)\s*(?:m|min|mins|minute|minutes)/i);

    if (hoursMatch) {
      durationMinutes += parseFloat(hoursMatch[1]) * 60;
    }
    if (minsMatch) {
      durationMinutes += parseInt(minsMatch[1], 10);
    }
    if (!hoursMatch && !minsMatch) {
      const num = parseFloat(durationInput);
      if (!isNaN(num)) {
        durationMinutes = num <= 12 ? num * 60 : num;
      }
    }
  }

  // Parse start time (e.g. "10:00 AM", "09:30 AM", "14:00", "9:30", "10:00am")
  const timeMatch = timeInput.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!timeMatch) {
    if (timeInput && durationInput) {
      return `${timeInput} (${durationInput})`;
    }
    return timeInput || (durationInput ? `(${durationInput})` : '—');
  }

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const ampm = timeMatch[3]?.toUpperCase();

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  const startTotalMinutes = hours * 60 + minutes;

  // Format Start Time
  const startH24 = Math.floor(startTotalMinutes / 60) % 24;
  const startM = startTotalMinutes % 60;
  const startAmpm = startH24 >= 12 ? 'PM' : 'AM';
  const startH12 = startH24 % 12 || 12;
  const formattedStart = `${String(startH12).padStart(2, '0')}:${String(startM).padStart(2, '0')} ${startAmpm}`;

  if (durationMinutes <= 0) {
    return durationInput ? `${formattedStart} (${durationInput})` : formattedStart;
  }

  // Calculate End Time
  const endTotalMinutes = (startTotalMinutes + durationMinutes) % 1440;
  const endH24 = Math.floor(endTotalMinutes / 60) % 24;
  const endM = endTotalMinutes % 60;
  const endAmpm = endH24 >= 12 ? 'PM' : 'AM';
  const endH12 = endH24 % 12 || 12;
  const formattedEnd = `${String(endH12).padStart(2, '0')}:${String(endM).padStart(2, '0')} ${endAmpm}`;

  const formattedDuration = durationInput || `${Math.floor(durationMinutes / 60)} hrs`;

  return `${formattedStart} - ${formattedEnd} (${formattedDuration})`;
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

    const keyLower = (fieldKey || '').toLowerCase();

    // Date formatting (DOB, Admission Date, Start Date, End Date, etc.)
    if (
      keyLower === 'dob' ||
      keyLower.includes('date_of_birth') ||
      keyLower.includes('birth') ||
      keyLower.includes('admission_date') ||
      keyLower.includes('start_date') ||
      keyLower.includes('end_date') ||
      keyLower.includes('dropout_date')
    ) {
      const formattedDate = formatDateOnly(trimmed);
      if (formattedDate) return formattedDate;
    }

    // Number with currency context
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
  let name = (log.causer_name || log.causer?.name || '').trim();
  
  // If causer is System or empty, check metadata
  if (!name || name.toLowerCase() === 'system') {
    const props = log?.properties || {};
    if (props.marked_by && props.marked_by.toLowerCase() !== 'system') {
      name = props.marked_by;
    } else if (props.actor_name && props.actor_name.toLowerCase() !== 'system') {
      name = props.actor_name;
    } else if (log?.description) {
      const desc = String(log.description);
      const m = desc.match(/^(Super Admin|Admin|[A-Za-z\s]+?)\s+(?:marked|registered|added|updated|created|deleted)/i);
      if (m) {
        name = m[1].trim();
      }
    }
  }

  if (!name || name.toLowerCase() === 'system') {
    name = 'Super Admin';
  }
  
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
  if (!role || role.toLowerCase() === 'system') {
    const lower = name.toLowerCase();
    if (lower.includes('super admin') || lower.includes('superadmin')) role = 'super-admin';
    else if (lower.includes('admin')) role = 'admin';
    else if (lower.includes('principal')) role = 'Principal';
    else if (lower.includes('teacher') || lower.includes('faculty')) role = 'Teacher';
    else if (lower.includes('accountant')) role = 'Accountant';
    else if (lower.includes('librarian')) role = 'Librarian';
    else if (lower.includes('support')) role = 'IT Support';
    else role = 'super-admin';
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

const KNOWN_BATCH_MAP: Record<string | number, string> = {
  1: '8A',
  2: '9B',
  3: '10A',
  4: '8C',
  5: '1A',
};

/**
 * Formats any class/batch string cleanly into standard "Class 8 - A" format
 */
export function formatClassSectionDisplay(rawStr: any): string {
  if (!rawStr) return '—';
  const str = String(rawStr).trim();
  if (!str || str === '—' || str === 'null' || str === 'undefined' || str.toLowerCase() === 'not set') return '—';

  // If already like "Class 8 - A" or "Class 8 - Section A"
  if (/^class\s+/i.test(str)) {
    const m = str.match(/^class\s+([A-Za-z0-9-]+)\s*[-/ ]?\s*(?:SECTION|SEC)?\s*([A-Za-z])$/i);
    if (m) {
      return `Class ${m[1]} - ${m[2].toUpperCase()}`;
    }
    return str;
  }

  // Match "8A", "9B", "10A", "10-A", "8-C", "LKGA", "PP1-A", "NURSERYA", "1A"
  const match = str.match(/^([A-Za-z0-9-]+)\s*[-/ ]?\s*(?:SECTION|SEC)?\s*([A-Za-z])$/i);
  if (match) {
    const cls = match[1];
    const sec = match[2].toUpperCase();
    return `Class ${cls} - ${sec}`;
  }

  // If bare class e.g. "8", "10", "LKG", "UKG"
  if (/^[A-Za-z0-9-]+$/.test(str)) {
    return `Class ${str}`;
  }

  return str;
}

/**
 * Finds student from localStorage cached student list by ID, Name, or Admission number
 */
export function findCachedStudent(properties: any, rawDesc?: string, fallbackTarget?: string | null): any | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('kts_students') : null;
    if (!raw) return null;
    const students: any[] = JSON.parse(raw);
    if (!Array.isArray(students) || students.length === 0) return null;

    const studentId = properties?.student_id || properties?.attributes?.student_id || properties?.attributes?.id;
    if (studentId) {
      const match = students.find(s => String(s.id) === String(studentId));
      if (match) return match;
    }

    const name = extractStudentName(properties, rawDesc, fallbackTarget);
    if (name) {
      const lowerName = name.toLowerCase().trim();
      const matchExact = students.find(s => (s.name || '').toLowerCase().trim() === lowerName);
      if (matchExact) return matchExact;

      const matchPartial = students.find(s => {
        const sName = (s.name || '').toLowerCase().trim();
        return sName.includes(lowerName) || lowerName.includes(sName);
      });
      if (matchPartial) return matchPartial;
    }

    const adm = properties?.admission_number || properties?.admission_no || properties?.enrollment_number;
    if (adm) {
      const matchAdm = students.find(s => (s.roll || s.enrollment_number || '').trim() === String(adm).trim());
      if (matchAdm) return matchAdm;
    }
  } catch (e) {
    // Ignore JSON errors
  }
  return null;
}

/**
 * Robust extractor for Student/Log Class & Section
 */
export function extractClassSection(log: any, cachedStudent?: any): string {
  if (!cachedStudent && log) {
    cachedStudent = findCachedStudent(log.properties, log.description);
  }
  if (!log && !cachedStudent) return '—';
  const properties = log?.properties || {};
  const attributes = properties.attributes || {};
  const old = properties.old || {};

  // 1. Direct class_name / batch_name string
  const directName =
    properties.class_name ||
    properties.batch_name ||
    attributes.class_name ||
    attributes.batch_name ||
    old.class_name ||
    old.batch_name ||
    properties.batch?.name ||
    attributes.batch?.name;

  if (directName && typeof directName === 'string' && directName.trim() !== '') {
    return formatClassSectionDisplay(directName);
  }

  // 2. Separate class & section properties
  const cls = properties.class || attributes.class || old.class || cachedStudent?.class;
  const sec = properties.section || attributes.section || old.section || cachedStudent?.section;
  if (cls) {
    return formatClassSectionDisplay(sec ? `${cls}${sec}` : String(cls));
  }

  // 3. Extract from description (e.g., "Rahul Kumar in Class 8-A" or "for Class 10A")
  const desc = String(log?.description || '');
  const matchClass =
    desc.match(/(?:in|to|for|class)\s+Class\s+([A-Za-z0-9-]+(?:\s*[- ]\s*[A-Za-z])?)/i) ||
    desc.match(/(?:in|to|for)\s+([0-9]+[A-Za-z])/i);
  if (matchClass && matchClass[1]) {
    return formatClassSectionDisplay(matchClass[1]);
  }

  // 4. Batch ID lookup
  const batchId = properties.batch_id || attributes.batch_id || old.batch_id || cachedStudent?.batch_id;
  if (batchId !== undefined && batchId !== null && batchId !== '') {
    if (KNOWN_BATCH_MAP[batchId]) {
      return formatClassSectionDisplay(KNOWN_BATCH_MAP[batchId]);
    }
  }

  if (cachedStudent) {
    if (cachedStudent.class && cachedStudent.section) {
      return formatClassSectionDisplay(`${cachedStudent.class}${cachedStudent.section}`);
    }
    if (cachedStudent.class) {
      return formatClassSectionDisplay(cachedStudent.class);
    }
  }

  return '—';
}

/**
 * Robust extractor for Student Admission Number / Enrollment Number
 */
export function extractAdmissionNo(log: any, cachedStudent?: any): string {
  if (!cachedStudent && log) {
    cachedStudent = findCachedStudent(log.properties, log.description);
  }
  if (!log && !cachedStudent) return '—';
  const properties = log?.properties || {};
  const attributes = properties.attributes || {};
  const old = properties.old || {};

  const val =
    properties.admission_number ||
    properties.admission_no ||
    properties.enrollment_number ||
    properties.roll_no ||
    properties.roll ||
    attributes.admission_number ||
    attributes.admission_no ||
    attributes.enrollment_number ||
    attributes.roll_no ||
    old.admission_number ||
    old.admission_no ||
    old.enrollment_number ||
    cachedStudent?.roll ||
    cachedStudent?.enrollment_number;

  return val && val !== 'null' && val !== 'undefined' ? String(val) : '—';
}

/**
 * Robust extractor for Student PEN Number
 */
export function extractPenNumber(log: any, cachedStudent?: any): string {
  if (!cachedStudent && log) {
    cachedStudent = findCachedStudent(log.properties, log.description);
  }
  if (!log && !cachedStudent) return '—';
  const properties = log?.properties || {};
  const attributes = properties.attributes || {};
  const old = properties.old || {};

  const val =
    properties.pen ||
    properties.pen_number ||
    properties.student_pen_no ||
    properties.permanent_education_number ||
    attributes.pen ||
    attributes.student_pen_no ||
    attributes.pen_number ||
    attributes.permanent_education_number ||
    old.pen ||
    old.student_pen_no ||
    old.pen_number ||
    cachedStudent?.student_pen_no ||
    cachedStudent?.pen;

  return val && val !== 'null' && val !== 'undefined' ? String(val) : '—';
}

export function parseActivityDetails(log: any): ActivityDisplayDetails {
  const rawDesc = String(log.description || '').trim();
  const cleanedDesc = sanitizeLogDescription(rawDesc);
  const event = String(log.event || '').toLowerCase();
  const subjectType = String(log.subject_type || '').toLowerCase();
  const lowerDesc = cleanedDesc.toLowerCase();
  const lowerRaw = rawDesc.toLowerCase();
  const properties = log?.properties || {};
  const attributes = properties.attributes || {};

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
  if (lowerDesc.includes('attendance') || subjectType.includes('attendance') || log.log_name === 'attendance') {
    const classMatch = rawDesc.match(/for\s+Class\s+([A-Za-z0-9-]+(?:\s*[- ]\s*[A-Za-z])?)/i) ||
                       rawDesc.match(/for\s+([A-Za-z0-9-]+(?:\s*[- ]\s*[A-Za-z])?)/i);
    const targetClass = log.properties?.class_name ? `Class ${log.properties.class_name}` : (classMatch ? (classMatch[1].toLowerCase().startsWith('class') ? classMatch[1] : `Class ${classMatch[1]}`) : 'Class Attendance');
    const isUpdate = event === 'updated' || lowerDesc.includes('updated') || lowerDesc.includes('edit');
    const isDelete = event === 'deleted' || lowerDesc.includes('deleted');
    return {
      title: isDelete ? 'Attendance Record Deleted' : (isUpdate ? 'Student Attendance Updated' : 'Student Attendance Marked'),
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

  // 5. Examinations & Marks (Must precede Student to avoid matching 'student evaluation marks')
  if (
    lowerDesc.includes('exam') ||
    lowerDesc.includes('mark') ||
    lowerDesc.includes('evaluation') ||
    subjectType.includes('exam') ||
    subjectType.includes('examination') ||
    log.log_name === 'exam' ||
    log.log_name === 'marks' ||
    properties.type === 'exam_schedule' ||
    properties.type === 'exam_marks' ||
    Array.isArray(properties.schedule_list) ||
    Boolean(properties.exam_id)
  ) {
    const rawClass = properties.class_name || properties.class || properties.batch_name || '';
    const classMatch = rawDesc.match(/for Class\s+([A-Za-z0-9-]+(?:\s*[- ]\s*[A-Za-z])?)/i) || rawDesc.match(/in Class\s+([A-Za-z0-9-]+(?:\s*[- ]\s*[A-Za-z])?)/i);
    const targetClass = rawClass ? (rawClass.toLowerCase().startsWith('class') ? rawClass : `Class ${rawClass}`) : (classMatch ? `Class ${classMatch[1]}` : '');
    const examMatch = rawDesc.match(/in\s+([A-Za-z0-9\s-]+?)(?:\.|$)/i);
    const examName = properties.exam_name || properties.exam || attributes.exam_name || (examMatch ? examMatch[1].trim() : '');

    const isSchedule =
      properties.type === 'exam_schedule' ||
      Array.isArray(properties.schedule_list) ||
      lowerDesc.includes('exam schedule') ||
      lowerDesc.includes('examination schedule') ||
      lowerDesc.includes('schedule design') ||
      lowerDesc.includes('designed exam schedule') ||
      lowerDesc.includes('timetable schedule') ||
      lowerDesc.includes('published examination timetable') ||
      (lowerDesc.includes('schedule') && (lowerDesc.includes('exam') || subjectType.includes('exam') || log.log_name === 'exam'));
    const isInvigilation = lowerDesc.includes('invigilat') || properties.invigilator_name;
    const isMarks =
      log.log_name === 'marks' ||
      properties.type === 'exam_marks' ||
      lowerDesc.includes('evaluation marks') ||
      lowerDesc.includes('saved student evaluation marks') ||
      lowerDesc.includes('student evaluation marks') ||
      lowerDesc.includes('marks entered') ||
      lowerDesc.includes('marks recorded') ||
      lowerDesc.includes('marks allotted') ||
      lowerDesc.includes('mark') ||
      Boolean(properties.students_marks || properties.marks_list || properties.marks !== undefined || properties.obtained_marks !== undefined);

    if (isSchedule) {
      return {
        title: 'Exam Schedule Design',
        description: cleanedDesc || (examName ? `Designed and published timetable schedule for exam "${examName}".` : 'Designed and published examination schedule.'),
        category: 'EXAMINATION',
        categoryBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40',
        target: targetClass && examName ? `${targetClass} • ${examName}` : (examName ? `Exam: ${examName}` : (targetClass || 'EXAMINATION SCHEDULE')),
      };
    }

    if (isInvigilation) {
      return {
        title: 'Exam Invigilation Allotted',
        description: cleanedDesc || 'Assigned faculty invigilator to exam hall.',
        category: 'EXAMINATION',
        categoryBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40',
        target: examName ? `Exam: ${examName}` : 'EXAMINATION SCHEDULE',
      };
    }

    if (isMarks) {
      let target = 'EXAMINATION';
      if (targetClass && examName) {
        target = `${targetClass} • ${examName}`;
      } else if (targetClass) {
        target = targetClass;
      } else if (examName) {
        target = `Exam: ${examName}`;
      }

      return {
        title: 'Marks Entered',
        description: cleanedDesc || (examName && targetClass ? `Entered student evaluation marks for ${targetClass} in ${examName}.` : (examName ? `Recorded evaluation marks for ${examName}.` : 'Entered student evaluation marks.')),
        category: 'EXAMINATION',
        categoryBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40',
        target,
      };
    }

    if (log.event === 'created' || lowerDesc.includes('created') || lowerDesc.includes('new exam')) {
      return {
        title: examName ? `Exam Created: ${examName}` : 'New Examination Created',
        description: cleanedDesc || (examName ? `Created new examination "${examName}".` : 'Created new examination record.'),
        category: 'EXAMINATION',
        categoryBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40',
        target: examName ? `Exam: ${examName}` : 'EXAMINATION',
      };
    }

    if (log.event === 'deleted' || lowerDesc.includes('deleted')) {
      return {
        title: examName ? `Exam Deleted: ${examName}` : 'Examination Deleted',
        description: cleanedDesc || (examName ? `Deleted examination "${examName}".` : 'Deleted examination record.'),
        category: 'EXAMINATION',
        categoryBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40',
        target: examName ? `Exam: ${examName}` : 'EXAMINATION',
      };
    }

    return {
      title: examName ? `Exam Updated: ${examName}` : 'Examination Updated',
      description: cleanedDesc || (examName ? `Updated examination record "${examName}".` : 'Updated examination record.'),
      category: 'EXAMINATION',
      categoryBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40',
      target: examName ? `Exam: ${examName}` : 'EXAMINATION',
    };
  }

  // 6. Student Actions
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

  // 7. Staff & Faculty
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

  // 8. Timetable
  if (
    (lowerDesc.includes('timetable') || subjectType.includes('timetable')) &&
    !lowerDesc.includes('exam') &&
    !subjectType.includes('exam') &&
    log.log_name !== 'exam' &&
    properties.type !== 'exam_schedule' &&
    !Array.isArray(properties.schedule_list)
  ) {
    const isCreate = event === 'created' || lowerDesc.includes('created') || lowerDesc.includes('entry');
    return {
      title: isCreate ? 'Timetable Entry Created' : 'Timetable Modified',
      description: isCreate ? 'Created schedule and period slot in class timetable.' : 'Updated class periods, timings, or assigned faculty in timetable.',
      category: 'ACADEMICS',
      categoryBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
      target: 'Class Timetable',
    };
  }

  // 9. Courses & Subjects
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

  // 10. Leave Applications
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

  // 11. Library / Books
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
  const subjectType = String(log.subject_type || '').toLowerCase();

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

  // 4. Attendance (Must precede Student Actions)
  if (lowerDesc.includes('attendance') || (log.subject_type || '').toLowerCase().includes('attendance') || log.log_name === 'attendance') {
    if (properties.old_status && properties.new_status && properties.student_name) {
      return `${userName} changed ${properties.student_name}'s attendance from ${properties.old_status} to ${properties.new_status}.`;
    }
    const classSection = properties.class_name || properties.batch_name || attributes.class_name || 'the class';
    const formattedClass = classSection.toLowerCase().startsWith('class ') ? classSection : `Class ${classSection}`;
    const session = properties.session === 'first_period' ? 'morning' : (properties.session === 'lunch_period' ? 'afternoon' : (properties.session || 'morning'));
    const present = properties.present_count !== undefined ? properties.present_count : null;
    const absent = properties.absent_count !== undefined ? properties.absent_count : null;
    const counts = present !== null && absent !== null ? ` (${present} Present, ${absent} Absent)` : '';
    if (event === 'deleted' || lowerDesc.includes('deleted')) {
      return `${userName} deleted attendance records for ${formattedClass}.`;
    }
    return `${userName} ${event === 'updated' || lowerDesc.includes('updated') ? 'updated' : 'marked'} ${session} attendance for ${formattedClass}${counts}.`;
  }

  // 5. Exams & Marks (Must precede Student Actions)
  if (
    lowerDesc.includes('mark') ||
    lowerDesc.includes('exam') ||
    lowerDesc.includes('evaluation') ||
    subjectType.includes('exam') ||
    subjectType.includes('examination') ||
    log.log_name === 'exam' ||
    log.log_name === 'marks' ||
    properties.type === 'exam_schedule' ||
    properties.type === 'exam_marks' ||
    Array.isArray(properties.schedule_list) ||
    Boolean(properties.exam_id)
  ) {
    const isSchedule =
      properties.type === 'exam_schedule' ||
      Array.isArray(properties.schedule_list) ||
      lowerDesc.includes('exam schedule') ||
      lowerDesc.includes('examination schedule') ||
      lowerDesc.includes('schedule design') ||
      lowerDesc.includes('designed exam schedule') ||
      lowerDesc.includes('timetable schedule') ||
      lowerDesc.includes('published examination timetable') ||
      (lowerDesc.includes('schedule') && (lowerDesc.includes('exam') || subjectType.includes('exam') || log.log_name === 'exam'));
    const isInvigilation = lowerDesc.includes('invigilat') || properties.invigilator_name;
    const exam = properties.exam_name || properties.exam || attributes.exam_name || '';

    if (isSchedule) {
      return `${userName} designed and published timetable schedule for examination${exam ? ` "${exam}"` : ''}.`;
    }

    if (isInvigilation) {
      const invigilator = properties.invigilator_name || properties.staff_name || 'faculty';
      return `${userName} assigned invigilator ${invigilator} to ${exam ? `"${exam}"` : 'examination'}.`;
    }

    const isMarks =
      log.log_name === 'marks' ||
      properties.type === 'exam_marks' ||
      lowerDesc.includes('evaluation marks') ||
      lowerDesc.includes('saved student evaluation marks') ||
      lowerDesc.includes('student evaluation marks') ||
      lowerDesc.includes('marks entered') ||
      lowerDesc.includes('marks recorded') ||
      lowerDesc.includes('marks allotted') ||
      lowerDesc.includes('mark') ||
      Boolean(properties.students_marks || properties.marks_list || properties.marks !== undefined || properties.obtained_marks !== undefined);

    if (isMarks) {
      const targetClass = properties.class_name || properties.class || (rawDesc.match(/for Class\s+([A-Za-z0-9-]+(?:\s*[- ]\s*[A-Za-z])?)/i)?.[1]);
      const formattedClass = targetClass ? (targetClass.toLowerCase().startsWith('class') ? targetClass : `Class ${targetClass}`) : '';
      if (formattedClass && exam) {
        return `${userName} entered student marks for ${formattedClass} in ${exam}.`;
      }
      if (exam) {
        return `${userName} entered student evaluation marks for "${exam}".`;
      }
      if (formattedClass) {
        return `${userName} entered student evaluation marks for ${formattedClass}.`;
      }
      return `${userName} entered student evaluation marks.`;
    }

    const student = properties.student_name || attributes.student_name || properties.name || attributes.name;
    const subject = properties.subject_name || properties.subject || attributes.subject_name || 'subject';
    const oldMarks = old.marks ?? properties.previous_marks;
    const newMarks = attributes.marks ?? properties.marks ?? properties.new_marks;

    if (student && (oldMarks !== undefined || newMarks !== undefined)) {
      if (oldMarks !== undefined && newMarks !== undefined) {
        return `${userName} updated ${student}'s ${subject} marks from ${oldMarks} to ${newMarks} in ${exam || 'examination'}.`;
      }
      return `${userName} updated examination evaluation records for ${student}.`;
    }

    if (event === 'created' || lowerDesc.includes('created') || lowerDesc.includes('new exam')) {
      return `${userName} created new examination${exam ? ` "${exam}"` : ''}.`;
    }

    if (event === 'deleted' || lowerDesc.includes('deleted')) {
      return `${userName} deleted examination${exam ? ` "${exam}"` : ''}.`;
    }

    return `${userName} updated examination records${exam ? ` for "${exam}"` : ''}.`;
  }

  // 6. Student Actions
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

  // 7. Leave
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

  // 8. Student Promotion / Transfer / Batch Changes
  if (lowerDesc.includes('transfer') || lowerDesc.includes('promot') || properties.type === 'batch_change') {
    const student = properties.student_name || attributes.student_name || properties.name || attributes.name || 'Student';
    const oldBatch = properties.old_batch_name || old.batch_name || 'previous class';
    const newBatch = properties.new_batch_name || attributes.batch_name || 'new class';
    return `${userName} transferred ${student} from ${oldBatch} to ${newBatch}.`;
  }

  // 9. Daily Diary
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

  // 10. General Updates with attributes/old
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

  // 11. Creations
  if (event === 'created' || lowerDesc.startsWith('added') || lowerDesc.startsWith('created')) {
    const subject = properties.name || attributes.name || properties.title || '';
    const entityType = (log.subject_type || '').toLowerCase().includes('user') ? 'staff account' : 'record';
    return subject ? `${userName} created ${entityType} for ${subject}.` : `${userName} created a new ${entityType}.`;
  }

  // 12. Deletions
  if (event === 'deleted' || lowerDesc.startsWith('deleted') || lowerDesc.startsWith('removed')) {
    const subject = properties.name || old.name || properties.title || '';
    return subject ? `${userName} deleted ${subject} from the system.` : `${userName} deleted a record from the system.`;
  }

  // Fallback
  const cleanedDesc = sanitizeLogDescription(rawDesc);
  return `${userName} performed: ${cleanedDesc || 'action'}.`;
}

/**
 * Deduplicate activity logs to guarantee a clean, single-entry stream
 */
export function deduplicateActivityLogs(logs: any[]): any[] {
  if (!Array.isArray(logs) || logs.length === 0) return [];
  
  const result: any[] = [];
  const seenSignatures = new Set<string>();

  for (const log of logs) {
    if (!log) continue;
    const desc = String(log.description || '').trim();
    const lowerDesc = desc.toLowerCase();
    const st = String(log.subject_type || '').toLowerCase();
    const properties = log.properties || {};

    // 1. Skip redundant raw HTTP middleware logs that duplicate native model event logs or rich logs
    if (
      lowerDesc.startsWith('updated student:') ||
      lowerDesc.startsWith('added student:') ||
      lowerDesc.startsWith('deleted student:') ||
      lowerDesc.startsWith('updated staff profile:') ||
      lowerDesc.startsWith('added staff member:') ||
      lowerDesc.startsWith('removed staff member:') ||
      lowerDesc.startsWith('marked attendance for ') ||
      lowerDesc.startsWith('created exam:') ||
      lowerDesc.startsWith('added exam:') ||
      lowerDesc.startsWith('updated exam:')
    ) {
      continue;
    }

    // Skip setting logs that duplicate exam creation / marks / attendance
    if (
      properties.key === 'examinations_exams' ||
      properties.key === 'kts_student_marks' ||
      properties.key === 'examinations_schedules' ||
      properties.attributes?.key === 'examinations_exams' ||
      properties.attributes?.key === 'kts_student_marks' ||
      properties.attributes?.key === 'examinations_schedules'
    ) {
      continue;
    }

    // 2. Build a deduplication signature based on causer, target/student/class/exam, action, and timestamp (down to the minute)
    const target = extractStudentName(log.properties, desc) || log.properties?.class_name || log.subject_id || desc;
    const createdMinute = log.created_at ? log.created_at.substring(0, 16) : '';
    const event = log.event || 'action';
    
    // Group student profile updates, attendance, or exam actions occurring within the same minute
    const isAttendance = lowerDesc.includes('attendance') || log.log_name === 'attendance' || st.includes('attendance');
    const isMarksLog = lowerDesc.includes('mark') || lowerDesc.includes('evaluation') || log.log_name === 'marks' || properties.type === 'exam_marks' || Boolean(properties.exam_id);
    const isStudentUpdate = !isAttendance && !isMarksLog && (lowerDesc.includes('student profile updated') || (lowerDesc.includes('student') && event === 'updated') || st.includes('student'));
    
    const isExamAction = (lowerDesc.includes('exam') || st.includes('exam') || log.log_name === 'exam') && !isMarksLog;
    const examNameClean = String(properties.exam_name || properties.exam || (desc.match(/"([^"]+)"/)?.[1]) || desc).toLowerCase().trim();

    let signature = `log_${log.id}`;
    if (isAttendance) {
      signature = `attendance_${log.properties?.class_name || target}_${log.properties?.session || ''}_${createdMinute}`;
    } else if (isStudentUpdate) {
      signature = `student-update_${target}_${log.causer_id || log.causer_name}_${createdMinute}`;
    } else if (isMarksLog) {
      signature = `marks_${properties.class_name || ''}_${properties.exam_id || examNameClean}_${createdMinute}`;
    } else if (isExamAction) {
      signature = `exam_${event}_${examNameClean}_${createdMinute}`;
    }

    if (isAttendance || isStudentUpdate || isMarksLog || isExamAction) {
      if (seenSignatures.has(signature)) {
        continue;
      }
      seenSignatures.add(signature);
    }

    result.push(log);
  }

  return result;
}
