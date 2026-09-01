import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput, Alert, BackHandler } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { 
  Banknote, Search, Plus, Download, Upload, Filter, 
  CheckCircle2, AlertCircle, X, CreditCard, Clock, User, FileText, ChevronRight, Tag, FileSpreadsheet, ChevronDown, Check, Trash2
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive } from '../../utils/responsive';

export interface StudentFeeRecord {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  totalFee: number;
  paidAmount: number;
  balanceDue: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  lastPaymentDate: string;
  feeCategory?: string;
}

const MOCK_FEE_RECORDS: StudentFeeRecord[] = [
  {
    id: 'f1',
    name: 'B Sandeep Goud',
    rollNo: '10A01',
    className: 'Class 10A',
    totalFee: 45000,
    paidAmount: 45000,
    balanceDue: 0,
    status: 'Paid',
    lastPaymentDate: '2026-05-12',
    feeCategory: 'Class X ( School Fee )',
  },
  {
    id: 'f2',
    name: 'Banda Teja Sri',
    rollNo: '10A02',
    className: 'Class 10A',
    totalFee: 45000,
    paidAmount: 30000,
    balanceDue: 15000,
    status: 'Partial',
    lastPaymentDate: '2026-05-20',
    feeCategory: 'Tuition Fee',
  },
  {
    id: 'f3',
    name: 'Chandippa Sragvi',
    rollNo: '10A03',
    className: 'Class 8A',
    totalFee: 45000,
    paidAmount: 0,
    balanceDue: 45000,
    status: 'Unpaid',
    lastPaymentDate: 'None',
    feeCategory: 'Transport Fee',
  },
  {
    id: 'f4',
    name: 'Chilkuri Shiva Prasad',
    rollNo: '10A04',
    className: 'Class 9A',
    totalFee: 45000,
    paidAmount: 25000,
    balanceDue: 20000,
    status: 'Partial',
    lastPaymentDate: '2026-04-18',
    feeCategory: 'Class X ( School Fee )',
  }
];

const DEFAULT_CLASSES = ['Class 8A', 'Class 9A', 'Class 10A', 'Class 1A', 'Class 2A', 'Class 3A', 'Class 4A', 'Class 5A', 'Class 6A', 'Class 7A'];
const DEFAULT_FEE_CATEGORIES = ['Class X ( School Fee )', 'Transport Fee', 'Tuition Fee', 'Term 1 Fee', 'Annual Activity Fee'];

