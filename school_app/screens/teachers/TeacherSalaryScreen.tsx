import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  Share,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import {
  Wallet,
  TrendingUp,
  FileText,
  Calendar,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  ArrowLeft,
  CreditCard,
  X,
  Share2,
  Printer,
  Sparkles,
  Shield,
  Layers,
  BarChart3,
  Check,
} from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';
import { useAuthStore } from '../../store/useAuthStore';

export interface PayslipItem {
  id: string;
  month: string;
  year: string;
  payDate: string;
  basicPay: number;
  hra?: number;
  specialAllowance?: number;
  grossSalary: number;
  pfDeduction: number;
  taxDeduction: number;
  lopDeduction: number;
  totalDeductions: number;
  netSalary: number;
  paymentMode: string;
  bankAccount: string;
  transactionRef: string;
  status: 'Pending' | 'Disbursed' | 'Processing';
}

const DEFAULT_PAYSLIPS: PayslipItem[] = [
  {
    id: 'SLIP-2026-09',
    month: 'September',
    year: '2026',
    payDate: '01 Oct 2026',
    basicPay: 14300,
    hra: 0,
    specialAllowance: 0,
    grossSalary: 14300,
    pfDeduction: 0,
    taxDeduction: 0,
    lopDeduction: 0,
    totalDeductions: 0,
    netSalary: 14300,
    paymentMode: 'Direct Bank Transfer',
    bankAccount: 'HDFC •••• 4821',
    transactionRef: 'KTS-TXN-984210',
    status: 'Pending',
  },
  {
    id: 'SLIP-2026-08',
    month: 'August',
    year: '2026',
    payDate: '01 Sep 2026',
    basicPay: 14300,
    hra: 0,
    specialAllowance: 0,
    grossSalary: 14300,
    pfDeduction: 0,
    taxDeduction: 0,
    lopDeduction: 0,
    totalDeductions: 0,
    netSalary: 14300,
    paymentMode: 'Direct Bank Transfer',
    bankAccount: 'HDFC •••• 4821',
    transactionRef: 'KTS-TXN-873912',
    status: 'Disbursed',
  },
  {
    id: 'SLIP-2026-07',
    month: 'July',
    year: '2026',
    payDate: '01 Aug 2026',
    basicPay: 14300,
    hra: 0,
    specialAllowance: 0,
    grossSalary: 14300,
    pfDeduction: 0,
    taxDeduction: 0,
    lopDeduction: 0,
    totalDeductions: 0,
    netSalary: 14300,
    paymentMode: 'Direct Bank Transfer',
    bankAccount: 'HDFC •••• 4821',
    transactionRef: 'KTS-TXN-762819',
    status: 'Disbursed',
  },
  {
    id: 'SLIP-2026-06',
    month: 'June',
    year: '2026',
    payDate: '01 Jul 2026',
    basicPay: 14300,
    hra: 0,
    specialAllowance: 0,
    grossSalary: 14300,
    pfDeduction: 0,
    taxDeduction: 0,
    lopDeduction: 0,
    totalDeductions: 0,
    netSalary: 14300,
    paymentMode: 'Direct Bank Transfer',
    bankAccount: 'HDFC •••• 4821',
    transactionRef: 'KTS-TXN-651728',
    status: 'Disbursed',
  },
  {
    id: 'SLIP-2026-05',
    month: 'May',
    year: '2026',
    payDate: '01 Jun 2026',
    basicPay: 14300,
    hra: 0,
    specialAllowance: 0,
    grossSalary: 14300,
    pfDeduction: 0,
    taxDeduction: 0,
    lopDeduction: 0,
    totalDeductions: 0,
    netSalary: 14300,
    paymentMode: 'Direct Bank Transfer',
    bankAccount: 'HDFC •••• 4821',
    transactionRef: 'KTS-TXN-540617',
    status: 'Disbursed',
  },
];

export interface MonthlyTrendPoint {
  id: string;
  month: string;
  year: string;
  netSalary: number;
  grossSalary: number;
  totalDeductions: number;
  status: 'Disbursed' | 'Pending' | 'Processing' | 'Upcoming';
  isPayslipAvailable: boolean;
}

export const FULL_SESSION_TREND_DATA: MonthlyTrendPoint[] = [
  { id: 'TREND-2026-04', month: 'April', year: '2026', netSalary: 13800, grossSalary: 13800, totalDeductions: 0, status: 'Disbursed', isPayslipAvailable: true },
  { id: 'TREND-2026-05', month: 'May', year: '2026', netSalary: 14300, grossSalary: 14300, totalDeductions: 0, status: 'Disbursed', isPayslipAvailable: true },
  { id: 'TREND-2026-06', month: 'June', year: '2026', netSalary: 14300, grossSalary: 14300, totalDeductions: 0, status: 'Disbursed', isPayslipAvailable: true },
  { id: 'TREND-2026-07', month: 'July', year: '2026', netSalary: 13500, grossSalary: 14300, totalDeductions: 800, status: 'Disbursed', isPayslipAvailable: true },
  { id: 'TREND-2026-08', month: 'August', year: '2026', netSalary: 14300, grossSalary: 14300, totalDeductions: 0, status: 'Disbursed', isPayslipAvailable: true },
  { id: 'TREND-2026-09', month: 'September', year: '2026', netSalary: 14300, grossSalary: 14300, totalDeductions: 0, status: 'Pending', isPayslipAvailable: true },
  { id: 'TREND-2026-10', month: 'October', year: '2026', netSalary: 14300, grossSalary: 14300, totalDeductions: 0, status: 'Upcoming', isPayslipAvailable: false },
  { id: 'TREND-2026-11', month: 'November', year: '2026', netSalary: 14300, grossSalary: 14300, totalDeductions: 0, status: 'Upcoming', isPayslipAvailable: false },
  { id: 'TREND-2026-12', month: 'December', year: '2026', netSalary: 14300, grossSalary: 14300, totalDeductions: 0, status: 'Upcoming', isPayslipAvailable: false },
  { id: 'TREND-2027-01', month: 'January', year: '2027', netSalary: 14300, grossSalary: 14300, totalDeductions: 0, status: 'Upcoming', isPayslipAvailable: false },
  { id: 'TREND-2027-02', month: 'February', year: '2027', netSalary: 14300, grossSalary: 14300, totalDeductions: 0, status: 'Upcoming', isPayslipAvailable: false },
  { id: 'TREND-2027-03', month: 'March', year: '2027', netSalary: 14300, grossSalary: 14300, totalDeductions: 0, status: 'Upcoming', isPayslipAvailable: false },
];

export const getStatusColor = (status: PayslipItem['status'] | 'Upcoming') => {
  switch (status) {
    case 'Disbursed':
      return '#00f1a1'; // Emerald Green for Credited
    case 'Processing':
      return '#38bdf8'; // Sky Blue for Processing
    case 'Upcoming':
      return 'rgba(221, 183, 255, 0.6)'; // Translucent Purple for Upcoming
    case 'Pending':
    default:
      return '#fbbf24'; // Amber Yellow/Gold for Pending / Uncredited
  }
};

export const getStatusBadgeStyle = (status: PayslipItem['status']) => {
  switch (status) {
    case 'Disbursed':
      return {
        bg: 'rgba(52, 211, 153, 0.15)',
        border: 'rgba(52, 211, 153, 0.4)',
        text: '#34d399',
        label: 'Credited',
      };
    case 'Processing':
      return {
        bg: 'rgba(56, 189, 248, 0.15)',
        border: 'rgba(56, 189, 248, 0.4)',
        text: '#38bdf8',
        label: 'Processing',
      };
    case 'Pending':
    default:
      return {
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.4)',
        text: '#fbbf24',
        label: 'Pending',
      };
  }
};

export const TeacherSalaryScreen: React.FC<any> = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { headerPaddingTop, tabBarBottomPadding } = useResponsive();
  const { user } = useAuthStore();

  const [payslips] = useState<PayslipItem[]>(DEFAULT_PAYSLIPS);
  const [selectedSlip, setSelectedSlip] = useState<PayslipItem | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026-2027 (Current)');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('All Months');
  const [expandedSlipIds, setExpandedSlipIds] = useState<string[]>([]);

  // Modals
  const [showAcademicYearModal, setShowAcademicYearModal] = useState(false);
  const [showMonthFilterModal, setShowMonthFilterModal] = useState(false);

  const teacherName = user?.name || 'Sheeren Sultana';
  const teacherRole = user?.designation || 'Teacher';

  const toggleExpandSlip = (id: string) => {
    setExpandedSlipIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Filtered payslips based on Month filter
  const filteredPayslips = useMemo(() => {
    if (selectedMonthFilter === 'All Months') return payslips;
    return payslips.filter((p) => `${p.month} ${p.year}` === selectedMonthFilter || p.month === selectedMonthFilter);
  }, [payslips, selectedMonthFilter]);

  const latestSlip = payslips[0] || DEFAULT_PAYSLIPS[0];
  const paidSlipsCount = payslips.filter((p) => p.status === 'Disbursed').length;
  const ytdPaidAmount = payslips
    .filter((p) => p.status === 'Disbursed')
    .reduce((sum, p) => sum + p.netSalary, 0);
  const totalActiveDeductions = latestSlip.totalDeductions;

  // Dynamic Calculation for 12-Month Net Pay Trend Graph
  const maxTrendSalary = useMemo(() => {
    const maxVal = Math.max(...FULL_SESSION_TREND_DATA.map((d) => d.netSalary), 10000);
    if (maxVal <= 16000) return 16000;
    if (maxVal <= 25000) return Math.ceil(maxVal / 5000) * 5000;
    if (maxVal <= 50000) return Math.ceil(maxVal / 5000) * 5000;
    return Math.ceil(maxVal / 10000) * 10000;
  }, []);

  const yAxisTicks = useMemo(() => {
    const step = maxTrendSalary / 4;
    return [
      maxTrendSalary,
      maxTrendSalary - step,
      maxTrendSalary - step * 2,
      maxTrendSalary - step * 3,
      0,
    ];
  }, [maxTrendSalary]);

  const formatCurrencyK = (val: number) => {
    if (val === 0) return '₹0';
    if (val >= 1000) {
      const k = val / 1000;
      return `₹${k % 1 === 0 ? k : k.toFixed(1)}k`;
    }
    return `₹${val}`;
  };

  const handleShareSlip = async (slip: PayslipItem) => {
    try {
      await Share.share({
        title: `Salary Payslip - ${slip.month} ${slip.year}`,
        message: `Krishnaveni Talent School\nNizamabad, Telangana • Salary Payslip\nEmployee: ${teacherName} (${teacherRole})\nPeriod: ${slip.month} ${slip.year}\nNet In-Hand: ₹${slip.netSalary.toLocaleString('en-IN')}\nStatus: ${slip.status}`,
      });
    } catch (_) {}
  };

  const handleBack = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Dashboard');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#22143d', '#150d26', '#0b0912', '#08070d']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header with Back button, Title & Academic Year Dropdown */}
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop }]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {navigation?.canGoBack?.() && (
              <Pressable
                onPress={handleBack}
                style={styles.backButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={20} color="#ddb7ff" />
              </Pressable>
            )}

            <View style={styles.headerTitleGroup}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitleText} numberOfLines={1}>
                  My Salary & Payslips
                </Text>
                <View style={styles.headerBadge}>
                  <Shield size={10} color="#34d399" style={{ marginRight: 3 }} />
                  <Text style={styles.headerBadgeText}>Faculty Portal</Text>
                </View>
              </View>

              <Pressable
                onPress={() => setShowAcademicYearModal(true)}
                style={styles.academicYearRow}
              >
                <View style={styles.liveIndicator} />
                <Text style={styles.academicYearText} numberOfLines={1}>
                  Academic Year: {selectedAcademicYear}
                </Text>
                <ChevronDown size={13} color="#ddb7ff" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(tabBarBottomPadding + 40, 100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO BANNER: MY PAYROLL DASHBOARD */}
        <View style={styles.heroBanner}>
          <LinearGradient
            colors={['#581c87', '#6b21a8', '#4c1d95']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroBackgroundIcon}>
            <Wallet size={80} color="rgba(255,255,255,0.08)" />
          </View>
          <View style={styles.heroContent}>
            <View className="flex-row items-center justify-between">
              <Text style={styles.heroSubtitle}>PAYROLL MANAGEMENT</Text>
              <View className="flex-row items-center">
                <Text className="text-white/80 text-xs font-bold mr-1.5">{teacherName}</Text>
                <View className="bg-white/20 px-2 py-0.5 rounded-md">
                  <Text className="text-[#ddb7ff] text-[10px] font-extrabold">{teacherRole}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.heroTitle}>My Payroll Dashboard</Text>
            <Text style={styles.heroDesc}>
              View your current salary structure, monthly payslips, and tax details.
            </Text>
          </View>
        </View>

        {/* MONTH FILTER BAR */}
        <View style={styles.filterBarRow}>
          <Text style={styles.filterBarLabel}>Filter Statements:</Text>
          <Pressable
            onPress={() => setShowMonthFilterModal(true)}
            style={styles.monthFilterDropdown}
          >
            <Calendar size={13} color="#ddb7ff" style={{ marginRight: 6 }} />
            <Text style={styles.monthFilterText}>Month: {selectedMonthFilter}</Text>
            <ChevronDown size={13} color="#ddb7ff" style={{ marginLeft: 6 }} />
          </Pressable>
        </View>

        {/* 1. TOP 3 KPI SUMMARY CARDS (Matching Web Dashboard) */}
        <View style={styles.kpiRow}>
          {/* Card 1: Latest Net Salary */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.35)' }]}>
              <Wallet size={16} color="#38bdf8" />
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.kpiLabel}>
              Latest Net Salary
            </Text>
            <Text style={styles.kpiValue}>₹{latestSlip.netSalary.toLocaleString('en-IN')}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.kpiSub, { color: '#38bdf8' }]}>
              Gross with active components
            </Text>
          </View>

          {/* Card 2: Year to Date Paid */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.35)' }]}>
              <TrendingUp size={16} color="#34d399" />
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.kpiLabel}>
              Year to Date Paid
            </Text>
            <Text style={styles.kpiValue}>₹{ytdPaidAmount.toLocaleString('en-IN')}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.kpiSub, { color: '#34d399' }]}>
              {paidSlipsCount} paid payslip(s)
            </Text>
          </View>

          {/* Card 3: Total Active Deductions */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.35)' }]}>
              <FileText size={16} color="#fb7185" />
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.kpiLabel}>
              Total Active Deductions
            </Text>
            <Text style={styles.kpiValue}>₹{totalActiveDeductions.toLocaleString('en-IN')}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.kpiSub, { color: '#fb7185' }]}>
              PF, TDS, and basic deductions
            </Text>
          </View>
        </View>

        {/* 2. ACTIVE SALARY STRUCTURE CARD (Matching Web) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <View className="flex-row items-center">
              <Layers size={17} color="#ddb7ff" style={{ marginRight: 8 }} />
              <Text style={styles.sectionCardTitle}>Active Salary Structure</Text>
            </View>
            <View style={styles.activeTagBadge}>
              <Text style={styles.activeTagText}>Active</Text>
            </View>
          </View>

          <View style={styles.salaryStructureRow}>
            <View>
              <Text style={styles.structureItemTitle}>Basic</Text>
              <Text style={styles.structureItemType}>EARNING</Text>
            </View>
            <Text style={styles.structureItemAmount}>
              ₹{latestSlip.basicPay.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Highlight Net Box */}
          <View style={styles.activeNetHighlightBox}>
            <Text style={styles.activeNetHighlightLabel}>Active Net (Monthly)</Text>
            <Text style={styles.activeNetHighlightValue}>
              ₹{latestSlip.netSalary.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* 3. NET PAY TREND VISUAL GRAPH (12 Months Dynamic Horizontal Scroll) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <View className="flex-row items-center">
              <BarChart3 size={17} color="#34d399" style={{ marginRight: 8 }} />
              <Text style={styles.sectionCardTitle}>Net Pay Trend</Text>
            </View>
            <View style={styles.trendBadge}>
              <Text style={styles.trendBadgeText}>12 Months • Swipe ➔</Text>
            </View>
          </View>

          {/* Dynamic Bar Graph Component with Horizontal Scroll */}
          <View style={styles.chartContainer}>
            {/* Horizontal Dynamic Y-Axis values */}
            <View style={styles.chartYAxisContainer}>
              {yAxisTicks.map((tick, index) => (
                <Text key={index} style={styles.chartAxisText}>
                  {formatCurrencyK(tick)}
                </Text>
              ))}
            </View>

            {/* Bars Area with Horizontal Scroll & Grid Lines */}
            <View style={styles.chartBarsArea}>
              {/* Grid Lines spanning horizontally */}
              <View style={[styles.chartGridLine, { top: 0 }]} />
              <View style={[styles.chartGridLine, { top: 25 }]} />
              <View style={[styles.chartGridLine, { top: 50 }]} />
              <View style={[styles.chartGridLine, { top: 75 }]} />
              <View style={[styles.chartGridLine, { top: 100 }]} />

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.barsScrollContent}
              >
                {FULL_SESSION_TREND_DATA.map((p) => {
                  const isDisbursed = p.status === 'Disbursed';
                  const isPending = p.status === 'Pending';
                  const isProcessing = p.status === 'Processing';
                  const isUpcoming = p.status === 'Upcoming';

                  const barColor: [string, string] = isDisbursed
                    ? ['#00f1a1', '#059669']
                    : isProcessing
                    ? ['#38bdf8', '#0284c7']
                    : isPending
                    ? ['#fbbf24', '#d97706']
                    : ['rgba(221, 183, 255, 0.35)', 'rgba(221, 183, 255, 0.1)'];

                  const pct = Math.min(100, Math.max(10, Math.round((p.netSalary / maxTrendSalary) * 100)));

                  return (
                    <View key={p.id} style={styles.singleBarGroup}>
                      {/* Amount Badge on Top */}
                      <View style={styles.barAmountPill}>
                        <Text
                          style={[
                            styles.barAmountText,
                            {
                              color: isDisbursed
                                ? '#00f1a1'
                                : isPending
                                ? '#fbbf24'
                                : isProcessing
                                ? '#38bdf8'
                                : 'rgba(255,255,255,0.4)',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {isUpcoming ? '-' : formatCurrencyK(p.netSalary)}
                        </Text>
                      </View>

                      {/* Bar Track & Fill */}
                      <View style={styles.barTrack}>
                        <LinearGradient
                          colors={barColor}
                          style={[styles.barFill, { height: `${pct}%` }]}
                        />
                      </View>

                      {/* Month Name */}
                      <Text
                        style={[
                          styles.barLabelText,
                          (isDisbursed || isPending) && { color: '#ffffff', fontWeight: '800' },
                        ]}
                        numberOfLines={1}
                      >
                        {p.month.slice(0, 3)}
                      </Text>

                      {/* Year Sub */}
                      <Text style={styles.barYearSub}>
                        '{p.year.slice(2)}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* 4. MY PAYSLIPS HISTORY (Previous Version Style with Status Colors & Expandable Dropdown) */}
        <View style={styles.historyCardContainer}>
          <View style={styles.historyCardHeader}>
            <Text style={styles.historyHeading}>Payslip History</Text>
            <Text style={styles.historySessionBadge}>SESSION 2026-27</Text>
          </View>

          <View style={styles.historyListContainer}>
            {filteredPayslips.map((slip, idx) => {
              const isExpanded = expandedSlipIds.includes(slip.id);
              const statusColor = getStatusColor(slip.status);
              const badgeStyle = getStatusBadgeStyle(slip.status);

              return (
                <View
                  key={slip.id}
                  style={[
                    styles.historyItemWrapper,
                    idx < filteredPayslips.length - 1 && styles.historyItemBorder,
                  ]}
                >
                  {/* Main Summary Row */}
                  <Pressable
                    onPress={() => toggleExpandSlip(slip.id)}
                    style={styles.historyItemRow}
                  >
                    <View style={styles.historyLeftGroup}>
                      <View style={styles.historyCalendarIconBox}>
                        <Calendar size={18} color="#ddb7ff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyMonthTitle}>
                          {slip.month} {slip.year}
                        </Text>
                        <Text
                          style={[
                            styles.historyCreditedText,
                            slip.status === 'Pending'
                              ? { color: '#fbbf24' }
                              : slip.status === 'Processing'
                              ? { color: '#38bdf8' }
                              : undefined,
                          ]}
                          numberOfLines={1}
                        >
                          {slip.status === 'Disbursed'
                            ? `Credited: ${slip.payDate} • ${slip.bankAccount}`
                            : slip.status === 'Processing'
                            ? `Status: Processing • ${slip.bankAccount}`
                            : `Status: Pending (Uncredited) • ${slip.bankAccount}`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.historyRightGroup}>
                      <Text style={[styles.historyAmountText, { color: statusColor }]}>
                        ₹{slip.netSalary.toLocaleString('en-IN')}
                      </Text>
                      <View style={styles.viewDetailsBtn}>
                        <Text style={styles.viewDetailsText}>VIEW DETAILS</Text>
                        {isExpanded ? (
                          <ChevronDown size={12} color="rgba(255,255,255,0.6)" />
                        ) : (
                          <ChevronRight size={12} color="rgba(255,255,255,0.6)" />
                        )}
                      </View>
                    </View>
                  </Pressable>

                  {/* Expandable Dropdown Details Box */}
                  {isExpanded && (
                    <View style={styles.dropdownDetailsBox}>
                      <View style={styles.dropdownDetailsGrid}>
                        {/* Gross Salary */}
                        <View style={styles.dropdownDetailItem}>
                          <Text style={styles.dropdownDetailLabel}>Gross Salary</Text>
                          <Text style={styles.dropdownDetailValue}>
                            ₹{slip.grossSalary.toLocaleString('en-IN')}
                          </Text>
                        </View>

                        {/* Deductions */}
                        <View style={styles.dropdownDetailItem}>
                          <Text style={styles.dropdownDetailLabel}>Deductions</Text>
                          <Text style={[styles.dropdownDetailValue, { color: '#fb7185' }]}>
                            -₹{slip.totalDeductions.toLocaleString('en-IN')}
                          </Text>
                        </View>

                        {/* Net Pay (Colored based on status) */}
                        <View style={styles.dropdownDetailItem}>
                          <Text style={styles.dropdownDetailLabel}>Net Pay</Text>
                          <Text style={[styles.dropdownDetailValue, { color: statusColor, fontWeight: '900' }]}>
                            ₹{slip.netSalary.toLocaleString('en-IN')}
                          </Text>
                        </View>

                        {/* Status Badge */}
                        <View style={styles.dropdownDetailItem}>
                          <Text style={styles.dropdownDetailLabel}>Status</Text>
                          <View
                            style={[
                              styles.statusPill,
                              {
                                backgroundColor: badgeStyle.bg,
                                borderColor: badgeStyle.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                { color: badgeStyle.text },
                              ]}
                            >
                              {slip.status === 'Disbursed' ? 'Credited' : slip.status}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Action: View Full Payslip Modal */}
                      <Pressable
                        onPress={() => setSelectedSlip(slip)}
                        style={styles.dropdownActionBtn}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <FileText size={14} color="#ddb7ff" style={{ marginRight: 6 }} />
                        <Text style={styles.dropdownActionBtnText}>View Full Payslip Statement</Text>
                        <ChevronRight size={14} color="#ddb7ff" style={{ marginLeft: 4 }} />
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* 5. SALARY ACCOUNT & BANK DETAILS (Preserved for completeness) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Salary Account Details</Text>
          <View style={{ gap: 10, marginTop: 12 }}>
            <View style={styles.bankDetailRow}>
              <Text style={styles.bankDetailLabel}>Bank Name</Text>
              <Text style={styles.bankDetailValue}>HDFC Bank Ltd.</Text>
            </View>
            <View style={styles.bankDetailRow}>
              <Text style={styles.bankDetailLabel}>Account Number</Text>
              <Text style={[styles.bankDetailValue, { color: '#ddb7ff' }]}>XXXX-XXXX-4821</Text>
            </View>
            <View style={styles.bankDetailRow}>
              <Text style={styles.bankDetailLabel}>IFSC Code</Text>
              <Text style={styles.bankDetailValue}>HDFC0001928</Text>
            </View>
            <View style={styles.bankDetailRow}>
              <Text style={styles.bankDetailLabel}>PAN Reference</Text>
              <Text style={styles.bankDetailValue}>ABCDE1234F</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ========================================================================= */}
      {/* PAYSLIP DETAILS MODAL (Matching Screenshot 2) */}
      {/* ========================================================================= */}
      {selectedSlip && (
        <Modal
          visible={!!selectedSlip}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedSlip(null)}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setSelectedSlip(null)} />
            <View style={styles.payslipModalContainer}>
              {/* Modal Top Bar */}
              <View style={styles.payslipModalHeader}>
                <View>
                  <Text style={styles.payslipModalTitle}>Payslip Details</Text>
                  <Text style={styles.payslipModalSub}>
                    {selectedSlip.month} {selectedSlip.year}
                  </Text>
                </View>

                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <Pressable
                    onPress={() => handleShareSlip(selectedSlip)}
                    style={styles.printActionBtn}
                  >
                    <Printer size={14} color="#ddb7ff" style={{ marginRight: 4 }} />
                    <Text style={styles.printActionBtnText}>Print</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedSlip(null)}
                    style={styles.modalCloseBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={18} color="rgba(255,255,255,0.7)" />
                  </Pressable>
                </View>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 18 }}
              >
                {/* School Header & Crest */}
                <View style={styles.schoolHeaderBox}>
                  <View style={styles.schoolLogoCircle}>
                    <Shield size={24} color="#ddb7ff" />
                  </View>
                  <Text style={styles.schoolNameText}>Krishnaveni Talent School</Text>
                  <Text style={styles.schoolAddressText}>
                    Nizamabad, Telangana • Salary Payslip
                  </Text>
                  <Text style={styles.schoolPeriodText}>
                    {selectedSlip.month} {selectedSlip.year}
                  </Text>
                </View>

                {/* 2x2 Employee Info Grid (Matching Screenshot 2) */}
                <View style={styles.employeeInfoGrid}>
                  {/* Row 1 */}
                  <View style={styles.employeeInfoRow}>
                    <View style={styles.employeeInfoBox}>
                      <Text style={styles.employeeInfoLabel}>Employee Name</Text>
                      <Text style={styles.employeeInfoValue}>{teacherName}</Text>
                    </View>
                    <View style={styles.employeeInfoBox}>
                      <Text style={styles.employeeInfoLabel}>Role/Designation</Text>
                      <Text style={styles.employeeInfoValue}>{teacherRole}</Text>
                    </View>
                  </View>

                  {/* Row 2 */}
                  <View style={styles.employeeInfoRow}>
                    <View style={styles.employeeInfoBox}>
                      <Text style={styles.employeeInfoLabel}>Pay Month</Text>
                      <Text style={styles.employeeInfoValue}>
                        {selectedSlip.month} {selectedSlip.year}
                      </Text>
                    </View>
                    <View style={styles.employeeInfoBox}>
                      <Text style={styles.employeeInfoLabel}>Payment Status</Text>
                      <Text
                        style={[
                          styles.employeeInfoValue,
                          { color: getStatusColor(selectedSlip.status), fontWeight: '900' },
                        ]}
                      >
                        {selectedSlip.status === 'Disbursed' ? 'Credited (Disbursed)' : selectedSlip.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Earnings Breakdown */}
                <View style={styles.earningsSection}>
                  <Text style={styles.earningsSectionTitle}>Earnings</Text>
                  <View style={styles.earningsRow}>
                    <Text style={styles.earningsItemLabel}>Basic</Text>
                    <Text style={styles.earningsItemValue}>
                      ₹{selectedSlip.basicPay.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={[styles.earningsRow, styles.grossRow]}>
                    <Text style={styles.grossLabel}>Gross</Text>
                    <Text style={styles.grossValue}>
                      ₹{selectedSlip.grossSalary.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Net In-Hand Highlight Box (Matching Status Color) */}
                <View
                  style={[
                    styles.netInHandBox,
                    {
                      backgroundColor:
                        selectedSlip.status === 'Disbursed'
                          ? 'rgba(52, 211, 153, 0.12)'
                          : selectedSlip.status === 'Processing'
                          ? 'rgba(56, 189, 248, 0.12)'
                          : 'rgba(245, 158, 11, 0.12)',
                      borderColor:
                        selectedSlip.status === 'Disbursed'
                          ? 'rgba(52, 211, 153, 0.35)'
                          : selectedSlip.status === 'Processing'
                          ? 'rgba(56, 189, 248, 0.35)'
                          : 'rgba(245, 158, 11, 0.35)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.netInHandLabel,
                      { color: getStatusColor(selectedSlip.status) },
                    ]}
                  >
                    {selectedSlip.status === 'Disbursed'
                      ? 'Net In-Hand (Credited)'
                      : `Net In-Hand (${selectedSlip.status})`}
                  </Text>
                  <Text
                    style={[
                      styles.netInHandValue,
                      { color: getStatusColor(selectedSlip.status) },
                    ]}
                  >
                    ₹{selectedSlip.netSalary.toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Close Button */}
                <Pressable
                  onPress={() => setSelectedSlip(null)}
                  style={styles.payslipCloseBtn}
                >
                  <Text style={styles.payslipCloseBtnText}>Close</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* ACADEMIC YEAR MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={showAcademicYearModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAcademicYearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAcademicYearModal(false)} />
          <View style={styles.pickerModalBox}>
            <View style={styles.pickerModalHeader}>
              <View className="flex-row items-center">
                <Sparkles size={18} color="#ddb7ff" style={{ marginRight: 8 }} />
                <Text style={styles.pickerModalTitle}>Select Academic Year</Text>
              </View>
              <Pressable onPress={() => setShowAcademicYearModal(false)}>
                <X size={18} color="#fff" />
              </Pressable>
            </View>
            <View style={{ gap: 6, paddingTop: 4 }}>
              {['2026-2027 (Current)', '2025-2026', '2024-2025'].map((yr) => (
                <Pressable
                  key={yr}
                  onPress={() => {
                    setSelectedAcademicYear(yr);
                    setShowAcademicYearModal(false);
                  }}
                  style={[
                    styles.pickerOptionItem,
                    selectedAcademicYear === yr && styles.pickerOptionItemActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedAcademicYear === yr && styles.pickerOptionTextActive,
                    ]}
                  >
                    {yr}
                  </Text>
                  {selectedAcademicYear === yr && <Check size={18} color="#ddb7ff" />}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MONTH FILTER MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={showMonthFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowMonthFilterModal(false)} />
          <View style={styles.pickerModalBox}>
            <View style={styles.pickerModalHeader}>
              <View className="flex-row items-center">
                <Calendar size={18} color="#ddb7ff" style={{ marginRight: 8 }} />
                <Text style={styles.pickerModalTitle}>Filter by Month</Text>
              </View>
              <Pressable onPress={() => setShowMonthFilterModal(false)}>
                <X size={18} color="#fff" />
              </Pressable>
            </View>
            <View style={{ gap: 6, paddingTop: 4 }}>
              {['All Months', 'September 2026', 'August 2026'].map((m) => (
                <Pressable
                  key={m}
                  onPress={() => {
                    setSelectedMonthFilter(m);
                    setShowMonthFilterModal(false);
                  }}
                  style={[
                    styles.pickerOptionItem,
                    selectedMonthFilter === m && styles.pickerOptionItemActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedMonthFilter === m && styles.pickerOptionTextActive,
                    ]}
                  >
                    {m}
                  </Text>
                  {selectedMonthFilter === m && <Check size={18} color="#ddb7ff" />}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08070d',
  },
  headerContainer: {
    zIndex: 50,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  headerBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  academicYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00f1a1',
    marginRight: 4,
  },
  academicYearText: {
    color: '#ddb7ff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroBanner: {
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
  },
  heroBackgroundIcon: {
    position: 'absolute',
    right: -10,
    bottom: -15,
  },
  heroContent: {
    zIndex: 2,
  },
  heroSubtitle: {
    color: '#ddb7ff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 4,
    marginBottom: 6,
  },
  heroDesc: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  filterBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  filterBarLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  monthFilterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181524',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  monthFilterText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#181524',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  kpiValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  kpiSub: {
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 12,
  },
  sectionCard: {
    backgroundColor: '#181524',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.18)',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionCardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  activeTagBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeTagText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },
  salaryStructureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  structureItemTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  structureItemType: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 1,
  },
  structureItemAmount: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  activeNetHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
  },
  activeNetHighlightLabel: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
  },
  activeNetHighlightValue: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '900',
  },
  trendBadge: {
    backgroundColor: 'rgba(221, 183, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendBadgeText: {
    color: '#ddb7ff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 165,
    marginTop: 8,
  },
  chartYAxisContainer: {
    width: 44,
    height: 122,
    justifyContent: 'space-between',
    paddingRight: 6,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  chartAxisText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'right',
  },
  chartBarsArea: {
    flex: 1,
    position: 'relative',
    height: '100%',
  },
  chartGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  barsScrollContent: {
    paddingHorizontal: 8,
    alignItems: 'flex-start',
    height: '100%',
  },
  singleBarGroup: {
    alignItems: 'center',
    width: 50,
    marginHorizontal: 3,
  },
  barAmountPill: {
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  barAmountText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  barTrack: {
    width: 22,
    height: 100,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barLabelText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },
  barYearSub: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 8.5,
    fontWeight: '600',
    marginTop: 1,
  },
  resultsCount: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  historyCardContainer: {
    backgroundColor: '#181524',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.18)',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  historyHeading: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  historySessionBadge: {
    color: '#ddb7ff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyListContainer: {
    gap: 2,
  },
  historyItemWrapper: {
    paddingVertical: 12,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  historyCalendarIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyMonthTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  historyCreditedText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  historyRightGroup: {
    alignItems: 'flex-end',
  },
  historyAmountText: {
    color: '#00f1a1',
    fontSize: 16,
    fontWeight: '900',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 3,
  },
  viewDetailsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dropdownDetailsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.15)',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  dropdownDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  dropdownDetailItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  dropdownDetailLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  dropdownDetailValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  dropdownActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(221, 183, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.3)',
    borderRadius: 10,
    paddingVertical: 9,
  },
  dropdownActionBtnText: {
    color: '#ddb7ff',
    fontSize: 11,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bankDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankDetailLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  bankDetailValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    position: 'absolute',
    inset: 0,
  },
  payslipModalContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#181524',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
    overflow: 'hidden',
    maxHeight: '92%',
  },
  payslipModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  payslipModalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  payslipModalSub: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  printActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(221, 183, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  printActionBtnText: {
    color: '#ddb7ff',
    fontSize: 11,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolHeaderBox: {
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  schoolLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(221, 183, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(221, 183, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  schoolNameText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  schoolAddressText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  schoolPeriodText: {
    color: '#ddb7ff',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  employeeInfoGrid: {
    gap: 8,
    marginBottom: 16,
  },
  employeeInfoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  employeeInfoBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 10,
  },
  employeeInfoLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 3,
  },
  employeeInfoValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  earningsSection: {
    marginBottom: 16,
  },
  earningsSectionTitle: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  earningsItemLabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    fontWeight: '600',
  },
  earningsItemValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  grossRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
    marginTop: 4,
  },
  grossLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  grossValue: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '900',
  },
  netInHandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  netInHandLabel: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '900',
  },
  netInHandValue: {
    color: '#38bdf8',
    fontSize: 22,
    fontWeight: '900',
  },
  payslipCloseBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payslipCloseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  pickerModalBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#181524',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(221, 183, 255, 0.25)',
    padding: 16,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  pickerModalTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  pickerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerOptionItemActive: {
    backgroundColor: 'rgba(221, 183, 255, 0.12)',
  },
  pickerOptionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  pickerOptionTextActive: {
    color: '#ddb7ff',
    fontWeight: '900',
  },
});

export default TeacherSalaryScreen;
