import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  BackHandler,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  BarChart2,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  CalendarCheck,
  Wallet,
  Download,
  Database,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Percent,
  X,
  RotateCcw,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  Calendar,
  SlidersHorizontal,
  LayoutDashboard,
  Building2,
  ShieldCheck,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { G, Circle, Path, Rect, Line, Text as SvgText } from 'react-native-svg';
import { GlassCard } from '../../components/GlassCard';
import { useResponsive } from '../../utils/responsive';
import { api } from '../../services/api';

type AnalyticsSection = 'overview' | 'cohort' | 'staff' | 'student' | 'financial' | null;

interface AnalyticsMenuItem {
  id: AnalyticsSection;
  title: string;
  subtitle: string;
  badge: string;
  icon: any;
  accentColor: string;
}

const ANALYTICS_MENU_ITEMS: AnalyticsMenuItem[] = [
  {
    id: 'overview',
    title: 'Overview',
    subtitle: 'Term-wise fee collections, class attendance distributions & quick report exports',
    badge: 'Core Audit',
    icon: LayoutDashboard,
    accentColor: '#ffe5a0',
  },
  {
    id: 'cohort',
    title: 'Cohort & YoY Collection',
    subtitle: 'Year-over-year revenue comparisons, fee collection funnel & retention cohorts',
    badge: 'Trends',
    icon: TrendingUp,
    accentColor: '#41eec2',
  },
  {
    id: 'staff',
    title: 'Staff Attendance Analytics',
    subtitle: 'Faculty roster, department performance, presence rates & absence tracking',
    badge: 'HR & Staff',
    icon: Users,
    accentColor: '#38bdf8',
  },
  {
    id: 'student',
    title: 'Student Data Report',
    subtitle: 'Comprehensive student records, batch filtering, age & fee ledger status',
    badge: 'Students',
    icon: UserCheck,
    accentColor: '#e0bdff',
  },
  {
    id: 'financial',
    title: 'Financial Forecasting',
    subtitle: '6-month collection projections, outstanding recovery goals & model confidence',
    badge: 'Projections',
    icon: DollarSign,
    accentColor: '#f0c110',
  },
];

