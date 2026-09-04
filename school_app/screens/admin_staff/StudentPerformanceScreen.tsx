import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User, Award, Phone, Mail, MapPin, Calendar, Clock,
  CheckCircle2, AlertCircle, TrendingUp, BookOpen, Layers,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X, ShieldAlert,
  Plus, Edit, Trash2, Printer, DollarSign, History, Filter, ArrowLeft
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

export interface FeeItem {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  concessionAmount: number;
}

export interface TimelineActivity {
  id: string;
  type: 'payment' | 'concession' | 'edit';
  title: string;
  amount: string;
  methodOrReason: string;
  date: string;
  performedBy: string;
}

const INITIAL_FEES: FeeItem[] = [
  { id: 'f1', name: 'Term 1 Tuition Fee', totalAmount: 15000, paidAmount: 15000, concessionAmount: 0 },
  { id: 'f2', name: 'Term 2 Tuition Fee', totalAmount: 10000, paidAmount: 10000, concessionAmount: 0 },
  { id: 'f3', name: 'Transport & Lab Fee', totalAmount: 10000, paidAmount: 0, concessionAmount: 0 },
];

const INITIAL_ACTIVITIES: TimelineActivity[] = [
  {
    id: 'act_1',
    type: 'payment',
    title: 'Fee Payment Received',
    amount: '₹15,000',
    methodOrReason: 'Paid via Cash (Receipt #RCP-9921)',
    date: '02 Aug 2026 • 11:30 AM',
    performedBy: 'Rajesh K (Admin Staff)'
  },
  {
    id: 'act_2',
    type: 'concession',
    title: 'Fee Concession Applied',
    amount: '₹2,000',
    methodOrReason: 'Approved by Principal (Merit Scholarship)',
    date: '28 Jul 2026 • 03:15 PM',
    performedBy: 'Priya M (Accounts Staff)'
  },
  {
    id: 'act_3',
    type: 'payment',
    title: 'Term 1 Tuition Fee Paid',
    amount: '₹10,000',
    methodOrReason: 'Paid via UPI (Txn #UPI884210)',
    date: '15 Jun 2026 • 09:45 AM',
    performedBy: 'Rajesh K (Admin Staff)'
  }
];

const getInitialFeesForStudent = (student?: any): FeeItem[] => {
  if (!student) {
    return [
      { id: 'f1', name: 'Class X Tuition Fee', totalAmount: 25000, paidAmount: 25000, concessionAmount: 0 },
      { id: 'f2', name: 'Term 2 Academic & Lab Fee', totalAmount: 10000, paidAmount: 10000, concessionAmount: 0 },
      { id: 'f3', name: 'Transport & Activity Fee', totalAmount: 10000, paidAmount: 0, concessionAmount: 0 },
    ];
  }

  // Extract student fee metrics if provided
  const total = typeof student.totalFee === 'number' && student.totalFee > 0 ? student.totalFee : 45000;
  const paid = typeof student.paidAmount === 'number' 
    ? student.paidAmount 
    : (student.feeStatus === 'Paid' ? total : student.feeStatus === 'Overdue' || student.feeStatus === 'Unpaid' ? 0 : Math.round(total * 0.65));

  // Component breakdown matching exact total sum
  const comp1Total = Math.round(total * 0.55);
  const comp2Total = Math.round(total * 0.25);
  const comp3Total = total - comp1Total - comp2Total;

  // Distribute paid amount across components starting from Component 1
  let remainingPaid = paid;
  
  const comp1Paid = Math.min(comp1Total, remainingPaid);
  remainingPaid -= comp1Paid;

  const comp2Paid = Math.min(comp2Total, remainingPaid);
  remainingPaid -= comp2Paid;

  const comp3Paid = Math.min(comp3Total, remainingPaid);

  return [
    { id: 'f1', name: student.feeCategory || 'Class X Tuition Fee', totalAmount: comp1Total, paidAmount: comp1Paid, concessionAmount: 0 },
    { id: 'f2', name: 'Term 2 Academic & Lab Fee', totalAmount: comp2Total, paidAmount: comp2Paid, concessionAmount: 0 },
    { id: 'f3', name: 'Transport & Activity Fee', totalAmount: comp3Total, paidAmount: comp3Paid, concessionAmount: 0 },
  ];
};

export const StudentPerformanceScreen: React.FC<any> = ({ route, navigation }) => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();
  const selectedStudent = route?.params?.student;
  const openProfileParam = route?.params?.openProfile;
  const studentName = selectedStudent?.name || route?.params?.studentName || 'Julian Sterling';
  const className = selectedStudent?.className || route?.params?.className || 'Class 10 — A';
  const admissionNo = selectedStudent?.admissionNo || route?.params?.rollNo || 'STDDe2026002';
  const canGoBack = navigation?.canGoBack && navigation.canGoBack();

  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(() => openProfileParam === true);

  // Dynamic State for Fees and Activities
  const [feeItems, setFeeItems] = useState<FeeItem[]>(() => getInitialFeesForStudent(selectedStudent));

  React.useEffect(() => {
    if (route?.params?.openProfile === true) {
      setIsDetailsExpanded(true);
    }
  }, [route?.params?.openProfile, route?.params?.student]);

  React.useEffect(() => {
    if (selectedStudent) {
      setFeeItems(getInitialFeesForStudent(selectedStudent));
    }
  }, [selectedStudent]);

  const [showAttendanceCalendar, setShowAttendanceCalendar] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'payment' | 'concession'>('all');
  const [showTimelineFilterDropdown, setShowTimelineFilterDropdown] = useState(false);
  const [activities, setActivities] = useState<TimelineActivity[]>(INITIAL_ACTIVITIES);

  // Modal States
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showConcessionModal, setShowConcessionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [selectedFee, setSelectedFee] = useState<FeeItem | null>(null);

  // Form Inputs: Collect Payment
  const [selectedCollectFeeIds, setSelectedCollectFeeIds] = useState<string[]>(['f3']);
  const [collectAmount, setCollectAmount] = useState('10000');
  const [collectMethod, setCollectMethod] = useState('Cash');
  const [collectRemarks, setCollectRemarks] = useState('');

  // Form Inputs: Concession
  const [selectedConcessionFeeId, setSelectedConcessionFeeId] = useState('f3');
  const [concessionVal, setConcessionVal] = useState('2000');
  const [concessionReasonStr, setConcessionReasonStr] = useState('Merit Scholarship');

  // Form Inputs: Edit Fee
  const [editTotal, setEditTotal] = useState('');
  const [editPaid, setEditPaid] = useState('');
  const [editConcession, setEditConcession] = useState('');

  // Fee Totals Calculation
  const feeTotals = useMemo(() => {
    let total = 0;
    let paid = 0;
    let concession = 0;
    feeItems.forEach(item => {
      total += item.totalAmount;
      paid += item.paidAmount;
      concession += item.concessionAmount;
    });
    const due = Math.max(0, total - paid - concession);
    return { total, paid, concession, due };
  }, [feeItems]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    if (timelineFilter === 'all') return activities;
    return activities.filter(act => act.type === timelineFilter);
  }, [activities, timelineFilter]);

  const [calendarMonth, setCalendarMonth] = useState(7); // 7 = August (0-indexed)
  const [calendarYear, setCalendarYear] = useState(2026);

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(prev => prev - 1);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(prev => prev + 1);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  };

  // Dynamic Real Calendar Grid Computation with Padding Cells for Weekday Alignment
  const calendarGridCells = useMemo(() => {
    const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const cells: Array<{ day: number | null; status?: 'present' | 'partial' | 'absent' | 'off' }> = [];

    // Empty offset padding cells before Day 1
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ day: null });
    }

    // Actual days in month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(calendarYear, calendarMonth, d);
      const dayOfWeek = dateObj.getDay();
      let status: 'present' | 'partial' | 'absent' | 'off' = 'present';
      
      if (dayOfWeek === 0) {
        status = 'off';
      } else if ((d + calendarMonth) % 9 === 0 || d === 5 || d === 18) {
        status = 'absent';
      } else if ((d + calendarMonth) % 6 === 0 || d === 12 || d === 25) {
        status = 'partial';
      }
      
      cells.push({ day: d, status });
    }

    return cells;
  }, [calendarMonth, calendarYear]);

  // Custom Toast Modal State
  const [toastData, setToastData] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'warning' | 'info';
  }>({ visible: false, title: '', message: '', type: 'success' });

  const showToast = (title: string, message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastData({ visible: true, title, message, type });
  };

  // Handler: Record Payment
  const handleRecordPaymentSubmit = () => {
    const amountNum = parseFloat(collectAmount) || 0;
    if (amountNum <= 0) {
      showToast('Invalid Amount', 'Please enter a valid payment amount.', 'warning');
      return;
    }

    setFeeItems(prev => prev.map(item => {
      if (selectedCollectFeeIds.includes(item.id)) {
        const newPaid = Math.min(item.totalAmount, item.paidAmount + amountNum);
        return { ...item, paidAmount: newPaid };
      }
      return item;
    }));

    const newAct: TimelineActivity = {
      id: `act_${Date.now()}`,
      type: 'payment',
      title: 'Fee Payment Received',
      amount: `₹${amountNum.toLocaleString()}`,
      methodOrReason: `Paid via ${collectMethod} ${collectRemarks ? `(${collectRemarks})` : ''}`,
      date: 'Today • Just Now',
      performedBy: 'Rajesh K (Admin Staff)'
    };

    setActivities(prev => [newAct, ...prev]);
    setShowCollectModal(false);
    showToast('Payment Recorded!', `₹${amountNum.toLocaleString()} payment recorded successfully via ${collectMethod}.`, 'success');
  };

  // Handler: Apply Concession
  const handleApplyConcessionSubmit = () => {
    const amountNum = parseFloat(concessionVal) || 0;
    if (amountNum <= 0) {
      showToast('Invalid Concession', 'Please enter a valid concession amount.', 'warning');
      return;
    }

    setFeeItems(prev => prev.map(item => {
      if (item.id === selectedConcessionFeeId) {
        return { ...item, concessionAmount: amountNum };
      }
      return item;
    }));

    const targetComponent = feeItems.find(f => f.id === selectedConcessionFeeId)?.name || 'Fee Component';

    const newAct: TimelineActivity = {
      id: `act_${Date.now()}`,
      type: 'concession',
      title: 'Fee Concession Applied',
      amount: `₹${amountNum.toLocaleString()}`,
      methodOrReason: `${targetComponent} - ${concessionReasonStr || 'Approved by Principal'}`,
      date: 'Today • Just Now',
      performedBy: 'Rajesh K (Admin Staff)'
    };

    setActivities(prev => [newAct, ...prev]);
    setShowConcessionModal(false);
    showToast('Concession Applied!', `₹${amountNum.toLocaleString()} concession applied for ${targetComponent}.`, 'success');
  };

  // Handler: Open Edit Modal
  const handleOpenEditModal = (item: FeeItem) => {
    setSelectedFee(item);
    setEditTotal(String(item.totalAmount));
    setEditPaid(String(item.paidAmount));
    setEditConcession(String(item.concessionAmount));
    setShowEditModal(true);
  };

  // Handler: Save Edit Fee
  const handleSaveEditFee = () => {
    if (!selectedFee) return;
    const tot = parseFloat(editTotal) || 0;
    const pd = parseFloat(editPaid) || 0;
    const conc = parseFloat(editConcession) || 0;

    setFeeItems(prev => prev.map(item => item.id === selectedFee.id ? {
      ...item,
      totalAmount: tot,
      paidAmount: pd,
      concessionAmount: conc
    } : item));

    const newAct: TimelineActivity = {
      id: `act_${Date.now()}`,
      type: 'edit',
      title: 'Fee Ledger Item Edited',
      amount: `₹${tot.toLocaleString()}`,
      methodOrReason: `${selectedFee.name} updated (Paid: ₹${pd.toLocaleString()}, Conc: ₹${conc.toLocaleString()})`,
      date: 'Today • Just Now',
      performedBy: 'Rajesh K (Admin Staff)'
    };

    setActivities(prev => [newAct, ...prev]);
    setShowEditModal(false);
    showToast('Fee Updated', `${selectedFee.name} details saved.`, 'info');
  };

  // Handler: Confirm Delete Fee Item
  const handleConfirmDeleteFee = () => {
    if (!selectedFee) return;
    const name = selectedFee.name;
    setFeeItems(prev => prev.filter(item => item.id !== selectedFee.id));
    setShowDeleteModal(false);
    showToast('Fee Item Deleted', `${name} removed from student ledger.`, 'warning');
  };

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';

  return (
    <View style={[styles.container, isSuperAdmin && { backgroundColor: '#101415' }]}>
      <LinearGradient
        colors={isSuperAdmin ? ['#1d2022', '#101415'] : ['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <AdminStaffHeader
        onBackPress={canGoBack ? () => navigation.goBack() : undefined}
        title="Student Performance & Ledger"
        subtitle={isSuperAdmin ? "Super Admin Student Analytics" : "Academic Analytics & Fee Portfolio"}
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <User size={20} color={primaryColor} />
          </View>
        }
      />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]} 
        showsVerticalScrollIndicator={false}
      >

        {/* TOP PROFILE CARD SUMMARY */}
        <View className="px-5 mb-4">
          <GlassCard intensity="low" className={`p-3.5 sm:p-4 border bg-[#101415]/90 rounded-2xl ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/20'}`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-2 min-w-0">
                <View className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl items-center justify-center mr-2.5 sm:mr-3 border shadow-sm flex-shrink-0 ${primaryBadgeClass}`}>
                  <Text className={`${primaryTextClass} font-extrabold text-base sm:text-lg`}>
                    {studentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1 min-w-0">
                  <View className="flex-row items-center flex-wrap" style={{ gap: 4 }}>
                    <Text className="text-white font-extrabold text-sm sm:text-base mr-1" numberOfLines={1}>
                      {studentName}
                    </Text>
                    <View className={`px-2 py-0.5 rounded-full flex-shrink-0 ${primaryBadgeClass}`}>
                      <Text className={`${primaryTextClass} text-[9.5px] font-bold`}>Active Student</Text>
                    </View>
                  </View>
                  <Text className="text-white/60 text-xs mt-0.5" numberOfLines={1}>
                    {className} • Admission: {admissionNo}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setIsDetailsExpanded(!isDetailsExpanded)}
                className={`px-2.5 py-1.5 rounded-xl flex-row items-center border flex-shrink-0 active:scale-95 ${isSuperAdmin ? 'border-[#f0c110]/40 bg-[#f0c110]/10' : 'border-[#00f1a1]/40 bg-[#00f1a1]/10'}`}
              >
                <Text className={`${primaryTextClass} text-xs font-bold mr-1`}>
                  {isDetailsExpanded ? 'Hide Details' : 'View Profile'}
                </Text>
                {isDetailsExpanded ? (
                  <ChevronUp size={15} color={primaryColor} />
                ) : (
                  <ChevronDown size={15} color={primaryColor} />
                )}
              </Pressable>
            </View>

            {/* EXPANDABLE COMPREHENSIVE STUDENT DETAILS */}
            {isDetailsExpanded && (
              <View className="mt-4 pt-4 border-t border-white/10">
                <Text className={`${primaryTextClass} text-xs font-bold uppercase tracking-wider mb-3`}>
                  Complete Student Demographics & Family Profile
                </Text>

                <View className="bg-black/40 rounded-xl p-3 mb-3 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Full Name</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">{studentName}</Text>
                  </View>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Gender & DOB</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">Male • 15-05-2011</Text>
                  </View>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Class & Section</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">{className}</Text>
                  </View>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Admission Number</Text>
                    <Text className={`${primaryTextClass} text-xs font-mono mt-0.5`}>{admissionNo}</Text>
                  </View>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Student PEN NO.</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">36 1204 1002 045</Text>
                  </View>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Aadhar Number</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">1234 5678 9012</Text>
                  </View>
                </View>

                {/* Parent Details Grid */}
                <View className="bg-black/40 rounded-xl p-3 mb-3 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Father's Name</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">Nageswara Rao</Text>
                  </View>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Father's Occupation</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">Business / Agriculture</Text>
                  </View>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Mother's Name</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">Laxmi Devi</Text>
                  </View>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Mother's Occupation</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">Homemaker</Text>
                  </View>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Guardian Mobile</Text>
                    <View className="flex-row items-center mt-0.5">
                      <Text className="text-white text-xs font-semibold mr-1">+91 9876543210</Text>
                      <Phone size={11} color={primaryColor} />
                    </View>
                  </View>
                  <View className="w-[47%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Mother Tongue</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">Telugu</Text>
                  </View>
                </View>

                {/* Address & Demographics Grid */}
                <View className="bg-black/40 rounded-xl p-3 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
                  <View className="w-full">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Residential Address</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">Door No: 4-12, Nizamabad Main Road, Telangana State</Text>
                  </View>
                  <View className="w-[30%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Religion</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">Hindu</Text>
                  </View>
                  <View className="w-[30%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">Caste</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">BC-B</Text>
                  </View>
                  <View className="w-[33%]">
                    <Text className="text-white/40 text-[10px] uppercase font-bold">TC Number</Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">TC-2026-9921</Text>
                  </View>
                </View>
              </View>
            )}
          </GlassCard>
        </View>

        {/* SECTION 1: ACADEMIC PERFORMANCE & ATTENDANCE */}
        <View className="px-5 mb-5">
          <GlassCard intensity="low" className={`p-4 bg-[#101415]/90 rounded-2xl border ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-white/10'}`}>
            <View className="flex-row items-center justify-between border-b border-white/10 pb-3 mb-4">
              <View className="flex-row items-center flex-1 mr-2 min-w-0">
                <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 flex-shrink-0 ${primaryBadgeClass}`}>
                  <TrendingUp size={16} color={primaryColor} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-white font-extrabold text-xs sm:text-sm" numberOfLines={1} adjustsFontSizeToFit>Academic Performance & Attendance</Text>
                  <Text className="text-white/50 text-[9.5px] sm:text-[10px]" numberOfLines={1}>Academic Year 2026-2027 Overview</Text>
                </View>
              </View>
              <View className={`px-2.5 py-1 rounded-full flex-shrink-0 ${primaryBadgeClass}`}>
                <Text className={`${primaryTextClass} text-[9.5px] sm:text-[10px] font-bold`}>Grade A+ (94.2%)</Text>
              </View>
            </View>

            {/* Academic Metrics 3 Cards Row */}
            <View className="flex-row justify-between mb-4" style={{ gap: 6 }}>
              <View className="flex-1 bg-black/40 p-2 sm:p-3 rounded-xl border border-white/5 items-center">
                <Text className="text-white/40 text-[9px] sm:text-[10px] uppercase font-bold mb-1" numberOfLines={1}>Rank</Text>
                <Text className={`${primaryTextClass} text-base sm:text-lg font-extrabold`} numberOfLines={1}>Rank 1</Text>
                <Text className="text-white/50 text-[8.5px] sm:text-[9px] text-center" numberOfLines={1}>Class Top Performer</Text>
              </View>

              <View className="flex-1 bg-black/40 p-2 sm:p-3 rounded-xl border border-white/5 items-center">
                <Text className="text-white/40 text-[9px] sm:text-[10px] uppercase font-bold mb-1" numberOfLines={1}>Attendance</Text>
                <Text className="text-sky-400 text-base sm:text-lg font-extrabold" numberOfLines={1}>91.6%</Text>
                <Text className="text-white/50 text-[8.5px] sm:text-[9px] text-center" numberOfLines={1}>165 / 180 Days</Text>
              </View>

              <View className="flex-1 bg-black/40 p-2 sm:p-3 rounded-xl border border-white/5 items-center">
                <Text className="text-white/40 text-[9px] sm:text-[10px] uppercase font-bold mb-1" numberOfLines={1}>GPA Score</Text>
                <Text className="text-purple-300 text-base sm:text-lg font-extrabold" numberOfLines={1}>9.8 / 10</Text>
                <Text className="text-white/50 text-[8.5px] sm:text-[9px] text-center" numberOfLines={1}>Term 1 Assessment</Text>
              </View>
            </View>

            {/* Attendance Progress Bar & Calendar Toggle */}
            <Pressable
              onPress={() => setShowAttendanceCalendar(!showAttendanceCalendar)}
              className="bg-white/5 border border-white/10 p-3.5 rounded-2xl mb-5 active:bg-white/10"
            >
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-white/90 text-xs font-semibold">Overall Attendance Rate</Text>
                <Text className={`${primaryTextClass} text-xs font-bold`}>91.6% (Click to view calendar →)</Text>
              </View>
              <View className="h-2 bg-black/40 rounded-full overflow-hidden">
                <View className={`h-full rounded-full ${primaryBtnClass}`} style={{ width: '91.6%' }} />
              </View>
            </Pressable>

            {/* COLOR-CODED ATTENDANCE CALENDAR GRID VIEW */}
            {showAttendanceCalendar && (
              <View className={`bg-[#121817] border p-4 rounded-2xl mb-5 ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-[#00f1a1]/30'}`}>
                <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-white/10">
                  <View className="flex-row items-center">
                    <Calendar size={15} color={primaryColor} style={{ marginRight: 8 }} />
                    <Text className="text-white text-xs font-bold">Attendance Calendar ({MONTH_NAMES[calendarMonth]} {calendarYear})</Text>
                  </View>
                  <View className="flex-row items-center" style={{ gap: 4 }}>
                    <Pressable onPress={handlePrevMonth} className="p-1 rounded-lg bg-white/5 active:bg-white/15">
                      <ChevronLeft size={16} color={primaryColor} />
                    </Pressable>
                    <Text className="text-white/80 text-[11px] font-bold mx-1">{MONTH_NAMES[calendarMonth].slice(0, 3)} {calendarYear}</Text>
                    <Pressable onPress={handleNextMonth} className="p-1 rounded-lg bg-white/5 active:bg-white/15">
                      <ChevronRight size={16} color={primaryColor} />
                    </Pressable>
                  </View>
                </View>

                {/* Calendar Legend */}
                <View className="flex-row flex-wrap mb-3" style={{ gap: 10 }}>
                  <View className="flex-row items-center">
                    <View className={`w-2.5 h-2.5 rounded-full mr-1.5 ${primaryBtnClass}`} />
                    <Text className={`${primaryTextClass} text-[10px] font-bold`}>Present (165d)</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5" />
                    <Text className="text-amber-400 text-[10px] font-bold">Half Day (4d)</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-2.5 rounded-full bg-rose-400 mr-1.5" />
                    <Text className="text-rose-400 text-[10px] font-bold">Absent (11d)</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-2.5 rounded-full bg-white/40 mr-1.5" />
                    <Text className="text-white/40 text-[10px] font-bold">Off/Sun (9d)</Text>
                  </View>
                </View>

                {/* Weekday Labels Header Row */}
                <View className="flex-row justify-between mb-2">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
                    <Text key={d} className={`w-[14.28%] text-center text-[9.5px] font-bold uppercase ${i === 0 ? 'text-rose-400/80' : 'text-white/40'}`}>{d}</Text>
                  ))}
                </View>

                {/* Real Calendar Grid with Weekday Alignment */}
                <View className="flex-row flex-wrap" style={{ margin: -2 }}>
                  {calendarGridCells.map((item, idx) => {
                    if (item.day === null) {
                      return (
                        <View key={`pad_${idx}`} className="w-[14.28%] p-1">
                          <View className="h-8 border border-transparent rounded-lg" />
                        </View>
                      );
                    }

                    let bgStyle = primaryBadgeClass;
                    let textStyle = primaryTextClass;
                    if (item.status === 'partial') {
                      bgStyle = 'bg-amber-500/20 border-amber-500/40';
                      textStyle = 'text-amber-400';
                    } else if (item.status === 'absent') {
                      bgStyle = 'bg-rose-500/20 border-rose-500/40';
                      textStyle = 'text-rose-400';
                    } else if (item.status === 'off') {
                      bgStyle = 'bg-white/5 border-white/10';
                      textStyle = 'text-white/30';
                    }

                    return (
                      <View key={`day_${item.day}`} className="w-[14.28%] p-1">
                        <View className={`h-8 border rounded-lg items-center justify-center ${bgStyle}`}>
                          <Text className={`text-[10px] font-bold ${textStyle}`}>{item.day}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Subject Marks Table Preview */}
            <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Subject-Wise Term 1 Marks</Text>
            <View className="bg-black/40 rounded-xl overflow-hidden border border-white/10">
              <View className="flex-row bg-white/5 p-2.5 border-b border-white/10">
                <Text className="w-[40%] text-white/60 text-[10px] font-bold uppercase">Subject</Text>
                <Text className="w-[30%] text-white/60 text-[10px] font-bold uppercase text-center">Marks</Text>
                <Text className="w-[30%] text-white/60 text-[10px] font-bold uppercase text-right">Grade</Text>
              </View>

              {[
                { name: 'Mathematics', marks: '98 / 100', grade: 'A+' },
                { name: 'Physics', marks: '95 / 100', grade: 'A+' },
                { name: 'Chemistry', marks: '92 / 100', grade: 'A+' },
                { name: 'English', marks: '92 / 100', grade: 'A+' },
              ].map((sub, idx) => (
                <View key={idx} className="flex-row p-2.5 border-b border-white/5 items-center">
                  <Text className="w-[40%] text-white text-xs font-semibold">{sub.name}</Text>
                  <Text className={`${primaryTextClass} w-[30%] text-xs font-bold text-center`}>{sub.marks}</Text>
                  <Text className="w-[30%] text-purple-300 text-xs font-bold text-right">{sub.grade}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </View>

        {/* SECTION 2: FEE SUMMARY & LEDGER */}
        <View className="px-5 mb-5">
          <GlassCard intensity="low" className={`p-4 bg-[#101415]/90 rounded-2xl border ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-white/10'}`}>
            <View className="flex-row items-center justify-between border-b border-white/10 pb-3 mb-4 flex-wrap" style={{ gap: 6 }}>
              <View className="flex-row items-center flex-1 mr-1 min-w-[130px]">
                <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2 flex-shrink-0 ${primaryBadgeClass}`}>
                  <DollarSign size={16} color={primaryColor} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-white font-extrabold text-xs sm:text-sm" numberOfLines={1}>Fee Summary & Ledger</Text>
                  <Text className="text-white/50 text-[9px] sm:text-[10px]" numberOfLines={1}>Component Allotments & Payments</Text>
                </View>
              </View>

              <View className="flex-row items-center flex-shrink-0" style={{ gap: 5 }}>
                <Pressable
                  onPress={() => setShowConcessionModal(true)}
                  className="bg-purple-500/20 border border-purple-500/40 px-2.5 py-1.5 rounded-xl flex-row items-center active:scale-95 flex-shrink-0"
                >
                  <Text className="text-purple-300 text-[11px] sm:text-xs font-bold">+ Concession</Text>
                </Pressable>

                <Pressable
                  onPress={() => setShowCollectModal(true)}
                  className={`${primaryBtnClass} px-2.5 py-1.5 rounded-xl flex-row items-center shadow-lg active:scale-95 flex-shrink-0`}
                >
                  <Plus size={13} color="#101415" style={{ marginRight: 3 }} />
                  <Text className="text-[#101415] text-[11px] sm:text-xs font-bold">Collect Fee</Text>
                </Pressable>
              </View>
            </View>

            {/* Fee Totals Ribbon */}
            <View className="flex-row justify-between mb-4" style={{ gap: 4 }}>
              <View className="flex-1 bg-black/40 p-2 sm:p-2.5 rounded-xl border border-white/5 items-center">
                <Text className="text-white/40 text-[8px] sm:text-[9px] uppercase font-bold text-center" numberOfLines={1} adjustsFontSizeToFit>TOTAL ASSIGNED</Text>
                <Text className="text-white text-xs sm:text-sm font-extrabold mt-0.5 text-center" numberOfLines={1} adjustsFontSizeToFit>₹{feeTotals.total.toLocaleString()}</Text>
              </View>

              <View className="flex-1 bg-black/40 p-2 sm:p-2.5 rounded-xl border border-white/5 items-center">
                <Text className="text-white/40 text-[8px] sm:text-[9px] uppercase font-bold text-center" numberOfLines={1} adjustsFontSizeToFit>PAID TILL DATE</Text>
                <Text className={`${primaryTextClass} text-xs sm:text-sm font-extrabold mt-0.5 text-center`} numberOfLines={1} adjustsFontSizeToFit>₹{feeTotals.paid.toLocaleString()}</Text>
              </View>

              <View className="flex-1 bg-black/40 p-2 sm:p-2.5 rounded-xl border border-white/5 items-center">
                <Text className="text-white/40 text-[8px] sm:text-[9px] uppercase font-bold text-center" numberOfLines={1} adjustsFontSizeToFit>CONCESSIONS</Text>
                <Text className="text-purple-300 text-xs sm:text-sm font-extrabold mt-0.5 text-center" numberOfLines={1} adjustsFontSizeToFit>₹{feeTotals.concession.toLocaleString()}</Text>
              </View>

              <View className="flex-1 bg-black/40 p-2 sm:p-2.5 rounded-xl border border-white/5 items-center">
                <Text className="text-white/40 text-[8px] sm:text-[9px] uppercase font-bold text-center" numberOfLines={1} adjustsFontSizeToFit>OUTSTANDING</Text>
                <Text className="text-rose-400 text-xs sm:text-sm font-extrabold mt-0.5 text-center" numberOfLines={1} adjustsFontSizeToFit>₹{feeTotals.due.toLocaleString()}</Text>
              </View>
            </View>

            {/* Fee Item Cards List */}
            <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Detailed Fee Items Breakdown</Text>
            {feeItems.map(item => {
              const due = Math.max(0, item.totalAmount - item.paidAmount - item.concessionAmount);
              const isFullyPaid = due === 0;

              return (
                <View key={item.id} className="bg-black/40 p-3 rounded-2xl border border-white/10 mb-3">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="text-white font-bold text-xs">{item.name}</Text>
                      <Text className="text-white/50 text-[10px]">
                        Assigned: ₹{item.totalAmount.toLocaleString()} • Paid: ₹{item.paidAmount.toLocaleString()}
                        {item.concessionAmount > 0 ? ` • Concession: ₹${item.concessionAmount.toLocaleString()}` : ''}
                      </Text>
                    </View>

                    {isFullyPaid ? (
                      <View className={`px-2 py-0.5 rounded-full ${primaryBadgeClass}`}>
                        <Text className={`${primaryTextClass} text-[9.5px] font-bold`}>Paid</Text>
                      </View>
                    ) : (
                      <View className="bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded-full">
                        <Text className="text-rose-400 text-[9.5px] font-bold">Due: ₹{due.toLocaleString()}</Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row justify-between items-center pt-2 border-t border-white/5">
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      {/* Print Receipt */}
                      <Pressable
                        onPress={() => {
                          setSelectedFee(item);
                          setShowPrintModal(true);
                        }}
                        className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg flex-row items-center"
                      >
                        <Printer size={12} color={primaryColor} className="mr-1" />
                        <Text className={`${primaryTextClass} text-[10px] font-bold`}>Receipt</Text>
                      </Pressable>

                      {/* Edit Fee */}
                      <Pressable
                        onPress={() => handleOpenEditModal(item)}
                        className="bg-white/5 border border-white/10 p-1.5 rounded-lg"
                      >
                        <Edit size={12} color="rgba(255,255,255,0.7)" />
                      </Pressable>

                      {/* Delete Fee */}
                      <Pressable
                        onPress={() => {
                          setSelectedFee(item);
                          setShowDeleteModal(true);
                        }}
                        className="bg-rose-500/10 border border-rose-500/30 p-1.5 rounded-lg"
                      >
                        <Trash2 size={12} color="#ff516a" />
                      </Pressable>
                    </View>

                    <Text className="text-white/40 text-[10px]">Due Date: 15-08-2026</Text>
                  </View>
                </View>
              );
            })}
          </GlassCard>
        </View>

        {/* SECTION 3: RECENT AUDIT TIMELINE */}
        <View className="px-5 mb-8">
          <GlassCard intensity="low" className={`p-4 bg-[#101415]/90 rounded-2xl border ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-white/10'}`}>
            <View className="flex-row items-center justify-between border-b border-white/10 pb-3 mb-4">
              <View className="flex-row items-center">
                <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${primaryBadgeClass}`}>
                  <History size={16} color={primaryColor} />
                </View>
                <View>
                  <Text className="text-white font-extrabold text-sm">Fee Activity & Payment Timeline</Text>
                  <Text className="text-white/50 text-[10px]">Audit Log of Collections & Concessions</Text>
                </View>
              </View>

              {/* Timeline Filter Dropdown Trigger */}
              <View className="relative">
                <Pressable
                  onPress={() => setShowTimelineFilterDropdown(!showTimelineFilterDropdown)}
                  className="bg-white/5 border border-white/15 px-3 py-1.5 rounded-xl flex-row items-center"
                >
                  <Filter size={12} color={primaryColor} className="mr-1.5" />
                  <Text className="text-white text-xs font-semibold capitalize">{timelineFilter}</Text>
                  <ChevronDown size={12} color="rgba(255,255,255,0.6)" className="ml-1" />
                </Pressable>

                {showTimelineFilterDropdown && (
                  <View className={`absolute top-9 right-0 z-50 bg-[#101415] border rounded-xl p-1 shadow-2xl w-32 ${isSuperAdmin ? 'border-[#f0c110]/40' : 'border-[#00f1a1]/40'}`}>
                    {(['all', 'payment', 'concession'] as const).map(tf => (
                      <Pressable
                        key={tf}
                        onPress={() => {
                          setTimelineFilter(tf);
                          setShowTimelineFilterDropdown(false);
                        }}
                        className={`p-2 rounded-lg flex-row items-center justify-between ${timelineFilter === tf ? primaryBadgeClass : 'active:bg-white/5'}`}
                      >
                        <Text className={`text-xs capitalize ${timelineFilter === tf ? primaryTextClass : 'text-white/80'}`}>{tf}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Timeline List */}
            {filteredActivities.map((act) => (
              <View key={act.id} className="flex-row items-start mb-4 border-l-2 border-white/10 pl-3 ml-2">
                <View className={`w-3 h-3 rounded-full -ml-[19px] mt-1 border-2 border-[#101415] ${act.type === 'payment' ? primaryBtnClass : act.type === 'concession' ? 'bg-purple-400' : 'bg-sky-400'}`} />
                <View className="flex-1 ml-2">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-white font-bold text-xs">{act.title}</Text>
                    <Text className={`${primaryTextClass} text-xs font-bold`}>{act.amount}</Text>
                  </View>
                  <Text className="text-white/60 text-[11px] mt-0.5">{act.methodOrReason}</Text>
                  <Text className="text-white/40 text-[10px] mt-1">{act.date} • By {act.performedBy}</Text>
                </View>
              </View>
            ))}
          </GlassCard>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* COLLECT FEE PAYMENT MODAL */}
      <Modal visible={showCollectModal} transparent animationType="slide" onRequestClose={() => setShowCollectModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-md p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-2xl' : 'border-[#00f1a1]/40 shadow-2xl'}`}>
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <Text className="text-white font-bold text-base">Record Fee Payment</Text>
              <Pressable onPress={() => setShowCollectModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <View className="mb-3">
              <Text className="text-white/70 text-xs font-bold mb-1">Collection Amount (₹) *</Text>
              <TextInput
                value={collectAmount}
                onChangeText={setCollectAmount}
                keyboardType="numeric"
                placeholder="10000"
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-sm font-extrabold"
              />
            </View>

            <View className="mb-3">
              <Text className="text-white/70 text-xs font-bold mb-1">Payment Mode *</Text>
              <View className="flex-row" style={{ gap: 6 }}>
                {['Cash', 'UPI', 'Card', 'Cheque'].map(m => (
                  <Pressable
                    key={m}
                    onPress={() => setCollectMethod(m)}
                    className={`flex-1 py-2 rounded-xl items-center border ${collectMethod === m ? primaryBtnClass : 'bg-white/5 border-white/10'}`}
                  >
                    <Text className={`text-xs font-bold ${collectMethod === m ? 'text-[#101415]' : 'text-white/70'}`}>{m}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-white/70 text-xs font-bold mb-1">Remarks / Txn ID</Text>
              <TextInput
                value={collectRemarks}
                onChangeText={setCollectRemarks}
                placeholder="e.g. Receipt #9921 / UPI884210"
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
              />
            </View>

            <View className="flex-row border-t border-white/10 pt-3" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowCollectModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleRecordPaymentSubmit} className={`flex-1 py-3 rounded-xl ${primaryBtnClass} items-center shadow-lg`}>
                <Text className="text-[#101415] font-extrabold text-xs">Submit Collection</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* APPLY CONCESSION MODAL */}
      <Modal visible={showConcessionModal} transparent animationType="slide" onRequestClose={() => setShowConcessionModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-md p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-2xl' : 'border-[#00f1a1]/40 shadow-2xl'}`}>
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <Text className="text-white font-bold text-base">Apply Fee Concession</Text>
              <Pressable onPress={() => setShowConcessionModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <View className="mb-3">
              <Text className="text-white/70 text-xs font-bold mb-1">Target Component *</Text>
              <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                {feeItems.map(f => (
                  <Pressable
                    key={f.id}
                    onPress={() => setSelectedConcessionFeeId(f.id)}
                    className={`px-3 py-2 rounded-xl border ${selectedConcessionFeeId === f.id ? primaryBtnClass : 'bg-white/5 border-white/10'}`}
                  >
                    <Text className={`text-xs font-bold ${selectedConcessionFeeId === f.id ? 'text-[#101415]' : 'text-white/70'}`}>{f.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-white/70 text-xs font-bold mb-1">Concession Amount (₹) *</Text>
              <TextInput
                value={concessionVal}
                onChangeText={setConcessionVal}
                keyboardType="numeric"
                placeholder="2000"
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-sm font-extrabold"
              />
            </View>

            <View className="mb-4">
              <Text className="text-white/70 text-xs font-bold mb-1">Approval Reason *</Text>
              <TextInput
                value={concessionReasonStr}
                onChangeText={setConcessionReasonStr}
                placeholder="e.g. Merit Scholarship / Staff Ward Discount"
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
              />
            </View>

            <View className="flex-row border-t border-white/10 pt-3" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowConcessionModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleApplyConcessionSubmit} className="flex-1 py-3 rounded-xl bg-purple-500 items-center shadow-lg">
                <Text className="text-white font-extrabold text-xs">Confirm Concession</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT FEE MODAL */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-md p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-2xl' : 'border-[#00f1a1]/40 shadow-2xl'}`}>
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <Text className="text-white font-bold text-base">Edit Fee Component</Text>
              <Pressable onPress={() => setShowEditModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <View className="mb-3">
              <Text className="text-white/70 text-xs font-bold mb-1">Total Assigned Fee (₹)</Text>
              <TextInput
                value={editTotal}
                onChangeText={setEditTotal}
                keyboardType="numeric"
                className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
              />
            </View>

            <View className="mb-3">
              <Text className="text-white/70 text-xs font-bold mb-1">Paid Amount (₹)</Text>
              <TextInput
                value={editPaid}
                onChangeText={setEditPaid}
                keyboardType="numeric"
                className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
              />
            </View>

            <View className="mb-4">
              <Text className="text-white/70 text-xs font-bold mb-1">Concession Amount (₹)</Text>
              <TextInput
                value={editConcession}
                onChangeText={setEditConcession}
                keyboardType="numeric"
                className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs"
              />
            </View>

            <View className="flex-row border-t border-white/10 pt-3" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowEditModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSaveEditFee} className={`flex-1 py-3 rounded-xl ${primaryBtnClass} items-center shadow-lg`}>
                <Text className="text-[#101415] font-extrabold text-xs">Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border-2 border-rose-500/50 rounded-3xl w-full max-w-sm p-6 items-center shadow-[0_0_30px_rgba(255,81,106,0.3)]">
            <View className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/50 items-center justify-center mb-4">
              <Trash2 size={28} color="#ff516a" />
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">Delete Fee Item?</Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">
              Are you sure you want to delete "{selectedFee?.name}" from student ledger? This action cannot be undone.
            </Text>

            <View className="flex-row w-full" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowDeleteModal(false)} className="flex-1 py-3.5 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirmDeleteFee} className="flex-1 py-3.5 rounded-xl bg-rose-500 items-center shadow-[0_0_12px_rgba(255,81,106,0.4)]">
                <Text className="text-white font-extrabold text-xs">Delete Item</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* PRINT RECEIPT PREVIEW MODAL */}
      <Modal visible={showPrintModal} transparent animationType="slide" onRequestClose={() => setShowPrintModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-md p-5 ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-2xl' : 'border-[#00f1a1]/40 shadow-2xl'}`}>
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <View className="flex-row items-center">
                <Printer size={18} color={primaryColor} className="mr-2" />
                <Text className="text-white font-bold text-base">Fee Payment Receipt</Text>
              </View>
              <Pressable onPress={() => setShowPrintModal(false)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <View className="bg-black/50 p-4 rounded-2xl border border-white/10 mb-4">
              <View className="items-center border-b border-white/10 pb-3 mb-3">
                <Text className="text-white font-extrabold text-base">NIZAMABAD INTERNATIONAL SCHOOL</Text>
                <Text className="text-white/50 text-[10px]">Official Student Fee Receipt • Academic Year 2026-2027</Text>
              </View>

              <View className="flex-row justify-between mb-1.5">
                <Text className="text-white/60 text-xs">Student Name:</Text>
                <Text className="text-white font-bold text-xs">{studentName}</Text>
              </View>
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-white/60 text-xs">Class & Section:</Text>
                <Text className="text-white font-bold text-xs">{className}</Text>
              </View>
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-white/60 text-xs">Fee Component:</Text>
                <Text className="text-white font-bold text-xs">{selectedFee?.name}</Text>
              </View>
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-white/60 text-xs">Amount Paid:</Text>
                <Text className={`${primaryTextClass} font-extrabold text-xs`}>₹{selectedFee?.paidAmount.toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-white/60 text-xs">Receipt Date:</Text>
                <Text className="text-white/80 text-xs font-semibold">02-08-2026</Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setShowPrintModal(false);
                showToast('Receipt Generated', 'Fee receipt sent to printer & downloaded as PDF.', 'success');
              }}
              className={`w-full py-3.5 rounded-xl ${primaryBtnClass} items-center shadow-lg`}
            >
              <Text className="text-[#101415] font-extrabold text-xs uppercase tracking-wider">Print / Download PDF</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* CUSTOM TOAST MODAL */}
      <Modal visible={toastData.visible} transparent animationType="fade" onRequestClose={() => setToastData(prev => ({ ...prev, visible: false }))}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className={`bg-[#101415] border-2 rounded-3xl w-full max-w-sm p-6 items-center ${isSuperAdmin ? 'border-[#f0c110]/40 shadow-2xl' : 'border-[#00f1a1]/40 shadow-2xl'}`}>
            <View className={`w-14 h-14 rounded-full items-center justify-center mb-4 border ${toastData.type === 'warning' ? 'bg-amber-500/20 border-amber-500/40' : primaryBadgeClass}`}>
              {toastData.type === 'warning' ? (
                <AlertCircle size={28} color="#f59e0b" />
              ) : (
                <CheckCircle2 size={28} color={primaryColor} />
              )}
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">{toastData.title}</Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">{toastData.message}</Text>

            <Pressable
              onPress={() => setToastData(prev => ({ ...prev, visible: false }))}
              className={`w-full py-3.5 rounded-xl ${primaryBtnClass} items-center shadow-lg`}
            >
              <Text className="text-[#101415] font-extrabold text-sm">Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d2a24',
  },
  scrollContent: {
    paddingTop: 16,
  },
});

export default StudentPerformanceScreen;