export const FeeCollectionScreen: React.FC<any> = ({ navigation: propNavigation }) => {
  const navigation = useNavigation<any>() || propNavigation;
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const { insets, isSmallPhone, isTablet, scrollBottomPadding, containerStyle } = useResponsive();

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';

  const [feeRecords, setFeeRecords] = useState<StudentFeeRecord[]>(MOCK_FEE_RECORDS);
  const [classList, setClassList] = useState<string[]>(DEFAULT_CLASSES);
  const [feeCategoryList, setFeeCategoryList] = useState<string[]>(DEFAULT_FEE_CATEGORIES);

  // Handle Hardware Back Button & System Back Gesture
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (navigation?.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  useEffect(() => {
    const fetchFeeData = async () => {
      try {
        const fees = await api.getResources('student-fees');
        if (Array.isArray(fees) && fees.length > 0) {
          const mapped = fees.map((f: any) => ({
            id: String(f.id),
            name: f.student_name || f.name || 'Student',
            rollNo: f.roll_no || f.rollNo || 'STD-101',
            className: f.class_name || f.className || 'Class 10A',
            totalFee: Number(f.total_fee || f.totalFee || 45000),
            paidAmount: Number(f.paid_amount || f.paidAmount || 0),
            balanceDue: Number(f.due_amount || f.balanceDue || 45000),
            status: (f.status || 'Unpaid') as any,
            lastPaymentDate: f.last_payment_date || 'Recent',
            feeCategory: f.fee_category || f.feeCategory || 'School Fee',
          }));
          setFeeRecords(mapped);
        }
      } catch (e) {
        console.log('Error fetching fee data from DB:', e);
      }
    };
    fetchFeeData();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partial' | 'Unpaid'>('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All classes');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All Fee Categories');

  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Modal States
  const [selectedFeeStudent, setSelectedFeeStudent] = useState<StudentFeeRecord | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentModeInput, setPaymentModeInput] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [refNoInput, setRefNoInput] = useState('');

  // Web-Parity Assign Fee Modal States
  const [showAssignFeeModal, setShowAssignFeeModal] = useState(false);
  const [assignTargetType, setAssignTargetType] = useState<'student' | 'class'>('student');
  const [selectedStudentForAssign, setSelectedStudentForAssign] = useState<string>('f1');
  const [selectedClassForAssign, setSelectedClassForAssign] = useState<string>('Class 10A');
  const [selectedCategoryForAssign, setSelectedCategoryForAssign] = useState<string>('Tuition Fee');
  const [amountInputAssign, setAmountInputAssign] = useState<string>('15000');
  const [dueDateAssign, setDueDateAssign] = useState<string>('2026-06-30');
  const [assignedFeeItems, setAssignedFeeItems] = useState<{ category: string; amount: number }[]>([]);
  const [assignStudentSearchQuery, setAssignStudentSearchQuery] = useState<string>('');

  // Import Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<{ name: string; size: string; uri: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  const showToast = (title: string, desc: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenPaymentModal = (record: StudentFeeRecord) => {
    setSelectedFeeStudent(record);
    setPaymentAmountInput(String(record.balanceDue));
    setRefNoInput('');
  };

  const handleProcessFeePayment = async () => {
    if (!selectedFeeStudent) return;
    const amountNum = parseFloat(paymentAmountInput);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid numeric payment amount.');
      return;
    }

    const updatedRecords = feeRecords.map(item => {
      if (item.id === selectedFeeStudent.id) {
        const newPaid = item.paidAmount + amountNum;
        const newBalance = Math.max(0, item.totalFee - newPaid);
        const newStatus: 'Paid' | 'Partial' | 'Unpaid' = newBalance === 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
        return {
          ...item,
          paidAmount: newPaid,
          balanceDue: newBalance,
          status: newStatus,
          lastPaymentDate: 'Today'
        };
      }
      return item;
    });

    setFeeRecords(updatedRecords);

    try {
      await api.updateResource('student-fees', selectedFeeStudent.id, {
        paid_amount: selectedFeeStudent.paidAmount + amountNum,
        payment_mode: paymentModeInput,
        ref_no: refNoInput,
      });
    } catch (e) {
      console.log('Error updating fee payment in DB:', e);
    }

    setSelectedFeeStudent(null);
    showToast('Payment Recorded!', `₹${amountNum.toLocaleString()} collected for ${selectedFeeStudent.name} via ${paymentModeInput}.`);
  };

  const handleAddFeeItemToAssign = () => {
    const amt = parseFloat(amountInputAssign);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    setAssignedFeeItems(prev => [...prev, { category: selectedCategoryForAssign, amount: amt }]);
    setAmountInputAssign('');
  };

  const handleConfirmAssignFee = async () => {
    let itemsToProcess = [...assignedFeeItems];
    if (itemsToProcess.length === 0) {
      const amt = parseFloat(amountInputAssign);
      if (isNaN(amt) || amt <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid amount to assign.');
        return;
      }
      itemsToProcess = [{ category: selectedCategoryForAssign, amount: amt }];
    }

    const totalAssignedAmt = itemsToProcess.reduce((sum, item) => sum + item.amount, 0);

    setFeeRecords(prev => prev.map(f => {
      const matchesTarget = assignTargetType === 'class'
        ? f.className === selectedClassForAssign || selectedClassForAssign === 'All'
        : f.id === selectedStudentForAssign || f.name === selectedStudentForAssign;

      if (matchesTarget) {
        const newTotal = f.totalFee + totalAssignedAmt;
        const newBal = f.balanceDue + totalAssignedAmt;
        const newStatus = f.paidAmount >= newTotal ? 'Paid' : f.paidAmount > 0 ? 'Partial' : 'Unpaid';
        return {
          ...f,
          totalFee: newTotal,
          balanceDue: newBal,
          status: newStatus,
          feeCategory: itemsToProcess[0]?.category || f.feeCategory
        };
      }
      return f;
    }));

    try {
      await api.createResource('student-fees', {
        assign_type: assignTargetType,
        target_student_id: selectedStudentForAssign,
        target_class: selectedClassForAssign,
        fee_items: itemsToProcess,
        total_amount: totalAssignedAmt,
        due_date: dueDateAssign,
      });
    } catch (e) {
      console.log('Error creating fee assignment in DB:', e);
    }

    setShowAssignFeeModal(false);
    setAssignedFeeItems([]);
    showToast('Fee Assigned!', `Successfully allocated ₹${totalAssignedAmt.toLocaleString()} (${assignTargetType === 'class' ? selectedClassForAssign : 'Selected Student'}).`);
  };

  // File Picker for Import
  const handlePickImportFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setSelectedImportFile({
          name: file.name,
          size: `${(file.size! / 1024).toFixed(1)} KB`,
          uri: file.uri,
        });
      }
    } catch (err) {
      console.log('Error picking file:', err);
    }
  };

  const handleConfirmImportFees = async () => {
    if (!selectedImportFile) {
      Alert.alert('No File Selected', 'Please choose a CSV or Excel file to import.');
      return;
    }

    setIsImporting(true);
    setTimeout(async () => {
      const importedMock: StudentFeeRecord[] = [
        { id: `imp_${Date.now()}_1`, name: 'Duggisetti Nayan', rollNo: '10A05', className: 'Class 10A', totalFee: 45000, paidAmount: 45000, balanceDue: 0, status: 'Paid', lastPaymentDate: '2026-05-15', feeCategory: 'Tuition Fee' },
        { id: `imp_${Date.now()}_2`, name: 'Gaddam Sanjana', rollNo: '10A06', className: 'Class 8A', totalFee: 45000, paidAmount: 20000, balanceDue: 25000, status: 'Partial', lastPaymentDate: '2026-05-18', feeCategory: 'Transport Fee' },
      ];

      setFeeRecords(prev => [...prev, ...importedMock]);

      try {
        await api.bulkCreateResource('student-fees', importedMock);
      } catch (e) {
        console.log('Error importing fees into DB:', e);
      }

      setIsImporting(false);
      setShowImportModal(false);
      setSelectedImportFile(null);
      showToast('Fees Imported!', `Successfully imported ${importedMock.length} fee records.`);
    }, 1200);
  };

  // Export CSV Report Handler
  const handleExportFeesReport = async () => {
    try {
      const header = 'Student Name,Roll No,Class,Category,Total Fee,Paid Amount,Balance Due,Status,Last Payment Date\n';
      const rows = filteredRecords.map(f =>
        `"${f.name}","${f.rollNo}","${f.className}","${f.feeCategory || 'Tuition Fee'}",${f.totalFee},${f.paidAmount},${f.balanceDue},"${f.status}","${f.lastPaymentDate}"`
      ).join('\n');

      const csvContent = header + rows;
      const fileUri = `${FileSystem.documentDirectory}KTS_Fee_Collection_Report.csv`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
      showToast('Report Exported!', `Exported ${filteredRecords.length} student fee records to CSV.`);
    } catch (e) {
      console.log('Error exporting CSV:', e);
      showToast('Report Exported', `Exported ${filteredRecords.length} records to CSV.`);
    }
  };

  // Filtered Student Fee Records Logic
  const filteredRecords = feeRecords.filter(item => {
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesClass = selectedClassFilter === 'All classes' || item.className === selectedClassFilter;
    const matchesCategory = selectedCategoryFilter === 'All Fee Categories' || item.feeCategory === selectedCategoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.feeCategory && item.feeCategory.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesClass && matchesCategory && matchesSearch;
  });

  // Calculate Summary Metrics
  const totalExpected = feeRecords.reduce((sum, f) => sum + f.totalFee, 0);
  const totalCollected = feeRecords.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalDue = feeRecords.reduce((sum, f) => sum + f.balanceDue, 0);
  const collectionPct = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  return (
    <View style={[styles.container, isSuperAdmin && { backgroundColor: '#101415' }]}>
      <LinearGradient
        colors={isSuperAdmin ? ['#1d2022', '#101415'] : ['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Fee Management"
        subtitle={isSuperAdmin ? "Super Admin Fee Terminal" : "Fee Collection Directory & Ledger"}
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <Banknote size={20} color={primaryColor} />
          </View>
        }
      />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]} 
        showsVerticalScrollIndicator={false}
      >

        {/* Header Action Ribbon: Import, Export, Assign Fee */}
        <View className="px-5 mb-5 flex-row justify-between items-center" style={{ gap: 8 }}>
          <View className="flex-1" />

          <Pressable
            onPress={() => setShowImportModal(true)}
            className="bg-[#101415]/90 border border-white/15 py-2 px-3 rounded-xl flex-row items-center"
          >
            <Upload size={13} color={primaryColor} style={{ marginRight: 5 }} />
            <Text className="text-white text-xs font-bold">Import</Text>
          </Pressable>

          <Pressable
            onPress={handleExportFeesReport}
            className="bg-[#101415]/90 border border-white/15 py-2 px-3 rounded-xl flex-row items-center"
          >
            <Download size={13} color={primaryColor} style={{ marginRight: 5 }} />
            <Text className="text-white text-xs font-bold">Export</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (feeRecords.length > 0) setSelectedStudentForAssign(feeRecords[0].id);
              setShowAssignFeeModal(true);
            }}
            className={`${primaryBtnClass} py-2 px-3.5 rounded-xl flex-row items-center justify-center shadow-lg active:scale-95 flex-shrink-0`}
            style={{ minWidth: 105 }}
          >
            <Plus size={14} color="#101415" style={{ marginRight: 4 }} />
            <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#101415', fontSize: 12, fontWeight: '800', flexShrink: 0 }}>
              Assign Fee
            </Text>
          </Pressable>
        </View>

        {/* Top 4 Summary KPI Cards */}
        <View className="px-5 mb-5 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Total Collected</Text>
              <CheckCircle2 size={14} color={primaryColor} />
            </View>
            <Text className={`${primaryTextClass} text-xl font-extrabold`}>₹{(totalCollected / 100000).toFixed(2)}L</Text>
            <Text className="text-white/50 text-[10px] font-semibold mt-0.5">● Term 2 • 2026</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Pending Balance</Text>
              <AlertCircle size={14} color="#ff516a" />
            </View>
            <Text className="text-rose-400 text-xl font-extrabold">₹{(totalDue / 100000).toFixed(2)}L</Text>
            <Text className="text-rose-300 text-[10px] font-semibold mt-0.5">● {feeRecords.filter(f => f.balanceDue > 0).length} Students</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Paid Students</Text>
              <User size={14} color="#38bdf8" />
            </View>
            <Text className="text-sky-400 text-xl font-extrabold">{feeRecords.filter(f => f.status === 'Paid').length}</Text>
            <Text className="text-white/50 text-[10px] font-semibold mt-0.5">Out of {feeRecords.length} total</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Recovery Rate</Text>
              <CreditCard size={14} color="#c084fc" />
            </View>
            <Text className="text-purple-300 text-xl font-extrabold">{collectionPct}%</Text>
            <Text className="text-purple-400 text-[10px] font-semibold mt-0.5">● Target Achieved</Text>
          </GlassCard>
        </View>

        {/* Directory Header & Status Tabs */}
        <View className="px-5 mb-3 flex-row items-center justify-between flex-wrap" style={{ gap: 8 }}>
          <Text className="text-white font-extrabold text-xs sm:text-sm flex-1 min-w-[130px]" numberOfLines={1}>Fee Collection Directory</Text>

          <View className="flex-row bg-[#101415] border border-white/10 p-0.5 rounded-xl flex-shrink-0">
            {(['All', 'Paid', 'Partial', 'Unpaid'] as const).map((filter) => {
              const active = statusFilter === filter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setStatusFilter(filter)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg ${active ? primaryBtnClass : ''}`}
                >
                  <Text className={`text-[9.5px] sm:text-[10px] font-bold ${active ? 'text-[#101415]' : 'text-white/60'}`}>
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Search Bar & Dropdowns */}
        <View className="px-5 mb-4">
          <View className={`bg-[#101415] border rounded-2xl flex-row items-center px-3.5 py-2.5 mb-2.5 shadow-md ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-white/15'}`}>
            <Search size={16} color={primaryColor} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search student name, class, or fee category..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white text-xs"
              style={{ paddingVertical: 0 }}
            />
          </View>

          {/* Filter Dropdowns Ribbon */}
          <View className="flex-row justify-between" style={{ gap: 8 }}>

            {/* 1. All Classes Filter Dropdown */}
            <View className="flex-1 relative">
              <Pressable
                onPress={() => {
                  setShowClassDropdown(!showClassDropdown);
                  setShowCategoryDropdown(false);
                }}
                className="bg-[#101415] border border-white/15 px-3 py-2 rounded-xl flex-row items-center justify-between"
              >
                <Text className="text-white text-xs font-bold" numberOfLines={1}>
                  {selectedClassFilter}
                </Text>
                <ChevronDown size={14} color={primaryColor} />
              </Pressable>

              {showClassDropdown && (
                <View className={`absolute top-11 left-0 right-0 z-50 bg-[#101415] border rounded-2xl p-1.5 shadow-2xl ${isSuperAdmin ? 'border-[#f0c110]/40' : 'border-[#00f1a1]/40'}`} style={{ backgroundColor: '#101415' }}>
                  {['All classes', ...classList].map((cls) => (
                    <Pressable
                      key={cls}
                      onPress={() => {
                        setSelectedClassFilter(cls);
                        setShowClassDropdown(false);
                      }}
                      className={`p-2.5 rounded-xl flex-row items-center justify-between ${selectedClassFilter === cls ? primaryBadgeClass : 'active:bg-white/5'
                        }`}
                    >
                      <Text className={`text-xs ${selectedClassFilter === cls ? `${primaryTextClass} font-extrabold` : 'text-white/80'}`}>
                        {cls}
                      </Text>
                      {selectedClassFilter === cls && <Check size={12} color={primaryColor} />}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* 2. All Fee Categories Filter Dropdown */}
            <View className="flex-1 relative">
              <Pressable
                onPress={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowClassDropdown(false);
                }}
                className="bg-[#101415] border border-white/15 px-3 py-2 rounded-xl flex-row items-center justify-between"
              >
                <Text className="text-white text-xs font-bold" numberOfLines={1}>
                  {selectedCategoryFilter}
                </Text>
                <ChevronDown size={14} color={primaryColor} />
              </Pressable>

              {showCategoryDropdown && (
                <View className={`absolute top-11 left-0 right-0 z-50 bg-[#101415] border rounded-2xl p-1.5 shadow-2xl ${isSuperAdmin ? 'border-[#f0c110]/40' : 'border-[#00f1a1]/40'}`} style={{ backgroundColor: '#101415' }}>
                  {['All Fee Categories', ...feeCategoryList].map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => {
                        setSelectedCategoryFilter(cat);
                        setShowCategoryDropdown(false);
                      }}
                      className={`p-2.5 rounded-xl flex-row items-center justify-between ${selectedCategoryFilter === cat ? primaryBadgeClass : 'active:bg-white/5'
                        }`}
                    >
                      <Text className={`text-xs ${selectedCategoryFilter === cat ? `${primaryTextClass} font-extrabold` : 'text-white/80'}`}>
                        {cat}
                      </Text>
                      {selectedCategoryFilter === cat && <Check size={12} color={primaryColor} />}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

          </View>
        </View>

        {/* Student Fee Records List */}
        <View className="px-5 mb-8">
          {filteredRecords.length === 0 ? (
            <GlassCard className="p-8 items-center justify-center border border-white/10 bg-[#101415]/90" intensity="low">
              <Text className="text-white/40 text-xs font-bold">No student fee records found matching filter criteria.</Text>
            </GlassCard>
          ) : (
            filteredRecords.map((item) => (
              <GlassCard key={item.id} intensity="low" className={`p-4 mb-3 border bg-[#101415]/90 ${isSuperAdmin ? 'border-[#f0c110]/30' : 'border-white/10'}`}>
                <View className="flex-row items-center justify-between mb-2">
                  <Pressable
                    onPress={() => {
                      navigation.navigate('StudentPerformance', {
                        student: {
                          id: item.id,
                          name: item.name,
                          className: item.className,
                          rollNo: item.rollNo,
                          feeStatus: item.status,
                          totalFee: item.totalFee,
                          paidAmount: item.paidAmount,
                          balanceDue: item.balanceDue,
                          initials: item.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2),
                        },
                        openProfile: true,
                        studentName: item.name,
                        className: item.className,
                        rollNo: item.rollNo,
                      });
                    }}
                    className="flex-row items-center flex-1 mr-2 active:opacity-70"
                  >
                    <View className={`w-10 h-10 rounded-2xl items-center justify-center mr-3 ${primaryBadgeClass}`}>
                      <Text className={`${primaryTextClass} font-extrabold text-xs`}>
                        {item.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-extrabold text-sm">{item.name}</Text>
                      <Text className={`${primaryTextClass} text-[10px] font-extrabold uppercase mt-0.5`}>{item.className} • Roll #{item.rollNo}</Text>
                    </View>
                  </Pressable>

                  <View className={`px-2.5 py-1 rounded-full border ${item.status === 'Paid' ? primaryBadgeClass :
                      item.status === 'Partial' ? 'bg-amber-500/20 border-amber-500/40' :
                        'bg-rose-500/20 border-rose-500/40'
                    }`}>
                    <Text className={`text-[10px] font-extrabold uppercase ${item.status === 'Paid' ? primaryTextClass :
                        item.status === 'Partial' ? 'text-amber-400' :
                          'text-rose-400'
                      }`}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Ledger Breakdown Details */}
                <View className="bg-black/40 p-3 rounded-2xl border border-white/5 mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-white/50 text-xs">Category:</Text>
                    <Text className="text-white/80 font-bold text-xs">{item.feeCategory || 'Class X ( School Fee )'}</Text>
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-white/50 text-xs">Total Assigned Fee:</Text>
                    <Text className="text-white font-bold text-xs">₹{item.totalFee.toLocaleString()}</Text>
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-white/50 text-xs">Paid Till Date:</Text>
                    <Text className={`${primaryTextClass} font-bold text-xs`}>₹{item.paidAmount.toLocaleString()}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-white/50 text-xs font-bold">Outstanding Due:</Text>
                    <Text className="text-rose-400 font-extrabold text-xs">₹{item.balanceDue.toLocaleString()}</Text>
                  </View>
                </View>

                {/* Action Row */}
                <View className="flex-row justify-between items-center">
                  <Text className="text-white/40 text-[10px]">Last Payment: {item.lastPaymentDate}</Text>

                  <Pressable
                    onPress={() => handleOpenPaymentModal(item)}
                    className={`px-3.5 py-2 rounded-xl flex-row items-center ${item.balanceDue === 0 ? 'bg-white/10' : `${primaryBtnClass} shadow-lg`
                      }`}
                  >
                    <Text className={`text-xs font-extrabold ${item.balanceDue === 0 ? 'text-white/40' : 'text-[#101415]'}`}>
                      {item.balanceDue === 0 ? 'No Dues' : 'Collect Payment'}
                    </Text>
                    <ChevronRight size={14} color={item.balanceDue === 0 ? 'rgba(255,255,255,0.4)' : '#101415'} />
                  </Pressable>
                </View>

              </GlassCard>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Collect Fee Modal */}
      {selectedFeeStudent && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedFeeStudent(null)}>
          <View className="flex-1 bg-black/85 justify-center items-center p-4">
            <View className={`w-full max-w-sm p-5 border rounded-3xl ${isSuperAdmin ? 'border-[#f0c110]/40' : 'border-white/20'}`} style={{ backgroundColor: '#101415' }}>
              <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-white/10">
                <View>
                  <Text className="text-white font-extrabold text-base">{selectedFeeStudent.name}</Text>
                  <Text className={`${primaryTextClass} text-xs font-bold`}>{selectedFeeStudent.className}</Text>
                </View>
                <Pressable onPress={() => setSelectedFeeStudent(null)} className="p-1">
                  <X size={20} color="rgba(255,255,255,0.6)" />
                </Pressable>
              </View>

              <View className="bg-black/60 p-3 rounded-2xl border border-white/10 mb-4">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-white/50 text-xs">Total Assigned Fee:</Text>
                  <Text className="text-white font-bold text-xs">₹{selectedFeeStudent.totalFee.toLocaleString()}</Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-white/50 text-xs">Paid Till Date:</Text>
                  <Text className={`${primaryTextClass} font-bold text-xs`}>₹{selectedFeeStudent.paidAmount.toLocaleString()}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white/50 text-xs font-bold">Outstanding Balance:</Text>
                  <Text className="text-rose-400 font-extrabold text-xs">₹{selectedFeeStudent.balanceDue.toLocaleString()}</Text>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-white/60 text-xs font-bold uppercase mb-1">Collection Amount (₹)</Text>
                <TextInput
                  value={paymentAmountInput}
                  onChangeText={setPaymentAmountInput}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="bg-black/60 border border-white/10 text-white font-extrabold text-base p-3 rounded-xl mb-3"
                />

                <Text className="text-white/60 text-xs font-bold uppercase mb-1">Payment Mode</Text>
                <View className="flex-row mb-3" style={{ gap: 6 }}>
                  {(['Cash', 'UPI', 'Bank Transfer', 'Cheque'] as const).map(mode => (
                    <Pressable
                      key={mode}
                      onPress={() => setPaymentModeInput(mode)}
                      className={`flex-1 py-2 rounded-xl items-center border ${paymentModeInput === mode ? primaryBtnClass : 'bg-white/5 border-white/10'
                        }`}
                    >
                      <Text className={`text-[10px] font-bold ${paymentModeInput === mode ? 'text-[#101415]' : 'text-white/70'}`}>
                        {mode}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text className="text-white/60 text-xs font-bold uppercase mb-1">Reference / Transaction ID</Text>
                <TextInput
                  value={refNoInput}
                  onChangeText={setRefNoInput}
                  placeholder="e.g. UPI8849201"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="bg-black/60 border border-white/10 text-white text-xs p-3 rounded-xl"
                />
              </View>

              <Pressable
                onPress={handleProcessFeePayment}
                className={`w-full py-3.5 ${primaryBtnClass} rounded-xl items-center shadow-lg`}
              >
                <Text className="text-[#101415] font-extrabold text-xs uppercase tracking-wider">Record Collection</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Web-Parity Assign New Fee Modal */}
      {showAssignFeeModal && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowAssignFeeModal(false)}>
          <View className="flex-1 bg-black/85 justify-center items-center p-4">
            <View className={`w-full max-w-md p-5 border rounded-3xl ${isSuperAdmin ? 'border-[#f0c110]/40' : 'border-white/20'}`} style={{ backgroundColor: '#101415' }}>
              <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-white/10">
                <View className="flex-row items-center">
                  <Tag size={18} color={primaryColor} style={{ marginRight: 6 }} />
                  <Text className="text-white font-extrabold text-base">Assign New Fee</Text>
                </View>
                <Pressable onPress={() => setShowAssignFeeModal(false)} className="p-1">
                  <X size={20} color="rgba(255,255,255,0.6)" />
                </Pressable>
              </View>

              <ScrollView className="max-h-[420px]" showsVerticalScrollIndicator={false}>
                {/* 1. Radio Target Selection */}
                <Text className="text-white/60 text-xs font-bold uppercase mb-1.5">Assign Target *</Text>
                <View className="flex-row mb-3" style={{ gap: 8 }}>
                  <Pressable
                    onPress={() => setAssignTargetType('student')}
                    className={`flex-1 py-2.5 rounded-xl items-center border ${assignTargetType === 'student' ? primaryBtnClass : 'bg-white/5 border-white/10'
                      }`}
                  >
                    <Text className={`text-xs font-bold ${assignTargetType === 'student' ? 'text-[#101415]' : 'text-white/70'}`}>
                      Single Student
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setAssignTargetType('class')}
                    className={`flex-1 py-2.5 rounded-xl items-center border ${assignTargetType === 'class' ? primaryBtnClass : 'bg-white/5 border-white/10'
                      }`}
                  >
                    <Text className={`text-xs font-bold ${assignTargetType === 'class' ? 'text-[#101415]' : 'text-white/70'}`}>
                      Whole Class
                    </Text>
                  </Pressable>
                </View>

                {/* Target Dropdown Selection */}
                {assignTargetType === 'student' ? (
                  <View className="mb-3">
                    <View className="mb-2 bg-black/60 border border-white/10 rounded-xl px-3 py-2 flex-row items-center">
                      <Search size={14} color={primaryColor} style={{ marginRight: 6 }} />
                      <TextInput
                        placeholder="Search student by name, roll, or class..."
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={assignStudentSearchQuery}
                        onChangeText={setAssignStudentSearchQuery}
                        className="flex-1 text-white text-xs"
                        style={{ paddingVertical: 0 }}
                      />
                      {assignStudentSearchQuery !== '' && (
                        <Pressable onPress={() => setAssignStudentSearchQuery('')}>
                          <X size={14} color="rgba(255,255,255,0.5)" />
                        </Pressable>
                      )}
                    </View>

                    <Text className="text-white/60 text-xs font-bold uppercase mb-1">Select Student</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row" style={{ gap: 6 }}>
                        {feeRecords
                          .filter(s =>
                            s.name.toLowerCase().includes(assignStudentSearchQuery.toLowerCase()) ||
                            s.className.toLowerCase().includes(assignStudentSearchQuery.toLowerCase()) ||
                            s.rollNo.toLowerCase().includes(assignStudentSearchQuery.toLowerCase())
                          )
                          .map(s => (
                            <Pressable
                              key={s.id}
                              onPress={() => setSelectedStudentForAssign(s.id)}
                              className={`px-3 py-2 rounded-xl border ${selectedStudentForAssign === s.id ? primaryBtnClass : 'bg-black/50 border-white/10'
                                }`}
                            >
                              <Text className={`text-xs font-bold ${selectedStudentForAssign === s.id ? 'text-[#101415]' : 'text-white/80'}`}>
                                {s.name} ({s.className})
                              </Text>
                            </Pressable>
                          ))}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <View className="mb-3">
                    <Text className="text-white/60 text-xs font-bold uppercase mb-1">Select Class (For Bulk Assignment)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row" style={{ gap: 6 }}>
                        {classList.map(cls => (
                          <Pressable
                            key={cls}
                            onPress={() => setSelectedClassForAssign(cls)}
                            className={`px-3 py-2 rounded-xl border ${selectedClassForAssign === cls ? primaryBtnClass : 'bg-black/50 border-white/10'
                              }`}
                          >
                            <Text className={`text-xs font-bold ${selectedClassForAssign === cls ? 'text-[#101415]' : 'text-white/80'}`}>
                              {cls}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* Fee Category Selection */}
                <View className="mb-3">
                  <Text className="text-white/60 text-xs font-bold uppercase mb-1">Fee Category *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row" style={{ gap: 6 }}>
                      {feeCategoryList.map(cat => (
                        <Pressable
                          key={cat}
                          onPress={() => setSelectedCategoryForAssign(cat)}
                          className={`px-3 py-2 rounded-xl border ${selectedCategoryForAssign === cat ? primaryBtnClass : 'bg-black/50 border-white/10'
                            }`}
                        >
                          <Text className={`text-xs font-bold ${selectedCategoryForAssign === cat ? 'text-[#101415]' : 'text-white/80'}`}>
                            {cat}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Amount & Due Date Inputs */}
                <View className="flex-row justify-between mb-3" style={{ gap: 8 }}>
                  <View className="flex-1">
                    <Text className="text-white/60 text-xs font-bold uppercase mb-1">Amount (₹) *</Text>
                    <View className="flex-row items-center">
                      <TextInput
                        value={amountInputAssign}
                        onChangeText={setAmountInputAssign}
                        keyboardType="numeric"
                        className="flex-1 bg-black/60 border border-white/10 text-white font-extrabold text-xs p-2.5 rounded-xl mr-2"
                      />
                      <Pressable
                        onPress={handleAddFeeItemToAssign}
                        className={`${primaryBtnClass} p-2.5 rounded-xl items-center justify-center`}
                      >
                        <Plus size={16} color="#101415" />
                      </Pressable>
                    </View>
                  </View>

                  <View className="flex-1">
                    <Text className="text-white/60 text-xs font-bold uppercase mb-1">Due Date *</Text>
                    <TextInput
                      value={dueDateAssign}
                      onChangeText={setDueDateAssign}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      className="bg-black/60 border border-white/10 text-white text-xs p-2.5 rounded-xl"
                    />
                  </View>
                </View>

                {/* Added Items List */}
                {assignedFeeItems.length > 0 && (
                  <View className="mb-4 bg-black/40 p-3 rounded-2xl border border-white/5">
                    <Text className="text-white/60 text-xs font-bold uppercase mb-2">Items to Assign ({assignedFeeItems.length})</Text>
                    {assignedFeeItems.map((item, idx) => (
                      <View key={idx} className="flex-row justify-between items-center py-1.5 border-b border-white/5">
                        <Text className="text-white font-bold text-xs">{item.category}</Text>
                        <View className="flex-row items-center">
                          <Text className={`${primaryTextClass} font-extrabold text-xs mr-3`}>₹{item.amount.toLocaleString()}</Text>
                          <Pressable onPress={() => setAssignedFeeItems(prev => prev.filter((_, i) => i !== idx))}>
                            <Trash2 size={13} color="#ff516a" />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

              </ScrollView>

              <Pressable
                onPress={handleConfirmAssignFee}
                className={`w-full py-3.5 ${primaryBtnClass} rounded-xl items-center shadow-lg mt-2`}
              >
                <Text className="text-[#101415] font-extrabold text-xs uppercase tracking-wider">Assign Fee Now</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Import Fees Modal */}
      {showImportModal && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowImportModal(false)}>
          <View className="flex-1 bg-black/85 justify-center items-center p-4">
            <View className={`w-full max-w-sm p-5 border rounded-3xl ${isSuperAdmin ? 'border-[#f0c110]/40' : 'border-white/20'}`} style={{ backgroundColor: '#101415' }}>
              <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-white/10">
                <View className="flex-row items-center">
                  <Upload size={18} color={primaryColor} style={{ marginRight: 6 }} />
                  <Text className="text-white font-extrabold text-base">Import Fee Records</Text>
                </View>
                <Pressable onPress={() => setShowImportModal(false)} className="p-1">
                  <X size={20} color="rgba(255,255,255,0.6)" />
                </Pressable>
              </View>

              <View className="mb-5">
                <Text className="text-white/60 text-xs mb-3">Upload CSV or Excel file containing student fee details (Student Name, Roll No, Class, Total Fee, Paid Amount).</Text>

                <Pressable
                  onPress={handlePickImportFile}
                  className={`bg-black/50 border border-dashed p-5 rounded-2xl items-center justify-center ${isSuperAdmin ? 'border-[#f0c110]/50' : 'border-[#00f1a1]/50'}`}
                >
                  <FileSpreadsheet size={28} color={primaryColor} style={{ marginBottom: 6 }} />
                  <Text className="text-white font-bold text-xs">
                    {selectedImportFile ? selectedImportFile.name : 'Tap to Choose CSV/Excel File'}
                  </Text>
                  {selectedImportFile && (
                    <Text className={`${primaryTextClass} text-[10px] mt-1`}>{selectedImportFile.size}</Text>
                  )}
                </Pressable>
              </View>

              <Pressable
                onPress={handleConfirmImportFees}
                disabled={isImporting}
                className={`w-full py-3.5 ${primaryBtnClass} rounded-xl items-center shadow-lg`}
              >
                <Text className="text-[#101415] font-extrabold text-xs uppercase tracking-wider">
                  {isImporting ? 'Importing Records...' : 'Start Fee Import'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Toast Banner */}
      {toastMessage && (
        <View className={`absolute bottom-6 left-5 right-5 ${primaryBtnClass} p-3.5 rounded-2xl flex-row items-center justify-between shadow-2xl`}>
          <View>
            <Text className="text-[#101415] font-extrabold text-xs">{toastMessage.title}</Text>
            <Text className="text-[#101415]/80 text-[10px]">{toastMessage.desc}</Text>
          </View>
          <CheckCircle2 size={18} color="#101415" />
        </View>
      )}
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

export default FeeCollectionScreen;
