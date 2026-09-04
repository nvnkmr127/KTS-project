import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
  Share,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  GraduationCap,
  FileText,
  DollarSign,
  Fingerprint,
  Check,
  X,
  AlertTriangle,
  ShieldCheck,
  Download,
  Award,
  Users,
  CheckCircle,
  Clock,
  ChevronRight,
  Edit3,
  Trash2,
  Printer,
  Building2,
  MapPin,
  BadgePercent,
  History,
  Wallet,
  UserCheck,
  Plus,
  Eye,
  Share2,
  UploadCloud,
  FileCheck2,
  Image as ImageIcon,
  File as FileIcon,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../components/GlassCard';
import { useResponsive } from '../../utils/responsive';
import { useStaffStore, StaffMember, INITIAL_STAFF_MEMBERS } from '../../store/staffStore';
import { api } from '../../services/api';

// Format date to standard DD-MM-YYYY format
export const formatToDDMMYYYY = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  const clean = dateStr.trim().split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY
      return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY -> DD-MM-YYYY
      return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
    }
  }
  return clean;
};

export const SuperAdminStaffDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isSmallPhone, isTablet, insets, headerPaddingTop, scrollBottomPadding, containerStyle } = useResponsive();

  const { staffList, updateStaff, deleteStaff } = useStaffStore();
  const staffParam: StaffMember | undefined = route.params?.staff;
  const staffIdParam: string | undefined = route.params?.staffId;

  // Resolve staff member from store or route param
  const staff: StaffMember = useMemo(() => {
    if (staffIdParam) {
      const found = staffList.find((s) => s.id === staffIdParam);
      if (found) return found;
    }
    if (staffParam) return staffParam;
    return staffList[0] || INITIAL_STAFF_MEMBERS[0];
  }, [staffIdParam, staffParam, staffList]);

  // Active view tab state
  const [activeTab, setActiveTab] = useState<'info' | 'attendance' | 'leaves' | 'salary' | 'slips'>('info');

  // Document Viewer & Preview Modal State
  const [viewingDoc, setViewingDoc] = useState<{
    name: string;
    type: 'pdf' | 'image';
    size: string;
  } | null>(null);
  const [docPreviewMode, setDocPreviewMode] = useState<'pdf' | 'image'>('pdf');

  // Add Document Modal State
  const [uploadDocModalVisible, setUploadDocModalVisible] = useState(false);
  const [uploadDocName, setUploadDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size?: number;
    uri?: string;
    mimeType?: string;
  } | null>(null);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [formName, setFormName] = useState(staff.name);
  const [formDesignation, setFormDesignation] = useState(staff.designation);
  const [formDepartment, setFormDepartment] = useState(staff.department);
  const [formCategory, setFormCategory] = useState<'Teaching' | 'Non-Teaching' | 'Admin' | 'Support'>(staff.category);
  const [formSubject, setFormSubject] = useState(staff.subject || '');
  const [formPhone, setFormPhone] = useState(staff.phone);
  const [formEmail, setFormEmail] = useState(staff.email);
  const [formJoinDate, setFormJoinDate] = useState(staff.join_date);
  const [formSalary, setFormSalary] = useState(String(staff.salary));
  const [formQualifications, setFormQualifications] = useState(staff.qualifications);
  const [formBiometricCode, setFormBiometricCode] = useState(staff.biometric_employee_code || '');
  const [formStatus, setFormStatus] = useState<'Active' | 'On Leave' | 'Resigned'>(staff.status);

  // Custom Alert State
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'confirm_delete';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showCustomAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'confirm_delete',
    onConfirm?: () => void
  ) => {
    setCustomAlert({ visible: true, title, message, type, onConfirm });
  };

  // Salary Calculations Breakdown
  const salaryBreakdown = useMemo(() => {
    const gross = staff.salary || 45000;
    const basicPay = Math.round(gross * 0.50);
    const hra = Math.round(gross * 0.25);
    const specialAllowance = Math.round(gross * 0.15);
    const conveyance = Math.round(gross * 0.10);
    const epfDeduction = Math.round(basicPay * 0.12);
    const professionalTax = 200;
    const totalDeductions = epfDeduction + professionalTax;
    const netSalary = gross - totalDeductions;
    const annualCTC = gross * 12;

    return {
      gross,
      basicPay,
      hra,
      specialAllowance,
      conveyance,
      epfDeduction,
      professionalTax,
      totalDeductions,
      netSalary,
      annualCTC,
    };
  }, [staff.salary]);

  // Mock Attendance Punch History (Past 30 Days)
  const attendanceHistory = useMemo(() => {
    const records = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const isSun = d.getDay() === 0;
      const isSat = d.getDay() === 6;
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      if (isSun) {
        records.push({
          date: dateStr,
          dayName,
          status: 'Sunday',
          inTime: '--:--',
          outTime: '--:--',
          biometricSynced: false,
        });
      } else if (i === 4) {
        records.push({
          date: dateStr,
          dayName,
          status: 'Leave',
          inTime: '--:--',
          outTime: '--:--',
          biometricSynced: false,
        });
      } else if (i === 8) {
        records.push({
          date: dateStr,
          dayName,
          status: 'Half Day',
          inTime: '08:30 AM',
          outTime: '01:15 PM',
          biometricSynced: true,
        });
      } else {
        records.push({
          date: dateStr,
          dayName,
          status: 'Present',
          inTime: `08:${20 + (i % 12)} AM`,
          outTime: `04:${30 + (i % 15)} PM`,
          biometricSynced: true,
        });
      }
    }
    return records;
  }, []);

  // Mock Leave Requests History
  const leaveHistory = useMemo(() => [
    {
      id: 'lv_1',
      type: 'Casual Leave',
      days: 1,
      from: '2026-08-20',
      to: '2026-08-20',
      reason: 'Personal family engagement in hometown.',
      status: 'Approved',
      adminNote: 'Approved by Super Admin on 19 Aug 2026.',
    },
    {
      id: 'lv_2',
      type: 'Sick Leave',
      days: 2,
      from: '2026-07-12',
      to: '2026-07-13',
      reason: 'Viral fever and prescribed medical rest.',
      status: 'Approved',
      adminNote: 'Medical certificate verified.',
    },
    {
      id: 'lv_3',
      type: 'Earned Leave',
      days: 3,
      from: '2026-05-10',
      to: '2026-05-12',
      reason: 'Annual family pilgrimage.',
      status: 'Approved',
      adminNote: 'Substitute faculty assigned.',
    },
  ], []);

  // Mock Payslips History
  const payslipsList = useMemo(() => [
    {
      month: 'August 2026',
      period: '01 Aug 2026 - 31 Aug 2026',
      gross: staff.salary,
      deductions: salaryBreakdown.totalDeductions,
      net: salaryBreakdown.netSalary,
      status: 'Processed',
      date: '31 Aug 2026',
    },
    {
      month: 'July 2026',
      period: '01 Jul 2026 - 31 Jul 2026',
      gross: staff.salary,
      deductions: salaryBreakdown.totalDeductions,
      net: salaryBreakdown.netSalary,
      status: 'Paid',
      date: '31 Jul 2026',
    },
    {
      month: 'June 2026',
      period: '01 Jun 2026 - 30 Jun 2026',
      gross: staff.salary,
      deductions: salaryBreakdown.totalDeductions,
      net: salaryBreakdown.netSalary,
      status: 'Paid',
      date: '30 Jun 2026',
    },
    {
      month: 'May 2026',
      period: '01 May 2026 - 31 May 2026',
      gross: staff.salary,
      deductions: salaryBreakdown.totalDeductions,
      net: salaryBreakdown.netSalary,
      status: 'Paid',
      date: '31 May 2026',
    },
  ], [staff.salary, salaryBreakdown]);

  // Open Edit Modal
  const handleOpenEditModal = () => {
    setFormName(staff.name);
    setFormDesignation(staff.designation);
    setFormDepartment(staff.department);
    setFormCategory(staff.category);
    setFormSubject(staff.subject || '');
    setFormPhone(staff.phone);
    setFormEmail(staff.email);
    setFormJoinDate(staff.join_date);
    setFormSalary(String(staff.salary));
    setFormQualifications(staff.qualifications);
    setFormBiometricCode(staff.biometric_employee_code || '');
    setFormStatus(staff.status);
    setEditModalVisible(true);
  };

  // Save Edit Staff
  const handleSaveEdit = async () => {
    if (!formName.trim() || !formDesignation.trim() || !formDepartment.trim()) {
      showCustomAlert('Validation Error', 'Please enter Full Name, Designation, and Department.', 'error');
      return;
    }

    const updated: StaffMember = {
      ...staff,
      name: formName.trim(),
      designation: formDesignation.trim(),
      department: formDepartment.trim(),
      category: formCategory,
      subject: formSubject.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      join_date: formJoinDate.trim() || staff.join_date,
      salary: parseFloat(formSalary.trim()) || staff.salary,
      qualifications: formQualifications.trim(),
      biometric_employee_code: formBiometricCode.trim(),
      status: formStatus,
    };

    updateStaff(updated);
    try {
      api.updateResource('faculty', staff.id, updated).catch(() => { });
    } catch (_) { }

    setEditModalVisible(false);
    showCustomAlert('Profile Updated', `${updated.name}'s profile has been updated successfully.`, 'success');
  };

  // Delete Staff
  const handleDeleteStaff = () => {
    showCustomAlert(
      'Move to Recycle Bin',
      `Are you sure you want to delete ${staff.name} from active faculty roster? They can be restored from the Recycle Bin.`,
      'confirm_delete',
      async () => {
        deleteStaff(staff.id);
        try {
          api.deleteResource('faculty', staff.id).catch(() => { });
        } catch (_) { }
        setCustomAlert((prev) => ({ ...prev, visible: false }));
        navigation.goBack();
      }
    );
  };

  // Quick Call Handler
  const handleCall = () => {
    if (staff.phone) {
      Linking.openURL(`tel:${staff.phone.replace(/[^0-9+]/g, '')}`);
    }
  };

  // Quick Email Handler
  const handleEmail = () => {
    if (staff.email) {
      Linking.openURL(`mailto:${staff.email}`);
    }
  };

  // Share Payslip
  const handleSharePayslip = (slip: any) => {
    Share.share({
      title: `Payslip - ${staff.name} (${slip.month})`,
      message: `KRISHNAVENI TALENT SCHOOL\nFaculty Payslip: ${staff.name}\nDesignation: ${staff.designation} (${staff.department})\nMonth: ${slip.month}\nGross Salary: ₹${slip.gross.toLocaleString('en-IN')}\nDeductions: ₹${slip.deductions.toLocaleString('en-IN')}\nNet Take-Home: ₹${slip.net.toLocaleString('en-IN')}\nStatus: ${slip.status}`,
    });
  };

  // Open Document Viewer
  const handleOpenDocViewer = (docName: string) => {
    const lower = docName.toLowerCase();
    const isImage =
      lower.includes('aadhaar') ||
      lower.includes('photo') ||
      lower.includes('id card') ||
      lower.includes('identity') ||
      lower.includes('pan') ||
      lower.includes('.png') ||
      lower.includes('.jpg') ||
      lower.includes('.jpeg') ||
      lower.includes('.webp') ||
      lower.includes('(png)') ||
      lower.includes('(jpg)') ||
      lower.includes('(jpeg)') ||
      lower.includes('image') ||
      lower.includes('scan');

    const detectedType: 'pdf' | 'image' = isImage ? 'image' : 'pdf';
    setViewingDoc({
      name: docName,
      type: detectedType,
      size: isImage ? '1.4 MB' : '2.8 MB',
    });
    setDocPreviewMode(detectedType);
  };

  // Document Picker Handler
  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setSelectedFile({
          name: asset.name,
          size: asset.size,
          uri: asset.uri,
          mimeType: asset.mimeType,
        });
        if (!uploadDocName.trim()) {
          const cleanName = asset.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          setUploadDocName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
      }
    } catch (err) {
      console.warn('Document picker error:', err);
    }
  };

  // Save Uploaded Document
  const handleSaveUploadedDoc = () => {
    if (!uploadDocName.trim()) {
      showCustomAlert('Missing Document Name', 'Please enter a name or title for this document.', 'error');
      return;
    }

    const docName = uploadDocName.trim();
    let finalDocName = docName;
    if (selectedFile?.name) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext && !docName.toLowerCase().includes(ext)) {
        finalDocName = `${docName} (${ext.toUpperCase()})`;
      }
    }

    const currentDocs = staff.documents && staff.documents.length > 0
      ? staff.documents
      : ['Aadhaar Card Copy', 'B.Ed & Degree Certificate', 'Contract & Appointment Letter', 'Experience Certificate'];

    const updatedDocs = [...currentDocs, finalDocName];
    const updatedStaff: StaffMember = {
      ...staff,
      documents: updatedDocs,
    };

    updateStaff(updatedStaff);
    try {
      api.updateResource('faculty', staff.id, updatedStaff).catch(() => { });
    } catch (_) { }

    setUploadDocModalVisible(false);
    setUploadDocName('');
    setSelectedFile(null);
    showCustomAlert('Document Attached', `${finalDocName} has been attached to ${staff.name}'s verification dossier.`, 'success');
  };

  // Download / Share Document
  const handleDownloadOrShareDoc = (doc: { name: string; type: string }) => {
    Share.share({
      title: `${doc.name} - ${staff.name}`,
      message: `KRISHNAVENI TALENT SCHOOL\nVerified Document: ${doc.name}\nStaff Member: ${staff.name} (${staff.designation})\nBiometric Code: ${staff.biometric_employee_code || staff.id}\nVerification Status: Authenticated & Digitized in School Cloud Storage.`,
    });
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

      {/* Header matching Super Admin Dark Gold Luxury Theme */}
      <View style={{ zIndex: 50 }}>
        <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20 active:scale-95"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={22} color="#ffe5a0" />
            </Pressable>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-xl md:text-2xl font-extrabold text-white font-display-lg">
                Faculty Profile
              </Text>
              <Text numberOfLines={1} className="text-xs uppercase tracking-wider text-[#ffe5a0] font-bold mt-0.5">
                COMPREHENSIVE STAFF DOSSIER
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={handleOpenEditModal}
              className="w-10 h-10 rounded-xl bg-[#f0c110]/15 border border-[#f0c110]/30 items-center justify-center active:scale-95"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Edit3 size={20} color="#f0c110" />
            </Pressable>
            <Pressable
              onPress={handleDeleteStaff}
              className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 items-center justify-center active:scale-95"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Trash2 size={20} color="#ffb4ab" />
            </Pressable>
          </View>
        </BlurView>

        {/* Glow Line below Header */}
        <LinearGradient
          colors={['rgba(245, 197, 24, 0.15)', 'transparent']}
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= HERO PROFILE CARD ================= */}
        <View className="px-5 mb-5">
          <GlassCard
            className="p-5 border border-white/15"
            style={{
              backgroundColor: '#1d2122',
              borderRadius: 24,
              shadowColor: '#f0c110',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            {/* Top Profile Summary */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="relative mr-4">
                  <Image
                    source={{ uri: staff.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150' }}
                    className="w-16 h-16 rounded-2xl border-2 border-[#f0c110]/40"
                  />
                  <View
                    className="w-5 h-5 rounded-full bg-[#41eec2] border-2 border-[#1d2122] items-center justify-center"
                    style={{ position: 'absolute', bottom: -2, right: -2 }}
                  >
                    <Check size={11} color="#101415" strokeWidth={3.5} />
                  </View>
                </View>

                <View className="flex-1 pr-1">
                  <Text className="text-white font-extrabold text-lg" numberOfLines={1}>
                    {staff.name}
                  </Text>
                  <Text className="text-[#ffe5a0] text-xs font-bold mt-0.5" numberOfLines={1}>
                    {staff.designation} • {staff.department}
                  </Text>
                  {staff.subject ? (
                    <Text className="text-white/50 text-[11px] mt-0.5" numberOfLines={1}>
                      Specialization: {staff.subject}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View
                className={`px-3 py-1 rounded-full border ${staff.status === 'Active'
                  ? 'bg-[#41eec2]/15 border-[#41eec2]/30'
                  : staff.status === 'On Leave'
                    ? 'bg-rose-500/15 border-rose-500/30'
                    : 'bg-white/10 border-white/20'
                  }`}
              >
                <Text
                  className={`text-[10px] font-extrabold uppercase ${staff.status === 'Active'
                    ? 'text-[#41eec2]'
                    : staff.status === 'On Leave'
                      ? 'text-rose-400'
                      : 'text-white/60'
                    }`}
                >
                  {staff.status}
                </Text>
              </View>
            </View>

            {/* Quick Action Chips */}
            <View className="flex-row items-center gap-2 mb-4">
              <Pressable
                onPress={handleCall}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 border border-white/15 flex-row items-center justify-center active:bg-white/20 active:scale-95"
              >
                <Phone size={13} color="#41eec2" style={{ marginRight: 6 }} />
                <Text className="text-white text-xs font-bold">Call Staff</Text>
              </Pressable>

              <Pressable
                onPress={handleEmail}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 border border-white/15 flex-row items-center justify-center active:bg-white/20 active:scale-95"
              >
                <Mail size={13} color="#ffe5a0" style={{ marginRight: 6 }} />
                <Text className="text-white text-xs font-bold">Email</Text>
              </Pressable>

              <View className="py-2.5 px-3 rounded-xl bg-[#f0c110]/15 border border-[#f0c110]/30 flex-row items-center">
                <Fingerprint size={13} color="#f0c110" style={{ marginRight: 4 }} />
                <Text className="text-[#f0c110] text-xs font-mono font-extrabold">
                  {staff.biometric_employee_code || `BIO-${staff.id}`}
                </Text>
              </View>
            </View>

            {/* 4 Quick Stat KPIs */}
            <View className="flex-row flex-wrap justify-between" style={{ gap: 8 }}>
              <View className="w-[23%] bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                <Text className="text-white/40 text-[8.5px] font-bold uppercase text-center">Attendance</Text>
                <Text className="text-[#41eec2] text-sm font-extrabold mt-0.5">{staff.attendance_percentage}%</Text>
              </View>

              <View className="w-[23%] bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                <Text className="text-white/40 text-[8.5px] font-bold uppercase text-center">Monthly Pay</Text>
                <Text className="text-[#ffe5a0] text-sm font-extrabold mt-0.5">₹{(staff.salary / 1000).toFixed(0)}k</Text>
              </View>

              <View className="w-[23%] bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                <Text className="text-white/40 text-[8.5px] font-bold uppercase text-center">Category</Text>
                <Text className="text-white text-[11px] font-bold mt-1" numberOfLines={1}>{staff.category}</Text>
              </View>

              <View className="w-[23%] bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                <Text className="text-white/40 text-[8.5px] font-bold uppercase text-center">Joined</Text>
                <Text className="text-[#ffe5a0] text-[10.5px] font-mono font-bold mt-1" numberOfLines={1}>
                  {formatToDDMMYYYY(staff.join_date)}
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* ================= TAB NAVIGATION BAR ================= */}
        <View className="px-5 mb-5">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row bg-[#16191b] p-1.5 rounded-2xl border border-white/10" style={{ gap: 6 }}>
              {(
                [
                  { id: 'info', label: 'Info & Docs', icon: UserCheck },
                  { id: 'attendance', label: 'Attendance Log', icon: History },
                  { id: 'leaves', label: 'Leaves', icon: Calendar },
                  { id: 'salary', label: 'Salary Structure', icon: Wallet },
                  { id: 'slips', label: 'Pay Slips', icon: FileText },
                ] as const
              ).map((tab) => {
                const isSel = activeTab === tab.id;
                const IconComp = tab.icon;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-2 rounded-xl flex-row items-center border transition-all active:scale-95 ${isSel
                      ? 'bg-[#f0c110] border-[#f0c110] shadow-sm'
                      : 'bg-transparent border-transparent'
                      }`}
                  >
                    <IconComp size={13} color={isSel ? '#101415' : 'rgba(255,255,255,0.6)'} style={{ marginRight: 6 }} />
                    <Text className={`text-xs font-extrabold ${isSel ? 'text-[#101415]' : 'text-white/60'}`}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* ================= TAB 1: INFO & DOCS ================= */}
        {activeTab === 'info' && (
          <View className="px-5 mb-6" style={{ gap: 16 }}>
            {/* General Information Grid */}
            <GlassCard
              className="p-5 border border-white/10"
              style={{
                backgroundColor: '#1d2122',
                borderRadius: 24,
                marginBottom: 16,
              }}
            >
              <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider mb-3.5">
                Professional & Academic Info
              </Text>

              <View className="flex-row flex-wrap justify-between" style={{ gap: 10 }}>
                {[
                  { label: 'Staff Category', value: staff.category, icon: Users },
                  { label: 'Department', value: staff.department, icon: Building2 },
                  { label: 'Specialization / Subject', value: staff.subject || 'Academics', icon: Award },
                  { label: 'Date of Joining', value: formatToDDMMYYYY(staff.join_date), icon: Calendar },
                  { label: 'Contact Phone', value: staff.phone, icon: Phone },
                  { label: 'Official Email', value: staff.email, icon: Mail },
                  { label: 'Qualifications', value: staff.qualifications || 'B.Ed, Graduate', icon: GraduationCap },
                  { label: 'Biometric System Code', value: staff.biometric_employee_code || `BIO-${staff.id}`, icon: Fingerprint },
                ].map((item, idx) => {
                  const ItemIcon = item.icon;
                  return (
                    <View key={idx} className="w-[48%] bg-black/40 p-3 rounded-xl border border-white/5 mb-1">
                      <View className="flex-row items-center mb-1">
                        <ItemIcon size={12} color="#ffe5a0" style={{ marginRight: 4 }} />
                        <Text className="text-white/40 text-[9px] font-bold uppercase">{item.label}</Text>
                      </View>
                      <Text className="text-white text-xs font-bold" numberOfLines={1}>
                        {item.value}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </GlassCard>

            {/* Submitted Documents & Certificates */}
            <GlassCard
              className="p-5 border border-white/10"
              style={{
                backgroundColor: '#1d2122',
                borderRadius: 24,
                marginBottom: 16,
              }}
            >
              {/* Header with "+ Add Other Document" Button and "All Verified" Badge */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider">
                      Submitted Documents
                    </Text>
                  </View>

                  {/* + Add Other Document Button */}
                  <Pressable
                    onPress={() => {
                      setUploadDocName('');
                      setSelectedFile(null);
                      setUploadDocModalVisible(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#f0c110] flex-row items-center active:scale-95 shadow-sm shadow-[#f0c110]/30"
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Plus size={13} color="#101415" strokeWidth={3} style={{ marginRight: 4 }} />
                    <Text className="text-[#101415] text-[11px] font-extrabold tracking-wide">
                      Add Other Document
                    </Text>
                  </Pressable>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-white/40 text-[10px]">
                    Tap any document to preview PDF / Image format
                  </Text>
                  <View className="px-2 py-0.5 rounded bg-[#41eec2]/15 border border-[#41eec2]/30 flex-row items-center">
                    <ShieldCheck size={10} color="#41eec2" style={{ marginRight: 3 }} />
                    <Text className="text-[#41eec2] text-[9px] font-bold uppercase">All Verified</Text>
                  </View>
                </View>
              </View>

              <View style={{ gap: 10 }}>
                {(staff.documents && staff.documents.length > 0
                  ? staff.documents
                  : ['Aadhaar Card Copy', 'B.Ed & Degree Certificate', 'Contract & Appointment Letter', 'Experience Certificate']
                ).map((doc, idx) => {
                  const isImage =
                    doc.toLowerCase().includes('aadhaar') ||
                    doc.toLowerCase().includes('photo') ||
                    doc.toLowerCase().includes('id') ||
                    doc.toLowerCase().includes('pan');

                  return (
                    <Pressable
                      key={idx}
                      onPress={() => handleOpenDocViewer(doc)}
                      className="p-3.5 bg-black/40 border border-white/5 rounded-2xl flex-row items-center justify-between active:bg-white/5 active:scale-[0.99] transition-all"
                    >
                      <View className="flex-row items-center flex-1 mr-2">
                        <View className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center mr-3">
                          {isImage ? (
                            <ImageIcon size={17} color="#41eec2" />
                          ) : (
                            <FileText size={17} color="#ffe5a0" />
                          )}
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-1.5">
                            <Text className="text-white text-xs font-bold" numberOfLines={1}>
                              {doc}
                            </Text>
                            <View
                              className={`px-1.5 py-0.5 rounded border ${isImage
                                ? 'bg-[#41eec2]/10 border-[#41eec2]/20'
                                : 'bg-[#f0c110]/10 border-[#f0c110]/20'
                                }`}
                            >
                              <Text
                                className={`text-[8.5px] font-mono font-bold uppercase ${isImage ? 'text-[#41eec2]' : 'text-[#f0c110]'
                                  }`}
                              >
                                {isImage ? 'IMAGE' : 'PDF'}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-white/40 text-[9.5px] mt-0.5">
                            Stored in Cloud • Tap to Preview Document
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-2">
                        <View className="w-8 h-8 rounded-xl bg-[#f0c110]/15 border border-[#f0c110]/30 items-center justify-center">
                          <Eye size={14} color="#f0c110" />
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </GlassCard>
          </View>
        )}

        {/* ================= TAB 2: ATTENDANCE LOG ================= */}
        {activeTab === 'attendance' && (
          <View className="px-5 mb-6" style={{ gap: 16 }}>
            {/* Monthly Attendance Summary KPI Card */}
            <GlassCard
              className="p-5 border border-white/10"
              style={{
                backgroundColor: '#1d2122',
                borderRadius: 24,
                marginBottom: 16,
              }}
            >
              <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider mb-3.5">
                Monthly Biometric Attendance Analytics
              </Text>

              <View className="flex-row flex-wrap justify-between" style={{ gap: 8 }}>
                <View className="w-[23%] bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/40 text-[8.5px] font-bold uppercase text-center">Present</Text>
                  <Text className="text-[#41eec2] text-sm font-extrabold mt-0.5">24 Days</Text>
                </View>

                <View className="w-[23%] bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/40 text-[8.5px] font-bold uppercase text-center">Absent</Text>
                  <Text className="text-rose-400 text-sm font-extrabold mt-0.5">0 Days</Text>
                </View>

                <View className="w-[23%] bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/40 text-[8.5px] font-bold uppercase text-center">Half Day</Text>
                  <Text className="text-amber-400 text-sm font-extrabold mt-0.5">1 Day</Text>
                </View>

                <View className="w-[23%] bg-black/40 p-2.5 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/40 text-[8.5px] font-bold uppercase text-center">On Leave</Text>
                  <Text className="text-sky-400 text-sm font-extrabold mt-0.5">1 Day</Text>
                </View>
              </View>
            </GlassCard>

            {/* Daily Punch Log */}
            <GlassCard
              className="p-5 border border-white/10"
              style={{
                backgroundColor: '#1d2122',
                borderRadius: 24,
                marginBottom: 16,
              }}
            >
              <View className="flex-row items-center justify-between mb-3.5">
                <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider">
                  Recent Biometric Punch Logs
                </Text>
                <View className="px-2 py-0.5 rounded bg-[#f0c110]/15 border border-[#f0c110]/30 flex-row items-center">
                  <Fingerprint size={10} color="#f0c110" style={{ marginRight: 3 }} />
                  <Text className="text-[#f0c110] text-[9px] font-bold uppercase">e-TimeOffice</Text>
                </View>
              </View>

              <View style={{ gap: 10 }}>
                {attendanceHistory.map((rec, idx) => (
                  <View
                    key={idx}
                    className="p-3 bg-black/40 border border-white/5 rounded-xl flex-row items-center justify-between"
                  >
                    <View className="flex-1 mr-2">
                      <Text className="text-white text-xs font-bold">{rec.dayName}</Text>
                      <View className="flex-row items-center mt-1">
                        <Clock size={11} color="rgba(255,255,255,0.5)" style={{ marginRight: 4 }} />
                        <Text className="text-white/70 text-[11px]">
                          IN: <Text className="text-white font-bold">{rec.inTime}</Text>  |  OUT: <Text className="text-white font-bold">{rec.outTime}</Text>
                        </Text>
                      </View>
                    </View>

                    <View
                      className={`px-2.5 py-1 rounded-full border ${rec.status === 'Present'
                        ? 'bg-[#41eec2]/15 border-[#41eec2]/30'
                        : rec.status === 'Absent'
                          ? 'bg-rose-500/15 border-rose-500/30'
                          : rec.status === 'Half Day'
                            ? 'bg-[#f0c110]/15 border-[#f0c110]/30'
                            : rec.status === 'Leave'
                              ? 'bg-sky-500/15 border-sky-500/30'
                              : 'bg-white/10 border-white/20'
                        }`}
                    >
                      <Text
                        className={`text-[9.5px] font-extrabold uppercase ${rec.status === 'Present'
                          ? 'text-[#41eec2]'
                          : rec.status === 'Absent'
                            ? 'text-rose-400'
                            : rec.status === 'Half Day'
                              ? 'text-[#f0c110]'
                              : rec.status === 'Leave'
                                ? 'text-sky-400'
                                : 'text-white/50'
                          }`}
                      >
                        {rec.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </GlassCard>
          </View>
        )}

        {/* ================= TAB 3: LEAVES ================= */}
        {activeTab === 'leaves' && (
          <View className="px-5 mb-6" style={{ gap: 16 }}>
            {/* Leave Balance Overview */}
            <GlassCard
              className="p-5 border border-white/10"
              style={{
                backgroundColor: '#1d2122',
                borderRadius: 24,
                marginBottom: 16,
              }}
            >
              <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider mb-3.5">
                Annual Leave Quota & Balances
              </Text>

              <View className="flex-row flex-wrap justify-between" style={{ gap: 8 }}>
                <View className="w-[30%] bg-black/40 p-3 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/40 text-[9px] font-bold uppercase">Casual</Text>
                  <Text className="text-[#41eec2] text-base font-extrabold mt-0.5">8 / 12</Text>
                </View>

                <View className="w-[30%] bg-black/40 p-3 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/40 text-[9px] font-bold uppercase">Sick</Text>
                  <Text className="text-[#ffe5a0] text-base font-extrabold mt-0.5">6 / 8</Text>
                </View>

                <View className="w-[30%] bg-black/40 p-3 rounded-xl border border-white/5 items-center">
                  <Text className="text-white/40 text-[9px] font-bold uppercase">Earned</Text>
                  <Text className="text-sky-400 text-base font-extrabold mt-0.5">10 / 15</Text>
                </View>
              </View>
            </GlassCard>

            {/* Leave Request History */}
            <GlassCard
              className="p-5 border border-white/10"
              style={{
                backgroundColor: '#1d2122',
                borderRadius: 24,
                marginBottom: 16,
              }}
            >
              <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider mb-3.5">
                Leave Request History & Super Admin Decisions
              </Text>

              <View style={{ gap: 12 }}>
                {leaveHistory.map((lv) => (
                  <View
                    key={lv.id}
                    className="p-3.5 bg-black/40 border border-white/5 rounded-xl"
                  >
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-white text-xs font-extrabold">{lv.type}</Text>
                        <Text className="text-[#ffe5a0] text-[10px] font-bold font-mono">({lv.days} day)</Text>
                      </View>

                      <View className="px-2 py-0.5 rounded-full bg-[#41eec2]/15 border border-[#41eec2]/30">
                        <Text className="text-[#41eec2] text-[9.5px] font-extrabold uppercase">{lv.status}</Text>
                      </View>
                    </View>

                    <Text className="text-white/60 text-xs font-semibold mb-1">
                      {lv.from} {lv.from !== lv.to ? `→ ${lv.to}` : ''}
                    </Text>

                    <Text className="text-white/40 text-[11px] mb-2">{lv.reason}</Text>

                    <View className="p-2 rounded-lg bg-white/5 border border-white/10 flex-row items-center">
                      <ShieldCheck size={12} color="#41eec2" style={{ marginRight: 6 }} />
                      <Text className="text-[#41eec2] text-[10px] font-semibold flex-1">{lv.adminNote}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </GlassCard>
          </View>
        )}

        {/* ================= TAB 4: SALARY STRUCTURE ================= */}
        {activeTab === 'salary' && (
          <View className="px-5 mb-6" style={{ gap: 16 }}>
            {/* Take Home Net Salary Hero Banner */}
            <GlassCard
              className="p-5 border border-[#f0c110]/30"
              style={{
                backgroundColor: '#1d2122',
                borderRadius: 24,
                shadowColor: '#f0c110',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 8,
                marginBottom: 16,
              }}
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[#ffe5a0] text-[10px] font-extrabold uppercase tracking-wider">
                  Net Monthly Take-Home Pay
                </Text>
                <View className="px-2 py-0.5 rounded bg-[#41eec2]/20 border border-[#41eec2]/40">
                  <Text className="text-[#41eec2] text-[9px] font-extrabold uppercase">Direct Bank Transfer</Text>
                </View>
              </View>

              <Text className="text-white font-extrabold text-3xl font-display-xl my-1">
                ₹{salaryBreakdown.netSalary.toLocaleString('en-IN')}
                <Text className="text-white/50 text-sm font-normal"> / month</Text>
              </Text>

              <Text className="text-white/50 text-xs mt-1">
                Annual Cost-to-Company (CTC): <Text className="text-[#f0c110] font-bold">₹{salaryBreakdown.annualCTC.toLocaleString('en-IN')}</Text>
              </Text>
            </GlassCard>

            {/* Earnings Breakdown */}
            <GlassCard
              className="p-5 border border-white/10"
              style={{
                backgroundColor: '#1d2122',
                borderRadius: 24,
                marginBottom: 16,
              }}
            >
              <View className="flex-row items-center justify-between mb-3.5">
                <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider">
                  Monthly Gross Earnings Breakdown
                </Text>
                <Text className="text-white font-extrabold text-xs">
                  ₹{salaryBreakdown.gross.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {[
                  { label: 'Basic Pay (50%)', amount: salaryBreakdown.basicPay },
                  { label: 'House Rent Allowance (HRA - 25%)', amount: salaryBreakdown.hra },
                  { label: 'Special Academic Allowance (15%)', amount: salaryBreakdown.specialAllowance },
                  { label: 'Conveyance & Medical Allowance (10%)', amount: salaryBreakdown.conveyance },
                ].map((earn, idx) => (
                  <View key={idx} className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex-row items-center justify-between">
                    <Text className="text-white/70 text-xs font-semibold">{earn.label}</Text>
                    <Text className="text-[#41eec2] text-xs font-extrabold">+₹{earn.amount.toLocaleString('en-IN')}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            {/* Statutory Deductions Breakdown */}
            <GlassCard
              className="p-5 border border-white/10"
              style={{
                backgroundColor: '#1d2122',
                borderRadius: 24,
                marginBottom: 16,
              }}
            >
              <View className="flex-row items-center justify-between mb-3.5">
                <Text className="text-rose-400 text-xs font-bold uppercase tracking-wider">
                  Statutory & Tax Deductions
                </Text>
                <Text className="text-rose-400 font-extrabold text-xs">
                  -₹{salaryBreakdown.totalDeductions.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {[
                  { label: 'Provident Fund (EPF 12% of Basic)', amount: salaryBreakdown.epfDeduction },
                  { label: 'Professional Tax (PT)', amount: salaryBreakdown.professionalTax },
                  { label: 'Income Tax (TDS / Deductions)', amount: 0 },
                ].map((ded, idx) => (
                  <View key={idx} className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex-row items-center justify-between">
                    <Text className="text-white/70 text-xs font-semibold">{ded.label}</Text>
                    <Text className="text-rose-400 text-xs font-extrabold">-₹{ded.amount.toLocaleString('en-IN')}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </View>
        )}

        {/* ================= TAB 5: PAY SLIPS ================= */}
        {activeTab === 'slips' && (
          <View className="px-5 mb-6" style={{ gap: 16 }}>
            <GlassCard
              className="p-5 border border-white/10"
              style={{
                backgroundColor: '#1d2122',
                borderRadius: 24,
                marginBottom: 16,
              }}
            >
              <View className="flex-row items-center justify-between mb-3.5">
                <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider">
                  Generated Monthly Salary Slips
                </Text>
                <Text className="text-white/40 text-[10px] font-mono">FY 2026-27</Text>
              </View>

              <View style={{ gap: 14 }}>
                {payslipsList.map((slip, idx) => (
                  <View
                    key={idx}
                    className="p-4 bg-black/40 border border-white/5 rounded-2xl"
                  >
                    <View className="flex-row items-center justify-between mb-2.5">
                      <View>
                        <Text className="text-white font-extrabold text-sm">{slip.month}</Text>
                        <Text className="text-white/40 text-[10px] mt-0.5">{slip.period}</Text>
                      </View>

                      <View
                        className={`px-2.5 py-0.5 rounded-full border ${slip.status === 'Paid'
                          ? 'bg-[#41eec2]/15 border-[#41eec2]/30'
                          : 'bg-[#f0c110]/15 border-[#f0c110]/30'
                          }`}
                      >
                        <Text
                          className={`text-[9.5px] font-extrabold uppercase ${slip.status === 'Paid' ? 'text-[#41eec2]' : 'text-[#f0c110]'
                            }`}
                        >
                          {slip.status}
                        </Text>
                      </View>
                    </View>

                    <View className="p-3 rounded-xl bg-white/5 border border-white/10 flex-row items-center justify-between mb-3.5">
                      <View>
                        <Text className="text-white/40 text-[9px] uppercase font-bold">Gross Pay</Text>
                        <Text className="text-white font-bold text-xs mt-0.5">₹{slip.gross.toLocaleString('en-IN')}</Text>
                      </View>

                      <View>
                        <Text className="text-white/40 text-[9px] uppercase font-bold">Deductions</Text>
                        <Text className="text-rose-400 font-bold text-xs mt-0.5">-₹{slip.deductions.toLocaleString('en-IN')}</Text>
                      </View>

                      <View>
                        <Text className="text-white/40 text-[9px] uppercase font-bold">Net Transferred</Text>
                        <Text className="text-[#ffe5a0] font-extrabold text-xs mt-0.5">₹{slip.net.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <Pressable
                        onPress={() => handleSharePayslip(slip)}
                        className="flex-1 py-2.5 rounded-xl bg-[#f0c110] flex-row items-center justify-center active:scale-95 shadow-sm shadow-[#f0c110]/20"
                      >
                        <Download size={13} color="#101415" style={{ marginRight: 6 }} />
                        <Text className="text-[#101415] text-xs font-extrabold uppercase tracking-wider">
                          Download Payslip
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </GlassCard>
          </View>
        )}
      </ScrollView>

      {/* ================= DOCUMENT VIEWER & PREVIEW MODAL ================= */}
      <Modal
        visible={!!viewingDoc}
        transparent
        animationType="slide"
        onRequestClose={() => setViewingDoc(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCardContainer, { maxHeight: '90%' }]}>
            <GlassCard
              className="p-5 border border-white/15"
              style={{
                backgroundColor: '#14181a',
                borderRadius: 28,
                shadowColor: '#f0c110',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.35,
                shadowRadius: 24,
                maxHeight: '100%',
              }}
            >
              {/* Modal Header */}
              <View className="flex-row items-center justify-between pb-3 border-b border-white/10 mb-3">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center gap-2 mb-1">
                    <View className="w-7 h-7 rounded-lg bg-[#f0c110]/15 border border-[#f0c110]/30 items-center justify-center">
                      <FileCheck2 size={15} color="#f0c110" />
                    </View>
                    <Text className="text-white font-extrabold text-sm flex-1" numberOfLines={1}>
                      {viewingDoc?.name}
                    </Text>
                  </View>
                  <Text className="text-white/40 text-[10px]">
                    Staff Dossier: <Text className="text-[#ffe5a0] font-bold">{staff.name}</Text> ({staff.biometric_employee_code || `BIO-${staff.id}`})
                  </Text>
                </View>

                <Pressable
                  onPress={() => setViewingDoc(null)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                >
                  <X size={16} color="white" />
                </Pressable>
              </View>

              {/* Format Toggle Pill with Mutual Disabling */}
              <View className="flex-row bg-black/50 p-1 rounded-xl border border-white/10 mb-3" style={{ gap: 4 }}>
                <Pressable
                  disabled={viewingDoc?.type === 'image'}
                  onPress={() => setDocPreviewMode('pdf')}
                  className={`flex-1 py-1.5 rounded-lg flex-row items-center justify-center ${
                    viewingDoc?.type === 'image'
                      ? 'bg-transparent opacity-25'
                      : docPreviewMode === 'pdf'
                      ? 'bg-[#f0c110]'
                      : 'bg-transparent'
                  }`}
                >
                  <FileText
                    size={12}
                    color={
                      viewingDoc?.type === 'image'
                        ? 'rgba(255,255,255,0.3)'
                        : docPreviewMode === 'pdf'
                        ? '#101415'
                        : 'rgba(255,255,255,0.6)'
                    }
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    className={`text-[11px] font-extrabold ${
                      viewingDoc?.type === 'image'
                        ? 'text-white/30'
                        : docPreviewMode === 'pdf'
                        ? 'text-[#101415]'
                        : 'text-white/60'
                    }`}
                  >
                    {viewingDoc?.type === 'image' ? 'PDF View (Disabled)' : 'PDF Document View'}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={viewingDoc?.type === 'pdf'}
                  onPress={() => setDocPreviewMode('image')}
                  className={`flex-1 py-1.5 rounded-lg flex-row items-center justify-center ${
                    viewingDoc?.type === 'pdf'
                      ? 'bg-transparent opacity-25'
                      : docPreviewMode === 'image'
                      ? 'bg-[#41eec2]'
                      : 'bg-transparent'
                  }`}
                >
                  <ImageIcon
                    size={12}
                    color={
                      viewingDoc?.type === 'pdf'
                        ? 'rgba(255,255,255,0.3)'
                        : docPreviewMode === 'image'
                        ? '#101415'
                        : 'rgba(255,255,255,0.6)'
                    }
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    className={`text-[11px] font-extrabold ${
                      viewingDoc?.type === 'pdf'
                        ? 'text-white/30'
                        : docPreviewMode === 'image'
                        ? 'text-[#101415]'
                        : 'text-white/60'
                    }`}
                  >
                    {viewingDoc?.type === 'pdf' ? 'Image View (Disabled)' : 'Scanned Image View'}
                  </Text>
                </Pressable>
              </View>

              {/* Document Display Canvas */}
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360, marginBottom: 16 }}>
                {docPreviewMode === 'pdf' ? (
                  /* Realistic PDF Document Mockup */
                  <View className="bg-[#f8fafc] rounded-2xl p-4 border border-white/20 shadow-inner">
                    {/* PDF Header Bar */}
                    <View className="flex-row items-center justify-between pb-3 border-b-2 border-slate-300 mb-3">
                      <View className="flex-row items-center gap-2">
                        <View className="w-8 h-8 rounded-lg bg-[#1d2122] items-center justify-center">
                          <GraduationCap size={16} color="#ffe5a0" />
                        </View>
                        <View>
                          <Text className="text-slate-900 font-extrabold text-[12px] uppercase tracking-wide">
                            KRISHNAVENI TALENT SCHOOL
                          </Text>
                          <Text className="text-slate-500 text-[9px] font-semibold">
                            Central Verification Authority • Academic Archive
                          </Text>
                        </View>
                      </View>

                      <View className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300">
                        <Text className="text-emerald-800 text-[8.5px] font-extrabold uppercase">AUTHENTIC</Text>
                      </View>
                    </View>

                    {/* Document Watermark & Body */}
                    <View className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm relative overflow-hidden mb-3">
                      <View
                        className="absolute inset-0 items-center justify-center opacity-5 pointer-events-none"
                        style={{ transform: [{ rotate: '-25deg' }] }}
                      >
                        <Text className="text-slate-900 font-black text-3xl">VERIFIED RECORD</Text>
                      </View>

                      <Text className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mb-1">
                        OFFICIAL ATTACHMENT RECORD
                      </Text>
                      <Text className="text-slate-900 font-extrabold text-sm mb-2">
                        {viewingDoc?.name}
                      </Text>

                      <View className="space-y-1.5 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-slate-500 text-[10px]">Staff Member:</Text>
                          <Text className="text-slate-900 text-[10px] font-bold">{staff.name}</Text>
                        </View>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-slate-500 text-[10px]">Designation & Dept:</Text>
                          <Text className="text-slate-900 text-[10px] font-bold">{staff.designation} ({staff.department})</Text>
                        </View>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-slate-500 text-[10px]">Joining Date:</Text>
                          <Text className="text-slate-900 text-[10px] font-mono font-bold">{formatToDDMMYYYY(staff.join_date)}</Text>
                        </View>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-slate-500 text-[10px]">Biometric ID:</Text>
                          <Text className="text-slate-900 text-[10px] font-mono font-bold">{staff.biometric_employee_code || `BIO-${staff.id}`}</Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-slate-500 text-[10px]">Security Hash:</Text>
                          <Text className="text-slate-500 text-[9px] font-mono">SHA256: 8f4a...e12d</Text>
                        </View>
                      </View>

                      <Text className="text-slate-600 text-[10px] leading-relaxed">
                        This digital document has been verified against physical originals and entered into the Krishnaveni Talent School institutional personnel dossier. All credentials and academic certifications stand validated.
                      </Text>
                    </View>

                    {/* PDF Footer Signatures */}
                    <View className="flex-row items-center justify-between pt-2 border-t border-slate-200">
                      <View className="items-center">
                        <Text className="text-slate-400 text-[8px] uppercase">Official Registrar Stamp</Text>
                        <View className="w-12 h-6 rounded border border-dashed border-slate-400 items-center justify-center mt-0.5">
                          <ShieldCheck size={14} color="#059669" />
                        </View>
                      </View>

                      <View className="items-center">
                        <Text className="text-slate-400 text-[8px] uppercase">Digital Signature</Text>
                        <Text className="text-slate-800 text-[9px] font-serif italic mt-0.5">Dr. K. Ramana (Super Admin)</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  /* Realistic Scanned Image / ID Card View */
                  <View className="bg-[#181c1e] rounded-2xl p-4 border border-white/15 items-center">
                    <View className="w-full bg-black/60 rounded-xl p-4 border border-white/10 relative overflow-hidden">
                      <View className="flex-row items-center justify-between mb-3 border-b border-white/10 pb-2.5">
                        <View className="flex-row items-center gap-2">
                          <Building2 size={16} color="#ffe5a0" />
                          <Text className="text-white text-xs font-bold uppercase">
                            GOVERNMENT / IDENTITY RECORD SCAN
                          </Text>
                        </View>
                        <View className="px-2 py-0.5 rounded bg-[#41eec2]/15 border border-[#41eec2]/30">
                          <Text className="text-[#41eec2] text-[8.5px] font-bold">200 DPI SCAN</Text>
                        </View>
                      </View>

                      {/* Scanned Card Face */}
                      <View className="flex-row items-center gap-3 mb-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        <Image
                          source={{ uri: staff.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150' }}
                          className="w-16 h-20 rounded-lg border-2 border-white/20"
                        />
                        <View className="flex-1">
                          <Text className="text-[#ffe5a0] text-sm font-extrabold">{staff.name}</Text>
                          <Text className="text-white/70 text-xs font-semibold mt-0.5">{viewingDoc?.name}</Text>
                          <Text className="text-white/40 text-[10px] font-mono mt-1">
                            REG-NO: KTS-{staff.id.toUpperCase()}-DOC
                          </Text>
                          <Text className="text-white/40 text-[10px] mt-0.5">
                            Issued: {formatToDDMMYYYY(staff.join_date)}
                          </Text>
                        </View>
                      </View>

                      {/* Barcode & Hologram footer */}
                      <View className="flex-row items-center justify-between pt-2 border-t border-white/10">
                        <View>
                          <Text className="text-white/30 text-[8px] font-mono">||| | |||| | ||||| || ||||</Text>
                          <Text className="text-white/40 text-[8px] font-mono">DOC-984210</Text>
                        </View>
                        <View className="px-2 py-1 rounded bg-[#f0c110]/15 border border-[#f0c110]/30 items-center justify-center">
                          <Text className="text-[#f0c110] text-[9px] font-bold">Holographic Verified</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Bottom Action Bar */}
              <View className="flex-row gap-2.5">
                <Pressable
                  onPress={() => viewingDoc && handleDownloadOrShareDoc(viewingDoc)}
                  className="flex-1 py-3 rounded-xl bg-[#f0c110] flex-row items-center justify-center active:scale-95 shadow-sm shadow-[#f0c110]/30"
                >
                  <Download size={14} color="#101415" style={{ marginRight: 6 }} />
                  <Text className="text-[#101415] text-xs font-extrabold uppercase tracking-wider">
                    Download File
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => viewingDoc && handleDownloadOrShareDoc(viewingDoc)}
                  className="py-3 px-4 rounded-xl bg-white/10 border border-white/15 flex-row items-center justify-center active:bg-white/20 active:scale-95"
                >
                  <Share2 size={14} color="#ffe5a0" style={{ marginRight: 5 }} />
                  <Text className="text-white text-xs font-bold">Share</Text>
                </Pressable>

                <Pressable
                  onPress={() => setViewingDoc(null)}
                  className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 items-center justify-center active:bg-white/10"
                >
                  <Text className="text-white/70 text-xs font-bold">Close</Text>
                </Pressable>
              </View>
            </GlassCard>
          </View>
        </View>
      </Modal>

      {/* ================= ADD / UPLOAD OTHER DOCUMENT MODAL ================= */}
      <Modal
        visible={uploadDocModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUploadDocModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCardContainer}>
            <GlassCard
              className="p-6 border border-white/15"
              style={{
                backgroundColor: '#16191b',
                borderRadius: 28,
                shadowColor: '#f0c110',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                maxHeight: '85%',
              }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between pb-4 border-b border-white/10 mb-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-[#f0c110]/15 border border-[#f0c110]/30 items-center justify-center">
                    <UploadCloud size={20} color="#f0c110" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-base">Add Other Document</Text>
                    <Text className="text-[#ffe5a0] text-[10px] uppercase tracking-wider font-bold">
                      STAFF VERIFICATION DOSSIER
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setUploadDocModalVisible(false)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                >
                  <X size={16} color="white" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Document Name */}
                <View className="mb-4">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">
                    Document Title / Category *
                  </Text>
                  <TextInput
                    value={uploadDocName}
                    onChangeText={setUploadDocName}
                    placeholder="e.g. PAN Card Copy, Master's Degree, Relieving Letter"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-xs font-semibold"
                  />
                </View>

                {/* File Picker Section */}
                <View className="mb-5">
                  <Text className="text-white/70 text-xs font-bold mb-1.5">
                    Select File (PDF, PNG, JPG) *
                  </Text>

                  <Pressable
                    onPress={handlePickDocument}
                    className="p-5 rounded-2xl border-2 border-dashed border-[#f0c110]/40 bg-black/40 items-center justify-center active:bg-white/5 active:border-[#f0c110]"
                  >
                    {selectedFile ? (
                      <View className="items-center">
                        <View className="w-12 h-12 rounded-2xl bg-[#41eec2]/15 border border-[#41eec2]/30 items-center justify-center mb-2">
                          <FileCheck2 size={24} color="#41eec2" />
                        </View>
                        <Text className="text-white font-bold text-xs text-center" numberOfLines={1}>
                          {selectedFile.name}
                        </Text>
                        <Text className="text-[#ffe5a0] text-[10px] font-mono mt-0.5">
                          {selectedFile.size ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'File Ready'} • Tap to Change
                        </Text>
                      </View>
                    ) : (
                      <View className="items-center">
                        <View className="w-12 h-12 rounded-2xl bg-[#f0c110]/15 border border-[#f0c110]/30 items-center justify-center mb-2">
                          <UploadCloud size={24} color="#f0c110" />
                        </View>
                        <Text className="text-white font-bold text-xs text-center">
                          Tap to Pick Document from Device
                        </Text>
                        <Text className="text-white/40 text-[10px] text-center mt-1">
                          Supports PDF, JPEG, PNG formats up to 25MB
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </View>

                {/* Upload & Save Button */}
                <Pressable
                  onPress={handleSaveUploadedDoc}
                  className="w-full py-4 rounded-xl bg-[#f0c110] items-center justify-center active:scale-95 shadow-md shadow-[#f0c110]/30 mb-2"
                >
                  <Text className="text-[#101415] text-sm font-extrabold uppercase tracking-wider">
                    Upload & Attach Document
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setUploadDocModalVisible(false)}
                  className="w-full py-3 items-center"
                >
                  <Text className="text-white/50 text-xs font-semibold">Cancel</Text>
                </Pressable>
              </ScrollView>
            </GlassCard>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= EDIT STAFF PROFILE MODAL ================= */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCardContainer}>
            <GlassCard
              className="p-6 border border-white/15"
              style={{
                backgroundColor: '#16191b',
                borderRadius: 28,
                shadowColor: '#f0c110',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                maxHeight: '85%',
              }}
            >
              {/* Modal Header */}
              <View className="flex-row items-center justify-between pb-4 border-b border-white/10 mb-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-[#f0c110]/15 border border-[#f0c110]/30 items-center justify-center">
                    <Briefcase size={20} color="#f0c110" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-base">Edit Staff Profile</Text>
                    <Text className="text-[#ffe5a0] text-[10px] uppercase tracking-wider font-bold">
                      SUPER ADMIN EDIT CONSOLE
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setEditModalVisible(false)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                >
                  <X size={16} color="white" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Full Name */}
                <View className="mb-3.5">
                  <Text className="text-white/60 text-xs font-bold mb-1.5">Full Name *</Text>
                  <TextInput
                    value={formName}
                    onChangeText={setFormName}
                    placeholder="e.g. Dr. Julian Vance"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-xs font-semibold"
                  />
                </View>

                {/* Designation & Department */}
                <View className="flex-row gap-3 mb-3.5">
                  <View className="flex-1">
                    <Text className="text-white/60 text-xs font-bold mb-1.5">Designation *</Text>
                    <TextInput
                      value={formDesignation}
                      onChangeText={setFormDesignation}
                      placeholder="e.g. Senior Faculty"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-3 text-white text-xs font-semibold"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-white/60 text-xs font-bold mb-1.5">Department *</Text>
                    <TextInput
                      value={formDepartment}
                      onChangeText={setFormDepartment}
                      placeholder="e.g. Physics"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-3 text-white text-xs font-semibold"
                    />
                  </View>
                </View>

                {/* Category Selector */}
                <View className="mb-3.5">
                  <Text className="text-white/60 text-xs font-bold mb-1.5">Staff Category</Text>
                  <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                    {(['Teaching', 'Non-Teaching', 'Admin', 'Support'] as const).map((cat) => {
                      const isSel = formCategory === cat;
                      return (
                        <Pressable
                          key={cat}
                          onPress={() => setFormCategory(cat)}
                          className={`px-3 py-2 rounded-xl border ${isSel ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-white/5 border-white/10'
                            }`}
                        >
                          <Text className={`text-xs font-bold ${isSel ? 'text-[#101415]' : 'text-white/70'}`}>
                            {cat}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Subject Specialization */}
                <View className="mb-3.5">
                  <Text className="text-white/60 text-xs font-bold mb-1.5">Specialization / Subject</Text>
                  <TextInput
                    value={formSubject}
                    onChangeText={setFormSubject}
                    placeholder="e.g. Senior Physics / Mathematics"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    className="bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-xs font-semibold"
                  />
                </View>

                {/* Phone & Email */}
                <View className="flex-row gap-3 mb-3.5">
                  <View className="flex-1">
                    <Text className="text-white/60 text-xs font-bold mb-1.5">Phone</Text>
                    <TextInput
                      value={formPhone}
                      onChangeText={setFormPhone}
                      placeholder="+91 98450 00000"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-3 text-white text-xs font-semibold"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-white/60 text-xs font-bold mb-1.5">Email</Text>
                    <TextInput
                      value={formEmail}
                      onChangeText={setFormEmail}
                      placeholder="faculty@krishnaveni.edu"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-3 text-white text-xs font-semibold"
                    />
                  </View>
                </View>

                {/* Salary & Biometric Code */}
                <View className="flex-row gap-3 mb-3.5">
                  <View className="flex-1">
                    <Text className="text-white/60 text-xs font-bold mb-1.5">Monthly Salary (₹)</Text>
                    <TextInput
                      value={formSalary}
                      onChangeText={setFormSalary}
                      placeholder="65000"
                      keyboardType="numeric"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-3 text-white text-xs font-semibold"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-white/60 text-xs font-bold mb-1.5">Biometric Code</Text>
                    <TextInput
                      value={formBiometricCode}
                      onChangeText={setFormBiometricCode}
                      placeholder="BIO-101"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-3 text-white text-xs font-semibold"
                    />
                  </View>
                </View>

                {/* Joining Date & Qualifications */}
                <View className="flex-row gap-3 mb-3.5">
                  <View className="flex-1">
                    <Text className="text-white/60 text-xs font-bold mb-1.5">Joining Date (DD-MM-YYYY)</Text>
                    <TextInput
                      value={formJoinDate}
                      onChangeText={setFormJoinDate}
                      placeholder="15-06-2021"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-3 text-white text-xs font-semibold"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-white/60 text-xs font-bold mb-1.5">Qualifications</Text>
                    <TextInput
                      value={formQualifications}
                      onChangeText={setFormQualifications}
                      placeholder="Ph.D., M.Sc., B.Ed"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/50 border border-white/15 rounded-xl px-3.5 py-3 text-white text-xs font-semibold"
                    />
                  </View>
                </View>

                {/* Status Selector */}
                <View className="mb-6">
                  <Text className="text-white/60 text-xs font-bold mb-1.5">Status</Text>
                  <View className="flex-row" style={{ gap: 8 }}>
                    {(['Active', 'On Leave', 'Resigned'] as const).map((st) => {
                      const isSel = formStatus === st;
                      return (
                        <Pressable
                          key={st}
                          onPress={() => setFormStatus(st)}
                          className={`flex-1 py-2.5 rounded-xl items-center border ${isSel ? 'bg-[#f0c110] border-[#f0c110]' : 'bg-white/5 border-white/10'
                            }`}
                        >
                          <Text className={`text-xs font-bold ${isSel ? 'text-[#101415]' : 'text-white/70'}`}>
                            {st}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Save Button */}
                <Pressable
                  onPress={handleSaveEdit}
                  className="w-full py-4 rounded-xl bg-[#f0c110] items-center justify-center active:scale-95 shadow-md shadow-[#f0c110]/30 mb-4"
                >
                  <Text className="text-[#101415] text-sm font-extrabold uppercase tracking-wider">
                    Save Changes
                  </Text>
                </Pressable>
              </ScrollView>
            </GlassCard>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= CUSTOM ALERT MODAL ================= */}
      <Modal
        visible={customAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertOverlay}>
          <GlassCard
            className="p-6 border border-white/10 items-center"
            style={{
              width: '85%',
              maxWidth: 340,
              backgroundColor: '#16191b',
              borderRadius: 28,
              shadowColor: customAlert.type === 'confirm_delete' ? '#ef4444' : '#f0c110',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
            }}
          >
            <View
              className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center ${customAlert.type === 'confirm_delete' || customAlert.type === 'error'
                ? 'bg-red-500/15 border border-red-500/30'
                : 'bg-[#f0c110]/15 border border-[#f0c110]/30'
                }`}
            >
              {customAlert.type === 'confirm_delete' ? (
                <Trash2 size={24} color="#ffb4ab" />
              ) : customAlert.type === 'error' ? (
                <AlertTriangle size={24} color="#ffb4ab" />
              ) : (
                <Check size={24} color="#f0c110" strokeWidth={3} />
              )}
            </View>

            <Text className="text-white text-lg font-bold font-display-md text-center mb-2">
              {customAlert.title}
            </Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-6 px-1">
              {customAlert.message}
            </Text>

            <View className="flex-row gap-3 w-full">
              {customAlert.type === 'confirm_delete' ? (
                <>
                  <Pressable
                    onPress={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
                    className="flex-1 py-3.5 rounded-xl bg-white/10 items-center active:bg-white/20"
                  >
                    <Text className="text-white text-xs font-bold uppercase tracking-wider">Cancel</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      if (customAlert.onConfirm) customAlert.onConfirm();
                    }}
                    className="flex-1 py-3.5 rounded-xl bg-red-500 items-center active:bg-red-600 shadow-md shadow-red-500/30"
                  >
                    <Text className="text-white text-xs font-bold uppercase tracking-wider">Delete</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  onPress={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
                  className="w-full py-3.5 rounded-xl bg-[#f0c110] items-center active:scale-95 shadow-md shadow-[#f0c110]/30"
                >
                  <Text className="text-[#101415] text-xs font-bold uppercase tracking-wider">Dismiss</Text>
                </Pressable>
              )}
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101415',
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingTop: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCardContainer: {
    width: '100%',
    maxWidth: 480,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SuperAdminStaffDetailsScreen;