export const AnalyticsDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { headerPaddingTop, scrollBottomPadding, containerStyle } = useResponsive();

  const [selectedSection, setSelectedSection] = useState<AnalyticsSection>(null);
  const [loading, setLoading] = useState(true);

  // Raw fetched data
  const [students, setStudents] = useState<any[]>([]);
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);

  // Dialog alert state
  const [dialogAlert, setDialogAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showCustomAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setDialogAlert({ visible: true, title, message, type });
  };

  // Hardware and left arrow back button handling
  const handleBackNavigation = useCallback(() => {
    if (dialogAlert.visible) {
      setDialogAlert((prev) => ({ ...prev, visible: false }));
      return true;
    }
    if (selectedSection !== null) {
      setSelectedSection(null);
      return true;
    }
    navigation.goBack();
    return true;
  }, [dialogAlert.visible, selectedSection, navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        return handleBackNavigation();
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBackNavigation])
  );

  // Data Loading
  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [rawStudents, rawFees, rawFaculty] = await Promise.all([
        api.getResources('students', { limit: 1000 }).catch(() => []),
        api.getResources('student-fees', { limit: 5000 }).catch(() => []),
        api.getResources('faculty', { limit: 200 }).catch(() => []),
      ]);

      const extract = (res: any) =>
        Array.isArray(res)
          ? res
          : res?.data && Array.isArray(res.data)
            ? res.data
            : res?.data?.data && Array.isArray(res.data.data)
              ? res.data.data
              : [];

      const studentsList = extract(rawStudents);
      const feesList = extract(rawFees);
      const facultyList = extract(rawFaculty);

      if (studentsList.length > 0) setStudents(studentsList);
      else setStudents(DEFAULT_STUDENTS);

      if (feesList.length > 0) setStudentFees(feesList);
      else setStudentFees(DEFAULT_FEES);

      if (facultyList.length > 0) setFaculty(facultyList);
      else setFaculty(DEFAULT_FACULTY);
    } catch (e) {
      setStudents(DEFAULT_STUDENTS);
      setStudentFees(DEFAULT_FEES);
      setFaculty(DEFAULT_FACULTY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // =========================================================
  // OVERVIEW DATA
  // =========================================================
  const totalInvoiced = useMemo(
    () => studentFees.reduce((sum, f) => sum + (Number(f.amount || f.total_amount) || 0), 0) || 5420000,
    [studentFees]
  );
  const totalPaid = useMemo(
    () => studentFees.reduce((sum, f) => sum + (Number(f.paid_amount) || 0), 0) || 4495000,
    [studentFees]
  );
  const totalOutstanding = Math.max(0, totalInvoiced - totalPaid);
  const [selectedBarClassIdx, setSelectedBarClassIdx] = useState<number | null>(1); // Default to Class LKG

  const termFeeData = useMemo(() => {
    return [
      { cls: 'Class Nursery', short: 'Nursery', group: 'Kindergarten', t1: 85, t2: 75, t3: 40 },
      { cls: 'Class LKG', short: 'LKG', group: 'Kindergarten', t1: 80, t2: 70, t3: 0 },
      { cls: 'Class UKG', short: 'UKG', group: 'Kindergarten', t1: 90, t2: 75, t3: 30 },
      { cls: 'Class 1', short: 'Class 1', group: 'Primary', t1: 95, t2: 85, t3: 60 },
      { cls: 'Class 2', short: 'Class 2', group: 'Primary', t1: 92, t2: 88, t3: 70 },
      { cls: 'Class 3', short: 'Class 3', group: 'Primary', t1: 94, t2: 80, t3: 65 },
      { cls: 'Class 4', short: 'Class 4', group: 'Primary', t1: 96, t2: 82, t3: 75 },
      { cls: 'Class 5', short: 'Class 5', group: 'Primary', t1: 98, t2: 90, t3: 80 },
      { cls: 'Class 6', short: 'Class 6', group: 'Middle', t1: 95, t2: 88, t3: 82 },
      { cls: 'Class 7', short: 'Class 7', group: 'Middle', t1: 92, t2: 85, t3: 78 },
      { cls: 'Class 8', short: 'Class 8', group: 'Middle', t1: 96, t2: 91, t3: 84 },
      { cls: 'Class 9', short: 'Class 9', group: 'High', t1: 98, t2: 94, t3: 88 },
      { cls: 'Class 10', short: 'Class 10', group: 'High', t1: 100, t2: 96, t3: 92 },
    ];
  }, []);

  const [selectedAttGroupName, setSelectedAttGroupName] = useState<string | null>(null);

  const attPieData = [
    { name: 'Kindergarten (Nur, LKG, UKG)', shortName: 'Kindergarten', value: 95, color: '#e0bdff' },
    { name: 'Primary (1-5)', shortName: 'Primary', value: 96, color: '#41eec2' },
    { name: 'Middle (6-8)', shortName: 'Middle', value: 94, color: '#f0c110' },
    { name: 'High (9-10)', shortName: 'High', value: 92, color: '#38bdf8' },
  ];

  const selectedAttGroupData = useMemo(() => {
    if (!selectedAttGroupName) return null;
    return attPieData.find((g) => g.name === selectedAttGroupName) || null;
  }, [selectedAttGroupName, attPieData]);

  const exportsList = [
    { id: 'fee', label: 'Fee Report', sub: 'PDF · Excel Sheet', icon: Wallet, color: '#41eec2' },
    { id: 'attendance', label: 'Attendance Roster', sub: 'Class-wise Records', icon: CalendarCheck, color: '#38bdf8' },
    { id: 'payroll', label: 'Payroll Sheet', sub: 'Staff CTC & Net', icon: DollarSign, color: '#ffe5a0' },
    { id: 'diary', label: 'Diary Report', sub: 'Weekly Broadcasts', icon: FileText, color: '#e0bdff' },
    { id: 'bus', label: 'Bus Fleet Logs', sub: 'GPS Tracking Telemetry', icon: BarChart2, color: '#41eec2' },
    { id: 'annual', label: 'Annual Summary', sub: 'Institutional Audit', icon: Database, color: '#ffb4ab' },
  ];

  const handleExportReport = (id: string, label: string) => {
    showCustomAlert(
      'Export Generated',
      `${label} data aggregated successfully. Report ready for download/archive.`,
      'success'
    );
  };

  // =========================================================
  // COHORT & YOY DATA
  // =========================================================
  const [selectedYoyMonthIdx, setSelectedYoyMonthIdx] = useState<number | null>(7); // Default to Aug
  const [selectedFunnelIdx, setSelectedFunnelIdx] = useState<number | null>(null);
  const [selectedCohortIdx, setSelectedCohortIdx] = useState<number | null>(null);

  const yoyData = [
    { month: 'Jan', lastYear: 320, thisYear: 410, fullMonth: 'Jan 2026', growth: '+28.1%' },
    { month: 'Feb', lastYear: 290, thisYear: 380, fullMonth: 'Feb 2026', growth: '+31.0%' },
    { month: 'Mar', lastYear: 450, thisYear: 560, fullMonth: 'Mar 2026', growth: '+24.4%' },
    { month: 'Apr', lastYear: 610, thisYear: 780, fullMonth: 'Apr 2026', growth: '+27.8%' },
    { month: 'May', lastYear: 380, thisYear: 490, fullMonth: 'May 2026', growth: '+28.9%' },
    { month: 'Jun', lastYear: 520, thisYear: 640, fullMonth: 'Jun 2026', growth: '+23.1%' },
    { month: 'Jul', lastYear: 480, thisYear: 610, fullMonth: 'Jul 2026', growth: '+27.1%' },
    { month: 'Aug', lastYear: 420, thisYear: 530, fullMonth: 'Aug 2026', growth: '+26.2%' },
    { month: 'Sep', lastYear: 460, thisYear: 580, fullMonth: 'Sep 2026', growth: '+26.1%' },
    { month: 'Oct', lastYear: 510, thisYear: 640, fullMonth: 'Oct 2026', growth: '+25.5%' },
    { month: 'Nov', lastYear: 390, thisYear: 480, fullMonth: 'Nov 2026', growth: '+23.1%' },
    { month: 'Dec', lastYear: 580, thisYear: 720, fullMonth: 'Dec 2026', growth: '+24.1%' },
  ];

  const funnelStages = [
    { stage: '1. Invoiced Fees Total', value: 5420000, percentage: 100, fill: '#38bdf8', desc: 'Gross billed across all active academic batches' },
    { stage: '2. Net After Concessions', value: 4940000, percentage: 91, fill: '#e0bdff', desc: 'Net billable post scholarship and sibling waivers' },
    { stage: '3. Collected To Date', value: 4495000, percentage: 83, fill: '#41eec2', desc: 'Realized collections from online and counter channels' },
    { stage: '4. Bank Settled & Verified', value: 4180000, percentage: 77, fill: '#f0c110', desc: 'Cleared bank funds reconciled against ledger' },
  ];

  const cohortData = [
    { cohort: '2023-2024 Batch', enrolled: 142, year1: 100, year2: 95, year3: 92, year4: 89, avgPaid: '₹44,500', status: 'High Retention' },
    { cohort: '2024-2025 Batch', enrolled: 168, year1: 100, year2: 96, year3: 93, year4: null, avgPaid: '₹47,200', status: 'Optimal' },
    { cohort: '2025-2026 Batch', enrolled: 185, year1: 100, year2: 97, year3: null, year4: null, avgPaid: '₹51,000', status: 'Top Growing' },
    { cohort: '2026-2027 Batch', enrolled: 210, year1: 100, year2: null, year3: null, year4: null, avgPaid: '₹54,200', status: 'Current Intake' },
  ];

  // =========================================================
  // STAFF ATTENDANCE DATA & FILTERS
  // =========================================================
  const [staffDeptFilter, setStaffDeptFilter] = useState('All');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffDatePreset, setStaffDatePreset] = useState<'today' | 'month' | 'last30' | 'term'>('today');
  const [staffViewMode, setStaffViewMode] = useState<'daily' | 'summary'>('daily');
  const [staffLayoutMode, setStaffLayoutMode] = useState<'cards' | 'table'>('cards');
  const [selectedStaffDistTier, setSelectedStaffDistTier] = useState<string | null>(null);
  const [selectedStaffPieIdx, setSelectedStaffPieIdx] = useState<number | null>(null);
  const [showStaffInsightsModal, setShowStaffInsightsModal] = useState(false);

  // Department Dropdown & Side-by-Side Date Picker (DD-MM-YYYY) States
  const [staffStartDate, setStaffStartDate] = useState('01-08-2026');
  const [staffEndDate, setStaffEndDate] = useState('03-09-2026');
  const [showStaffDeptDropdown, setShowStaffDeptDropdown] = useState(false);
  const [showStaffCalendarModal, setShowStaffCalendarModal] = useState(false);
  const [staffTargetDateField, setStaffTargetDateField] = useState<'start' | 'end'>('start');
  const [staffPickerMonth, setStaffPickerMonth] = useState(new Date().getMonth());
  const [staffPickerYear, setStaffPickerYear] = useState(new Date().getFullYear());

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const staffCalendarCells = useMemo(() => {
    const firstDayIndex = new Date(staffPickerYear, staffPickerMonth, 1).getDay();
    const daysInMonth = new Date(staffPickerYear, staffPickerMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);
    return cells;
  }, [staffPickerYear, staffPickerMonth]);

  const openStaffCalendarPicker = (field: 'start' | 'end') => {
    setStaffTargetDateField(field);
    const currentDateStr = field === 'start' ? staffStartDate : staffEndDate;
    if (currentDateStr && /^\d{2}-\d{2}-\d{4}$/.test(currentDateStr)) {
      const parts = currentDateStr.split('-');
      const y = parseInt(parts[2], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        setStaffPickerYear(y);
        setStaffPickerMonth(m);
      }
    } else {
      setStaffPickerYear(new Date().getFullYear());
      setStaffPickerMonth(new Date().getMonth());
    }
    setShowStaffCalendarModal(true);
  };

  const handleSelectStaffCalendarDate = (day: number) => {
    const dd = String(day).padStart(2, '0');
    const mm = String(staffPickerMonth + 1).padStart(2, '0');
    const yyyy = String(staffPickerYear);
    const dateFormatted = `${dd}-${mm}-${yyyy}`;

    if (staffTargetDateField === 'start') {
      setStaffStartDate(dateFormatted);
    } else {
      setStaffEndDate(dateFormatted);
    }
    setShowStaffCalendarModal(false);
  };

  const formatDateInput = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 8)}`;
  };

  const departmentsList = useMemo(() => {
    const depts = Array.from(new Set(faculty.map((f) => f.department || 'Teaching'))).filter(Boolean);
    return ['All', ...depts];
  }, [faculty]);

  const staffAttendanceDistribution = useMemo(() => {
    return [
      { name: 'Excellent (>90%)', count: Math.max(1, Math.round(faculty.length * 0.65)), color: '#10B981', tier: 'Excellent', desc: 'Consistent top attendance record' },
      { name: 'Good (80-90%)', count: Math.max(1, Math.round(faculty.length * 0.22)), color: '#38BDF8', tier: 'Good', desc: 'Standard compliant attendance' },
      { name: 'Satisfactory (60-80%)', count: Math.max(0, Math.round(faculty.length * 0.10)), color: '#F0C110', tier: 'Satisfactory', desc: 'Moderate leave & late entries' },
      { name: 'Improvement (<60%)', count: Math.max(0, faculty.length - Math.round(faculty.length * 0.65) - Math.round(faculty.length * 0.22) - Math.round(faculty.length * 0.10)), color: '#EF4444', tier: 'Improvement', desc: 'Frequent absenteeism' },
    ];
  }, [faculty]);

  const staffStatusBreakdown = useMemo(() => {
    return [
      { name: 'Present', percentage: 88, color: '#10B981' },
      { name: 'Late Check-In', percentage: 6, color: '#F0C110' },
      { name: 'Half Day', percentage: 3, color: '#38BDF8' },
      { name: 'Absent / Leave', percentage: 3, color: '#EF4444' },
    ];
  }, []);

  const staffReportMonths = useMemo(() => {
    const parts1 = staffStartDate.split('-');
    const parts2 = staffEndDate.split('-');
    if (parts1.length !== 3 || parts2.length !== 3) return ['September 2026'];

    const d1 = new Date(parseInt(parts1[2], 10), parseInt(parts1[1], 10) - 1, parseInt(parts1[0], 10));
    const d2 = new Date(parseInt(parts2[2], 10), parseInt(parts2[1], 10) - 1, parseInt(parts2[0], 10));

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return ['September 2026'];

    const months: string[] = [];
    const current = new Date(d1.getFullYear(), d1.getMonth(), 1);
    const end = new Date(d2.getFullYear(), d2.getMonth(), 1);

    while (current <= end) {
      const mName = `${MONTH_NAMES[current.getMonth()]} ${current.getFullYear()}`;
      if (!months.includes(mName)) months.push(mName);
      current.setMonth(current.getMonth() + 1);
    }
    return months.length > 0 ? months : ['September 2026'];
  }, [staffStartDate, staffEndDate, MONTH_NAMES]);

  const processedStaffList = useMemo(() => {
    return faculty.map((f, idx) => {
      const empId = f.employee_id || f.empId || f.biometric_employee_code || `EMP-2026-0${idx + 1}`;
      const name = f.name || 'Faculty Member';
      const role = f.designation || f.role || 'Senior Teacher';
      const category = f.category || (f.department === 'Teaching' ? 'Teaching Faculty' : 'Non-Teaching');
      const dept = f.department || 'Teaching';

      const basePct = 90 + ((idx * 7) % 9);
      const isLate = idx % 5 === 0;
      const isEarly = idx % 7 === 0;
      const checkIn = isLate ? '09:18 AM' : '08:48 AM';
      const checkOut = isEarly ? '04:15 PM' : '04:45 PM';
      const hours = isEarly ? '06h 57m' : isLate ? '07h 27m' : '07h 57m';
      const status = idx === 3 ? 'Leave' : idx === 5 ? 'Half Day' : isLate ? 'Late' : 'Present';

      const workDays = 24;
      const presentDays = Math.max(18, Math.round(workDays * (basePct / 100)));
      const lateDays = isLate ? 2 : 0;
      const halfDays = idx === 5 ? 1 : 0;
      const leaveDays = idx === 3 ? 2 : (idx % 3 === 0 ? 1 : 0);
      const absentDays = Math.max(0, workDays - presentDays - leaveDays);

      let distTier = 'Excellent';
      if (basePct < 60) distTier = 'Improvement';
      else if (basePct < 80) distTier = 'Satisfactory';
      else if (basePct <= 90) distTier = 'Good';

      const monthlyData: Record<
        string,
        { workDays: number; present: number; late: number; half: number; absent: number; leave: number; percentage: string }
      > = {};

      let sumWork = 0;
      let sumPres = 0;
      let sumLate = 0;
      let sumHalf = 0;
      let sumAbs = 0;
      let sumLeave = 0;

      staffReportMonths.forEach((m, mIdx) => {
        const isAug = m.toLowerCase().includes('august');
        const isSep = m.toLowerCase().includes('september');
        const mWork = isAug ? 25 : isSep ? (staffReportMonths.length > 1 ? 3 : 24) : 24;
        const mPres = Math.max(0, Math.round(mWork * (basePct / 100)) - (idx % 3 === 0 ? 1 : 0));
        const mLate = (idx + mIdx) % 5 === 0 ? 1 : 0;
        const mHalf = (idx + mIdx) % 7 === 0 ? 1 : 0;
        const mLeave = (idx + mIdx) % 4 === 0 ? 1 : 0;
        const mAbs = Math.max(0, mWork - mPres - mLeave);
        const mScore = mPres + mLate + mHalf * 0.5;
        const mPct = mWork > 0 ? `${Math.min(100, Math.round((mScore / mWork) * 100))}%` : '0%';

        monthlyData[m] = {
          workDays: mWork,
          present: mPres,
          late: mLate,
          half: mHalf,
          absent: mAbs,
          leave: mLeave,
          percentage: mPct,
        };

        sumWork += mWork;
        sumPres += mPres;
        sumLate += mLate;
        sumHalf += mHalf;
        sumAbs += mAbs;
        sumLeave += mLeave;
      });

      const oScore = sumPres + sumLate + sumHalf * 0.5;
      const overallPct = sumWork > 0 ? `${Math.min(100, Math.round((oScore / sumWork) * 100))}%` : `${basePct}%`;
      const overallData = {
        workDays: sumWork || workDays,
        present: sumPres || presentDays,
        late: sumLate || lateDays,
        half: sumHalf || halfDays,
        absent: sumAbs || absentDays,
        leave: sumLeave || leaveDays,
        percentage: overallPct,
      };

      return {
        id: f.id || idx,
        name,
        empId,
        role,
        category,
        dept,
        checkIn,
        checkOut,
        hours,
        status,
        isLate,
        isEarly,
        workDays,
        presentDays,
        lateDays,
        halfDays,
        absentDays,
        leaveDays,
        attendancePct: basePct,
        distTier,
        monthlyData,
        overallData,
      };
    });
  }, [faculty, staffReportMonths]);

  const filteredStaffList = useMemo(() => {
    return processedStaffList.filter((f) => {
      const matchesDept = staffDeptFilter === 'All' || f.dept === staffDeptFilter;
      const matchesSearch =
        !staffSearchQuery.trim() ||
        f.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        f.empId.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        f.role.toLowerCase().includes(staffSearchQuery.toLowerCase());
      const matchesDistTier = !selectedStaffDistTier || f.distTier === selectedStaffDistTier;
      return matchesDept && matchesSearch && matchesDistTier;
    });
  }, [processedStaffList, staffDeptFilter, staffSearchQuery, selectedStaffDistTier]);

  // =========================================================
  // STUDENT DATA REPORT DATA & FILTERS
  // =========================================================
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('All');
  const [studentStatusFilter, setStudentStatusFilter] = useState('All');
  const [studentYearFilter, setStudentYearFilter] = useState('All');
  const [studentLayoutMode, setStudentLayoutMode] = useState<'table' | 'cards'>('table');

  const [showStudentYearDropdown, setShowStudentYearDropdown] = useState(false);
  const [showStudentClassDropdown, setShowStudentClassDropdown] = useState(false);
  const [showStudentStatusDropdown, setShowStudentStatusDropdown] = useState(false);
  const [selectedForecastMonthIdx, setSelectedForecastMonthIdx] = useState<number | null>(null);

  const studentYearsList = useMemo(() => {
    const rawYears = Array.from(
      new Set(
        students.map((s) => (typeof s.batch?.academic_year === 'object' ? s.batch?.academic_year?.name : s.batch?.academic_year) || s.academic_year || s.batchName)
      )
    ).filter(Boolean);
    const standardYears = ['2026-2027', '2025-2026', '2024-2025'];
    return ['All', ...Array.from(new Set([...standardYears, ...rawYears]))];
  }, [students]);

  const studentClassesList = useMemo(() => {
    const rawClasses = Array.from(new Set(students.map((s) => s.class || s.class_name))).filter(Boolean);
    const standardOrder = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
    const merged = Array.from(new Set([...standardOrder, ...rawClasses]));
    return ['All', ...merged];
  }, [students]);

  const studentStatusesList = ['All', 'Active', 'Left', 'Transferred'];

  const processedStudents = useMemo(() => {
    return students.map((s, idx) => {
      const fees = studentFees.filter((f) => String(f.student_id) === String(s.id));
      const sInvoiced = fees.reduce((sum, f) => sum + (Number(f.amount || f.total_amount) || 0), 0) || (45000 + ((idx * 3500) % 15000));
      const sPaid = fees.reduce((sum, f) => sum + (Number(f.paid_amount) || 0), 0) || (idx % 3 === 0 ? sInvoiced : Math.round(sInvoiced * 0.75));
      const sDue = Math.max(0, sInvoiced - sPaid);

      let formattedDob = s.dob || '';
      let calculatedAge = '14 Years, 2 Months';
      if (formattedDob) {
        const d = new Date(formattedDob);
        if (!isNaN(d.getTime())) {
          formattedDob = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
          const now = new Date();
          let years = now.getFullYear() - d.getFullYear();
          let months = now.getMonth() - d.getMonth();
          if (months < 0) {
            years--;
            months += 12;
          }
          if (now.getDate() < d.getDate()) {
            months--;
            if (months < 0) {
              years--;
              months += 12;
            }
          }
          calculatedAge = years > 0 ? `${years} Years, ${Math.max(0, months)} Months` : `${Math.max(0, months)} Months`;
        }
      }

      let rawAdmDate = String(s.admissionDate || s.admission_date || '2024-06-15');
      const dateMatch = rawAdmDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        rawAdmDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
      } else if (rawAdmDate.length > 10 && rawAdmDate.includes('T')) {
        rawAdmDate = rawAdmDate.split('T')[0];
      }

      const stStatus = (s.status || 'Active').toLowerCase();
      const displayStatus = (stStatus === 'active') ? 'Active' : (stStatus === 'left' || stStatus === 'dropout') ? 'Left' : (stStatus === 'transfer' || stStatus === 'transferred') ? 'Transferred' : 'Active';

      const roll = s.roll || s.enrollment_number || s.admission_number || `ADM-2026-${String(idx + 1).padStart(3, '0')}`;
      const name = s.name || s.student_name || 'Student';
      const penNo = s.student_pen_no || s.pen_no || `PEN-26-${1000 + idx}`;
      const fatherName = s.father_name || s.parent || 'Parent Guardian';
      const motherName = s.mother_name || 'Mother Guardian';
      const phone = s.phone || s.student_mobile || s.father_mobile || '+91 98765 43210';
      const address = s.address || s.village || 'City Campus';
      const displayClass = s.class || s.class_name || (idx % 2 === 0 ? 'Class 10' : 'Class 9');
      const batchName = (typeof s.batch?.academic_year === 'object' ? s.batch?.academic_year?.name : s.batch?.academic_year) || s.academic_year || '2026-2027';
      const gender = s.gender || (idx % 2 === 0 ? 'Male' : 'Female');

      return {
        ...s,
        id: s.id || idx,
        displayRoll: roll,
        displayName: name,
        penNo,
        admissionDate: rawAdmDate,
        displayDob: formattedDob || '15-08-2012',
        displayAge: calculatedAge,
        fatherName,
        motherName,
        displayPhone: phone,
        address,
        displayClass,
        batchName,
        totalFee: sInvoiced,
        paidFee: sPaid,
        dueFee: sDue,
        displayStatus,
        gender,
      };
    });
  }, [students, studentFees]);

  const filteredStudents = useMemo(() => {
    return processedStudents.filter((s) => {
      const matchSearch =
        !studentSearch.trim() ||
        s.displayName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.displayRoll.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.fatherName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.penNo.toLowerCase().includes(studentSearch.toLowerCase());
      const matchClass = studentClassFilter === 'All' || s.displayClass === studentClassFilter;
      const matchStatus = studentStatusFilter === 'All' || s.displayStatus === studentStatusFilter;
      const matchYear = studentYearFilter === 'All' || s.batchName === studentYearFilter;

      return matchSearch && matchClass && matchStatus && matchYear;
    });
  }, [processedStudents, studentSearch, studentClassFilter, studentStatusFilter, studentYearFilter]);

  // =========================================================
  // FINANCIAL FORECASTING DATA
  // =========================================================
  const forecastMonths = useMemo(() => {
    const futureMonths = ['Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026'];
    const baseOutstanding = totalOutstanding > 0 ? totalOutstanding : 450000;
    let currentOutstanding = baseOutstanding;

    return futureMonths.map((m, idx) => {
      const monthlyRecoveryRate = idx === 0 ? 0.25 : idx === 1 ? 0.20 : idx === 2 ? 0.18 : idx === 3 ? 0.15 : idx === 4 ? 0.12 : 0.10;
      const projected = Math.round(baseOutstanding * monthlyRecoveryRate);
      currentOutstanding = Math.max(0, currentOutstanding - projected);

      return {
        month: m,
        minExp: Math.round(projected * 0.8),
        projected,
        target: Math.round(projected * 1.15),
        outstandingGoal: currentOutstanding,
      };
    });
  }, [totalOutstanding]);

  // Header Title Helper
  const getHeaderTitle = () => {
    if (!selectedSection) return 'Reports & Analytics';
    const found = ANALYTICS_MENU_ITEMS.find((m) => m.id === selectedSection);
    return found ? found.title : 'Reports & Analytics';
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1d2022', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={{ zIndex: 50 }}>
        <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center gap-3.5 flex-1 mr-2">
            <Pressable
              onPress={handleBackNavigation}
              className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <ChevronLeft size={22} color="#ffe5a0" />
            </Pressable>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-xl md:text-2xl font-bold text-white font-display-lg">
                {getHeaderTitle()}
              </Text>
              <Text numberOfLines={1} className="text-[10px] uppercase tracking-widest text-[#ffe5a0] font-bold mt-0.5">
                {selectedSection ? 'INSTITUTIONAL METRICS & AUDIT INTELLIGENCE' : 'SELECT REPORT MODULE'}
              </Text>
            </View>
          </View>
          <View className="w-11 h-11 rounded-2xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center">
            <BarChart2 size={20} color="#f0c110" />
          </View>
        </BlurView>

        <LinearGradient
          colors={['rgba(245, 197, 24, 0.15)', 'transparent']}
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#f0c110" />
            <Text className="text-white/60 text-xs font-bold mt-3">Aggregating database reports and analytics...</Text>
          </View>
        ) : selectedSection === null ? (
          /* ========================================================= */
          /* MAIN MENU: 5 PILLS LISTED ONE AFTER THE OTHER IN A COLUMN  */
          /* ========================================================= */
          <View className="px-5 mb-8 pt-6 md:pt-8" style={{ gap: 18 }}>
            {ANALYTICS_MENU_ITEMS.map((item) => {
              const IconComp = item.icon;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedSection(item.id)}
                  style={({ pressed }) => [
                    pressed && { backgroundColor: 'rgba(240, 193, 16, 0.2)', transform: [{ scale: 0.98 }] },
                  ]}
                  className="flex-row items-center justify-between p-4 md:p-5 rounded-2xl bg-white/5 border border-white/10 active:border-[#f0c110]/40"
                >
                  <View className="flex-row items-center gap-3.5 flex-1 mr-3">
                    <View className="w-12 h-12 rounded-2xl bg-[#f0c110]/15 border border-[#f0c110]/30 items-center justify-center shadow-sm">
                      <IconComp size={22} color={item.accentColor} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-extrabold text-sm md:text-base">{item.title}</Text>
                      <Text className="text-[#d1c5ac] text-xs mt-1 leading-relaxed" numberOfLines={2}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2.5">
                    <View className="px-2.5 py-1 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40">
                      <Text className="text-[#ffe5a0] text-[10.5px] font-black uppercase tracking-wider">{item.badge}</Text>
                    </View>
                    <ChevronRight size={18} color="#ffe5a0" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          /* ========================================================= */
          /* RESPECTIVE SELECTED REPORT SCREEN                         */
          /* ========================================================= */
          <View className="px-5 mb-8 gap-5">
            {/* SCREEN 1: OVERVIEW */}
            {selectedSection === 'overview' && (
              <View className="gap-5">
                {/* 3 Overview Top KPI Cards */}
                <View className="flex-row gap-2.5">
                  <GlassCard className="flex-1 p-4 border border-white/10 rounded-2xl" intensity="low">
                    <View className="w-8 h-8 rounded-xl bg-sky-500/20 items-center justify-center mb-2">
                      <FileText size={16} color="#38bdf8" />
                    </View>
                    <Text className="text-white font-black text-xl md:text-2xl">48</Text>
                    <Text className="text-white/60 text-[11px] font-bold uppercase mt-0.5">Reports Gen</Text>
                    <Text className="text-[#ffe5a0] text-[10px] font-medium mt-1">This month</Text>
                  </GlassCard>

                  <GlassCard className="flex-1 p-4 border border-white/10 rounded-2xl" intensity="low">
                    <View className="w-8 h-8 rounded-xl bg-emerald-500/20 items-center justify-center mb-2">
                      <BarChart2 size={16} color="#41eec2" />
                    </View>
                    <Text className="text-emerald-400 font-black text-xl md:text-2xl">Today</Text>
                    <Text className="text-white/60 text-[11px] font-bold uppercase mt-0.5">Last Export</Text>
                    <Text className="text-white/50 text-[10px] font-medium mt-1">Fee Collection</Text>
                  </GlassCard>

                  <GlassCard className="flex-1 p-4 border border-white/10 rounded-2xl" intensity="low">
                    <View className="w-8 h-8 rounded-xl bg-[#f0c110]/20 items-center justify-center mb-2">
                      <Database size={16} color="#f0c110" />
                    </View>
                    <Text className="text-[#ffe5a0] font-black text-xl md:text-2xl">{students.length * 8 + 420}</Text>
                    <Text className="text-white/60 text-[11px] font-bold uppercase mt-0.5">Data Points</Text>
                    <Text className="text-white/50 text-[10px] font-medium mt-1">Live DB Records</Text>
                  </GlassCard>
                </View>

                {/* Term-wise Fee Collection Horizontal Scrolling Bar Graph Card */}
                <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="text-white font-extrabold text-sm md:text-base">Term-wise Fee Collection</Text>
                      <Text className="text-white/50 text-xs mt-0.5">Scroll horizontally & tap any class to inspect</Text>
                    </View>
                    <View className="px-2.5 py-1 rounded-lg bg-[#f0c110]/20 border border-[#f0c110]/40">
                      <Text className="text-[#ffe5a0] text-[10.5px] font-bold">2026-2027</Text>
                    </View>
                  </View>

                  {/* Legend */}
                  <View className="flex-row items-center gap-4 py-2 border-b border-white/5 mb-3">
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-2.5 h-2.5 rounded-sm bg-[#2dd4bf]" />
                      <Text className="text-white/70 text-xs font-bold">Term 1</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-2.5 h-2.5 rounded-sm bg-[#38bdf8]" />
                      <Text className="text-white/70 text-xs font-bold">Term 2</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-2.5 h-2.5 rounded-sm bg-[#f0c110]" />
                      <Text className="text-white/70 text-xs font-bold">Term 3</Text>
                    </View>
                  </View>

                  {/* Interactive Selected Class Statistics Pop-up (Matching Reference Image) */}
                  {selectedBarClassIdx !== null && termFeeData[selectedBarClassIdx] && (
                    <View className="mb-3.5 p-3.5 bg-white/95 rounded-2xl shadow-xl shadow-black/70 border border-white/40 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3.5 flex-1">
                        <View className="pr-3 border-r border-gray-300">
                          <Text className="text-gray-900 font-black text-sm">{termFeeData[selectedBarClassIdx].cls}</Text>
                          <Text className="text-gray-500 text-[10px] font-extrabold uppercase mt-0.5">Term Statistics</Text>
                        </View>
                        <View className="flex-row flex-wrap gap-x-3.5 gap-y-1">
                          <Text className="text-[#0d9488] font-bold text-xs font-mono">
                            Term 1 : <Text className="font-extrabold">{termFeeData[selectedBarClassIdx].t1}</Text>
                          </Text>
                          <Text className="text-[#2563eb] font-bold text-xs font-mono">
                            Term 2 : <Text className="font-extrabold">{termFeeData[selectedBarClassIdx].t2}</Text>
                          </Text>
                          <Text className="text-[#b45309] font-bold text-xs font-mono">
                            Term 3 : <Text className="font-extrabold">{termFeeData[selectedBarClassIdx].t3}</Text>
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => setSelectedBarClassIdx(null)}
                        className="p-1 rounded-full bg-gray-200 active:bg-gray-300"
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <X size={14} color="#374151" />
                      </Pressable>
                    </View>
                  )}

                  {/* Main Graph Plot Area with Fixed Y-Axis & Horizontal Scrolling X-Axis */}
                  <View className="pt-2 bg-black/40 rounded-2xl p-3 border border-white/5">
                    <View className="flex-row">
                      {/* Fixed Y-Axis Column (10% scale increments from 0% to 100%) */}
                      <View className="w-10">
                        {/* Top headroom spacer to match bar floating labels */}
                        <View style={{ height: 22 }} />

                        {/* Y-Axis 11 Ticks across exact 180px plot height */}
                        <View style={{ height: 180, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6 }}>
                          <Text style={{ fontSize: 9.5, lineHeight: 10 }} className="text-white/60 font-mono">100%</Text>
                          <Text style={{ fontSize: 9, lineHeight: 10 }} className="text-white/40 font-mono">90%</Text>
                          <Text style={{ fontSize: 9.5, lineHeight: 10 }} className="text-white/60 font-mono">80%</Text>
                          <Text style={{ fontSize: 9, lineHeight: 10 }} className="text-white/40 font-mono">70%</Text>
                          <Text style={{ fontSize: 9.5, lineHeight: 10 }} className="text-white/60 font-mono">60%</Text>
                          <Text style={{ fontSize: 9, lineHeight: 10 }} className="text-white/40 font-mono">50%</Text>
                          <Text style={{ fontSize: 9.5, lineHeight: 10 }} className="text-white/60 font-mono">40%</Text>
                          <Text style={{ fontSize: 9, lineHeight: 10 }} className="text-white/40 font-mono">30%</Text>
                          <Text style={{ fontSize: 9.5, lineHeight: 10 }} className="text-white/60 font-mono">20%</Text>
                          <Text style={{ fontSize: 9, lineHeight: 10 }} className="text-white/40 font-mono">10%</Text>
                          <Text style={{ fontSize: 9.5, lineHeight: 10 }} className="text-white/60 font-mono">0%</Text>
                        </View>

                        {/* Bottom X-axis spacer */}
                        <View style={{ height: 28 }} />
                      </View>

                      {/* Horizontal Scrollable Chart Area */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={true} className="flex-1">
                        <View>
                          {/* Top headroom spacer for floating percentage labels */}
                          <View style={{ height: 22 }} />

                          {/* Plotting Region (Exact 180px Height) */}
                          <View style={{ height: 180, position: 'relative' }}>
                            {/* Background Horizontal Gridlines (11 lines matching Y-axis ticks exactly) */}
                            <View
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 180,
                                justifyContent: 'space-between',
                                width: termFeeData.length * 74,
                              }}
                              pointerEvents="none"
                            >
                              <View className="border-b border-white/15 w-full" />
                              <View className="border-b border-white/5 w-full" />
                              <View className="border-b border-white/10 w-full" />
                              <View className="border-b border-white/5 w-full" />
                              <View className="border-b border-white/10 w-full" />
                              <View className="border-b border-white/5 w-full" />
                              <View className="border-b border-white/10 w-full" />
                              <View className="border-b border-white/5 w-full" />
                              <View className="border-b border-white/10 w-full" />
                              <View className="border-b border-white/5 w-full" />
                              <View className="border-b border-white/20 w-full" />
                            </View>

                            {/* Class Bar Columns */}
                            <View style={{ height: 180, flexDirection: 'row', alignItems: 'flex-end' }}>
                              {termFeeData.map((item, idx) => {
                                const isSelected = selectedBarClassIdx === idx;
                                const h1 = Math.round((item.t1 / 100) * 180);
                                const h2 = Math.round((item.t2 / 100) * 180);
                                const h3 = Math.round((item.t3 / 100) * 180);

                                return (
                                  <Pressable
                                    key={item.cls}
                                    onPress={() => setSelectedBarClassIdx(isSelected ? null : idx)}
                                    style={{
                                      width: 70,
                                      height: 180,
                                      marginHorizontal: 2,
                                      justifyContent: 'flex-end',
                                      alignItems: 'center',
                                    }}
                                    className={`rounded-xl ${isSelected
                                      ? 'bg-white/15 border border-white/30'
                                      : 'active:bg-white/5'
                                      }`}
                                  >
                                    {/* 3 Grouped Term Bars with Exact Proportional Heights & Top Labels */}
                                    <View className="flex-row items-end justify-center gap-1.5" style={{ height: 180 }}>
                                      {/* Term 1 Bar Column */}
                                      <View className="items-center justify-end" style={{ height: 180, width: 14 }}>
                                        {isSelected && (
                                          <View
                                            style={{
                                              position: 'absolute',
                                              bottom: h1 + 2,
                                              width: 24,
                                              alignItems: 'center',
                                            }}
                                          >
                                            <Text className="text-[#2dd4bf] text-[9.5px] font-mono font-black">
                                              {item.t1}
                                            </Text>
                                          </View>
                                        )}
                                        <View
                                          style={{
                                            height: Math.max(h1, 2),
                                            width: 10,
                                            backgroundColor: '#2dd4bf',
                                            borderTopLeftRadius: 3,
                                            borderTopRightRadius: 3,
                                          }}
                                        />
                                      </View>

                                      {/* Term 2 Bar Column */}
                                      <View className="items-center justify-end" style={{ height: 180, width: 14 }}>
                                        {isSelected && (
                                          <View
                                            style={{
                                              position: 'absolute',
                                              bottom: h2 + 2,
                                              width: 24,
                                              alignItems: 'center',
                                            }}
                                          >
                                            <Text className="text-[#38bdf8] text-[9.5px] font-mono font-black">
                                              {item.t2}
                                            </Text>
                                          </View>
                                        )}
                                        <View
                                          style={{
                                            height: Math.max(h2, 2),
                                            width: 10,
                                            backgroundColor: '#38bdf8',
                                            borderTopLeftRadius: 3,
                                            borderTopRightRadius: 3,
                                          }}
                                        />
                                      </View>

                                      {/* Term 3 Bar Column */}
                                      <View className="items-center justify-end" style={{ height: 180, width: 14 }}>
                                        {isSelected && (
                                          <View
                                            style={{
                                              position: 'absolute',
                                              bottom: Math.max(h3, 2) + 2,
                                              width: 24,
                                              alignItems: 'center',
                                            }}
                                          >
                                            <Text className="text-[#f0c110] text-[9.5px] font-mono font-black">
                                              {item.t3}
                                            </Text>
                                          </View>
                                        )}
                                        <View
                                          style={{
                                            height: Math.max(h3, item.t3 > 0 ? 2 : 1),
                                            width: 10,
                                            backgroundColor: '#f0c110',
                                            borderTopLeftRadius: 3,
                                            borderTopRightRadius: 3,
                                            opacity: item.t3 > 0 ? 1 : 0.25,
                                          }}
                                        />
                                      </View>
                                    </View>
                                  </Pressable>
                                );
                              })}
                            </View>
                          </View>

                          {/* Baseline Divider */}
                          <View style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.15)', width: termFeeData.length * 74 }} />

                          {/* X-Axis Class Labels Row */}
                          <View style={{ height: 28, flexDirection: 'row', alignItems: 'center' }}>
                            {termFeeData.map((item, idx) => {
                              const isSelected = selectedBarClassIdx === idx;
                              return (
                                <View key={item.cls} style={{ width: 70, marginHorizontal: 2, alignItems: 'center' }}>
                                  <Text
                                    numberOfLines={1}
                                    className={`text-[11px] font-extrabold text-center ${isSelected ? 'text-[#ffe5a0]' : 'text-white/70'
                                      }`}
                                  >
                                    {item.short}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                </GlassCard>

                {/* Attendance by Class Group Circular Donut Chart Card */}
                <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1 mr-2">
                      <Text className="text-white font-extrabold text-sm md:text-base">Attendance by Class Group</Text>
                      <Text className="text-white/50 text-xs mt-0.5">Tap any circular arc or group pill to inspect percentage</Text>
                    </View>
                    <View className="px-2.5 py-1 rounded-lg bg-[#41eec2]/20 border border-[#41eec2]/40">
                      <Text className="text-[#41eec2] text-[10.5px] font-bold">Live Status</Text>
                    </View>
                  </View>

                  {/* Circular Donut Chart with Center Percentage Display */}
                  <View className="items-center justify-center py-2 relative">
                    <View className="relative w-[170px] h-[170px] items-center justify-center">
                      <Svg width={170} height={170} viewBox="0 0 170 170">
                        {(() => {
                          const totalSum = attPieData.reduce((acc, cur) => acc + cur.value, 0);
                          const totalGapDegrees = 66; // 16.5 degrees gap between each of the 4 segments
                          const availableDegrees = 360 - totalGapDegrees;
                          let currentAngle = 8; // Start angle for symmetric layout

                          const polarToCartesian = (cx: number, cy: number, r: number, angleInDeg: number) => {
                            const rad = ((angleInDeg - 90) * Math.PI) / 180.0;
                            return {
                              x: cx + r * Math.cos(rad),
                              y: cy + r * Math.sin(rad),
                            };
                          };

                          const describeArc = (cx: number, cy: number, r: number, startA: number, endA: number) => {
                            const start = polarToCartesian(cx, cy, r, endA);
                            const end = polarToCartesian(cx, cy, r, startA);
                            const largeArc = endA - startA <= 180 ? '0' : '1';
                            return ['M', start.x, start.y, 'A', r, r, 0, largeArc, 0, end.x, end.y].join(' ');
                          };

                          return attPieData.map((group) => {
                            const isSelected = selectedAttGroupName === group.name;
                            const sliceAngle = (group.value / totalSum) * availableDegrees;
                            const startAngle = currentAngle;
                            const endAngle = currentAngle + sliceAngle;
                            currentAngle = endAngle + 16.5; // 16.5-degree balanced gap between segments

                            const pathD = describeArc(85, 85, 58, startAngle, endAngle);

                            return (
                              <Path
                                key={group.name}
                                d={pathD}
                                stroke={group.color}
                                strokeWidth={isSelected ? 18 : 12}
                                strokeLinecap="round"
                                fill="none"
                                opacity={selectedAttGroupName && !isSelected ? 0.35 : 1}
                                onPress={() => setSelectedAttGroupName(isSelected ? null : group.name)}
                              />
                            );
                          });
                        })()}
                      </Svg>

                      {/* Center Stats Display */}
                      <Pressable
                        onPress={() => setSelectedAttGroupName(null)}
                        style={{
                          position: 'absolute',
                          width: 88,
                          height: 88,
                          borderRadius: 44,
                          backgroundColor: '#14181a',
                          borderWidth: selectedAttGroupData ? 2 : 1,
                          borderColor: selectedAttGroupData ? selectedAttGroupData.color : 'rgba(255, 255, 255, 0.15)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {selectedAttGroupData ? (
                          <>
                            <Text style={{ color: selectedAttGroupData.color }} className="text-2xl font-black font-mono">
                              {selectedAttGroupData.value}%
                            </Text>
                            <Text numberOfLines={1} style={{ color: selectedAttGroupData.color }} className="font-extrabold text-[9px] text-center px-1 mt-0.5">
                              {selectedAttGroupData.name.split(' ')[0]}
                            </Text>
                            <Text style={{ color: selectedAttGroupData.color }} className="text-[8px] font-black uppercase">Present</Text>
                          </>
                        ) : (
                          <>
                            <Text className="text-[#ffe5a0] text-2xl font-black font-mono">93.3%</Text>
                            <Text className="text-white/60 font-extrabold text-[9px] uppercase mt-0.5">Avg Present</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>

                  {/* Interactive Legend Pills Below */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                    {attPieData.map((group) => {
                      const isSelected = selectedAttGroupName === group.name;
                      return (
                        <Pressable
                          key={group.name}
                          onPress={() => setSelectedAttGroupName(isSelected ? null : group.name)}
                          style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: 11,
                              paddingVertical: 5.5,
                              borderRadius: 12,
                              borderWidth: isSelected ? 1.5 : 1,
                              borderColor: isSelected ? group.color : 'rgba(255, 255, 255, 0.35)',
                              backgroundColor: isSelected ? `${group.color}25` : 'rgba(255, 255, 255, 0.07)',
                            }}
                          >
                            <View
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: 2,
                                backgroundColor: group.color,
                                marginRight: 6,
                              }}
                            />
                            <Text
                              style={{
                                color: isSelected ? '#ffffff' : '#f3f4f6',
                                fontSize: 10.5,
                                fontWeight: '700',
                                marginRight: 5,
                              }}
                            >
                              {group.name}
                            </Text>
                            <Text
                              style={{
                                color: group.color,
                                fontSize: 10.5,
                                fontWeight: '900',
                                fontFamily: 'monospace',
                              }}
                            >
                              {group.value}%
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Selected Group Detailed Stats Panel */}
                  {selectedAttGroupData && (
                    <View
                      style={{
                        marginTop: 14,
                        padding: 14,
                        borderRadius: 18,
                        borderWidth: 2,
                        borderColor: selectedAttGroupData.color,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            backgroundColor: `${selectedAttGroupData.color}25`,
                            borderWidth: 1.5,
                            borderColor: selectedAttGroupData.color,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Users size={18} color={selectedAttGroupData.color} />
                        </View>
                        <View>
                          <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
                            {selectedAttGroupData.name}
                          </Text>
                          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11, fontWeight: '500', marginTop: 2 }}>
                            Daily Class Attendance Rate
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: selectedAttGroupData.color, fontWeight: '900', fontSize: 20, fontFamily: 'monospace' }}>
                          {selectedAttGroupData.value}%
                        </Text>
                        <Text style={{ color: '#34d399', fontSize: 10.5, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 }}>
                          {100 - selectedAttGroupData.value}% Absentee Rate
                        </Text>
                      </View>
                    </View>
                  )}
                </GlassCard>

                {/* Quick Exports Section */}
                <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                  <View className="flex-row items-center justify-between mb-3.5">
                    <Text className="text-[#ffe5a0] text-xs md:text-sm font-extrabold uppercase tracking-wider">
                      QUICK REPORTS EXPORT
                    </Text>
                    <Download size={16} color="#ffe5a0" />
                  </View>

                  <View className="gap-2.5">
                    {exportsList.map((exp) => {
                      const IconComp = exp.icon;
                      return (
                        <Pressable
                          key={exp.id}
                          onPress={() => handleExportReport(exp.id, exp.label)}
                          className="flex-row items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 active:bg-white/15"
                        >
                          <View className="flex-row items-center gap-3">
                            <View style={{ backgroundColor: `${exp.color}25` }} className="w-10 h-10 rounded-xl items-center justify-center">
                              <IconComp size={18} color={exp.color} />
                            </View>
                            <View>
                              <Text className="text-white font-extrabold text-xs md:text-sm">{exp.label}</Text>
                              <Text className="text-white/50 text-[11px] mt-0.5">{exp.sub}</Text>
                            </View>
                          </View>
                          <Download size={16} color="rgba(255,255,255,0.6)" />
                        </Pressable>
                      );
                    })}
                  </View>
                </GlassCard>
              </View>
            )}

            {/* SCREEN 2: COHORT & YOY COLLECTION */}
            {selectedSection === 'cohort' && (
              <View className="gap-5">
                {/* Year-over-Year Collection Comparison Bar Graph */}
                <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      <TrendingUp size={18} color="#41eec2" />
                      <Text className="text-white font-extrabold text-sm md:text-base">Year-over-Year (YoY) Collection</Text>
                    </View>
                    <View className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                      <Text className="text-emerald-400 text-[10px] font-black">+26.2% Avg Growth</Text>
                    </View>
                  </View>
                  <Text className="text-white/60 text-xs leading-relaxed mb-3">
                    Comparing month-wise collections of 2026 vs 2025 across all 12 months.
                  </Text>

                  {/* Graph Series Legend */}
                  <View className="flex-row flex-wrap items-center gap-4 mb-3 pt-1 border-t border-white/5">
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-2.5 h-2.5 rounded-sm bg-[#41eec2]" />
                      <Text className="text-white/90 text-xs font-bold">This Year (2026)</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-2.5 h-2.5 rounded-sm bg-[#94a3b8]" />
                      <Text className="text-white/60 text-xs font-bold">Last Year (2025)</Text>
                    </View>
                  </View>

                  {/* Interactive Selected Month Tooltip Card (Matching Reference Design) */}
                  {selectedYoyMonthIdx !== null && (
                    <View className="mb-3.5 p-3.5 bg-white/95 rounded-2xl border border-white/40 shadow-lg flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3.5 flex-1">
                        <View className="pr-3 border-r border-gray-300">
                          <Text className="text-gray-900 font-black text-sm">{yoyData[selectedYoyMonthIdx].fullMonth}</Text>
                          <Text className="text-emerald-600 text-[10px] font-black uppercase mt-0.5">
                            {yoyData[selectedYoyMonthIdx].growth} Growth
                          </Text>
                        </View>
                        <View className="flex-row flex-wrap gap-x-3.5 gap-y-1">
                          <Text className="text-[#0d9488] font-bold text-xs font-mono">
                            2026 : <Text className="font-black">₹{yoyData[selectedYoyMonthIdx].thisYear}k</Text>
                          </Text>
                          <Text className="text-slate-600 font-bold text-xs font-mono">
                            2025 : <Text className="font-black">₹{yoyData[selectedYoyMonthIdx].lastYear}k</Text>
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => setSelectedYoyMonthIdx(null)}
                        className="p-1.5 rounded-full bg-gray-200 active:bg-gray-300"
                      >
                        <X size={13} color="#374151" />
                      </Pressable>
                    </View>
                  )}

                  {/* Horizontal Scrolling Bar Graph with Left Fixed Y-Axis */}
                  <View className="flex-row" style={{ height: 230 }}>
                    {/* Fixed Left Y-Axis */}
                    <View className="w-12 justify-between items-end pr-2 pt-[22px] pb-[28px]">
                      {['₹1000k', '₹800k', '₹600k', '₹400k', '₹200k', '₹0k'].map((label) => (
                        <Text key={label} className="text-white/40 text-[9.5px] font-mono font-bold">
                          {label}
                        </Text>
                      ))}
                    </View>

                    {/* Scrollable Graph Area */}
                    <View className="flex-1 relative">
                      {/* Horizontal Gridlines */}
                      <View className="absolute left-0 right-0 top-[22px] h-[180px] justify-between pointer-events-none">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <View key={i} className="border-b border-white/10 w-full" />
                        ))}
                      </View>

                      {/* Scrollable Month Columns */}
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 4, height: 230 }}
                      >
                        {yoyData.map((d, idx) => {
                          const isSelected = selectedYoyMonthIdx === idx;
                          const thisYearBarHeight = Math.max(4, Math.round((d.thisYear / 1000) * 180));
                          const lastYearBarHeight = Math.max(4, Math.round((d.lastYear / 1000) * 180));

                          return (
                            <Pressable
                              key={d.month}
                              onPress={() => setSelectedYoyMonthIdx(isSelected ? null : idx)}
                              className="items-center justify-end"
                              style={{ width: 62, height: 230 }}
                            >
                              {/* Selected Column Gray Highlight Pill */}
                              {isSelected && (
                                <View
                                  className="absolute rounded-xl bg-white/15 border border-white/30"
                                  style={{
                                    left: 2,
                                    right: 2,
                                    top: 6,
                                    bottom: 30,
                                  }}
                                />
                              )}

                              {/* Bars Area */}
                              <View
                                className="flex-row items-end justify-center w-full relative"
                                style={{ height: 180, gap: 4 }}
                              >
                                {/* 2026 Bar (Teal) */}
                                <View className="items-center relative">
                                  {isSelected && (
                                    <View
                                      style={{
                                        position: 'absolute',
                                        bottom: thisYearBarHeight + 2,
                                        width: 32,
                                        alignItems: 'center',
                                      }}
                                    >
                                      <Text
                                        numberOfLines={1}
                                        style={{ color: '#41eec2' }}
                                        className="text-[9.5px] font-black font-mono text-center"
                                      >
                                        ₹{d.thisYear}k
                                      </Text>
                                    </View>
                                  )}
                                  <View
                                    style={{
                                      height: thisYearBarHeight,
                                      width: 14,
                                      backgroundColor: '#41eec2',
                                      borderTopLeftRadius: 3,
                                      borderTopRightRadius: 3,
                                      opacity: selectedYoyMonthIdx !== null && !isSelected ? 0.4 : 1,
                                    }}
                                  />
                                </View>

                                {/* 2025 Bar (Slate) */}
                                <View className="items-center relative">
                                  {isSelected && (
                                    <View
                                      style={{
                                        position: 'absolute',
                                        bottom: lastYearBarHeight + 2,
                                        width: 32,
                                        alignItems: 'center',
                                      }}
                                    >
                                      <Text
                                        numberOfLines={1}
                                        style={{ color: '#cbd5e1' }}
                                        className="text-[9.5px] font-black font-mono text-center"
                                      >
                                        ₹{d.lastYear}k
                                      </Text>
                                    </View>
                                  )}
                                  <View
                                    style={{
                                      height: lastYearBarHeight,
                                      width: 14,
                                      backgroundColor: '#94a3b8',
                                      borderTopLeftRadius: 3,
                                      borderTopRightRadius: 3,
                                      opacity: selectedYoyMonthIdx !== null && !isSelected ? 0.4 : 1,
                                    }}
                                  />
                                </View>
                              </View>

                              {/* Baseline Divider */}
                              <View className="w-full border-b border-white/20" />

                              {/* Month Name */}
                              <View className="h-[28px] justify-center items-center">
                                <Text
                                  style={{ color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)' }}
                                  className={`text-[11px] font-mono ${isSelected ? 'font-black' : 'font-semibold'}`}
                                >
                                  {d.month}
                                </Text>
                              </View>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                </GlassCard>

                {/* Fee Collection Funnel */}
                <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <View className="flex-row items-center gap-2">
                      <Percent size={18} color="#e0bdff" />
                      <Text className="text-white font-extrabold text-sm md:text-base">Fee Collection Funnel</Text>
                    </View>
                    <View className="px-2 py-0.5 rounded-lg bg-purple-500/20 border border-purple-500/30">
                      <Text className="text-purple-300 text-[10px] font-black">77% Settlement</Text>
                    </View>
                  </View>
                  <Text className="text-white/60 text-xs mb-4">Progression of invoice value through settlement stages.</Text>

                  <View className="gap-3">
                    {funnelStages.map((stage, sIdx) => {
                      const isSelected = selectedFunnelIdx === sIdx;
                      return (
                        <Pressable
                          key={stage.stage}
                          onPress={() => setSelectedFunnelIdx(isSelected ? null : sIdx)}
                          style={{
                            padding: 12,
                            borderRadius: 16,
                            borderWidth: isSelected ? 2 : 1,
                            borderColor: isSelected ? stage.fill : 'rgba(255, 255, 255, 0.1)',
                            backgroundColor: isSelected ? `${stage.fill}20` : 'rgba(0, 0, 0, 0.4)',
                          }}
                        >
                          <View className="flex-row justify-between items-center mb-2">
                            <Text style={{ color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.85)' }} className="text-xs font-bold">
                              {stage.stage}
                            </Text>
                            <Text style={{ color: stage.fill }} className="text-xs font-mono font-black">
                              ₹{stage.value.toLocaleString()} ({stage.percentage}%)
                            </Text>
                          </View>

                          <View className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                            <View
                              style={{
                                width: `${stage.percentage}%`,
                                backgroundColor: stage.fill,
                                opacity: isSelected ? 1 : 0.85,
                              }}
                              className="h-full rounded-full"
                            />
                          </View>

                          {isSelected && (
                            <Text className="text-white/80 text-[11px] font-medium mt-2 pt-2 border-t border-white/10">
                              ℹ️ {stage.desc}
                            </Text>
                          )}
                        </Pressable>
                      );
                    })}

                    <View className="bg-white/5 p-3 rounded-2xl border border-white/10 mt-1">
                      <Text className="text-[#ffe5a0] text-xs leading-relaxed">
                        💡 <Text className="font-bold">Funnel Insights:</Text> Conversion rate from invoiced fees down to settled bank amounts maintains an 83% collection efficiency.
                      </Text>
                    </View>
                  </View>
                </GlassCard>

                {/* Student Enrollment & Retention Cohort Analysis */}
                <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <View className="flex-row items-center gap-2">
                      <Users size={18} color="#38bdf8" />
                      <Text className="text-white font-extrabold text-sm md:text-base">Retention Cohort Analysis</Text>
                    </View>
                    <View className="px-2 py-0.5 rounded-lg bg-sky-500/20 border border-sky-500/30">
                      <Text className="text-sky-300 text-[10px] font-black">4 Academic Batches</Text>
                    </View>
                  </View>
                  <Text className="text-white/60 text-xs mb-3.5">
                    Tracking student retention rates year-over-year based on enrollment batch.
                  </Text>

                  {/* Horizontal Scrollable Matrix Table */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-1">
                    <View style={{ minWidth: 540 }}>
                      {/* Table Header */}
                      <View className="flex-row items-center pb-2.5 border-b border-white/15 px-2">
                        <Text className="text-white/50 text-[11px] font-bold w-[140px]">Enrollment Cohort</Text>
                        <Text className="text-white/50 text-[11px] font-bold w-[75px] text-center">Enrolled</Text>
                        <Text className="text-white/50 text-[11px] font-bold w-[70px] text-center">Year 1</Text>
                        <Text className="text-white/50 text-[11px] font-bold w-[70px] text-center">Year 2</Text>
                        <Text className="text-white/50 text-[11px] font-bold w-[70px] text-center">Year 3</Text>
                        <Text className="text-white/50 text-[11px] font-bold w-[70px] text-center">Year 4</Text>
                        <Text className="text-white/50 text-[11px] font-bold w-[85px] text-right">Avg Fee</Text>
                      </View>

                      {/* Table Body */}
                      <View className="gap-2 pt-2">
                        {cohortData.map((row, rIdx) => {
                          const isSelected = selectedCohortIdx === rIdx;
                          return (
                            <Pressable
                              key={row.cohort}
                              onPress={() => setSelectedCohortIdx(isSelected ? null : rIdx)}
                              style={{
                                paddingVertical: 10,
                                paddingHorizontal: 8,
                                borderRadius: 14,
                                borderWidth: isSelected ? 2 : 1,
                                borderColor: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                                backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 0, 0, 0.35)',
                                flexDirection: 'row',
                                alignItems: 'center',
                              }}
                            >
                              <Text className="text-white font-extrabold text-xs w-[140px]">{row.cohort}</Text>
                              <Text className="text-[#ffe5a0] font-mono font-bold text-xs w-[75px] text-center">
                                {row.enrolled}
                              </Text>

                              <View className="w-[70px] items-center">
                                <View className="px-2 py-0.5 rounded-md bg-sky-500/20">
                                  <Text className="text-sky-300 text-[10px] font-bold">{row.year1}%</Text>
                                </View>
                              </View>

                              <View className="w-[70px] items-center">
                                {row.year2 !== null ? (
                                  <View className="px-2 py-0.5 rounded-md bg-emerald-500/20">
                                    <Text className="text-emerald-300 text-[10px] font-bold">{row.year2}%</Text>
                                  </View>
                                ) : (
                                  <Text className="text-white/30 text-xs font-mono">—</Text>
                                )}
                              </View>

                              <View className="w-[70px] items-center">
                                {row.year3 !== null ? (
                                  <View className="px-2 py-0.5 rounded-md bg-purple-500/20">
                                    <Text className="text-purple-300 text-[10px] font-bold">{row.year3}%</Text>
                                  </View>
                                ) : (
                                  <Text className="text-white/30 text-xs font-mono">—</Text>
                                )}
                              </View>

                              <View className="w-[70px] items-center">
                                {row.year4 !== null ? (
                                  <View className="px-2 py-0.5 rounded-md bg-amber-500/20">
                                    <Text className="text-amber-300 text-[10px] font-bold">{row.year4}%</Text>
                                  </View>
                                ) : (
                                  <Text className="text-white/30 text-xs font-mono">—</Text>
                                )}
                              </View>

                              <Text className="text-white/90 font-mono font-bold text-xs w-[85px] text-right">
                                {row.avgPaid}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </ScrollView>

                  {/* Selected Cohort Breakdown Banner */}
                  {selectedCohortIdx !== null && (
                    <View className="mt-3 p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex-row justify-between items-center">
                      <View>
                        <Text className="text-sky-200 font-extrabold text-xs">
                          {cohortData[selectedCohortIdx].cohort} Status: {cohortData[selectedCohortIdx].status}
                        </Text>
                        <Text className="text-white/60 text-[10.5px] mt-0.5">
                          {cohortData[selectedCohortIdx].enrolled} active students enrolled with {cohortData[selectedCohortIdx].avgPaid} annual realization.
                        </Text>
                      </View>
                      <Pressable onPress={() => setSelectedCohortIdx(null)} className="p-1 rounded-full bg-white/10">
                        <X size={12} color="#ffffff" />
                      </Pressable>
                    </View>
                  )}
                </GlassCard>
              </View>
            )}

            {/* SCREEN 3: STAFF ATTENDANCE ANALYTICS (WEB & APP PARITY) */}
            {selectedSection === 'staff' && (
              <View className="gap-5">
                {/* Header & Performance Insights Action */}
                <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-2">
                      <Text className="text-white font-extrabold text-sm md:text-base">
                        Faculty Attendance Analysis Report
                      </Text>
                      <Text className="text-white/60 text-xs mt-0.5">
                        Biometric logs, daily check-ins & period-wise faculty analytics
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setShowStaffInsightsModal(!showStaffInsightsModal)}
                      className={`px-3 py-1.5 rounded-xl border flex-row items-center gap-1.5 ${showStaffInsightsModal ? 'bg-[#41eec2] border-[#41eec2]' : 'bg-[#41eec2]/20 border-[#41eec2]/40'
                        }`}
                    >
                      <TrendingUp size={14} color={showStaffInsightsModal ? '#101415' : '#41eec2'} />
                      <Text className={`text-xs font-black ${showStaffInsightsModal ? 'text-[#101415]' : 'text-[#41eec2]'}`}>
                        Insights
                      </Text>
                    </Pressable>
                  </View>

                  {/* Performance Insights Collapsible Banner */}
                  {showStaffInsightsModal && (
                    <View className="mt-3.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 gap-2">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-emerald-300 font-extrabold text-xs">💡 Faculty Attendance Insights</Text>
                        <Pressable onPress={() => setShowStaffInsightsModal(false)}>
                          <X size={13} color="#41eec2" />
                        </Pressable>
                      </View>
                      <Text className="text-white/80 text-[11.5px] leading-relaxed">
                        Overall staff punctual check-in compliance is at <Text className="text-emerald-300 font-bold">94.2%</Text>. Teaching department leads with <Text className="text-white font-bold">96.8%</Text> presence rate. Average checkout duration is <Text className="text-white font-bold">7h 48m</Text>.
                      </Text>
                    </View>
                  )}
                </GlassCard>

                {/* Top Filter Bar (Department Dropdown & Side-by-Side Date Filters) */}
                <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                  <View className="gap-3.5">
                    {/* Department Dropdown Selector */}
                    <View>
                      <Text className="text-white/50 text-[10.5px] font-bold uppercase tracking-wider mb-1.5">
                        Department
                      </Text>
                      <Pressable
                        onPress={() => setShowStaffDeptDropdown(true)}
                        className="flex-row items-center justify-between px-3.5 py-3 rounded-xl bg-black/40 border border-white/15 active:bg-white/10"
                      >
                        <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                          <Building2 size={16} color="#ffe5a0" />
                          <Text className="text-white font-extrabold text-xs md:text-sm" numberOfLines={1}>
                            {staffDeptFilter === 'All' ? 'All Departments' : staffDeptFilter}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <View className="px-2 py-0.5 rounded-md bg-[#f0c110]/20 border border-[#f0c110]/40">
                            <Text className="text-[#ffe5a0] text-[10px] font-black">
                              {staffDeptFilter === 'All'
                                ? `${faculty.length} Staff`
                                : `${faculty.filter((f) => (f.department || 'Teaching') === staffDeptFilter).length} Staff`}
                            </Text>
                          </View>
                          <ChevronDown size={16} color="rgba(255,255,255,0.6)" />
                        </View>
                      </Pressable>
                    </View>

                    {/* Side-by-Side Date Range Inputs with Calendar Pickers */}
                    <View className="flex-row gap-2.5">
                      {/* Start Date */}
                      <View className="flex-1">
                        <Text className="text-white/50 text-[10.5px] font-bold uppercase tracking-wider mb-1.5">
                          Start Date (DD-MM-YYYY)
                        </Text>
                        <View className="flex-row items-center justify-between bg-black/50 border border-white/15 rounded-xl px-3 py-2">
                          <TextInput
                            value={staffStartDate}
                            onChangeText={(t) => setStaffStartDate(formatDateInput(t))}
                            placeholder="DD-MM-YYYY"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            maxLength={10}
                            keyboardType="numeric"
                            className="flex-1 text-white font-mono text-xs font-bold p-0"
                          />
                          <Pressable
                            onPress={() => openStaffCalendarPicker('start')}
                            className="p-1.5 rounded-lg bg-white/10 active:bg-[#f0c110]/30 ml-1.5"
                          >
                            <Calendar size={14} color="#ffe5a0" />
                          </Pressable>
                        </View>
                      </View>

                      {/* End Date */}
                      <View className="flex-1">
                        <Text className="text-white/50 text-[10.5px] font-bold uppercase tracking-wider mb-1.5">
                          End Date (DD-MM-YYYY)
                        </Text>
                        <View className="flex-row items-center justify-between bg-black/50 border border-white/15 rounded-xl px-3 py-2">
                          <TextInput
                            value={staffEndDate}
                            onChangeText={(t) => setStaffEndDate(formatDateInput(t))}
                            placeholder="DD-MM-YYYY"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            maxLength={10}
                            keyboardType="numeric"
                            className="flex-1 text-white font-mono text-xs font-bold p-0"
                          />
                          <Pressable
                            onPress={() => openStaffCalendarPicker('end')}
                            className="p-1.5 rounded-lg bg-white/10 active:bg-[#f0c110]/30 ml-1.5"
                          >
                            <Calendar size={14} color="#ffe5a0" />
                          </Pressable>
                        </View>
                      </View>
                    </View>

                  </View>
                </GlassCard>

                {/* 4 KPI Summary Cards (With Web Color-Coded Accent Borders) */}
                <View className="flex-row flex-wrap gap-2.5">
                  {/* Total Faculty */}
                  <View
                    style={{
                      flex: 1,
                      minWidth: 140,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderLeftWidth: 4,
                      borderLeftColor: '#ffffff',
                      padding: 12,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-white/60 text-[9.5px] uppercase font-extrabold tracking-wider">TOTAL STAFF</Text>
                      <Users size={14} color="#ffffff" />
                    </View>
                    <Text className="text-white font-black text-xl font-mono">{filteredStaffList.length}</Text>
                    <Text style={{ color: '#ffffff' }} className="text-[10px] font-bold mt-0.5">Active Staff Roster</Text>
                  </View>

                  {/* Avg Attendance */}
                  <View
                    style={{
                      flex: 1,
                      minWidth: 140,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderLeftWidth: 4,
                      borderLeftColor: '#10b981',
                      padding: 12,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-white/60 text-[9.5px] uppercase font-extrabold tracking-wider">AVG. ATTENDANCE</Text>
                      <TrendingUp size={14} color="#10b981" />
                    </View>
                    <Text className="text-emerald-400 font-black text-xl font-mono">95.6%</Text>
                    <Text className="text-emerald-400 text-[10px] font-bold mt-0.5">+1.8% vs Last Month</Text>
                  </View>

                  {/* Avg Present Days */}
                  <View
                    style={{
                      flex: 1,
                      minWidth: 140,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderLeftWidth: 4,
                      borderLeftColor: '#38bdf8',
                      padding: 12,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-white/60 text-[9.5px] uppercase font-extrabold tracking-wider">AVG. PRESENT</Text>
                      <CheckCircle2 size={14} color="#38bdf8" />
                    </View>
                    <Text style={{ color: '#38bdf8' }} className="font-black text-xl font-mono">23.4d</Text>
                    <Text style={{ color: '#38bdf8' }} className="text-[10px] font-bold mt-0.5">Out of 24 Work Days</Text>
                  </View>

                  {/* Avg Absent Days */}
                  <View
                    style={{
                      flex: 1,
                      minWidth: 140,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderLeftWidth: 4,
                      borderLeftColor: '#ef4444',
                      padding: 12,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-white/60 text-[9.5px] uppercase font-extrabold tracking-wider">AVG. ABSENT</Text>
                      <AlertCircle size={14} color="#ef4444" />
                    </View>
                    <Text className="text-red-400 font-black text-xl font-mono">1.1d</Text>
                    <Text className="text-red-400 text-[10px] font-bold mt-0.5">Includes Leaves</Text>
                  </View>
                </View>

                {/* Two Interactive Analytics Charts (Matching Web) */}
                <View className="gap-5">
                  {/* Chart 1: Attendance Distribution (Faculty) Vertical Bar Graph */}
                  <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View className="flex-row items-center gap-2">
                        <BarChart2 size={18} color="#38bdf8" />
                        <Text className="text-white font-extrabold text-sm md:text-base">
                          Attendance Distribution (Faculty)
                        </Text>
                      </View>
                      {selectedStaffDistTier && (
                        <Pressable
                          onPress={() => setSelectedStaffDistTier(null)}
                          className="px-2 py-0.5 rounded-lg bg-white/10 flex-row items-center gap-1"
                        >
                          <Text className="text-white text-[10px] font-bold">Reset</Text>
                          <X size={11} color="#ffffff" />
                        </Pressable>
                      )}
                    </View>
                    <Text className="text-white/60 text-xs leading-relaxed mb-3">
                      Categorization by attendance achievement tiers. Tap a bar to view count and filter roster.
                    </Text>

                    {/* Interactive Selected Tier Detail Popover Card */}
                    {selectedStaffDistTier !== null && (
                      <View className="mb-3.5 p-3.5 bg-white/95 rounded-2xl border border-white/40 shadow-lg flex-row items-center justify-between">
                        {(() => {
                          const activeTier = staffAttendanceDistribution.find((t) => t.tier === selectedStaffDistTier);
                          if (!activeTier) return null;
                          const totalFacultyCount = faculty.length || 1;
                          const pctOfTotal = Math.round((activeTier.count / totalFacultyCount) * 100);
                          return (
                            <>
                              <View className="flex-row items-center gap-3 flex-1">
                                <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: activeTier.color }} />
                                <View>
                                  <Text className="text-gray-900 font-black text-sm">{activeTier.name}</Text>
                                  <Text className="text-gray-600 text-[11px] font-bold mt-0.5">
                                    <Text style={{ color: activeTier.color }} className="font-black font-mono">{activeTier.count} Faculty</Text> ({pctOfTotal}% of total staff)
                                  </Text>
                                </View>
                              </View>
                              <Pressable
                                onPress={() => setSelectedStaffDistTier(null)}
                                className="p-1.5 rounded-full bg-gray-200 active:bg-gray-300"
                              >
                                <X size={13} color="#374151" />
                              </Pressable>
                            </>
                          );
                        })()}
                      </View>
                    )}

                    {/* Vertical Bar Chart Canvas with Y-Axis and Gridlines */}
                    <View className="flex-row items-stretch my-2">
                      {/* Fixed Left Y-Axis */}
                      {(() => {
                        const maxCount = Math.max(...staffAttendanceDistribution.map((t) => t.count), 10);
                        const maxY = Math.ceil(maxCount / 5) * 5 || 20;
                        const yTicks = [maxY, Math.round(maxY * 0.75), Math.round(maxY * 0.5), Math.round(maxY * 0.25), 0];

                        return (
                          <View className="w-[30px] justify-between items-end pr-1.5 py-1" style={{ height: 160 }}>
                            {yTicks.map((val, idx) => (
                              <Text key={idx} className="text-white/40 font-mono text-[9px] font-semibold">
                                {val}
                              </Text>
                            ))}
                          </View>
                        );
                      })()}

                      {/* Main Chart Area */}
                      <View className="flex-1 relative" style={{ height: 200 }}>
                        {/* Background Horizontal Grid Lines */}
                        <View className="absolute inset-0 justify-between py-1 pointer-events-none" style={{ height: 160 }}>
                          {[0, 1, 2, 3, 4].map((i) => (
                            <View key={i} className="w-full border-b border-white/10" />
                          ))}
                        </View>

                        {/* 4 Vertical Bar Columns */}
                        <View className="flex-row items-end justify-around h-[160px] w-full px-1">
                          {(() => {
                            const maxCount = Math.max(...staffAttendanceDistribution.map((t) => t.count), 10);
                            const maxY = Math.ceil(maxCount / 5) * 5 || 20;

                            return staffAttendanceDistribution.map((tier) => {
                              const isSelected = selectedStaffDistTier === tier.tier;
                              const barHeight = Math.max(8, (tier.count / maxY) * 140);

                              return (
                                <Pressable
                                  key={tier.tier}
                                  onPress={() => setSelectedStaffDistTier(isSelected ? null : tier.tier)}
                                  className="items-center justify-end h-full relative"
                                  style={{
                                    flex: 1,
                                    maxWidth: 70,
                                    marginHorizontal: 3,
                                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                                    borderRadius: 10,
                                    paddingBottom: 0,
                                  }}
                                >
                                  {/* Floating Top Count Badge */}
                                  {isSelected && (
                                    <View
                                      style={{
                                        position: 'absolute',
                                        bottom: barHeight + 4,
                                        alignItems: 'center',
                                        zIndex: 10,
                                      }}
                                    >
                                      <View
                                        style={{
                                          backgroundColor: tier.color,
                                          paddingHorizontal: 6,
                                          paddingVertical: 2,
                                          borderRadius: 6,
                                          shadowColor: tier.color,
                                          shadowOffset: { width: 0, height: 2 },
                                          shadowOpacity: 0.4,
                                          shadowRadius: 4,
                                          elevation: 4,
                                        }}
                                      >
                                        <Text
                                          style={{ color: '#101415', fontSize: 10, fontWeight: '900', fontFamily: 'monospace' }}
                                        >
                                          {tier.count}
                                        </Text>
                                      </View>
                                    </View>
                                  )}

                                  {/* Bar Body */}
                                  <View
                                    style={{
                                      height: barHeight,
                                      width: 28,
                                      backgroundColor: tier.color,
                                      borderTopLeftRadius: 6,
                                      borderTopRightRadius: 6,
                                      opacity: selectedStaffDistTier !== null && !isSelected ? 0.35 : 1,
                                    }}
                                  />
                                </Pressable>
                              );
                            });
                          })()}
                        </View>

                        {/* Baseline Divider */}
                        <View className="w-full border-b border-white/20" />

                        {/* X-Axis Category Labels */}
                        <View className="flex-row justify-around w-full pt-1.5 px-1">
                          {staffAttendanceDistribution.map((tier) => {
                            const isSelected = selectedStaffDistTier === tier.tier;
                            return (
                              <Pressable
                                key={tier.tier}
                                onPress={() => setSelectedStaffDistTier(isSelected ? null : tier.tier)}
                                style={{ flex: 1, maxWidth: 70, alignItems: 'center' }}
                              >
                                <Text
                                  numberOfLines={1}
                                  style={{ color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)' }}
                                  className={`text-[10px] text-center ${isSelected ? 'font-black' : 'font-semibold'}`}
                                >
                                  {tier.tier}
                                </Text>
                                <Text
                                  style={{ color: isSelected ? tier.color : 'rgba(255, 255, 255, 0.4)' }}
                                  className="text-[8.5px] font-mono text-center font-bold"
                                >
                                  {tier.tier === 'Excellent'
                                    ? '>90%'
                                    : tier.tier === 'Good'
                                      ? '80-90%'
                                      : tier.tier === 'Satisfactory'
                                        ? '60-80%'
                                        : '<60%'}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  </GlassCard>

                  {/* Chart 2: Overall Status Breakdown Donut */}
                  <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                    <View className="flex-row items-center justify-between mb-2">
                      <View>
                        <Text className="text-white font-extrabold text-sm md:text-base">
                          Overall Status Breakdown
                        </Text>
                        <Text className="text-white/60 text-xs mt-0.5">
                          Daily attendance breakdown by present, late & leaves
                        </Text>
                      </View>
                      <View className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                        <Text className="text-emerald-300 text-[10px] font-black">Live Status</Text>
                      </View>
                    </View>

                    {/* Circular Donut Graphic */}
                    <View className="items-center justify-center py-2 relative">
                      <View className="relative w-[160px] h-[160px] items-center justify-center">
                        <Svg width={160} height={160} viewBox="0 0 160 160">
                          {(() => {
                            const totalSum = staffStatusBreakdown.reduce((acc, cur) => acc + cur.percentage, 0);
                            const totalGapDegrees = 56; // 14 degrees gap between each of the 4 segments
                            const availableDegrees = 360 - totalGapDegrees;
                            let currentAngle = 10;

                            const polarToCartesian = (cx: number, cy: number, r: number, angleInDeg: number) => {
                              const rad = ((angleInDeg - 90) * Math.PI) / 180.0;
                              return {
                                x: cx + r * Math.cos(rad),
                                y: cy + r * Math.sin(rad),
                              };
                            };

                            const describeArc = (cx: number, cy: number, r: number, startA: number, endA: number) => {
                              const start = polarToCartesian(cx, cy, r, endA);
                              const end = polarToCartesian(cx, cy, r, startA);
                              const largeArc = endA - startA <= 180 ? '0' : '1';
                              return ['M', start.x, start.y, 'A', r, r, 0, largeArc, 0, end.x, end.y].join(' ');
                            };

                            return staffStatusBreakdown.map((group, idx) => {
                              const isSelected = selectedStaffPieIdx === idx;
                              const sliceAngle = (group.percentage / totalSum) * availableDegrees;
                              const startAngle = currentAngle;
                              const endAngle = currentAngle + sliceAngle;
                              currentAngle = endAngle + 14;

                              const pathD = describeArc(80, 80, 54, startAngle, endAngle);

                              return (
                                <Path
                                  key={group.name}
                                  d={pathD}
                                  stroke={group.color}
                                  strokeWidth={isSelected ? 16 : 11}
                                  strokeLinecap="round"
                                  fill="none"
                                  opacity={selectedStaffPieIdx !== null && !isSelected ? 0.35 : 1}
                                  onPress={() => setSelectedStaffPieIdx(isSelected ? null : idx)}
                                />
                              );
                            });
                          })()}
                        </Svg>

                        {/* Center Stats Hole */}
                        <Pressable
                          onPress={() => setSelectedStaffPieIdx(null)}
                          style={{
                            position: 'absolute',
                            width: 82,
                            height: 82,
                            borderRadius: 41,
                            backgroundColor: '#14181a',
                            borderWidth: selectedStaffPieIdx !== null ? 2 : 1,
                            borderColor: selectedStaffPieIdx !== null ? staffStatusBreakdown[selectedStaffPieIdx].color : 'rgba(255, 255, 255, 0.15)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {selectedStaffPieIdx !== null ? (
                            <>
                              <Text style={{ color: staffStatusBreakdown[selectedStaffPieIdx].color }} className="text-xl font-black font-mono">
                                {staffStatusBreakdown[selectedStaffPieIdx].percentage}%
                              </Text>
                              <Text numberOfLines={1} style={{ color: staffStatusBreakdown[selectedStaffPieIdx].color }} className="font-extrabold text-[8.5px] text-center px-1 mt-0.5">
                                {staffStatusBreakdown[selectedStaffPieIdx].name}
                              </Text>
                            </>
                          ) : (
                            <>
                              <Text className="text-emerald-400 text-xl font-black font-mono">88%</Text>
                              <Text className="text-white/60 font-extrabold text-[8.5px] uppercase mt-0.5">Present</Text>
                            </>
                          )}
                        </Pressable>
                      </View>
                    </View>

                    {/* Status Legend Pills Below */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 10 }}>
                      {staffStatusBreakdown.map((group, idx) => {
                        const isSelected = selectedStaffPieIdx === idx;
                        return (
                          <Pressable
                            key={group.name}
                            onPress={() => setSelectedStaffPieIdx(isSelected ? null : idx)}
                            style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                          >
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                borderRadius: 12,
                                borderWidth: isSelected ? 1.5 : 1,
                                borderColor: isSelected ? group.color : 'rgba(255, 255, 255, 0.3)',
                                backgroundColor: isSelected ? `${group.color}25` : 'rgba(255, 255, 255, 0.07)',
                              }}
                            >
                              <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: group.color, marginRight: 5 }} />
                              <Text style={{ color: isSelected ? '#ffffff' : '#f3f4f6', fontSize: 10.5, fontWeight: '700', marginRight: 5 }}>
                                {group.name}
                              </Text>
                              <Text style={{ color: group.color, fontSize: 10.5, fontWeight: '900', fontFamily: 'monospace' }}>
                                {group.percentage}%
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </GlassCard>
                </View>

                {/* Detailed Attendance Roster & Matrix Section */}
                <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                  {(() => {
                    const isSingleDate = staffStartDate.trim() === staffEndDate.trim();

                    return (
                      <>
                        {/* Section Header (Responsive 2-Row Layout to Prevent UI Breaking) */}
                        <View className="mb-3.5 gap-2">
                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2 flex-1 mr-2">
                              <Text className="text-[#ffe5a0] text-xs md:text-sm font-extrabold uppercase tracking-wider">
                                DETAILED ATTENDANCE DATA
                              </Text>
                              <View className="px-2 py-0.5 rounded-full bg-[#ffe5a0]/20 border border-[#ffe5a0]/30">
                                <Text className="text-[#ffe5a0] text-[10px] font-black font-mono">
                                  {filteredStaffList.length}
                                </Text>
                              </View>
                            </View>
                            <View
                              className={`px-2 py-0.5 rounded-md border ${isSingleDate ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-sky-500/20 border-sky-500/40'
                                }`}
                            >
                              <Text className={`text-[9.5px] font-black ${isSingleDate ? 'text-emerald-300' : 'text-sky-300'}`}>
                                {isSingleDate ? 'Single Day' : 'Range Summary'}
                              </Text>
                            </View>
                          </View>

                          <View className="flex-row items-center justify-between pt-1.5 border-t border-white/5">
                            <Text className="text-white/50 text-[10.5px] font-mono flex-1 mr-2" numberOfLines={1}>
                              {isSingleDate ? `Date: ${staffStartDate}` : `${staffStartDate} to ${staffEndDate}`}
                            </Text>

                            <View className="flex-row items-center gap-2">
                              {/* Layout Switcher */}
                              <Pressable
                                onPress={() => setStaffLayoutMode(staffLayoutMode === 'cards' ? 'table' : 'cards')}
                                className="px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/15 flex-row items-center gap-1.5 active:bg-white/20"
                              >
                                <SlidersHorizontal size={12} color="#ffffff" />
                                <Text className="text-white text-xs font-bold">
                                  {staffLayoutMode === 'cards' ? 'Table' : 'Cards'}
                                </Text>
                              </Pressable>

                              {/* Export Button */}
                              <Pressable
                                onPress={() => handleExportReport('staff_att', 'Faculty Attendance Analytics Report')}
                                className="px-3 py-1.5 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 flex-row items-center gap-1.5 active:bg-[#f0c110]/30"
                              >
                                <Download size={12} color="#ffe5a0" />
                                <Text className="text-[#ffe5a0] text-xs font-bold">Export</Text>
                              </Pressable>
                            </View>
                          </View>
                        </View>

                        {/* CARDS VIEW */}
                        {staffLayoutMode === 'cards' && (
                          <View className="gap-3">
                            {filteredStaffList.map((s) => (
                              <View
                                key={s.id}
                                className="bg-black/40 p-3.5 rounded-2xl border border-white/10"
                              >
                                {isSingleDate ? (
                                  /* SINGLE DAY CARD FORMAT */
                                  <>
                                    {/* Top Row: Avatar, Name, Designation & Status */}
                                    <View className="flex-row justify-between items-start mb-2.5">
                                      <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                                        <View className="w-9 h-9 rounded-xl bg-[#38bdf8]/20 border border-[#38bdf8]/40 items-center justify-center">
                                          <Text className="text-[#38bdf8] font-black text-xs">
                                            {s.name.substring(0, 2).toUpperCase()}
                                          </Text>
                                        </View>
                                        <View className="flex-1">
                                          <Text className="text-white font-extrabold text-sm" numberOfLines={1}>
                                            {s.name}
                                          </Text>
                                          <Text className="text-white/50 text-[10.5px] mt-0.5" numberOfLines={1}>
                                            {s.role}
                                          </Text>
                                        </View>
                                      </View>

                                      <View
                                        className={`px-2.5 py-0.5 rounded-lg border ${s.status === 'Present'
                                          ? 'bg-emerald-500/20 border-emerald-500/30'
                                          : s.status === 'Late'
                                            ? 'bg-amber-500/20 border-amber-500/30'
                                            : s.status === 'Half Day'
                                              ? 'bg-sky-500/20 border-sky-500/30'
                                              : 'bg-purple-500/20 border-purple-500/30'
                                          }`}
                                      >
                                        <Text
                                          className={`text-[11px] font-extrabold ${s.status === 'Present'
                                            ? 'text-emerald-400'
                                            : s.status === 'Late'
                                              ? 'text-amber-400'
                                              : s.status === 'Half Day'
                                                ? 'text-sky-300'
                                                : 'text-purple-300'
                                            }`}
                                        >
                                          {s.status}
                                        </Text>
                                      </View>
                                    </View>

                                    {/* Middle Row: Check-In, Check-Out & Duration */}
                                    <View className="flex-row items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 mb-2.5">
                                      <View className="flex-1 items-start">
                                        <Text className="text-white/40 text-[9px] uppercase font-bold">Check-In</Text>
                                        <View className="flex-row items-center gap-1 mt-0.5">
                                          <Text className="text-[#41eec2] font-mono font-bold text-xs">{s.checkIn}</Text>
                                          {s.isLate && (
                                            <View className="px-1 py-0.2 rounded bg-amber-500/30">
                                              <Text className="text-amber-300 text-[8px] font-black">Late</Text>
                                            </View>
                                          )}
                                        </View>
                                      </View>

                                      <View className="flex-1 items-center">
                                        <Text className="text-white/40 text-[9px] uppercase font-bold">Check-Out</Text>
                                        <View className="flex-row items-center gap-1 mt-0.5">
                                          <Text className="text-rose-400 font-mono font-bold text-xs">{s.checkOut}</Text>
                                          {s.isEarly && (
                                            <View className="px-1 py-0.2 rounded bg-amber-500/30">
                                              <Text className="text-amber-300 text-[8px] font-black">Early</Text>
                                            </View>
                                          )}
                                        </View>
                                      </View>

                                      <View className="flex-1 items-end">
                                        <Text className="text-white/40 text-[9px] uppercase font-bold">Hours</Text>
                                        <Text className="text-white font-mono font-extrabold text-xs mt-0.5">{s.hours}</Text>
                                      </View>
                                    </View>

                                    {/* Bottom Row: Category & Department + Emp ID */}
                                    <View className="flex-row justify-between items-center pt-2 border-t border-white/5">
                                      <Text className="text-white/60 text-[10.5px]" numberOfLines={1}>
                                        Dept: <Text className="text-white font-bold">{s.dept}</Text>
                                      </Text>
                                      <Text className="text-white/60 text-[10.5px] font-mono">
                                        Emp ID: <Text className="text-white font-bold">{s.empId}</Text>
                                      </Text>
                                    </View>
                                  </>
                                ) : (
                                  /* MULTI-DAY RANGE SUMMARY CARD FORMAT */
                                  <>
                                    {/* Top Row: Avatar, Name, Designation & % Rate */}
                                    <View className="flex-row justify-between items-start mb-2.5">
                                      <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                                        <View className="w-9 h-9 rounded-xl bg-[#38bdf8]/20 border border-[#38bdf8]/40 items-center justify-center">
                                          <Text className="text-[#38bdf8] font-black text-xs">
                                            {s.name.substring(0, 2).toUpperCase()}
                                          </Text>
                                        </View>
                                        <View className="flex-1">
                                          <Text className="text-white font-extrabold text-sm" numberOfLines={1}>
                                            {s.name}
                                          </Text>
                                          <Text className="text-white/50 text-[10.5px] mt-0.5" numberOfLines={1}>
                                            {s.role} • {s.dept}
                                          </Text>
                                        </View>
                                      </View>

                                      <View className="items-end">
                                        <View className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                                          <Text className="text-emerald-400 text-xs font-black font-mono">
                                            {s.attendancePct}%
                                          </Text>
                                        </View>
                                        <Text className="text-white/40 text-[8.5px] font-bold uppercase mt-0.5">
                                          Attendance
                                        </Text>
                                      </View>
                                    </View>

                                    {/* 2-Row 3-Column Stats Grid (Guaranteed No Overlap) */}
                                    <View className="p-2.5 rounded-xl bg-white/5 border border-white/5 mb-2.5 gap-2">
                                      {/* Row 1: Working, Present, Late */}
                                      <View className="flex-row items-center justify-between">
                                        <View className="flex-1 items-start">
                                          <Text className="text-white/40 text-[9px] uppercase font-bold">Working</Text>
                                          <Text className="text-white font-bold text-xs font-mono mt-0.5">{s.workDays}d</Text>
                                        </View>
                                        <View className="flex-1 items-center">
                                          <Text className="text-white/40 text-[9px] uppercase font-bold">Present</Text>
                                          <Text className="text-[#41eec2] font-black text-xs font-mono mt-0.5">{s.presentDays}d</Text>
                                        </View>
                                        <View className="flex-1 items-end">
                                          <Text className="text-white/40 text-[9px] uppercase font-bold">Late</Text>
                                          <Text className="text-amber-400 font-bold text-xs font-mono mt-0.5">{s.lateDays}d</Text>
                                        </View>
                                      </View>

                                      {/* Divider */}
                                      <View className="w-full border-b border-white/5" />

                                      {/* Row 2: Half, Absent, Leave */}
                                      <View className="flex-row items-center justify-between">
                                        <View className="flex-1 items-start">
                                          <Text className="text-white/40 text-[9px] uppercase font-bold">Half Day</Text>
                                          <Text className="text-sky-300 font-bold text-xs font-mono mt-0.5">{s.halfDays}d</Text>
                                        </View>
                                        <View className="flex-1 items-center">
                                          <Text className="text-white/40 text-[9px] uppercase font-bold">Absent</Text>
                                          <Text className="text-rose-400 font-bold text-xs font-mono mt-0.5">{s.absentDays}d</Text>
                                        </View>
                                        <View className="flex-1 items-end">
                                          <Text className="text-white/40 text-[9px] uppercase font-bold">Leave</Text>
                                          <Text className="text-purple-300 font-bold text-xs font-mono mt-0.5">{s.leaveDays}d</Text>
                                        </View>
                                      </View>
                                    </View>

                                    {/* Bottom Row: Emp ID & Achievement Tier */}
                                    <View className="flex-row justify-between items-center pt-2 border-t border-white/5">
                                      <Text className="text-white/60 text-[10.5px] font-mono">
                                        Emp ID: <Text className="text-white font-bold">{s.empId}</Text>
                                      </Text>
                                      <Text className="text-white/60 text-[10.5px]">
                                        Tier: <Text style={{ color: s.distTier === 'Excellent' ? '#10b981' : '#38bdf8' }} className="font-bold">{s.distTier}</Text>
                                      </Text>
                                    </View>
                                  </>
                                )}
                              </View>
                            ))}
                          </View>
                        )}

                        {/* MATRIX TABLE VIEW (EXACT WEB PARITY & CRISP SPREADSHEET STRUCTURE) */}
                        {staffLayoutMode === 'table' && (
                          <ScrollView horizontal showsHorizontalScrollIndicator={true} className="pb-1">
                            <View
                              style={{
                                minWidth: isSingleDate ? 810 : 280 + staffReportMonths.length * 356 + 362,
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.15)',
                                overflow: 'hidden',
                                backgroundColor: 'rgba(8, 12, 16, 0.85)',
                              }}
                            >
                              {isSingleDate ? (
                                /* ================= SINGLE DAY TABLE FORMAT ================= */
                                <View style={{ width: 810 }}>
                                  {/* Table Header Row */}
                                  <View style={{ flexDirection: 'row', alignItems: 'stretch', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.15)' }}>
                                    <View style={{ width: 200, minWidth: 200, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                      <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Staff Member
                                      </Text>
                                    </View>
                                    <View style={{ width: 170, minWidth: 170, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                      <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Category & Dept
                                      </Text>
                                    </View>
                                    <View style={{ width: 110, minWidth: 110, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                      <Text style={{ color: '#5eead4', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Check-In
                                      </Text>
                                    </View>
                                    <View style={{ width: 110, minWidth: 110, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                      <Text style={{ color: '#fda4af', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Check-Out
                                      </Text>
                                    </View>
                                    <View style={{ width: 105, minWidth: 105, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                      <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Working Hours
                                      </Text>
                                    </View>
                                    <View style={{ width: 115, minWidth: 115, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, alignSelf: 'stretch' }}>
                                      <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Status
                                      </Text>
                                    </View>
                                  </View>

                                  {/* Table Body Rows */}
                                  <View>
                                    {filteredStaffList.map((s, idx) => (
                                      <View
                                        key={s.id}
                                        style={{
                                          flexDirection: 'row',
                                          alignItems: 'stretch',
                                          borderBottomWidth: idx === filteredStaffList.length - 1 ? 0 : 1,
                                          borderBottomColor: 'rgba(255, 255, 255, 0.15)',
                                          backgroundColor: idx % 2 === 1 ? 'rgba(255, 255, 255, 0.025)' : 'transparent',
                                        }}
                                      >
                                        {/* Staff Member (Avatar + Name + Role) */}
                                        <View style={{ width: 200, minWidth: 200, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(56, 189, 248, 0.2)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.4)', alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={{ color: '#38bdf8', fontWeight: '900', fontSize: 11 }}>
                                              {s.name.substring(0, 2).toUpperCase()}
                                            </Text>
                                          </View>
                                          <View style={{ flex: 1 }}>
                                            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }} numberOfLines={1}>
                                              {s.name}
                                            </Text>
                                            <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 10, marginTop: 1 }} numberOfLines={1}>
                                              {s.role}
                                            </Text>
                                          </View>
                                        </View>

                                        {/* Category & Department */}
                                        <View style={{ width: 170, minWidth: 170, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 11.5 }} numberOfLines={1}>
                                            {s.category}
                                          </Text>
                                          <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 10, marginTop: 1 }} numberOfLines={1}>
                                            {s.dept}
                                          </Text>
                                        </View>

                                        {/* Check-In */}
                                        <View style={{ width: 110, minWidth: 110, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: '#41eec2', fontFamily: 'monospace', fontWeight: '700', fontSize: 12 }}>
                                            {s.checkIn}
                                          </Text>
                                          {s.isLate && (
                                            <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, backgroundColor: 'rgba(245, 158, 11, 0.3)', marginTop: 2 }}>
                                              <Text style={{ color: '#fcd34d', fontSize: 8, fontWeight: '900' }}>Late</Text>
                                            </View>
                                          )}
                                        </View>

                                        {/* Check-Out */}
                                        <View style={{ width: 110, minWidth: 110, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: '#fb7185', fontFamily: 'monospace', fontWeight: '700', fontSize: 12 }}>
                                            {s.checkOut}
                                          </Text>
                                          {s.isEarly && (
                                            <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, backgroundColor: 'rgba(245, 158, 11, 0.3)', marginTop: 2 }}>
                                              <Text style={{ color: '#fcd34d', fontSize: 8, fontWeight: '900' }}>Early</Text>
                                            </View>
                                          )}
                                        </View>

                                        {/* Working Hours */}
                                        <View style={{ width: 105, minWidth: 105, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: '700', fontSize: 12 }}>
                                            {s.hours}
                                          </Text>
                                        </View>

                                        {/* Status */}
                                        <View style={{ width: 115, minWidth: 115, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, alignSelf: 'stretch' }}>
                                          <View
                                            style={{
                                              paddingHorizontal: 10,
                                              paddingVertical: 3.5,
                                              borderRadius: 20,
                                              backgroundColor:
                                                s.status === 'Present'
                                                  ? 'rgba(16, 185, 129, 0.2)'
                                                  : s.status === 'Late'
                                                    ? 'rgba(245, 158, 11, 0.2)'
                                                    : s.status === 'Half Day'
                                                      ? 'rgba(56, 189, 248, 0.2)'
                                                      : s.status === 'Leave'
                                                        ? 'rgba(192, 132, 252, 0.2)'
                                                        : 'rgba(244, 63, 94, 0.2)',
                                              borderWidth: 1,
                                              borderColor:
                                                s.status === 'Present'
                                                  ? 'rgba(16, 185, 129, 0.35)'
                                                  : s.status === 'Late'
                                                    ? 'rgba(245, 158, 11, 0.35)'
                                                    : s.status === 'Half Day'
                                                      ? 'rgba(56, 189, 248, 0.35)'
                                                      : s.status === 'Leave'
                                                        ? 'rgba(192, 132, 252, 0.35)'
                                                        : 'rgba(244, 63, 94, 0.35)',
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: 10,
                                                fontWeight: '800',
                                                color:
                                                  s.status === 'Present'
                                                    ? '#6ee7b7'
                                                    : s.status === 'Late'
                                                      ? '#fcd34d'
                                                      : s.status === 'Half Day'
                                                        ? '#7dd3fc'
                                                        : s.status === 'Leave'
                                                          ? '#d8b4fe'
                                                          : '#fda4af',
                                              }}
                                            >
                                              {s.status}
                                            </Text>
                                          </View>
                                        </View>
                                      </View>
                                    ))}
                                  </View>
                                </View>
                              ) : (
                                /* ================= MULTI-DAY SUMMARY TABLE FORMAT (EXACT WEB PARITY) ================= */
                                <View style={{ width: 280 + staffReportMonths.length * 356 + 362 }}>
                                  {/* Super Header Row 1 (Top Category Row) */}
                                  <View style={{ flexDirection: 'row', alignItems: 'stretch', backgroundColor: 'rgba(255, 255, 255, 0.12)', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.15)' }}>
                                    {/* Faculty Info Super Header */}
                                    <View style={{ width: 280, minWidth: 280, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                      <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                                        Faculty Info
                                      </Text>
                                    </View>

                                    {/* Dynamic Month Super Headers */}
                                    {staffReportMonths.map((m) => (
                                      <View
                                        key={m}
                                        style={{
                                          width: 356,
                                          minWidth: 356,
                                          paddingVertical: 10,
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          alignSelf: 'stretch',
                                          borderRightWidth: 1,
                                          borderRightColor: 'rgba(255, 255, 255, 0.15)',
                                          backgroundColor: 'rgba(56, 189, 248, 0.08)',
                                        }}
                                      >
                                        <Text style={{ color: '#38bdf8', fontSize: 11.5, fontWeight: '800', letterSpacing: 0.4 }}>
                                          {m}
                                        </Text>
                                      </View>
                                    ))}

                                    {/* Overall Summary Super Header */}
                                    <View style={{ width: 362, minWidth: 362, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', backgroundColor: 'rgba(255, 229, 160, 0.08)' }}>
                                      <Text style={{ color: '#ffe5a0', fontSize: 11.5, fontWeight: '800', letterSpacing: 0.4 }}>
                                        Overall Summary
                                      </Text>
                                    </View>
                                  </View>

                                  {/* Sub Header Row 2 (Column Headers Row) */}
                                  <View style={{ flexDirection: 'row', alignItems: 'stretch', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.15)' }}>
                                    {/* Name */}
                                    <View style={{ width: 180, minWidth: 180, paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                      <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 10.5, fontWeight: '700' }}>
                                        Name
                                      </Text>
                                    </View>

                                    {/* Bio/Emp ID */}
                                    <View style={{ width: 100, minWidth: 100, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                      <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 10.5, fontWeight: '700' }}>
                                        Bio/Emp ID
                                      </Text>
                                    </View>

                                    {/* Month Sub Headers (Work, Present, Late, Half, Absent, Leave, %) */}
                                    {staffReportMonths.map((m) => (
                                      <React.Fragment key={m + '_sub'}>
                                        <View style={{ width: 50, minWidth: 50, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 10, fontWeight: '700' }}>Work</Text>
                                        </View>
                                        <View style={{ width: 54, minWidth: 54, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: '#5eead4', fontSize: 10, fontWeight: '700' }}>Present</Text>
                                        </View>
                                        <View style={{ width: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: '#fbbf24', fontSize: 10, fontWeight: '700' }}>Late</Text>
                                        </View>
                                        <View style={{ width: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: '#38bdf8', fontSize: 10, fontWeight: '700' }}>Half</Text>
                                        </View>
                                        <View style={{ width: 50, minWidth: 50, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: '#fda4af', fontSize: 10, fontWeight: '700' }}>Absent</Text>
                                        </View>
                                        <View style={{ width: 50, minWidth: 50, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: '#c084fc', fontSize: 10, fontWeight: '700' }}>Leave</Text>
                                        </View>
                                        <View style={{ width: 56, minWidth: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>%</Text>
                                        </View>
                                      </React.Fragment>
                                    ))}

                                    {/* Overall Summary Sub Headers (Working, Present, Late, Half, Absent, Leave, %) */}
                                    <View style={{ width: 54, minWidth: 54, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                      <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 10, fontWeight: '700' }}>Working</Text>
                                    </View>
                                    <View style={{ width: 54, minWidth: 54, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                      <Text style={{ color: '#5eead4', fontSize: 10, fontWeight: '700' }}>Present</Text>
                                    </View>
                                    <View style={{ width: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                      <Text style={{ color: '#fbbf24', fontSize: 10, fontWeight: '700' }}>Late</Text>
                                    </View>
                                    <View style={{ width: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                      <Text style={{ color: '#38bdf8', fontSize: 10, fontWeight: '700' }}>Half</Text>
                                    </View>
                                    <View style={{ width: 50, minWidth: 50, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                      <Text style={{ color: '#fda4af', fontSize: 10, fontWeight: '700' }}>Absent</Text>
                                    </View>
                                    <View style={{ width: 50, minWidth: 50, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                      <Text style={{ color: '#c084fc', fontSize: 10, fontWeight: '700' }}>Leave</Text>
                                    </View>
                                    <View style={{ width: 58, minWidth: 58, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, alignSelf: 'stretch' }}>
                                      <Text style={{ color: '#ffe5a0', fontSize: 10, fontWeight: '900' }}>%</Text>
                                    </View>
                                  </View>

                                  {/* Table Body Rows */}
                                  <View>
                                    {filteredStaffList.map((s, idx) => (
                                      <View
                                        key={s.id}
                                        style={{
                                          flexDirection: 'row',
                                          alignItems: 'stretch',
                                          borderBottomWidth: idx === filteredStaffList.length - 1 ? 0 : 1,
                                          borderBottomColor: 'rgba(255, 255, 255, 0.15)',
                                          backgroundColor: idx % 2 === 1 ? 'rgba(255, 255, 255, 0.025)' : 'transparent',
                                        }}
                                      >
                                        {/* Name */}
                                        <View style={{ width: 180, minWidth: 180, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <View style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(56, 189, 248, 0.2)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.4)', alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={{ color: '#38bdf8', fontWeight: '900', fontSize: 10.5 }}>
                                              {s.name.substring(0, 2).toUpperCase()}
                                            </Text>
                                          </View>
                                          <View style={{ flex: 1 }}>
                                            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11.5 }} numberOfLines={1}>
                                              {s.name}
                                            </Text>
                                            <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 9.5, marginTop: 1 }} numberOfLines={1}>
                                              {s.role}
                                            </Text>
                                          </View>
                                        </View>

                                        {/* Bio/Emp ID */}
                                        <View style={{ width: 100, minWidth: 100, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'monospace', fontWeight: '700', fontSize: 11 }} numberOfLines={1}>
                                            {s.empId}
                                          </Text>
                                        </View>

                                        {/* Monthly Data Cells */}
                                        {staffReportMonths.map((m) => {
                                          const mData = s.monthlyData?.[m] || {
                                            workDays: 24,
                                            present: s.presentDays,
                                            late: s.lateDays,
                                            half: s.halfDays,
                                            absent: s.absentDays,
                                            leave: s.leaveDays,
                                            percentage: `${s.attendancePct}%`,
                                          };
                                          return (
                                            <React.Fragment key={m + '_' + s.id}>
                                              <View style={{ width: 50, minWidth: 50, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                                <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontFamily: 'monospace', fontSize: 11.5, fontWeight: '600' }}>
                                                  {mData.workDays}
                                                </Text>
                                              </View>
                                              <View style={{ width: 54, minWidth: 54, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                                <Text style={{ color: '#41eec2', fontFamily: 'monospace', fontWeight: '800', fontSize: 11.5 }}>
                                                  {mData.present}
                                                </Text>
                                              </View>
                                              <View style={{ width: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                                <Text style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: '700', fontSize: 11.5 }}>
                                                  {mData.late}
                                                </Text>
                                              </View>
                                              <View style={{ width: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                                <Text style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: '700', fontSize: 11.5 }}>
                                                  {mData.half}
                                                </Text>
                                              </View>
                                              <View style={{ width: 50, minWidth: 50, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                                <Text style={{ color: '#fb7185', fontFamily: 'monospace', fontWeight: '700', fontSize: 11.5 }}>
                                                  {mData.absent}
                                                </Text>
                                              </View>
                                              <View style={{ width: 50, minWidth: 50, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                                <Text style={{ color: '#c084fc', fontFamily: 'monospace', fontWeight: '700', fontSize: 11.5 }}>
                                                  {mData.leave}
                                                </Text>
                                              </View>
                                              <View style={{ width: 56, minWidth: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                                <Text style={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: '800', fontSize: 11.5 }}>
                                                  {mData.percentage}
                                                </Text>
                                              </View>
                                            </React.Fragment>
                                          );
                                        })}

                                        {/* Overall Summary Cells */}
                                        <View style={{ width: 54, minWidth: 54, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontFamily: 'monospace', fontSize: 11.5, fontWeight: '600' }}>
                                            {s.overallData?.workDays || s.workDays}
                                          </Text>
                                        </View>
                                        <View style={{ width: 54, minWidth: 54, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: '#41eec2', fontFamily: 'monospace', fontWeight: '900', fontSize: 11.5 }}>
                                            {s.overallData?.present || s.presentDays}
                                          </Text>
                                        </View>
                                        <View style={{ width: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: '700', fontSize: 11.5 }}>
                                            {s.overallData?.late || s.lateDays}
                                          </Text>
                                        </View>
                                        <View style={{ width: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: '700', fontSize: 11.5 }}>
                                            {s.overallData?.half || s.halfDays}
                                          </Text>
                                        </View>
                                        <View style={{ width: 50, minWidth: 50, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: '#fb7185', fontFamily: 'monospace', fontWeight: '700', fontSize: 11.5 }}>
                                            {s.overallData?.absent || s.absentDays}
                                          </Text>
                                        </View>
                                        <View style={{ width: 50, minWidth: 50, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                          <Text style={{ color: '#c084fc', fontFamily: 'monospace', fontWeight: '700', fontSize: 11.5 }}>
                                            {s.overallData?.leave || s.leaveDays}
                                          </Text>
                                        </View>
                                        <View style={{ width: 58, minWidth: 58, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, alignSelf: 'stretch' }}>
                                          <Text style={{ color: '#10b981', fontFamily: 'monospace', fontWeight: '900', fontSize: 11.5 }}>
                                            {s.overallData?.percentage || `${s.attendancePct}%`}
                                          </Text>
                                        </View>
                                      </View>
                                    ))}
                                  </View>
                                </View>
                              )}
                            </View>
                          </ScrollView>
                        )}

                        {filteredStaffList.length === 0 && (
                          <View className="py-8 items-center justify-center">
                            <Users size={32} color="rgba(255,255,255,0.2)" />
                            <Text className="text-white/60 font-bold text-xs mt-2">No faculty members matched your filter.</Text>
                          </View>
                        )}
                      </>
                    );
                  })()}
                </GlassCard>
              </View>
            )}

            {/* SCREEN 4: STUDENT DATA REPORT */}
            {selectedSection === 'student' && (
              <View className="gap-5">
                {/* Top KPI Metrics for Students */}
                <View className="flex-row gap-2.5">
                  <GlassCard className="flex-1 p-3.5 border border-white/10 items-center rounded-2xl" intensity="low">
                    <Text className="text-white font-black text-xl md:text-2xl">{filteredStudents.length}</Text>
                    <Text className="text-white/70 text-[11px] uppercase font-bold mt-1 text-center">Total Students</Text>
                  </GlassCard>

                  <GlassCard className="flex-1 p-3.5 border border-white/10 items-center rounded-2xl" intensity="low">
                    <Text className="text-sky-400 font-black text-xl md:text-2xl">
                      {filteredStudents.filter((s) => s.gender === 'Male' || s.gender === 'Boy').length}
                    </Text>
                    <Text className="text-white/70 text-[11px] uppercase font-bold mt-1 text-center">Boys</Text>
                  </GlassCard>

                  <GlassCard className="flex-1 p-3.5 border border-white/10 items-center rounded-2xl" intensity="low">
                    <Text className="text-pink-400 font-black text-xl md:text-2xl">
                      {filteredStudents.filter((s) => s.gender === 'Female' || s.gender === 'Girl').length}
                    </Text>
                    <Text className="text-white/70 text-[11px] uppercase font-bold mt-1 text-center">Girls</Text>
                  </GlassCard>

                  <GlassCard className="flex-1 p-3.5 border border-white/10 items-center rounded-2xl" intensity="low">
                    <Text className="text-emerald-400 font-black text-xl md:text-2xl">
                      {filteredStudents.filter((s) => s.displayStatus === 'Active').length}
                    </Text>
                    <Text className="text-white/70 text-[11px] uppercase font-bold mt-1 text-center">Active</Text>
                  </GlassCard>
                </View>

                {/* Filter Controls Card with 3 Dropdowns */}
                <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                  <View className="gap-3.5">
                    {/* Search Input */}
                    <View className="bg-black/50 border border-white/15 rounded-2xl px-4 py-2.5 flex-row items-center gap-3">
                      <Search size={16} color="rgba(255,255,255,0.5)" />
                      <TextInput
                        value={studentSearch}
                        onChangeText={setStudentSearch}
                        placeholder="Search student by name, roll, father, PEN no..."
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        className="flex-1 text-white text-xs md:text-sm font-medium p-0"
                      />
                      {studentSearch ? (
                        <Pressable onPress={() => setStudentSearch('')}>
                          <X size={16} color="#fff" />
                        </Pressable>
                      ) : null}
                    </View>

                    {/* 3 Dropdown Style Filter Selectors */}
                    <View className="flex-row gap-2.5">
                      {/* Academic Year Dropdown Button */}
                      <Pressable
                        onPress={() => setShowStudentYearDropdown(true)}
                        className="flex-1 p-2.5 rounded-xl bg-black/40 border border-white/15 flex-row items-center justify-between active:bg-white/5"
                      >
                        <View className="flex-1 mr-1">
                          <Text className="text-white/40 text-[9.5px] uppercase font-extrabold">Academic Year</Text>
                          <Text className="text-[#ffe5a0] text-xs font-bold mt-0.5" numberOfLines={1}>
                            {studentYearFilter === 'All' ? 'All Years' : studentYearFilter}
                          </Text>
                        </View>
                        <ChevronDown size={14} color="#ffe5a0" />
                      </Pressable>

                      {/* Class Dropdown Button */}
                      <Pressable
                        onPress={() => setShowStudentClassDropdown(true)}
                        className="flex-1 p-2.5 rounded-xl bg-black/40 border border-white/15 flex-row items-center justify-between active:bg-white/5"
                      >
                        <View className="flex-1 mr-1">
                          <Text className="text-white/40 text-[9.5px] uppercase font-extrabold">Class</Text>
                          <Text className="text-[#ffe5a0] text-xs font-bold mt-0.5" numberOfLines={1}>
                            {studentClassFilter === 'All' ? 'All Classes' : studentClassFilter}
                          </Text>
                        </View>
                        <ChevronDown size={14} color="#ffe5a0" />
                      </Pressable>

                      {/* Status Dropdown Button */}
                      <Pressable
                        onPress={() => setShowStudentStatusDropdown(true)}
                        className="flex-1 p-2.5 rounded-xl bg-black/40 border border-white/15 flex-row items-center justify-between active:bg-white/5"
                      >
                        <View className="flex-1 mr-1">
                          <Text className="text-white/40 text-[9.5px] uppercase font-extrabold">Status</Text>
                          <Text className="text-[#ffe5a0] text-xs font-bold mt-0.5" numberOfLines={1}>
                            {studentStatusFilter === 'All' ? 'All Status' : studentStatusFilter}
                          </Text>
                        </View>
                        <ChevronDown size={14} color="#ffe5a0" />
                      </Pressable>
                    </View>

                    {/* Active Filters Summary & Reset */}
                    {(studentYearFilter !== 'All' || studentClassFilter !== 'All' || studentStatusFilter !== 'All' || studentSearch) && (
                      <View className="flex-row items-center justify-between pt-2 border-t border-white/5">
                        <Text className="text-white/50 text-[11px]">
                          Showing <Text className="text-white font-bold">{filteredStudents.length}</Text> filtered records
                        </Text>
                        <Pressable
                          onPress={() => {
                            setStudentYearFilter('All');
                            setStudentClassFilter('All');
                            setStudentStatusFilter('All');
                            setStudentSearch('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/10 active:bg-white/20"
                        >
                          <Text className="text-[#ffe5a0] text-[10.5px] font-bold">Reset Filters</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </GlassCard>

                {/* Students Data Grid / Cards Section */}
                <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                  <View className="flex-row justify-between items-center mb-3.5">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-[#ffe5a0] text-xs md:text-sm font-extrabold uppercase tracking-wider">
                        STUDENT DATA REPORT
                      </Text>
                      <View className="px-2 py-0.5 rounded-full bg-[#ffe5a0]/20 border border-[#ffe5a0]/30">
                        <Text className="text-[#ffe5a0] text-[10.5px] font-black font-mono">
                          {filteredStudents.length}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-2">
                      {/* Layout Switcher */}
                      <Pressable
                        onPress={() => setStudentLayoutMode(studentLayoutMode === 'cards' ? 'table' : 'cards')}
                        className="px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/15 flex-row items-center gap-1.5 active:bg-white/20"
                      >
                        <SlidersHorizontal size={12} color="#ffffff" />
                        <Text className="text-white text-xs font-bold">
                          {studentLayoutMode === 'cards' ? 'Table' : 'Cards'}
                        </Text>
                      </Pressable>

                      {/* Export Excel Button */}
                      <Pressable
                        onPress={() => handleExportReport('student_data', 'Student Roster Report')}
                        className="px-3 py-1.5 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 flex-row items-center gap-1.5 active:bg-[#f0c110]/30"
                      >
                        <Download size={12} color="#ffe5a0" />
                        <Text className="text-[#ffe5a0] text-xs font-bold">Export Excel</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* SPREADSHEET DATA GRID TABLE VIEW (EXACT WEB PARITY & ENLARGED CRISP TYPOGRAPHY) */}
                  {studentLayoutMode === 'table' && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={true} className="pb-1">
                      <View
                        style={{
                          minWidth: 2010,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: 'rgba(255, 255, 255, 0.15)',
                          overflow: 'hidden',
                          backgroundColor: 'rgba(8, 12, 16, 0.85)',
                        }}
                      >
                        {/* Table Header Row */}
                        <View style={{ flexDirection: 'row', alignItems: 'stretch', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.15)' }}>
                          <View style={{ width: 110, minWidth: 110, paddingHorizontal: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Adm No
                            </Text>
                          </View>
                          <View style={{ width: 220, minWidth: 220, paddingHorizontal: 12, paddingVertical: 12, justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Name
                            </Text>
                          </View>
                          <View style={{ width: 120, minWidth: 120, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              PEN No
                            </Text>
                          </View>
                          <View style={{ width: 115, minWidth: 115, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Adm Date
                            </Text>
                          </View>
                          <View style={{ width: 115, minWidth: 115, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              DOB
                            </Text>
                          </View>
                          <View style={{ width: 125, minWidth: 125, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Age
                            </Text>
                          </View>
                          <View style={{ width: 160, minWidth: 160, paddingHorizontal: 12, paddingVertical: 12, justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Father Name
                            </Text>
                          </View>
                          <View style={{ width: 150, minWidth: 150, paddingHorizontal: 12, paddingVertical: 12, justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Mother Name
                            </Text>
                          </View>
                          <View style={{ width: 135, minWidth: 135, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Parent Mobile
                            </Text>
                          </View>
                          <View style={{ width: 170, minWidth: 170, paddingHorizontal: 12, paddingVertical: 12, justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Address
                            </Text>
                          </View>
                          <View style={{ width: 95, minWidth: 95, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Class
                            </Text>
                          </View>
                          <View style={{ width: 115, minWidth: 115, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Batch
                            </Text>
                          </View>
                          <View style={{ width: 110, minWidth: 110, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Total Fee
                            </Text>
                          </View>
                          <View style={{ width: 110, minWidth: 110, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                            <Text style={{ color: '#5eead4', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Fee Paid
                            </Text>
                          </View>
                          <View style={{ width: 110, minWidth: 110, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                            <Text style={{ color: '#fda4af', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Fee Due
                            </Text>
                          </View>
                          <View style={{ width: 110, minWidth: 110, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' }}>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Status
                            </Text>
                          </View>
                        </View>

                        {/* Table Body Rows */}
                        <View>
                          {filteredStudents.map((st, idx) => (
                            <View
                              key={st.id}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'stretch',
                                borderBottomWidth: idx === filteredStudents.length - 1 ? 0 : 1,
                                borderBottomColor: 'rgba(255, 255, 255, 0.15)',
                                backgroundColor: idx % 2 === 1 ? 'rgba(255, 255, 255, 0.025)' : 'transparent',
                              }}
                            >
                              {/* Adm No */}
                              <View style={{ width: 110, minWidth: 110, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <Text style={{ color: '#ffe5a0', fontFamily: 'monospace', fontWeight: '800', fontSize: 13 }} numberOfLines={1}>
                                  {st.displayRoll}
                                </Text>
                              </View>

                              {/* Name & Avatar */}
                              <View style={{ width: 220, minWidth: 220, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: st.gender === 'Female' ? 'rgba(244, 114, 182, 0.2)' : 'rgba(56, 189, 248, 0.2)', borderWidth: 1, borderColor: st.gender === 'Female' ? 'rgba(244, 114, 182, 0.4)' : 'rgba(56, 189, 248, 0.4)', alignItems: 'center', justifyContent: 'center' }}>
                                  <Text style={{ color: st.gender === 'Female' ? '#f472b6' : '#38bdf8', fontWeight: '900', fontSize: 12 }}>
                                    {st.displayName.substring(0, 2).toUpperCase()}
                                  </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }} numberOfLines={1}>
                                    {st.displayName}
                                  </Text>
                                  <Text style={{ color: st.gender === 'Female' ? '#f472b6' : '#38bdf8', fontSize: 11, fontWeight: '700', marginTop: 1 }}>
                                    {st.gender}
                                  </Text>
                                </View>
                              </View>

                              {/* PEN No */}
                              <View style={{ width: 120, minWidth: 120, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontFamily: 'monospace', fontSize: 12.5, fontWeight: '600' }} numberOfLines={1}>
                                  {st.penNo}
                                </Text>
                              </View>

                              {/* Adm Date */}
                              <View style={{ width: 115, minWidth: 115, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontFamily: 'monospace', fontSize: 12.5, fontWeight: '600' }} numberOfLines={1}>
                                  {st.admissionDate}
                                </Text>
                              </View>

                              {/* DOB */}
                              <View style={{ width: 115, minWidth: 115, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontFamily: 'monospace', fontSize: 12.5, fontWeight: '600' }} numberOfLines={1}>
                                  {st.displayDob}
                                </Text>
                              </View>

                              {/* Age */}
                              <View style={{ width: 125, minWidth: 125, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 12.5, fontWeight: '600' }} numberOfLines={1}>
                                  {st.displayAge}
                                </Text>
                              </View>

                              {/* Father Name */}
                              <View style={{ width: 160, minWidth: 160, paddingHorizontal: 12, paddingVertical: 12, justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                                  {st.fatherName}
                                </Text>
                              </View>

                              {/* Mother Name */}
                              <View style={{ width: 150, minWidth: 150, paddingHorizontal: 12, paddingVertical: 12, justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                                  {st.motherName}
                                </Text>
                              </View>

                              {/* Parent Mobile */}
                              <View style={{ width: 135, minWidth: 135, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <Text style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: 12.5, fontWeight: '700' }} numberOfLines={1}>
                                  {st.displayPhone}
                                </Text>
                              </View>

                              {/* Address */}
                              <View style={{ width: 170, minWidth: 170, paddingHorizontal: 12, paddingVertical: 12, justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12.5, fontWeight: '500' }} numberOfLines={1}>
                                  {st.address}
                                </Text>
                              </View>

                              {/* Class */}
                              <View style={{ width: 95, minWidth: 95, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <View style={{ paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>
                                    {st.displayClass}
                                  </Text>
                                </View>
                              </View>

                              {/* Batch / Year */}
                              <View style={{ width: 115, minWidth: 115, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <Text style={{ color: '#ffe5a0', fontSize: 12.5, fontWeight: '700' }} numberOfLines={1}>
                                  {st.batchName}
                                </Text>
                              </View>

                              {/* Total Fee */}
                              <View style={{ width: 110, minWidth: 110, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <Text style={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: '800', fontSize: 13 }}>
                                  ₹{st.totalFee.toLocaleString()}
                                </Text>
                              </View>

                              {/* Fee Paid */}
                              <View style={{ width: 110, minWidth: 110, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <Text style={{ color: '#41eec2', fontFamily: 'monospace', fontWeight: '900', fontSize: 13 }}>
                                  ₹{st.paidFee.toLocaleString()}
                                </Text>
                              </View>

                              {/* Fee Due */}
                              <View style={{ width: 110, minWidth: 110, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', borderRightWidth: 1, borderRightColor: 'rgba(255, 255, 255, 0.15)' }}>
                                <Text style={{ color: st.dueFee > 0 ? '#fb7185' : '#41eec2', fontFamily: 'monospace', fontWeight: '900', fontSize: 13 }}>
                                  ₹{st.dueFee.toLocaleString()}
                                </Text>
                              </View>

                              {/* Status */}
                              <View style={{ width: 110, minWidth: 110, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' }}>
                                <View
                                  style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 20,
                                    backgroundColor:
                                      st.displayStatus === 'Active'
                                        ? 'rgba(16, 185, 129, 0.2)'
                                        : st.displayStatus === 'Left'
                                          ? 'rgba(244, 63, 94, 0.2)'
                                          : 'rgba(245, 158, 11, 0.2)',
                                    borderWidth: 1,
                                    borderColor:
                                      st.displayStatus === 'Active'
                                        ? 'rgba(16, 185, 129, 0.35)'
                                        : st.displayStatus === 'Left'
                                          ? 'rgba(244, 63, 94, 0.35)'
                                          : 'rgba(245, 158, 11, 0.35)',
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 11,
                                      fontWeight: '800',
                                      color:
                                        st.displayStatus === 'Active'
                                          ? '#6ee7b7'
                                          : st.displayStatus === 'Left'
                                            ? '#fda4af'
                                            : '#fcd34d',
                                    }}
                                  >
                                    {st.displayStatus}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    </ScrollView>
                  )}

                  {/* CARDS VIEW (ALTERNATIVE MOBILE VIEW) */}
                  {studentLayoutMode === 'cards' && (
                    <View className="gap-3.5">
                      {filteredStudents.map((st) => (
                        <View key={st.id} className="bg-black/40 p-4 rounded-2xl border border-white/10">
                          <View className="flex-row justify-between items-start mb-2.5">
                            <View className="flex-row items-center gap-3 flex-1 mr-2">
                              <View className={`w-9 h-9 rounded-xl items-center justify-center border ${st.gender === 'Female' ? 'bg-pink-500/20 border-pink-500/40' : 'bg-sky-500/20 border-sky-500/40'}`}>
                                <Text className={`font-black text-xs ${st.gender === 'Female' ? 'text-pink-400' : 'text-sky-400'}`}>
                                  {st.displayName.substring(0, 2).toUpperCase()}
                                </Text>
                              </View>
                              <View className="flex-1">
                                <Text className="text-white font-extrabold text-sm md:text-base">{st.displayName}</Text>
                                <Text className="text-white/60 text-xs mt-0.5">
                                  Adm: <Text className="text-[#ffe5a0] font-mono font-bold">{st.displayRoll}</Text> • Class {st.displayClass}
                                </Text>
                              </View>
                            </View>
                            <View
                              className={`px-2.5 py-1 rounded-full border ${st.displayStatus === 'Active' ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'
                                }`}
                            >
                              <Text className={`text-xs font-bold ${st.displayStatus === 'Active' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {st.displayStatus}
                              </Text>
                            </View>
                          </View>

                          <View className="pt-2.5 border-t border-white/5 gap-1.5">
                            <Text className="text-white/70 text-xs">
                              Father: <Text className="text-white font-medium">{st.fatherName}</Text> ({st.displayPhone})
                            </Text>
                            <Text className="text-white/70 text-xs">
                              DOB: <Text className="text-white font-mono font-bold">{st.displayDob}</Text> • Age: <Text className="text-white">{st.displayAge}</Text>
                            </Text>
                            <View className="flex-row justify-between items-center mt-1 pt-2 border-t border-white/5">
                              <Text className="text-white/60 text-xs font-mono">
                                Fee: ₹{st.totalFee.toLocaleString()} • Paid: ₹{st.paidFee.toLocaleString()}
                              </Text>
                              <View className={`px-2 py-0.5 rounded-lg ${st.dueFee <= 0 ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                                <Text className={`text-xs font-bold ${st.dueFee <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {st.dueFee <= 0 ? 'Fully Paid' : `Due: ₹${st.dueFee.toLocaleString()}`}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {filteredStudents.length === 0 && (
                    <View className="py-8 items-center justify-center">
                      <UserCheck size={32} color="rgba(255,255,255,0.2)" />
                      <Text className="text-white/60 font-bold text-xs mt-2">No students found matching your filters.</Text>
                    </View>
                  )}
                </GlassCard>
              </View>
            )}

            {/* SCREEN 5: FINANCIAL FORECASTING (EXACT WEB PARITY) */}
            {selectedSection === 'financial' && (
              <View className="gap-5">
                {/* Top Financial KPI Cards */}
                <View className="flex-row gap-2.5">
                  <GlassCard className="flex-1 p-3.5 md:p-4 border border-white/10 rounded-2xl" intensity="low">
                    <View className="w-8 h-8 rounded-xl bg-amber-500/20 items-center justify-center mb-2">
                      <DollarSign size={16} color="#ffe5a0" />
                    </View>
                    <Text className="text-[#ffe5a0] font-black text-lg md:text-xl font-mono">
                      ₹{(totalOutstanding / 100000).toFixed(1)}L
                    </Text>
                    <Text className="text-white/70 text-[10.5px] font-extrabold uppercase mt-0.5">Outstanding</Text>
                    <Text className="text-white/40 text-[9.5px] mt-0.5">Currently uncollected</Text>
                  </GlassCard>

                  <GlassCard className="flex-1 p-3.5 md:p-4 border border-white/10 rounded-2xl" intensity="low">
                    <View className="w-8 h-8 rounded-xl bg-emerald-500/20 items-center justify-center mb-2">
                      <TrendingUp size={16} color="#2dd4bf" />
                    </View>
                    <Text className="text-[#2dd4bf] font-black text-lg md:text-xl font-mono">
                      ₹{((totalOutstanding * 0.85) / 100000).toFixed(1)}L
                    </Text>
                    <Text className="text-white/70 text-[10.5px] font-extrabold uppercase mt-0.5">Projected (6M)</Text>
                    <Text className="text-white/40 text-[9.5px] mt-0.5">Weighted estimate</Text>
                  </GlassCard>

                  <GlassCard className="flex-1 p-3.5 md:p-4 border border-white/10 rounded-2xl" intensity="low">
                    <View className="w-8 h-8 rounded-xl bg-sky-500/20 items-center justify-center mb-2">
                      <Percent size={16} color="#38bdf8" />
                    </View>
                    <Text className="text-sky-400 font-black text-lg md:text-xl font-mono">94.8%</Text>
                    <Text className="text-white/70 text-[10.5px] font-extrabold uppercase mt-0.5">Accuracy</Text>
                    <Text className="text-white/40 text-[9.5px] mt-0.5">Model confidence</Text>
                  </GlassCard>
                </View>

                {/* 6-Month Projected Collection & Outstanding Recovery Composed Chart (Exact Web Parity) */}
                <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <View className="flex-row items-center gap-2 flex-1 mr-2">
                      <TrendingUp size={18} color="#2dd4bf" />
                      <Text className="text-white font-extrabold text-sm md:text-base">
                        6-Month Collection Projection & Recovery
                      </Text>
                    </View>
                    <View className="px-2.5 py-1 rounded-lg bg-[#2dd4bf]/20 border border-[#2dd4bf]/40">
                      <Text className="text-[#2dd4bf] text-[10.5px] font-bold">2026-2027</Text>
                    </View>
                  </View>
                  <Text className="text-white/60 text-xs mb-3">
                    Expected collection trends based on past cohort behaviors, monthly tuition terms, and outstanding balances.
                  </Text>

                  {/* Composed Chart Legend (Exact Web Parity) */}
                  <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2 py-2.5 px-3 bg-white/5 rounded-xl border border-white/5 mb-3.5">
                    {/* Outstanding Balance Bar */}
                    <View className="flex-row items-center gap-1.5">
                      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#c084fc', opacity: 0.55 }} />
                      <Text className="text-white/80 text-[11px] font-bold">Outstanding Balance (Goal)</Text>
                    </View>

                    {/* Projected Collection Line */}
                    <View className="flex-row items-center gap-1.5">
                      <View className="flex-row items-center">
                        <View style={{ width: 12, height: 3, backgroundColor: '#2dd4bf' }} />
                        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#2dd4bf', marginLeft: -2 }} />
                      </View>
                      <Text className="text-white/80 text-[11px] font-bold">Projected Collection</Text>
                    </View>

                    {/* Min Expected Dashed Line */}
                    <View className="flex-row items-center gap-1.5">
                      <View style={{ width: 14, height: 0, borderBottomWidth: 2, borderBottomColor: '#fb7185', borderStyle: 'dashed' }} />
                      <Text className="text-white/80 text-[11px] font-bold">Min Expected</Text>
                    </View>

                    {/* Max Target Dashed Line */}
                    <View className="flex-row items-center gap-1.5">
                      <View style={{ width: 14, height: 0, borderBottomWidth: 2, borderBottomColor: '#38bdf8', borderStyle: 'dashed' }} />
                      <Text className="text-white/80 text-[11px] font-bold">Max Target</Text>
                    </View>
                  </View>

                  {/* Interactive Selected Month Statistics Pop-up with Respected Color Codes */}
                  {selectedForecastMonthIdx !== null && forecastMonths[selectedForecastMonthIdx] && (
                    <View className="mb-3.5 p-3.5 bg-[#121618] rounded-2xl shadow-2xl shadow-black/80 border border-white/20">
                      <View className="flex-row items-center justify-between pb-2 mb-2.5 border-b border-white/10">
                        <View className="flex-row items-center gap-2">
                          <View className="w-2.5 h-2.5 rounded-full bg-[#2dd4bf]" />
                          <Text className="text-white font-black text-sm">
                            {forecastMonths[selectedForecastMonthIdx].month}
                          </Text>
                          <View className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
                            <Text className="text-[#ffe5a0] text-[9.5px] font-extrabold uppercase tracking-wide">
                              Forecast Figures
                            </Text>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => setSelectedForecastMonthIdx(null)}
                          className="w-6 h-6 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <X size={13} color="#ffffff" />
                        </Pressable>
                      </View>

                      {/* 4 Color-Coded Metric Cards */}
                      <View className="flex-row flex-wrap gap-2">
                        {/* 1. Projected Collection (Teal #2dd4bf) */}
                        <View
                          style={{
                            flex: 1,
                            minWidth: 140,
                            backgroundColor: 'rgba(45, 212, 191, 0.12)',
                            borderColor: 'rgba(45, 212, 191, 0.4)',
                            borderWidth: 1,
                            borderRadius: 12,
                            paddingHorizontal: 10,
                            paddingVertical: 7,
                          }}
                        >
                          <View className="flex-row items-center gap-1.5 mb-1">
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#2dd4bf' }} />
                            <Text style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: 10, fontWeight: '700' }}>
                              Projected
                            </Text>
                          </View>
                          <Text style={{ color: '#2dd4bf', fontSize: 13.5, fontWeight: '900', fontFamily: 'monospace' }}>
                            ₹{forecastMonths[selectedForecastMonthIdx].projected.toLocaleString()}
                          </Text>
                        </View>

                        {/* 2. Outstanding Balance Goal (Purple #c084fc) */}
                        <View
                          style={{
                            flex: 1,
                            minWidth: 140,
                            backgroundColor: 'rgba(192, 132, 252, 0.12)',
                            borderColor: 'rgba(192, 132, 252, 0.4)',
                            borderWidth: 1,
                            borderRadius: 12,
                            paddingHorizontal: 10,
                            paddingVertical: 7,
                          }}
                        >
                          <View className="flex-row items-center gap-1.5 mb-1">
                            <View style={{ width: 6, height: 6, borderRadius: 2, backgroundColor: '#c084fc' }} />
                            <Text style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: 10, fontWeight: '700' }}>
                              Balance Goal
                            </Text>
                          </View>
                          <Text style={{ color: '#c084fc', fontSize: 13.5, fontWeight: '900', fontFamily: 'monospace' }}>
                            ₹{forecastMonths[selectedForecastMonthIdx].outstandingGoal.toLocaleString()}
                          </Text>
                        </View>

                        {/* 3. Min Expected (Coral #fb7185) */}
                        <View
                          style={{
                            flex: 1,
                            minWidth: 140,
                            backgroundColor: 'rgba(251, 113, 133, 0.12)',
                            borderColor: 'rgba(251, 113, 133, 0.4)',
                            borderWidth: 1,
                            borderRadius: 12,
                            paddingHorizontal: 10,
                            paddingVertical: 7,
                          }}
                        >
                          <View className="flex-row items-center gap-1.5 mb-1">
                            <View style={{ width: 8, height: 2, backgroundColor: '#fb7185' }} />
                            <Text style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: 10, fontWeight: '700' }}>
                              Min Expected
                            </Text>
                          </View>
                          <Text style={{ color: '#fb7185', fontSize: 13.5, fontWeight: '900', fontFamily: 'monospace' }}>
                            ₹{forecastMonths[selectedForecastMonthIdx].minExp.toLocaleString()}
                          </Text>
                        </View>

                        {/* 4. Max Target (Sky Blue #38bdf8) */}
                        <View
                          style={{
                            flex: 1,
                            minWidth: 140,
                            backgroundColor: 'rgba(56, 189, 248, 0.12)',
                            borderColor: 'rgba(56, 189, 248, 0.4)',
                            borderWidth: 1,
                            borderRadius: 12,
                            paddingHorizontal: 10,
                            paddingVertical: 7,
                          }}
                        >
                          <View className="flex-row items-center gap-1.5 mb-1">
                            <View style={{ width: 8, height: 2, backgroundColor: '#38bdf8' }} />
                            <Text style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: 10, fontWeight: '700' }}>
                              Max Target
                            </Text>
                          </View>
                          <Text style={{ color: '#38bdf8', fontSize: 13.5, fontWeight: '900', fontFamily: 'monospace' }}>
                            ₹{forecastMonths[selectedForecastMonthIdx].target.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Main Graph Plot Area with Fixed Y-Axis & Horizontal Scrolling X-Axis */}
                  <View className="pt-2 bg-black/40 rounded-2xl p-3 border border-white/5">
                    {(() => {
                      const maxVal = Math.max(
                        ...forecastMonths.map((m) => Math.max(m.projected, m.target, m.minExp, m.outstandingGoal)),
                        100000
                      );
                      const maxY = Math.ceil(maxVal / 100000) * 100000 || 500000;
                      const plotHeight = 180;
                      const chartWidth = 460;
                      const colW = (chartWidth - 20) / 6;

                      const yTicks = [
                        maxY,
                        Math.round(maxY * 0.75),
                        Math.round(maxY * 0.5),
                        Math.round(maxY * 0.25),
                        0,
                      ];

                      const formatTick = (val: number) => {
                        if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                        if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                        return `₹${val}`;
                      };

                      const projPath = forecastMonths
                        .map((d, i) => `${i === 0 ? 'M' : 'L'} ${10 + (i + 0.5) * colW} ${plotHeight - (d.projected / maxY) * plotHeight}`)
                        .join(' ');

                      const minPath = forecastMonths
                        .map((d, i) => `${i === 0 ? 'M' : 'L'} ${10 + (i + 0.5) * colW} ${plotHeight - (d.minExp / maxY) * plotHeight}`)
                        .join(' ');

                      const targetPath = forecastMonths
                        .map((d, i) => `${i === 0 ? 'M' : 'L'} ${10 + (i + 0.5) * colW} ${plotHeight - (d.target / maxY) * plotHeight}`)
                        .join(' ');

                      return (
                        <View className="flex-row">
                          {/* Fixed Left Y-Axis */}
                          <View className="w-12">
                            {/* Headroom spacer */}
                            <View style={{ height: 16 }} />

                            {/* 5 Ticks across plotHeight (180px) */}
                            <View style={{ height: plotHeight, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6 }}>
                              {yTicks.map((tVal, idx) => (
                                <Text key={idx} style={{ fontSize: 9.5, lineHeight: 10 }} className="text-white/50 font-mono font-semibold">
                                  {formatTick(tVal)}
                                </Text>
                              ))}
                            </View>

                            {/* Bottom X-axis label spacer */}
                            <View style={{ height: 28 }} />
                          </View>

                          {/* Horizontal Scrolling Composed Chart */}
                          <ScrollView horizontal showsHorizontalScrollIndicator={true} className="flex-1">
                            <View style={{ width: chartWidth, position: 'relative' }}>
                              {/* Headroom spacer */}
                              <View style={{ height: 16 }} />

                              <Svg width={chartWidth} height={plotHeight}>
                                {/* Horizontal Grid Lines */}
                                {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
                                  <Line
                                    key={idx}
                                    x1="0"
                                    y1={plotHeight * p}
                                    x2={chartWidth}
                                    y2={plotHeight * p}
                                    stroke="rgba(255, 255, 255, 0.08)"
                                    strokeWidth="1"
                                  />
                                ))}

                                {/* Selected Column Vertical Highlight Band & Guide Line */}
                                {selectedForecastMonthIdx !== null && (
                                  <>
                                    <Rect
                                      x={10 + selectedForecastMonthIdx * colW + 2}
                                      y={0}
                                      width={colW - 4}
                                      height={plotHeight}
                                      fill="rgba(255, 255, 255, 0.08)"
                                      rx={8}
                                    />
                                    <Line
                                      x1={10 + (selectedForecastMonthIdx + 0.5) * colW}
                                      y1={0}
                                      x2={10 + (selectedForecastMonthIdx + 0.5) * colW}
                                      y2={plotHeight}
                                      stroke="rgba(255, 255, 255, 0.25)"
                                      strokeWidth="1"
                                      strokeDasharray="3,3"
                                    />
                                  </>
                                )}

                                {/* 1. Purple Bars: Outstanding Balance (Goal) */}
                                {forecastMonths.map((d, i) => {
                                  const cx = 10 + (i + 0.5) * colW;
                                  const barW = 28;
                                  const barX = cx - barW / 2;
                                  const barH = Math.max(4, (d.outstandingGoal / maxY) * plotHeight);
                                  const barY = plotHeight - barH;
                                  const isSelected = selectedForecastMonthIdx === i;

                                  return (
                                    <G key={'bar_group_' + i}>
                                      <Rect
                                        x={barX}
                                        y={barY}
                                        width={barW}
                                        height={barH}
                                        fill="#c084fc"
                                        opacity={isSelected ? 0.8 : 0.32}
                                        rx={5}
                                        ry={5}
                                      />
                                      {/* Direct Purple Figure Badge when Selected */}
                                      {isSelected && (
                                        <G>
                                          <Rect
                                            x={cx - 24}
                                            y={Math.max(2, barY - 20)}
                                            width={48}
                                            height={17}
                                            rx={4}
                                            fill="#c084fc"
                                          />
                                          <SvgText
                                            x={cx}
                                            y={Math.max(14, barY - 8)}
                                            fill="#101415"
                                            fontSize="9"
                                            fontWeight="900"
                                            textAnchor="middle"
                                          >
                                            {formatTick(d.outstandingGoal)}
                                          </SvgText>
                                        </G>
                                      )}
                                    </G>
                                  );
                                })}

                                {/* 2. Coral Dashed Line: Min Expected */}
                                <Path
                                  d={minPath}
                                  stroke="#fb7185"
                                  strokeWidth="1.8"
                                  strokeDasharray="4,4"
                                  fill="none"
                                />

                                {/* 3. Sky Blue Dashed Line: Max Target */}
                                <Path
                                  d={targetPath}
                                  stroke="#38bdf8"
                                  strokeWidth="1.8"
                                  strokeDasharray="4,4"
                                  fill="none"
                                />

                                {/* 4. Thick Teal Solid Line: Projected Collection */}
                                <Path
                                  d={projPath}
                                  stroke="#2dd4bf"
                                  strokeWidth="3.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  fill="none"
                                />

                                {/* 5. Dots on Lines & Selected Point Badges */}
                                {forecastMonths.map((d, i) => {
                                  const cx = 10 + (i + 0.5) * colW;
                                  const projY = plotHeight - (d.projected / maxY) * plotHeight;
                                  const minY = plotHeight - (d.minExp / maxY) * plotHeight;
                                  const targetY = plotHeight - (d.target / maxY) * plotHeight;
                                  const isSelected = selectedForecastMonthIdx === i;

                                  return (
                                    <G key={'dot_' + i}>
                                      {/* Points on Min and Target when Selected */}
                                      {isSelected && (
                                        <>
                                          {/* Min Expected Point + Coral Figure Badge */}
                                          <Circle
                                            cx={cx}
                                            cy={minY}
                                            r={4.5}
                                            fill="#fb7185"
                                            stroke="#101415"
                                            strokeWidth="1.5"
                                          />
                                          <Rect
                                            x={cx + 7}
                                            y={minY - 8}
                                            width={44}
                                            height={16}
                                            rx={4}
                                            fill="#fb7185"
                                          />
                                          <SvgText
                                            x={cx + 29}
                                            y={minY + 3.5}
                                            fill="#101415"
                                            fontSize="8.5"
                                            fontWeight="900"
                                            textAnchor="middle"
                                          >
                                            {formatTick(d.minExp)}
                                          </SvgText>

                                          {/* Max Target Point + Sky Blue Figure Badge */}
                                          <Circle
                                            cx={cx}
                                            cy={targetY}
                                            r={4.5}
                                            fill="#38bdf8"
                                            stroke="#101415"
                                            strokeWidth="1.5"
                                          />
                                          <Rect
                                            x={cx + 7}
                                            y={targetY - 8}
                                            width={44}
                                            height={16}
                                            rx={4}
                                            fill="#38bdf8"
                                          />
                                          <SvgText
                                            x={cx + 29}
                                            y={targetY + 3.5}
                                            fill="#101415"
                                            fontSize="8.5"
                                            fontWeight="900"
                                            textAnchor="middle"
                                          >
                                            {formatTick(d.target)}
                                          </SvgText>
                                        </>
                                      )}

                                      {/* Outer Halo when Selected */}
                                      {isSelected && (
                                        <Circle
                                          cx={cx}
                                          cy={projY}
                                          r={13}
                                          fill="rgba(45, 212, 191, 0.35)"
                                          stroke="#2dd4bf"
                                          strokeWidth="2"
                                        />
                                      )}

                                      {/* Solid Center Dot */}
                                      <Circle
                                        cx={cx}
                                        cy={projY}
                                        r={5.5}
                                        fill="#2dd4bf"
                                        stroke="#101415"
                                        strokeWidth="2"
                                      />

                                      {/* Direct Teal Projected Figure Badge when Selected */}
                                      {isSelected && (
                                        <G>
                                          <Rect
                                            x={cx - 26}
                                            y={Math.max(2, projY - 24)}
                                            width={52}
                                            height={18}
                                            rx={5}
                                            fill="#2dd4bf"
                                          />
                                          <SvgText
                                            x={cx}
                                            y={Math.max(14, projY - 11)}
                                            fill="#101415"
                                            fontSize="9.5"
                                            fontWeight="900"
                                            textAnchor="middle"
                                          >
                                            {formatTick(d.projected)}
                                          </SvgText>
                                        </G>
                                      )}
                                    </G>
                                  );
                                })}
                              </Svg>

                              {/* Native Pressable Touch Column Overlay (100% Reliable Native Touches) */}
                              <View
                                style={{
                                  position: 'absolute',
                                  top: 16,
                                  left: 10,
                                  width: chartWidth - 20,
                                  height: plotHeight,
                                  flexDirection: 'row',
                                  zIndex: 10,
                                }}
                              >
                                {forecastMonths.map((d, i) => (
                                  <Pressable
                                    key={'press_col_' + i}
                                    onPress={() => setSelectedForecastMonthIdx(selectedForecastMonthIdx === i ? null : i)}
                                    style={{
                                      width: colW,
                                      height: '100%',
                                    }}
                                  />
                                ))}
                              </View>

                              {/* Baseline Line */}
                              <View className="w-full border-b border-white/20" />

                              {/* X-Axis Month Labels */}
                              <View className="flex-row items-center w-full" style={{ height: 28 }}>
                                {forecastMonths.map((d, i) => {
                                  const isSelected = selectedForecastMonthIdx === i;
                                  return (
                                    <Pressable
                                      key={d.month}
                                      onPress={() => setSelectedForecastMonthIdx(isSelected ? null : i)}
                                      style={{ width: colW, alignItems: 'center', justifyContent: 'center' }}
                                    >
                                      <Text
                                        numberOfLines={1}
                                        style={{
                                          fontSize: 10.5,
                                          fontWeight: isSelected ? '900' : '700',
                                          color: isSelected ? '#ffe5a0' : 'rgba(255, 255, 255, 0.65)',
                                        }}
                                      >
                                        {d.month}
                                      </Text>
                                    </Pressable>
                                  );
                                })}
                              </View>
                            </View>
                          </ScrollView>
                        </View>
                      );
                    })()}
                  </View>
                </GlassCard>

                {/* Methodology & Risk Analysis Cards (Exact Web Parity) */}
                <GlassCard className="p-4 md:p-5 border border-white/10 rounded-2xl" intensity="low">
                  <Text className="text-[#ffe5a0] text-xs md:text-sm font-extrabold uppercase tracking-wider mb-3">
                    FORECASTING METHODOLOGY & RISK INSIGHTS
                  </Text>

                  <View className="gap-3">
                    <View className="p-3.5 bg-black/40 rounded-2xl border border-white/5">
                      <View className="flex-row items-center gap-2 mb-1.5">
                        <ArrowRight size={14} color="#38bdf8" />
                        <Text className="text-white font-bold text-xs md:text-sm">Collection Projection Methodology</Text>
                      </View>
                      <Text className="text-white/60 text-xs leading-relaxed">
                        Expected collection projections use a weighted probability index based on class group payment timings, parent credit ratings, and historical fee category collection rates (term vs monthly).
                      </Text>
                    </View>

                    <View className="p-3.5 bg-black/40 rounded-2xl border border-white/5">
                      <View className="flex-row items-center gap-2 mb-1.5">
                        <ArrowRight size={14} color="#2dd4bf" />
                        <Text className="text-white font-bold text-xs md:text-sm">Recovery Rate Projections</Text>
                      </View>
                      <Text className="text-white/60 text-xs leading-relaxed">
                        Outstanding fee recovery rates are projected to settle around 82% over the next two terms, while remaining 18% is categorized as high risk requiring manual collection triggers.
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* STAFF DEPARTMENT DROPDOWN MODAL */}
      <Modal visible={showStaffDeptDropdown} transparent animationType="fade" onRequestClose={() => setShowStaffDeptDropdown(false)}>
        <View style={styles.alertOverlay}>
          <GlassCard
            className="w-[90%] max-w-[340px] p-5 border border-[#f0c110]/40"
            style={{ backgroundColor: '#101415', borderRadius: 28 }}
          >
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center">
                  <Building2 size={16} color="#ffe5a0" />
                </View>
                <Text className="text-white font-bold text-sm">Select Department</Text>
              </View>
              <Pressable onPress={() => setShowStaffDeptDropdown(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>
            <ScrollView className="max-h-[300px]">
              {departmentsList.map((dept) => {
                const isSelected = staffDeptFilter === dept;
                const count = dept === 'All' ? faculty.length : faculty.filter((f) => (f.department || 'Teaching') === dept).length;
                return (
                  <Pressable
                    key={dept}
                    onPress={() => {
                      setStaffDeptFilter(dept);
                      setShowStaffDeptDropdown(false);
                    }}
                    className={`flex-row items-center justify-between p-3 rounded-xl mb-1.5 border ${isSelected ? 'bg-[#f0c110]/20 border-[#f0c110]' : 'bg-white/5 border-white/10 active:bg-white/10'
                      }`}
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className={`text-xs font-extrabold ${isSelected ? 'text-[#ffe5a0]' : 'text-white'}`}>{dept}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white/50 text-[11px] font-mono">{count} Staff</Text>
                      {isSelected && <Check size={14} color="#f0c110" />}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>

      {/* STAFF CALENDAR DATE PICKER MODAL (DD-MM-YYYY) */}
      <Modal visible={showStaffCalendarModal} transparent animationType="fade" onRequestClose={() => setShowStaffCalendarModal(false)}>
        <View style={styles.alertOverlay}>
          <GlassCard
            className="w-[90%] max-w-[340px] p-5 border border-[#f0c110]/40"
            style={{ backgroundColor: '#101415', borderRadius: 28 }}
          >
            {/* Calendar Header */}
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center">
                  <Calendar size={16} color="#ffe5a0" />
                </View>
                <Text className="text-white font-bold text-sm">
                  Select {staffTargetDateField === 'start' ? 'Start' : 'End'} Date
                </Text>
              </View>
              <Pressable
                onPress={() => setShowStaffCalendarModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 items-center justify-center"
              >
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            {/* Month & Year Navigation Ribbon */}
            <View className="flex-row justify-between items-center bg-white/5 p-2 rounded-xl mb-3 border border-white/10">
              <Pressable
                onPress={() => {
                  if (staffPickerMonth === 0) {
                    setStaffPickerMonth(11);
                    setStaffPickerYear((y) => y - 1);
                  } else {
                    setStaffPickerMonth((m) => m - 1);
                  }
                }}
                className="p-1 border border-white/10 rounded-lg bg-white/5 active:bg-white/20"
              >
                <ChevronLeft size={16} color="#ffe5a0" />
              </Pressable>
              <Text className="text-white font-extrabold text-xs">
                {MONTH_NAMES[staffPickerMonth]} {staffPickerYear}
              </Text>
              <Pressable
                onPress={() => {
                  if (staffPickerMonth === 11) {
                    setStaffPickerMonth(0);
                    setStaffPickerYear((y) => y + 1);
                  } else {
                    setStaffPickerMonth((m) => m + 1);
                  }
                }}
                className="p-1 border border-white/10 rounded-lg bg-white/5 active:bg-white/20"
              >
                <ChevronRight size={16} color="#ffe5a0" />
              </Pressable>
            </View>

            {/* 7 Days of Week Header */}
            <View className="flex-row mb-2">
              {DAYS_OF_WEEK.map((d, i) => (
                <View key={i} style={{ width: '14.28%', alignItems: 'center' }}>
                  <Text className="text-white/40 text-[9.5px] font-bold uppercase">{d}</Text>
                </View>
              ))}
            </View>

            {/* 7-Column Calendar Days Grid */}
            <View className="flex-row flex-wrap mb-4">
              {staffCalendarCells.map((dayNum, idx) => {
                if (!dayNum) {
                  return <View key={idx} style={{ width: '14.28%', height: 34 }} />;
                }

                const currentFormatted = `${String(dayNum).padStart(2, '0')}-${String(staffPickerMonth + 1).padStart(2, '0')}-${staffPickerYear}`;
                const isSelected = (staffTargetDateField === 'start' ? staffStartDate : staffEndDate) === currentFormatted;

                return (
                  <View key={idx} style={{ width: '14.28%', height: 34, padding: 1.5 }}>
                    <Pressable
                      onPress={() => handleSelectStaffCalendarDate(dayNum)}
                      className={`w-full h-full rounded-lg items-center justify-center border ${isSelected
                        ? 'bg-[#f0c110] border-[#f0c110]'
                        : 'bg-white/5 border-white/10 active:bg-white/20'
                        }`}
                    >
                      <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white'}`}>
                        {dayNum}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <Pressable
              onPress={() => setShowStaffCalendarModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 items-center active:scale-95"
            >
              <Text className="text-white/80 font-bold text-xs">Close Calendar</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>

      {/* STUDENT ACADEMIC YEAR DROPDOWN MODAL */}
      <Modal visible={showStudentYearDropdown} transparent animationType="fade" onRequestClose={() => setShowStudentYearDropdown(false)}>
        <View style={styles.alertOverlay}>
          <GlassCard
            className="w-[90%] max-w-[340px] p-5 border border-[#f0c110]/40"
            style={{ backgroundColor: '#101415', borderRadius: 28 }}
          >
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center">
                  <Calendar size={16} color="#ffe5a0" />
                </View>
                <Text className="text-white font-bold text-sm">Select Academic Year</Text>
              </View>
              <Pressable onPress={() => setShowStudentYearDropdown(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>
            <ScrollView className="max-h-[300px]">
              {studentYearsList.map((yr) => {
                const isSelected = studentYearFilter === yr;
                const count = yr === 'All' ? processedStudents.length : processedStudents.filter((s) => s.batchName === yr).length;
                return (
                  <Pressable
                    key={yr}
                    onPress={() => {
                      setStudentYearFilter(yr);
                      setShowStudentYearDropdown(false);
                    }}
                    className={`flex-row items-center justify-between p-3 rounded-xl mb-1.5 border ${isSelected ? 'bg-[#f0c110]/20 border-[#f0c110]' : 'bg-white/5 border-white/10 active:bg-white/10'
                      }`}
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className={`text-xs font-extrabold ${isSelected ? 'text-[#ffe5a0]' : 'text-white'}`}>
                        {yr === 'All' ? 'All Academic Years' : yr}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white/50 text-[11px] font-mono">{count} Students</Text>
                      {isSelected && <Check size={14} color="#f0c110" />}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>

      {/* STUDENT CLASS DROPDOWN MODAL */}
      <Modal visible={showStudentClassDropdown} transparent animationType="fade" onRequestClose={() => setShowStudentClassDropdown(false)}>
        <View style={styles.alertOverlay}>
          <GlassCard
            className="w-[90%] max-w-[340px] p-5 border border-[#f0c110]/40"
            style={{ backgroundColor: '#101415', borderRadius: 28 }}
          >
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center">
                  <Users size={16} color="#ffe5a0" />
                </View>
                <Text className="text-white font-bold text-sm">Select Class</Text>
              </View>
              <Pressable onPress={() => setShowStudentClassDropdown(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>
            <ScrollView className="max-h-[300px]">
              {studentClassesList.map((cls) => {
                const isSelected = studentClassFilter === cls;
                const count = cls === 'All' ? processedStudents.length : processedStudents.filter((s) => s.displayClass === cls).length;
                return (
                  <Pressable
                    key={cls}
                    onPress={() => {
                      setStudentClassFilter(cls);
                      setShowStudentClassDropdown(false);
                    }}
                    className={`flex-row items-center justify-between p-3 rounded-xl mb-1.5 border ${isSelected ? 'bg-[#f0c110]/20 border-[#f0c110]' : 'bg-white/5 border-white/10 active:bg-white/10'
                      }`}
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className={`text-xs font-extrabold ${isSelected ? 'text-[#ffe5a0]' : 'text-white'}`}>
                        {cls === 'All' ? 'All Classes' : cls}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white/50 text-[11px] font-mono">{count} Students</Text>
                      {isSelected && <Check size={14} color="#f0c110" />}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>

      {/* STUDENT STATUS DROPDOWN MODAL */}
      <Modal visible={showStudentStatusDropdown} transparent animationType="fade" onRequestClose={() => setShowStudentStatusDropdown(false)}>
        <View style={styles.alertOverlay}>
          <GlassCard
            className="w-[90%] max-w-[340px] p-5 border border-[#f0c110]/40"
            style={{ backgroundColor: '#101415', borderRadius: 28 }}
          >
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center">
                  <ShieldCheck size={16} color="#ffe5a0" />
                </View>
                <Text className="text-white font-bold text-sm">Select Student Status</Text>
              </View>
              <Pressable onPress={() => setShowStudentStatusDropdown(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>
            <ScrollView className="max-h-[300px]">
              {studentStatusesList.map((st) => {
                const isSelected = studentStatusFilter === st;
                const count = st === 'All' ? processedStudents.length : processedStudents.filter((s) => s.displayStatus === st).length;
                return (
                  <Pressable
                    key={st}
                    onPress={() => {
                      setStudentStatusFilter(st);
                      setShowStudentStatusDropdown(false);
                    }}
                    className={`flex-row items-center justify-between p-3 rounded-xl mb-1.5 border ${isSelected ? 'bg-[#f0c110]/20 border-[#f0c110]' : 'bg-white/5 border-white/10 active:bg-white/10'
                      }`}
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className={`text-xs font-extrabold ${isSelected ? 'text-[#ffe5a0]' : 'text-white'}`}>
                        {st === 'All' ? 'All Status' : st}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white/50 text-[11px] font-mono">{count} Students</Text>
                      {isSelected && <Check size={14} color="#f0c110" />}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>

      {/* CUSTOM DIALOG MODAL */}
      <Modal visible={dialogAlert.visible} transparent animationType="fade" onRequestClose={() => setDialogAlert((prev) => ({ ...prev, visible: false }))}>
        <View style={styles.alertOverlay}>
          <GlassCard
            className="w-[85%] max-w-[340px] p-6 border border-white/10 items-center"
            style={{
              backgroundColor: '#16191b',
              borderRadius: 28,
              shadowColor: '#f0c110',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <View
              className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center ${dialogAlert.type === 'error'
                ? 'bg-red-500/20 border border-red-500/40'
                : 'bg-[#f0c110]/20 border border-[#f0c110]/40'
                }`}
            >
              {dialogAlert.type === 'error' ? (
                <AlertCircle size={24} color="#ffb4ab" />
              ) : (
                <CheckCircle2 size={24} color="#ffe5a0" />
              )}
            </View>

            <Text className="text-white text-base font-bold text-center mb-1.5">{dialogAlert.title}</Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-5 px-1">{dialogAlert.message}</Text>

            <Pressable
              onPress={() => setDialogAlert((prev) => ({ ...prev, visible: false }))}
              className="w-full py-3 rounded-xl bg-[#f0c110] items-center active:scale-95 shadow-md shadow-[#f0c110]/30"
            >
              <Text className="text-[#101415] text-xs font-extrabold uppercase tracking-wider">Dismiss</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
};

// Fallback Mock Data
const DEFAULT_STUDENTS = [
  { id: 1, name: 'Aarav Sharma', class: '10-A', gender: 'Male', roll: 'ADM-1001', parent: 'Rajesh Sharma', phone: '+91 98480 11221', dob: '2010-04-15', status: 'Active', academic_year: '2026-2027' },
  { id: 2, name: 'Ananya Reddy', class: '10-A', gender: 'Female', roll: 'ADM-1002', parent: 'Srinivas Reddy', phone: '+91 98480 11222', dob: '2010-08-20', status: 'Active', academic_year: '2026-2027' },
  { id: 3, name: 'Sai Teja Varma', class: '9-B', gender: 'Male', roll: 'ADM-1003', parent: 'Prasad Varma', phone: '+91 98480 11223', dob: '2011-02-10', status: 'Active', academic_year: '2026-2027' },
  { id: 4, name: 'Kavya Goud', class: '9-B', gender: 'Female', roll: 'ADM-1004', parent: 'Narasimha Goud', phone: '+91 98480 11224', dob: '2011-06-25', status: 'Active', academic_year: '2026-2027' },
  { id: 5, name: 'Rohan Gupta', class: '8-A', gender: 'Male', roll: 'ADM-1005', parent: 'Mahesh Gupta', phone: '+91 98480 11225', dob: '2012-09-12', status: 'Active', academic_year: '2026-2027' },
  { id: 6, name: 'Sneha Patel', class: '8-A', gender: 'Female', roll: 'ADM-1006', parent: 'Dipak Patel', phone: '+91 98480 11226', dob: '2012-11-30', status: 'Active', academic_year: '2026-2027' },
];

const DEFAULT_FEES = [
  { student_id: 1, amount: 50000, paid_amount: 50000 },
  { student_id: 2, amount: 50000, paid_amount: 35000 },
  { student_id: 3, amount: 48000, paid_amount: 48000 },
  { student_id: 4, amount: 48000, paid_amount: 24000 },
  { student_id: 5, amount: 45000, paid_amount: 45000 },
  { student_id: 6, amount: 45000, paid_amount: 30000 },
];

const DEFAULT_FACULTY = [
  { id: 1, name: 'Dr. Robert Vance', role: 'HOD Physics', department: 'Teaching', employee_id: 'EMP-2026-94' },
  { id: 2, name: 'Mrs. Sunita Rao', role: 'Senior Mathematics Faculty', department: 'Teaching', employee_id: 'EMP-2026-95' },
  { id: 3, name: 'Mr. Ramesh Yadav', role: 'Head of Accounts', department: 'Administrative', employee_id: 'EMP-2026-96' },
  { id: 4, name: 'Mrs. Priyadarshini K', role: 'English Faculty', department: 'Teaching', employee_id: 'EMP-2026-97' },
  { id: 5, name: 'Mr. Yadagiri T', role: 'Transport Supervisor', department: 'Transport', employee_id: 'EMP-2026-98' },
  { id: 6, name: 'Mr. Anthony Das', role: 'Chief Security Officer', department: 'Security', employee_id: 'EMP-2026-99' },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101415',
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AnalyticsDashboardScreen;
