import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Mail,
  ArrowLeft,
  GraduationCap,
  FileText,
  Users,
  FileCheck,
  Calendar,
  Percent,
  Clock,
  Pencil,
  Printer,
  Trash2,
  History,
  Filter,
  List,
  Banknote,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';

export interface FeeItem {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  concessionAmount: number;
}

export interface TimelineActivity {
  id: string;
  type: 'payment' | 'concession';
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

  // Calendar Day Mock (August 2026: 31 Days)
  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      let status: 'present' | 'partial' | 'absent' | 'off' = 'present';
      if (i % 7 === 0) status = 'off'; // Sundays
      else if (i === 5 || i === 18) status = 'absent';
      else if (i === 12 || i === 25) status = 'partial';
      days.push({ day: i, status });
    }
    return days;
  }, []);

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
  const handleSaveEditFeeSubmit = () => {
    if (!selectedFee) return;
    const tot = parseFloat(editTotal) || 0;
    const pd = parseFloat(editPaid) || 0;
    const conc = parseFloat(editConcession) || 0;

    setFeeItems(prev => prev.map(item => {
      if (item.id === selectedFee.id) {
        return { ...item, totalAmount: tot, paidAmount: pd, concessionAmount: conc };
      }
      return item;
    }));

    setShowEditModal(false);
    showToast('Fee Updated', `${selectedFee.name} details have been updated successfully.`, 'success');
  };

  // Handler: Open Delete Modal
  const handleOpenDeleteModal = (item: FeeItem) => {
    setSelectedFee(item);
    setShowDeleteModal(true);
  };

  // Handler: Confirm Delete Fee
  const handleConfirmDeleteFee = () => {
    if (!selectedFee) return;
    setFeeItems(prev => prev.filter(item => item.id !== selectedFee.id));
    setShowDeleteModal(false);
    showToast('Fee Reversed', `${selectedFee.name} record has been removed.`, 'success');
  };

  // Handler: Open Print Modal
  const handleOpenPrintModal = (item: FeeItem) => {
    setSelectedFee(item);
    setShowPrintModal(true);
  };

  // Native Phone Printing via expo-print
  const handlePrintNative = async (itemToPrint?: FeeItem | null) => {
    const fee = itemToPrint || selectedFee;
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 40px;
                color: #111827;
                background-color: #ffffff;
              }
              .header {
                text-align: center;
                border-bottom: 3px solid #00f1a1;
                padding-bottom: 15px;
                margin-bottom: 25px;
              }
              .school-name {
                font-size: 24px;
                font-weight: 800;
                color: #0d2a24;
                letter-spacing: 1px;
              }
              .doc-title {
                font-size: 13px;
                color: #4b5563;
                text-transform: uppercase;
                margin-top: 5px;
                font-weight: bold;
              }
              .receipt-info {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 25px;
              }
              .receipt-info td {
                padding: 10px 12px;
                font-size: 13px;
                border-bottom: 1px solid #e5e7eb;
              }
              .label {
                color: #6b7280;
                font-weight: 600;
                width: 40%;
              }
              .value {
                color: #111827;
                font-weight: 700;
              }
              .amount-card {
                background-color: #ecfdf5;
                border: 1px solid #a7f3d0;
                padding: 15px;
                border-radius: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 20px;
              }
              .amount-label {
                font-size: 14px;
                font-weight: 700;
                color: #065f46;
              }
              .amount-val {
                font-size: 20px;
                font-weight: 800;
                color: #047857;
              }
              .footer {
                margin-top: 50px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
              }
              .sign-title {
                font-size: 12px;
                font-weight: 700;
              }
              .sign-sub {
                font-size: 10px;
                color: #6b7280;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="school-name">KTS INTERNATIONAL SCHOOL</div>
              <div class="doc-title">Official Fee Payment Receipt</div>
            </div>

            <table class="receipt-info">
              <tr>
                <td class="label">Receipt Number</td>
                <td class="value">RCP-2026-0891</td>
              </tr>
              <tr>
                <td class="label">Date & Time</td>
                <td class="value">${new Date().toLocaleString()}</td>
              </tr>
              <tr>
                <td class="label">Student Name</td>
                <td class="value">${studentName}</td>
              </tr>
              <tr>
                <td class="label">Class & Section</td>
                <td class="value">${className}</td>
              </tr>
              <tr>
                <td class="label">Admission Number</td>
                <td class="value">${admissionNo}</td>
              </tr>
              <tr>
                <td class="label">Fee Component</td>
                <td class="value">${fee?.name || 'School Fee Component'}</td>
              </tr>
              <tr>
                <td class="label">Payment Status</td>
                <td class="value" style="color: #047857;">VERIFIED & PAID</td>
              </tr>
            </table>

            <div class="amount-card">
              <div class="amount-label">Total Amount Paid</div>
              <div class="amount-val">₹${(fee?.paidAmount || 15000).toLocaleString()}</div>
            </div>

            <div class="footer">
              <div>
                <p style="font-size: 10px; color: #9ca3af; margin: 0;">Computer Generated Receipt</p>
                <p style="font-size: 10px; color: #9ca3af; margin: 2px 0 0 0;">KTS EduVision Administrative Terminal</p>
              </div>
              <div style="text-align: center;">
                <div class="sign-title">Authorized Signatory</div>
                <div class="sign-sub">Rajesh K (Admin Staff)</div>
              </div>
            </div>
          </body>
        </html>
      `;

      setShowPrintModal(false);
      await Print.printAsync({ html: htmlContent });
    } catch (err) {
      console.error('Print Error:', err);
      showToast('Print Failed', 'Unable to launch native print dialog.', 'warning');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header matching Admin Staff theme */}
      <AdminStaffHeader
        title="Student Performance"
        subtitle="ACADEMIC PERFORMANCE TERMINAL"
        onBackPress={canGoBack ? () => navigation.goBack() : undefined}
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1] items-center justify-center shadow-[0_0_10px_rgba(0,241,161,0.5)]">
            <TrendingUp size={22} color="#101415" />
          </View>
        }
        rightAction={
          <Pressable className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center relative shadow-[0_0_10px_rgba(0,241,161,0.1)]">
            <Bell size={18} color="#00f1a1" />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Responsive Header Title */}
        <View className="mb-6 flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <Text className="text-white text-2xl font-extrabold tracking-tight">Student Performance</Text>
            <Text className="text-white/60 text-xs mt-0.5">Deep dive into academic metrics & trends</Text>
          </View>
          {canGoBack && (
            <Pressable
              onPress={() => navigation.goBack()}
              className="bg-[#00f1a1]/15 border border-[#00f1a1]/30 px-3 py-1.5 rounded-xl flex-row items-center flex-shrink-0"
            >
              <ArrowLeft size={13} color="#00f1a1" style={{ marginRight: 4 }} />
              <Text className="text-[#00f1a1] text-xs font-bold">Back</Text>
            </Pressable>
          )}
        </View>

        {/* Student Selector Banner (Clicking toggles inline details below) */}
        <Pressable
          onPress={() => setIsDetailsExpanded(!isDetailsExpanded)}
          className="bg-[#101415]/90 border border-[#00f1a1]/40 rounded-2xl px-5 py-3.5 flex-row justify-between items-center mb-4 shadow-lg active:opacity-80"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-10 h-10 rounded-full bg-[#00f1a1]/20 border border-[#00f1a1]/50 items-center justify-center mr-3">
              <Text className="text-[#00f1a1] font-bold text-base">
                {selectedStudent?.initials || studentName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[#00f1a1] text-[10px] font-bold tracking-widest uppercase mb-0.5">
                SELECTED STUDENT • {className}
              </Text>
              <Text className="text-white font-bold text-base" numberOfLines={1}>{studentName}</Text>
              <Text className="text-white/40 text-[11px]">Adm No: {admissionNo}</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            {/* Edit Profile Button */}
            <Pressable
              onPress={() => navigation.navigate('AddStudent', { student: selectedStudent, isEdit: true })}
              className="bg-[#00f1a1]/15 border border-[#00f1a1]/40 px-3 py-1.5 rounded-xl flex-row items-center mr-2"
            >
              <Pencil size={12} color="#00f1a1" style={{ marginRight: 4 }} />
              <Text className="text-[#00f1a1] text-xs font-bold">Edit Profile</Text>
            </Pressable>

            <View className="w-8 h-8 rounded-full bg-[#00f1a1]/10 border border-[#00f1a1]/30 items-center justify-center">
              {isDetailsExpanded ? (
                <ChevronUp size={18} color="#00f1a1" />
              ) : (
                <ChevronDown size={18} color="#00f1a1" />
              )}
            </View>
          </View>
        </Pressable>

        {/* INLINE COLLAPSIBLE STUDENT PROFILE DETAILS SECTION */}
        {isDetailsExpanded && (
          <View className="bg-[#101415]/95 border border-[#00f1a1]/40 rounded-3xl p-5 mb-8 shadow-2xl">
            {/* Header */}
            <View className="flex-row justify-between items-center pb-3 border-b border-white/10 mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-white text-base font-bold">Student Profile Details</Text>
                <Text className="text-white/50 text-[11px]">Personal, attendance and fee ledger summary</Text>
              </View>

              <View className="items-end" style={{ gap: 6 }}>
                <View className="flex-row items-center">
                  <Text className="text-white/40 text-[10px] uppercase font-bold mr-1.5">Status:</Text>
                  {selectedStudent?.status === 'Left' ? (
                    <View className="bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full">
                      <Text className="text-white/60 text-[10px] font-bold">Left</Text>
                    </View>
                  ) : selectedStudent?.status === 'Transfer' ? (
                    <View className="bg-sky-500/15 border border-sky-500/40 px-2.5 py-0.5 rounded-full">
                      <Text className="text-sky-400 text-[10px] font-bold">Transfer</Text>
                    </View>
                  ) : (
                    <View className="bg-[#00f1a1]/15 border border-[#00f1a1]/40 px-2.5 py-0.5 rounded-full">
                      <Text className="text-[#00f1a1] text-[10px] font-bold">{selectedStudent?.status || 'Active'}</Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center">
                  <Text className="text-white/40 text-[10px] uppercase font-bold mr-1.5">Fee Status:</Text>
                  {feeTotals.due > 0 ? (
                    feeTotals.paid > 0 ? (
                      <View className="bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex-row items-center">
                        <View className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
                        <Text className="text-amber-400 text-[10px] font-bold">Partial</Text>
                      </View>
                    ) : (
                      <View className="bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full flex-row items-center">
                        <View className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5" />
                        <Text className="text-rose-400 text-[10px] font-bold">Overdue</Text>
                      </View>
                    )
                  ) : (
                    <View className="bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex-row items-center">
                      <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                      <Text className="text-emerald-400 text-[10px] font-bold">Paid</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Attendance Overview */}
            <View className="flex-row justify-between items-center mb-2.5">
              <Text className="text-white/70 text-xs font-bold uppercase tracking-wider">Attendance Overview</Text>
              <Pressable
                onPress={() => setShowAttendanceCalendar(!showAttendanceCalendar)}
                className="flex-row items-center"
              >
                <Calendar size={12} color="#00f1a1" style={{ marginRight: 4 }} />
                <Text className="text-[#00f1a1] text-[11px] font-bold">
                  {showAttendanceCalendar ? 'Hide Grid View ▲' : 'Calendar Grid View ▼'}
                </Text>
              </Pressable>
            </View>

            <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
              <View className="flex-1 min-w-[70px] bg-white/5 border border-white/10 p-2.5 rounded-xl items-center">
                <Text className="text-white/50 text-[10px] uppercase font-semibold">Working</Text>
                <Text className="text-white font-extrabold text-base mt-1">180</Text>
              </View>
              <View className="flex-1 min-w-[70px] bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl items-center">
                <Text className="text-[#00f1a1] text-[10px] uppercase font-semibold">Present</Text>
                <Text className="text-[#00f1a1] font-extrabold text-base mt-1">165</Text>
              </View>
              <View className="flex-1 min-w-[70px] bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl items-center">
                <Text className="text-amber-400 text-[10px] uppercase font-semibold">Half Days</Text>
                <Text className="text-amber-400 font-extrabold text-base mt-1">4</Text>
              </View>
              <View className="flex-1 min-w-[70px] bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl items-center">
                <Text className="text-rose-400 text-[10px] uppercase font-semibold">Absent</Text>
                <Text className="text-rose-400 font-extrabold text-base mt-1">11</Text>
              </View>
            </View>

            {/* Attendance Progress Bar & Calendar Toggle */}
            <Pressable
              onPress={() => setShowAttendanceCalendar(!showAttendanceCalendar)}
              className="bg-white/5 border border-white/10 p-3.5 rounded-2xl mb-5 active:bg-white/10"
            >
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-white/90 text-xs font-semibold">Overall Attendance Rate</Text>
                <Text className="text-[#00f1a1] text-xs font-bold">91.6% (Click to view calendar →)</Text>
              </View>
              <View className="h-2 bg-black/40 rounded-full overflow-hidden">
                <View className="h-full bg-[#00f1a1] rounded-full" style={{ width: '91.6%' }} />
              </View>
            </Pressable>

            {/* COLOR-CODED ATTENDANCE CALENDAR GRID VIEW */}
            {showAttendanceCalendar && (
              <View className="bg-[#121817] border border-[#00f1a1]/30 p-4 rounded-2xl mb-5">
                <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-white/10">
                  <View className="flex-row items-center">
                    <Calendar size={15} color="#00f1a1" style={{ marginRight: 8 }} />
                    <Text className="text-white text-xs font-bold">Attendance Calendar (August 2026)</Text>
                  </View>
                  <View className="flex-row items-center" style={{ gap: 4 }}>
                    <ChevronLeft size={16} color="rgba(255,255,255,0.6)" />
                    <Text className="text-white/80 text-[11px] font-bold">Aug 2026</Text>
                    <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
                  </View>
                </View>

                {/* Calendar Legend */}
                <View className="flex-row flex-wrap mb-3" style={{ gap: 10 }}>
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-2.5 rounded-full bg-[#00f1a1] mr-1.5" />
                    <Text className="text-[#00f1a1] text-[10px] font-bold">Present (165d)</Text>
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

                {/* 31 Days Grid */}
                <View className="flex-row flex-wrap" style={{ margin: -2 }}>
                  {calendarDays.map((item) => {
                    let bgStyle = 'bg-emerald-500/20 border-emerald-500/40';
                    let textStyle = 'text-[#00f1a1]';
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
                      <View key={item.day} className="w-[14.28%] p-1">
                        <View className={`h-8 border rounded-lg items-center justify-center ${bgStyle}`}>
                          <Text className={`text-[10px] font-bold ${textStyle}`}>{item.day}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Personal & Academic Details */}
            <View className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-5">
              <View className="flex-row items-center mb-3 pb-2 border-b border-white/10">
                <GraduationCap size={16} color="#00f1a1" style={{ marginRight: 10 }} />
                <Text className="text-white text-xs font-bold">Personal & Academic Details</Text>
              </View>
              <View className="flex-row flex-wrap" style={{ margin: -4 }}>
                {[
                  { label: 'Gender', val: selectedStudent?.gender || 'Male' },
                  { label: 'Date of Birth', val: selectedStudent?.dob || '31-03-1998' },
                  { label: 'Admission Date', val: '01-06-2026' },
                  { label: 'Admission No', val: admissionNo },
                  { label: 'Student PEN NO.', val: selectedStudent?.penNo || 'PEN984210' },
                  { label: 'Student Mobile', val: selectedStudent?.phone || '+91 9876543210' },
                  { label: 'Aadhar Number', val: selectedStudent?.aadharNumber || '1234 5678 9012' },
                  { label: 'Biometric Code', val: selectedStudent?.biometricCode || 'BIO-8874' },
                  { label: 'Address', val: selectedStudent?.address || 'Nizamabad Main Street, Telangana' }
                ].map((item, idx) => (
                  <View key={idx} className="w-1/2 p-1">
                    <View className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <Text className="text-white/40 text-[10px] mb-0.5">{item.label}</Text>
                      <Text className="text-white text-xs font-semibold" numberOfLines={1}>{item.val}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Fee Summary & Ledger (With Vertical Stacked Concession & Collect Buttons) */}
            <View className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-5">
              <View className="flex-row justify-between items-start mb-3 pb-3 border-b border-white/10">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center mb-1">
                    <FileText size={16} color="#00f1a1" style={{ marginRight: 10 }} />
                    <Text className="text-white text-sm font-bold">Fee Summary & Ledger</Text>
                  </View>
                  <Text className="text-white/50 text-[11px]">Manage components, payments & concessions</Text>
                </View>

                {/* Vertical Stack: Fee Concession (Top), Collect Payment (Bottom) */}
                <View className="flex-col items-end" style={{ gap: 6 }}>
                  {/* Fee Concession Button */}
                  <Pressable
                    onPress={() => setShowConcessionModal(true)}
                    className="bg-purple-500/20 border border-purple-500/40 px-3 py-2 rounded-xl flex-row items-center active:bg-purple-500/30"
                  >
                    <Percent size={13} color="#c084fc" style={{ marginRight: 6 }} />
                    <Text className="text-purple-300 text-xs font-bold">Fee Concession</Text>
                  </Pressable>

                  {/* Collect Payment Button */}
                  <Pressable
                    onPress={() => setShowCollectModal(true)}
                    className="bg-[#00f1a1] px-3 py-2 rounded-xl flex-row items-center active:opacity-90 shadow-[0_0_10px_rgba(0,241,161,0.3)]"
                  >
                    <Clock size={13} color="#101415" style={{ marginRight: 6 }} />
                    <Text className="text-[#101415] text-xs font-extrabold">Collect Payment</Text>
                  </Pressable>
                </View>
              </View>

              <View className="flex-row justify-between mb-4" style={{ gap: 8 }}>
                <View className="flex-1 bg-black/40 p-2.5 rounded-xl border border-white/10 items-center">
                  <Text className="text-white/40 text-[9px] uppercase">Total Fee</Text>
                  <Text className="text-white font-bold text-xs mt-0.5">₹{feeTotals.total.toLocaleString()}</Text>
                </View>
                <View className="flex-1 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30 items-center">
                  <Text className="text-[#00f1a1] text-[9px] uppercase">Paid</Text>
                  <Text className="text-[#00f1a1] font-bold text-xs mt-0.5">₹{feeTotals.paid.toLocaleString()}</Text>
                </View>
                <View className="flex-1 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30 items-center">
                  <Text className="text-rose-400 text-[9px] uppercase">Due</Text>
                  <Text className="text-rose-400 font-bold text-xs mt-0.5">₹{feeTotals.due.toLocaleString()}</Text>
                </View>
              </View>

              {/* Detailed Fee Breakdown Items with Larger Print, Edit & Delete Buttons */}
              <Text className="text-white/70 text-[11px] font-bold mb-2">Detailed Fee Breakdown</Text>
              {feeItems.map((item) => {
                const itemDue = Math.max(0, item.totalAmount - item.paidAmount - item.concessionAmount);
                const isFullyPaid = itemDue === 0;

                return (
                  <View key={item.id} className="bg-black/30 p-3 rounded-2xl mb-2 flex-row justify-between items-center border border-white/5">
                    <View className="flex-1 mr-3">
                      <Text className="text-white text-xs font-bold">{item.name}</Text>
                      <Text className="text-white/50 text-[11px] mt-0.5">
                        Amount: <Text className="text-white font-semibold">₹{item.totalAmount.toLocaleString()}</Text>
                        {item.concessionAmount > 0 ? ` (Conc: ₹${item.concessionAmount})` : ''}
                      </Text>
                    </View>

                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      {/* Larger Print Button */}
                      <Pressable
                        onPress={() => handleOpenPrintModal(item)}
                        className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 items-center justify-center active:bg-emerald-500/30"
                      >
                        <Printer size={15} color="#00f1a1" />
                      </Pressable>

                      {/* Larger Edit Paid Button */}
                      <Pressable
                        onPress={() => handleOpenEditModal(item)}
                        className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/40 items-center justify-center active:bg-purple-500/30"
                      >
                        <Pencil size={15} color="#c084fc" />
                      </Pressable>

                      {/* Larger Delete / Reverse Button */}
                      <Pressable
                        onPress={() => handleOpenDeleteModal(item)}
                        className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/40 items-center justify-center active:bg-rose-500/30"
                      >
                        <Trash2 size={15} color="#ff516a" />
                      </Pressable>

                      <View className={`px-2.5 py-1 rounded-md ${isFullyPaid ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-rose-500/20 border border-rose-500/40'}`}>
                        <Text className={`text-[10px] font-bold ${isFullyPaid ? 'text-[#00f1a1]' : 'text-rose-400'}`}>
                          {isFullyPaid ? 'Paid' : `Due: ₹${itemDue.toLocaleString()}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* RECENT ACTIVITY TIMELINE WITH FILTER */}
            <View className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-5">
              <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-white/10">
                <View className="flex-row items-center">
                  <History size={16} color="#00f1a1" style={{ marginRight: 10 }} />
                  <Text className="text-white text-xs font-bold">Recent Activity Timeline</Text>
                </View>

                {/* Timeline Filter Toggle */}
                <View className="relative">
                  <Pressable
                    onPress={() => setShowTimelineFilterDropdown(!showTimelineFilterDropdown)}
                    className="bg-[#00f1a1]/15 border border-[#00f1a1]/30 px-2.5 py-1 rounded-lg flex-row items-center"
                  >
                    <Filter size={11} color="#00f1a1" style={{ marginRight: 4 }} />
                    <Text className="text-[#00f1a1] text-[10px] font-bold capitalize">{timelineFilter} Activities</Text>
                    <ChevronDown size={12} color="#00f1a1" style={{ marginLeft: 2 }} />
                  </Pressable>

                  {/* Dropdown Options */}
                  {showTimelineFilterDropdown && (
                    <View className="absolute right-0 top-8 w-40 bg-[#121817] border border-[#00f1a1]/40 rounded-xl p-1 z-30 shadow-2xl">
                      <Pressable
                        onPress={() => { setTimelineFilter('all'); setShowTimelineFilterDropdown(false); }}
                        className={`p-2 rounded-lg flex-row items-center ${timelineFilter === 'all' ? 'bg-[#00f1a1]/20' : ''}`}
                      >
                        <List size={12} color={timelineFilter === 'all' ? '#00f1a1' : '#ffffff'} style={{ marginRight: 6 }} />
                        <Text className={`text-xs ${timelineFilter === 'all' ? 'text-[#00f1a1] font-bold' : 'text-white/80'}`}>All Activities</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => { setTimelineFilter('payment'); setShowTimelineFilterDropdown(false); }}
                        className={`p-2 rounded-lg flex-row items-center ${timelineFilter === 'payment' ? 'bg-[#00f1a1]/20' : ''}`}
                      >
                        <Banknote size={12} color={timelineFilter === 'payment' ? '#00f1a1' : '#ffffff'} style={{ marginRight: 6 }} />
                        <Text className={`text-xs ${timelineFilter === 'payment' ? 'text-[#00f1a1] font-bold' : 'text-white/80'}`}>Payments Only</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => { setTimelineFilter('concession'); setShowTimelineFilterDropdown(false); }}
                        className={`p-2 rounded-lg flex-row items-center ${timelineFilter === 'concession' ? 'bg-[#00f1a1]/20' : ''}`}
                      >
                        <Percent size={12} color={timelineFilter === 'concession' ? '#00f1a1' : '#ffffff'} style={{ marginRight: 6 }} />
                        <Text className={`text-xs ${timelineFilter === 'concession' ? 'text-[#00f1a1] font-bold' : 'text-white/80'}`}>Concessions Only</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>

              {/* Timeline Items List */}
              <View className="pl-1">
                {filteredActivities.map((act, index) => (
                  <View key={act.id} className="flex-row items-start mb-3 relative">
                    {/* Vertical Connector Line */}
                    {index < filteredActivities.length - 1 && (
                      <View className="absolute left-[13px] top-6 bottom-0 w-0.5 bg-white/10" />
                    )}
                    {/* Icon Dot */}
                    <View className={`w-7 h-7 rounded-full items-center justify-center mr-3 z-10 ${act.type === 'payment' ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-purple-500/20 border border-purple-500/50'}`}>
                      {act.type === 'payment' ? (
                        <Banknote size={12} color="#00f1a1" />
                      ) : (
                        <Percent size={12} color="#c084fc" />
                      )}
                    </View>
                    <View className="flex-1 bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <View className="flex-row justify-between items-center mb-0.5">
                        <Text className="text-white text-xs font-bold">{act.title}</Text>
                        <Text className={`text-xs font-bold ${act.type === 'payment' ? 'text-[#00f1a1]' : 'text-purple-400'}`}>{act.amount}</Text>
                      </View>
                      <Text className="text-white/60 text-[11px] mb-1.5">{act.methodOrReason}</Text>
                      <View className="flex-row items-center justify-between pt-1 border-t border-white/5">
                        <Text className="text-white/40 text-[9.5px] font-medium">{act.date}</Text>
                        <View className="bg-[#00f1a1]/15 border border-[#00f1a1]/30 px-2 py-0.5 rounded-md flex-row items-center">
                          <Users size={9} color="#00f1a1" style={{ marginRight: 4 }} />
                          <Text className="text-[#00f1a1] text-[9px] font-bold">by {act.performedBy}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Parent & Guardian Details */}
            <View className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-5">
              <View className="flex-row items-center mb-3 pb-2 border-b border-white/10">
                <Users size={16} color="#00f1a1" style={{ marginRight: 10 }} />
                <Text className="text-white text-xs font-bold">Parent / Guardian Details</Text>
              </View>
              <View className="flex-row flex-wrap" style={{ margin: -4 }}>
                {[
                  { label: "Father's Name", val: selectedStudent?.parentName || 'Pandu K' },
                  { label: "Father's Mobile", val: selectedStudent?.phone || '+91 9876543210' },
                  { label: "Father's Occupation", val: 'Farmer / Business' },
                  { label: "Mother's Name", val: 'Laxmi K' },
                  { label: "Mother's Mobile", val: '+91 9876543211' },
                  { label: "Mother's Occupation", val: 'Homemaker' },
                ].map((item, idx) => (
                  <View key={idx} className="w-1/2 p-1">
                    <View className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <Text className="text-white/40 text-[10px] mb-0.5">{item.label}</Text>
                      <Text className="text-white text-xs font-semibold" numberOfLines={1}>{item.val}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Demographics & TC Details */}
            <View className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-1">
              <View className="flex-row items-center mb-3 pb-2 border-b border-white/10">
                <FileCheck size={16} color="#00f1a1" style={{ marginRight: 10 }} />
                <Text className="text-white text-xs font-bold">Demographics & TC Details</Text>
              </View>
              <View className="flex-row flex-wrap" style={{ margin: -4 }}>
                {[
                  { label: 'Mother Tongue', val: 'Telugu' },
                  { label: 'Nationality', val: 'Indian' },
                  { label: 'State', val: 'Telangana' },
                  { label: 'Religion', val: 'Hindu' },
                  { label: 'Caste', val: 'BC-B' },
                  { label: 'Sub Caste', val: 'Yadav' },
                  { label: 'TC Number', val: 'N/A' },
                ].map((item, idx) => (
                  <View key={idx} className="w-1/2 p-1">
                    <View className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <Text className="text-white/40 text-[10px] mb-0.5">{item.label}</Text>
                      <Text className="text-white text-xs font-semibold" numberOfLines={1}>{item.val}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Subject Mastery */}
        <View className="bg-[#101415]/80 border border-white/10 rounded-[32px] p-6 mb-8 shadow-lg">
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-white text-2xl font-bold mb-1">Subject Mastery</Text>
              <Text className="text-white/60 text-[10px] font-bold tracking-widest uppercase">CURRENT SEMESTER SCORE %</Text>
            </View>
            <View className="bg-[#00f1a1]/10 border border-[#00f1a1]/30 px-4 py-1.5 rounded-full flex-row items-center">
              <View className="w-1.5 h-1.5 rounded-full bg-[#00f1a1] mr-2 shadow-[0_0_8px_#00f1a1]" />
              <Text className="text-[#00f1a1] text-[10px] font-bold">Live Data</Text>
            </View>
          </View>

          <View className="flex-row justify-between items-end h-40 mt-4 px-2">
            {[
              { label: 'MATH', height: '90%' },
              { label: 'PHYS', height: '65%' },
              { label: 'BIOL', height: '80%' },
              { label: 'HIST', height: '45%' },
              { label: 'LIT', height: '85%' },
              { label: 'CHEM', height: '60%' },
            ].map((item, index) => (
              <View key={index} className="items-center w-[12%]">
                <View className="w-full bg-[#0d2a24]/60 rounded-t-xl overflow-hidden" style={{ height: 120, justifyContent: 'flex-end' }}>
                  <View style={{ width: '100%', height: item.height as any, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: '#00f1a1' }} />
                </View>
                <Text className="text-white/80 text-[10px] font-bold mt-4">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Rank Trend */}
        <View className="bg-[#101415]/80 border border-white/10 rounded-[32px] p-6 mb-8 shadow-lg overflow-hidden relative">
          <Text className="text-white text-2xl font-bold mb-1">Rank Trend</Text>
          <Text className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-8">GLOBAL CLASSROOM POSITION</Text>

          {/* Mock Chart Area */}
          <View className="h-28 mb-4 justify-center relative">
            <View className="absolute inset-x-0 top-1/2 h-[3px] bg-[#00f1a1] rounded-full shadow-[0_0_12px_#00f1a1]" style={{ elevation: 10, shadowColor: '#00f1a1', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8 }} />
            <View className="flex-row justify-between items-center h-full pt-4 relative">
              <View className="w-3 h-3 rounded-full bg-[#00f1a1] border-[3px] border-[#101415] z-10" style={{ transform: [{ translateY: 15 }] }} />
              <View className="w-3 h-3 rounded-full bg-[#00f1a1] border-[3px] border-[#101415] z-10" style={{ transform: [{ translateY: -5 }] }} />
              <View className="w-3 h-3 rounded-full bg-[#00f1a1] border-[3px] border-[#101415] z-10" style={{ transform: [{ translateY: 20 }] }} />
              <View className="w-3.5 h-3.5 rounded-full bg-white border-[3px] border-[#101415] shadow-[0_0_16px_#fff] z-10" style={{ transform: [{ translateY: -20 }] }} />
            </View>
          </View>

          <View className="flex-row justify-between mb-8 px-1">
            <Text className="text-white/60 text-xs font-bold">Ex. 01</Text>
            <Text className="text-white/60 text-xs font-bold">Ex. 02</Text>
            <Text className="text-white/60 text-xs font-bold">Ex. 03</Text>
            <Text className="text-white/60 text-xs font-bold">Latest</Text>
          </View>

          <View className="flex-row justify-between items-end border-t border-white/5 pt-5 mt-2">
            <View>
              <Text className="text-white/60 text-sm mb-1">Current Rank</Text>
              <Text className="text-[#00f1a1] text-3xl font-bold">#04</Text>
            </View>
            <View className="bg-[#00f1a1]/20 border border-[#00f1a1]/30 px-4 py-1.5 rounded-full flex-row items-center">
              <TrendingUp size={14} color="#00f1a1" style={{ marginRight: 4 }} />
              <Text className="text-[#00f1a1] text-xs font-bold">+2</Text>
            </View>
          </View>
        </View>

        {/* Benchmarking */}
        <View className="flex-row justify-between items-center mb-6 mt-4">
          <Text className="text-white text-[28px] font-bold tracking-tight">Benchmarking</Text>
          <View className="flex-row">
            <View className="flex-row items-center mr-4">
              <View className="w-2 h-2 rounded-full bg-[#00f1a1] mr-1.5" />
              <Text className="text-white font-bold text-xs">Above</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-[#f87171] mr-1.5" />
              <Text className="text-white font-bold text-xs">Below</Text>
            </View>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-between mb-8">
          {[
            { subject: 'Mathematics', val: '+12%', type: 'Above Avg' },
            { subject: 'Physics', val: '+05%', type: 'Above Avg' },
            { subject: 'History', val: '-08%', type: 'Below Avg' },
            { subject: 'Biology', val: '+02%', type: 'Above Avg' },
            { subject: 'Literature', val: '+18%', type: 'Above Avg' },
            { subject: 'Chemistry', val: '-04%', type: 'Below Avg' },
          ].map((item, index) => {
            const isAbove = item.type === 'Above Avg';
            return (
              <View key={index} className="w-[48%] bg-[#101415]/80 border border-white/10 rounded-2xl p-5 mb-4 shadow-lg">
                <Text className="text-white/90 text-sm mb-4 font-medium">{item.subject}</Text>
                <View className="flex-row items-center">
                  <Text className="text-white text-xl font-bold mr-2">{item.val}</Text>
                  <View className={`px-2 py-1 rounded-md ${isAbove ? 'bg-[#00f1a1]/20' : 'bg-[#f87171]/20'}`}>
                    <Text className={`text-[10px] font-bold ${isAbove ? 'text-[#00f1a1]' : 'text-[#f87171]'}`}>{item.type}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Priority: History */}
        <View className="bg-[#101415]/80 border-2 border-[#f97316]/50 rounded-[32px] p-6 mb-6 relative overflow-hidden">
          <View className="absolute -right-4 -top-4 opacity-[0.03]">
            <AlertTriangle size={140} color="#f97316" />
          </View>

          <View className="flex-row items-center mb-5">
            <AlertTriangle size={24} color="#f97316" />
            <Text className="text-white text-lg font-bold ml-3">Priority: History</Text>
          </View>

          <Text className="text-white/60 text-[15px] leading-relaxed mb-6">
            Julian is struggling with chronological timelines and cause-effect analysis in 19th-century modules.
          </Text>

          <Text className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-3">SUGGESTED ACTION</Text>
          <View className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
            <Text className="text-white/70 text-sm italic leading-relaxed">
              "Schedule a 15-minute sync to review the Napoleonic Era mind-map. Assign visual timeline exercises for homework."
            </Text>
          </View>

          <Pressable className="bg-[#f97316]/10 border border-[#f97316]/30 flex-row items-center justify-center py-4 rounded-xl">
            <Mail size={18} color="#f97316" />
            <Text className="text-[#f97316] font-bold text-base ml-2">Nudge Guardian</Text>
          </Pressable>
        </View>

        {/* Progress Note: Chemistry */}
        <View className="bg-[#101415]/80 border-2 border-[#00f1a1]/30 rounded-[32px] p-6 mb-8 relative overflow-hidden">
          <View className="absolute -right-4 -bottom-4 opacity-[0.03]">
            <Lightbulb size={140} color="#00f1a1" />
          </View>

          <View className="flex-row items-center mb-5">
            <Lightbulb size={24} color="#00f1a1" />
            <Text className="text-white text-lg font-bold ml-3">Progress Note: Chemistry</Text>
          </View>

          <Text className="text-white/60 text-[15px] leading-relaxed mb-6">
            Steady improvement in stoichiometric calculations, but conceptual gaps remain in organic bonding.
          </Text>

          <View className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-5 flex-row justify-between items-center">
            <Text className="text-white/70 text-sm font-medium">Interactive Quiz Score</Text>
            <Text className="text-[#00f1a1] text-lg font-bold">74%</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 1. COLLECT PAYMENT MODAL (Admin Staff Dark/Neon UI) */}
      <Modal visible={showCollectModal} transparent animationType="slide" onRequestClose={() => setShowCollectModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border border-[#00f1a1]/40 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_30px_rgba(0,241,161,0.2)]">
            <View className="flex-row justify-between items-center p-5 border-b border-white/10 bg-[#121817]">
              <View>
                <Text className="text-white text-base font-bold">Collect Student Fee</Text>
                <Text className="text-[#00f1a1] text-xs font-semibold">{studentName} ({className})</Text>
              </View>
              <Pressable onPress={() => setShowCollectModal(false)} className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                <X size={16} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
              <Text className="text-white/70 text-xs font-semibold mb-2">Select Fee Component *</Text>
              {feeItems.map(item => (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedCollectFeeIds([item.id])}
                  className={`p-3 rounded-xl mb-2 flex-row justify-between items-center border ${selectedCollectFeeIds.includes(item.id) ? 'bg-[#00f1a1]/20 border-[#00f1a1]' : 'bg-black/30 border-white/10'}`}
                >
                  <Text className="text-white text-xs font-bold">{item.name}</Text>
                  <Text className="text-[#00f1a1] text-xs font-bold">Due: ₹{Math.max(0, item.totalAmount - item.paidAmount - item.concessionAmount).toLocaleString()}</Text>
                </Pressable>
              ))}

              <Text className="text-white/70 text-xs font-semibold mt-3 mb-1.5">Amount to Record (₹) *</Text>
              <TextInput
                value={collectAmount}
                onChangeText={setCollectAmount}
                keyboardType="numeric"
                className="bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white font-bold text-base mb-4"
              />

              <Text className="text-white/70 text-xs font-semibold mb-2">Payment Method *</Text>
              <View className="flex-row flex-wrap mb-4" style={{ gap: 6 }}>
                {['Cash', 'UPI', 'Card', 'Net Banking', 'Bank Transfer'].map(m => (
                  <Pressable
                    key={m}
                    onPress={() => setCollectMethod(m)}
                    className={`px-3 py-2 rounded-xl border ${collectMethod === m ? 'bg-[#00f1a1] border-[#00f1a1]' : 'bg-white/5 border-white/10'}`}
                  >
                    <Text className={`text-xs font-bold ${collectMethod === m ? 'text-[#101415]' : 'text-white/80'}`}>{m}</Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-white/70 text-xs font-semibold mb-1.5">Note / Remarks (Optional)</Text>
              <TextInput
                value={collectRemarks}
                onChangeText={setCollectRemarks}
                placeholder="Transaction ID, cheque number or notes..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                className="bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white text-xs mb-4"
              />
            </ScrollView>

            <View className="p-4 border-t border-white/10 bg-[#121817] flex-row" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowCollectModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleRecordPaymentSubmit} className="flex-1 py-3 rounded-xl bg-[#00f1a1] items-center shadow-[0_0_10px_rgba(0,241,161,0.4)]">
                <Text className="text-[#101415] font-extrabold text-xs">Record Payment</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. FEE CONCESSION MODAL */}
      <Modal visible={showConcessionModal} transparent animationType="slide" onRequestClose={() => setShowConcessionModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border border-purple-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.2)]">
            <View className="flex-row justify-between items-center p-5 border-b border-white/10 bg-[#121817]">
              <View>
                <Text className="text-white text-base font-bold">Apply Fee Concession</Text>
                <Text className="text-purple-400 text-xs font-semibold">{studentName} ({className})</Text>
              </View>
              <Pressable onPress={() => setShowConcessionModal(false)} className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                <X size={16} color="#ffffff" />
              </Pressable>
            </View>

            <View className="p-5">
              <Text className="text-white/70 text-xs font-semibold mb-2">Select Fee Component *</Text>
              {feeItems.map(item => (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedConcessionFeeId(item.id)}
                  className={`p-3 rounded-xl mb-2 flex-row justify-between items-center border ${selectedConcessionFeeId === item.id ? 'bg-purple-500/20 border-purple-500' : 'bg-black/30 border-white/10'}`}
                >
                  <Text className="text-white text-xs font-bold">{item.name}</Text>
                  <Text className="text-purple-300 text-xs font-bold">₹{item.totalAmount.toLocaleString()}</Text>
                </Pressable>
              ))}

              <Text className="text-white/70 text-xs font-semibold mt-3 mb-1.5">Concession Amount (₹) *</Text>
              <TextInput
                value={concessionVal}
                onChangeText={setConcessionVal}
                keyboardType="numeric"
                className="bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-purple-300 font-bold text-base mb-4"
              />

              <Text className="text-white/70 text-xs font-semibold mb-1.5">Reason / Note *</Text>
              <TextInput
                value={concessionReasonStr}
                onChangeText={setConcessionReasonStr}
                placeholder="e.g. Merit Scholarship, Staff Ward..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                className="bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white text-xs mb-4"
              />
            </View>

            <View className="p-4 border-t border-white/10 bg-[#121817] flex-row" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowConcessionModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleApplyConcessionSubmit} className="flex-1 py-3 rounded-xl bg-purple-600 items-center shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                <Text className="text-white font-extrabold text-xs">Apply Concession</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. EDIT PAID AMOUNT MODAL */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border border-purple-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <View className="flex-row justify-between items-center p-5 border-b border-white/10 bg-[#121817]">
              <View>
                <Text className="text-white text-base font-bold">Edit Fee Component</Text>
                <Text className="text-purple-400 text-xs font-semibold">{selectedFee?.name}</Text>
              </View>
              <Pressable onPress={() => setShowEditModal(false)} className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                <X size={16} color="#ffffff" />
              </Pressable>
            </View>

            <View className="p-5">
              <Text className="text-white/70 text-xs font-semibold mb-1.5">Total Component Amount (₹)</Text>
              <TextInput
                value={editTotal}
                onChangeText={setEditTotal}
                keyboardType="numeric"
                className="bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-white font-bold text-sm mb-3"
              />

              <Text className="text-white/70 text-xs font-semibold mb-1.5">Paid Amount (₹)</Text>
              <TextInput
                value={editPaid}
                onChangeText={setEditPaid}
                keyboardType="numeric"
                className="bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-[#00f1a1] font-bold text-sm mb-3"
              />

              <Text className="text-white/70 text-xs font-semibold mb-1.5">Concession Amount (₹)</Text>
              <TextInput
                value={editConcession}
                onChangeText={setEditConcession}
                keyboardType="numeric"
                className="bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-purple-300 font-bold text-sm mb-4"
              />
            </View>

            <View className="p-4 border-t border-white/10 bg-[#121817] flex-row" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowEditModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSaveEditFeeSubmit} className="flex-1 py-3 rounded-xl bg-[#00f1a1] items-center">
                <Text className="text-[#101415] font-extrabold text-xs">Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. DELETE / REVERSE PAYMENT MODAL */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border border-rose-500/40 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl">
            <View className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 items-center justify-center mx-auto mb-4">
              <Trash2 size={22} color="#ff516a" />
            </View>
            <Text className="text-white text-lg font-bold mb-1 text-center">Reverse Fee Component?</Text>
            <Text className="text-white/60 text-xs text-center mb-6 leading-relaxed">
              Are you sure you want to remove <Text className="text-white font-bold">{selectedFee?.name}</Text>? This will reset its balance and remove it from student dues.
            </Text>

            <View className="flex-row" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirmDeleteFee} className="flex-1 py-3 rounded-xl bg-rose-600 items-center shadow-[0_0_10px_rgba(244,63,94,0.4)]">
                <Text className="text-white font-extrabold text-xs">Confirm Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. PRINT RECEIPT PREVIEW MODAL */}
      <Modal visible={showPrintModal} transparent animationType="slide" onRequestClose={() => setShowPrintModal(false)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border border-[#00f1a1]/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <View className="flex-row justify-between items-center p-5 border-b border-white/10 bg-[#121817]">
              <View className="flex-row items-center">
                <Printer size={18} color="#00f1a1" style={{ marginRight: 8 }} />
                <Text className="text-white text-base font-bold">Fee Receipt Preview</Text>
              </View>
              <Pressable onPress={() => setShowPrintModal(false)} className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                <X size={16} color="#ffffff" />
              </Pressable>
            </View>

            <View className="p-5 bg-[#121817] border border-white/10 rounded-2xl m-5">
              <Text className="text-[#00f1a1] text-center font-extrabold text-lg tracking-wider mb-1">KTS INTERNATIONAL SCHOOL</Text>
              <Text className="text-white/50 text-center text-[10px] uppercase tracking-widest mb-4">Official Fee Payment Receipt</Text>

              <View className="border-t border-b border-white/10 py-3 mb-4 space-y-1">
                <View className="flex-row justify-between">
                  <Text className="text-white/50 text-xs">Receipt No:</Text>
                  <Text className="text-[#00f1a1] text-xs font-mono font-bold">RCP-2026-0891</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white/50 text-xs">Student Name:</Text>
                  <Text className="text-white text-xs font-bold">{studentName}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white/50 text-xs">Class & Sec:</Text>
                  <Text className="text-white text-xs font-semibold">{className}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white/50 text-xs">Admission No:</Text>
                  <Text className="text-white text-xs font-mono">{admissionNo}</Text>
                </View>
              </View>

              <Text className="text-white/70 text-xs font-bold mb-2">Itemized Component:</Text>
              <View className="bg-black/40 p-3 rounded-xl mb-4 border border-white/5 flex-row justify-between items-center">
                <Text className="text-white text-xs font-bold">{selectedFee?.name}</Text>
                <Text className="text-[#00f1a1] text-sm font-bold">₹{selectedFee?.paidAmount.toLocaleString()}</Text>
              </View>

              <View className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex-row justify-between items-center">
                <Text className="text-[#00f1a1] text-xs font-bold">Total Payment Verified</Text>
                <Text className="text-[#00f1a1] text-base font-extrabold">₹{selectedFee?.paidAmount.toLocaleString()}</Text>
              </View>
            </View>

            <View className="p-4 border-t border-white/10 bg-[#121817] flex-row" style={{ gap: 10 }}>
              <Pressable onPress={() => setShowPrintModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Close Preview</Text>
              </Pressable>
              <Pressable onPress={() => handlePrintNative()} className="flex-1 py-3 rounded-xl bg-[#00f1a1] items-center shadow-[0_0_10px_rgba(0,241,161,0.4)]">
                <Text className="text-[#101415] font-extrabold text-xs">Print / PDF</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUSTOM ADMIN STAFF NOTIFICATION TOAST MODAL */}
      <Modal visible={toastData.visible} transparent animationType="fade" onRequestClose={() => setToastData(prev => ({ ...prev, visible: false }))}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border-2 border-[#00f1a1]/40 rounded-3xl w-full max-w-sm p-6 items-center shadow-[0_0_30px_rgba(0,241,161,0.3)]">
            <View className={`w-14 h-14 rounded-full items-center justify-center mb-4 border ${toastData.type === 'warning' ? 'bg-amber-500/20 border-amber-500/40' : 'bg-[#00f1a1]/20 border-[#00f1a1]/40'}`}>
              {toastData.type === 'warning' ? (
                <AlertCircle size={28} color="#f59e0b" />
              ) : (
                <CheckCircle2 size={28} color="#00f1a1" />
              )}
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">{toastData.title}</Text>
            <Text className="text-white/70 text-xs text-center mb-6 leading-relaxed px-2">{toastData.message}</Text>

            <Pressable
              onPress={() => setToastData(prev => ({ ...prev, visible: false }))}
              className="w-full py-3.5 rounded-xl bg-[#00f1a1] items-center shadow-[0_0_12px_rgba(0,241,161,0.4)]"
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
});

export default StudentPerformanceScreen;
