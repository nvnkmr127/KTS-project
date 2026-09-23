import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import {
  Wallet,
  TrendingUp,
  FileText,
  Download,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronLeft,
  DollarSign,
  Building,
  CreditCard,
  X,
  Share2,
  AlertCircle,
} from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

export interface PayslipItem {
  id: string;
  month: string;
  year: string;
  payDate: string;
  basicPay: number;
  hra: number;
  specialAllowance: number;
  grossSalary: number;
  pfDeduction: number;
  taxDeduction: number;
  lopDeduction: number;
  totalDeductions: number;
  netSalary: number;
  paymentMode: string;
  bankAccount: string;
  transactionRef: string;
  status: 'Disbursed' | 'Processing' | 'On Hold';
}

const MOCK_PAYSLIPS: PayslipItem[] = [
  {
    id: 'SLIP-2026-08',
    month: 'August',
    year: '2026',
    payDate: '01 Sep 2026',
    basicPay: 28000,
    hra: 11200,
    specialAllowance: 5800,
    grossSalary: 45000,
    pfDeduction: 1800,
    taxDeduction: 1200,
    lopDeduction: 0,
    totalDeductions: 3000,
    netSalary: 42000,
    paymentMode: 'Direct Bank Transfer',
    bankAccount: 'HDFC •••• 4821',
    transactionRef: 'KTS-TXN-984210',
    status: 'Disbursed',
  },
  {
    id: 'SLIP-2026-07',
    month: 'July',
    year: '2026',
    payDate: '01 Aug 2026',
    basicPay: 28000,
    hra: 11200,
    specialAllowance: 5800,
    grossSalary: 45000,
    pfDeduction: 1800,
    taxDeduction: 1200,
    lopDeduction: 1500,
    totalDeductions: 4500,
    netSalary: 40500,
    paymentMode: 'Direct Bank Transfer',
    bankAccount: 'HDFC •••• 4821',
    transactionRef: 'KTS-TXN-873912',
    status: 'Disbursed',
  },
  {
    id: 'SLIP-2026-06',
    month: 'June',
    year: '2026',
    payDate: '01 Jul 2026',
    basicPay: 28000,
    hra: 11200,
    specialAllowance: 5800,
    grossSalary: 45000,
    pfDeduction: 1800,
    taxDeduction: 1200,
    lopDeduction: 0,
    totalDeductions: 3000,
    netSalary: 42000,
    paymentMode: 'Direct Bank Transfer',
    bankAccount: 'HDFC •••• 4821',
    transactionRef: 'KTS-TXN-762901',
    status: 'Disbursed',
  },
  {
    id: 'SLIP-2026-05',
    month: 'May',
    year: '2026',
    payDate: '01 Jun 2026',
    basicPay: 28000,
    hra: 11200,
    specialAllowance: 5800,
    grossSalary: 45000,
    pfDeduction: 1800,
    taxDeduction: 1200,
    lopDeduction: 0,
    totalDeductions: 3000,
    netSalary: 42000,
    paymentMode: 'Direct Bank Transfer',
    bankAccount: 'HDFC •••• 4821',
    transactionRef: 'KTS-TXN-651890',
    status: 'Disbursed',
  },
];

export const TeacherSalaryScreen: React.FC<any> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { headerPaddingTop, scrollBottomPadding } = useResponsive();
  const { user } = useAuthStore();

  const [payslips, setPayslips] = useState<PayslipItem[]>(MOCK_PAYSLIPS);
  const [selectedSlip, setSelectedSlip] = useState<PayslipItem | null>(null);
  const [selectedYear, setSelectedYear] = useState('2026-2027');
  const [loading, setLoading] = useState(false);

  const currentSlip = payslips[0] || MOCK_PAYSLIPS[0];
  const ytdEarnings = payslips.reduce((sum, p) => sum + p.netSalary, 0);
  const avgMonthly = Math.round(ytdEarnings / (payslips.length || 1));

  const handleShareSlip = async (slip: PayslipItem) => {
    try {
      await Share.share({
        title: `Salary Payslip - ${slip.month} ${slip.year}`,
        message: `Krishnaveni Talent School\nSalary Payslip for ${user?.name || 'Faculty Member'}\nPeriod: ${slip.month} ${slip.year}\nNet Disbursed: ₹${slip.netSalary.toLocaleString('en-IN')}\nStatus: ${slip.status}\nRef: ${slip.transactionRef}`,
      });
    } catch (_) {}
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

      {/* Header */}
      <View style={{ zIndex: 50 }}>
        <BlurView intensity={35} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-10 h-10 rounded-xl bg-[#ddb7ff]/20 border border-[#ddb7ff]/40 items-center justify-center">
              <Wallet size={20} color="#ddb7ff" />
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-white font-extrabold text-xl">
                My Salary & Payslips
              </Text>
              <Text numberOfLines={1} className="text-white/60 text-xs font-semibold mt-0.5">
                Faculty Remuneration & Statements
              </Text>
            </View>
          </View>
        </BlurView>

        <LinearGradient
          colors={['rgba(221, 183, 255, 0.18)', 'transparent']}
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. CURRENT MONTH SALARY HERO CARD */}
        <View className="mb-6">
          <LinearGradient
            colors={['#271747', '#1c1033', '#130a24']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-5 rounded-3xl border border-[#ddb7ff]/30 relative overflow-hidden shadow-2xl"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center bg-[#ddb7ff]/15 px-3 py-1 rounded-full border border-[#ddb7ff]/30">
                <Text className="text-[#ddb7ff] text-[11px] font-black uppercase tracking-wider">
                  Latest Disbursement • {currentSlip.month} {currentSlip.year}
                </Text>
              </View>

              <View className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/40 flex-row items-center">
                <CheckCircle2 size={12} color="#00f1a1" style={{ marginRight: 4 }} />
                <Text className="text-[#00f1a1] text-[11px] font-extrabold">Paid</Text>
              </View>
            </View>

            <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mt-2">
              Net Take-Home Salary
            </Text>
            <Text className="text-white text-3xl md:text-4xl font-black font-display-lg mt-1 mb-3">
              ₹{currentSlip.netSalary.toLocaleString('en-IN')}
            </Text>

            {/* Breakdown row */}
            <View className="flex-row justify-between pt-3 border-t border-white/10">
              <View>
                <Text className="text-white/50 text-[10px] font-bold uppercase">Gross Earnings</Text>
                <Text className="text-white font-extrabold text-sm mt-0.5">
                  ₹{currentSlip.grossSalary.toLocaleString('en-IN')}
                </Text>
              </View>

              <View className="w-[1px] h-8 bg-white/10" />

              <View>
                <Text className="text-white/50 text-[10px] font-bold uppercase">Deductions (PF/Tax)</Text>
                <Text className="text-rose-400 font-extrabold text-sm mt-0.5">
                  - ₹{currentSlip.totalDeductions.toLocaleString('en-IN')}
                </Text>
              </View>

              <View className="w-[1px] h-8 bg-white/10" />

              <View>
                <Text className="text-white/50 text-[10px] font-bold uppercase">Paid Date</Text>
                <Text className="text-[#ddb7ff] font-extrabold text-sm mt-0.5">
                  {currentSlip.payDate}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setSelectedSlip(currentSlip)}
              className="mt-4 w-full py-3 rounded-2xl bg-[#ddb7ff]/20 border border-[#ddb7ff]/40 flex-row items-center justify-center active:bg-[#ddb7ff]/30"
            >
              <FileText size={16} color="#ddb7ff" style={{ marginRight: 8 }} />
              <Text className="text-[#ddb7ff] font-extrabold text-xs uppercase tracking-wider">
                View Detailed Payslip
              </Text>
            </Pressable>
          </LinearGradient>
        </View>

        {/* 2. SUMMARY KPI STATS CARDS */}
        <View className="flex-row justify-between mb-6" style={{ gap: 10 }}>
          <View className="flex-1 bg-[#181524] border border-white/10 rounded-2xl p-4 shadow-md">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-white/60 text-[11px] font-extrabold uppercase">YTD Net Paid</Text>
              <TrendingUp size={16} color="#00f1a1" />
            </View>
            <Text className="text-white text-xl font-black">
              ₹{(ytdEarnings / 1000).toFixed(1)}k
            </Text>
            <Text className="text-[#00f1a1] text-xs font-semibold mt-1">4 Months Disbursed</Text>
          </View>

          <View className="flex-1 bg-[#181524] border border-white/10 rounded-2xl p-4 shadow-md">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-white/60 text-[11px] font-extrabold uppercase">Average Monthly</Text>
              <CreditCard size={16} color="#ddb7ff" />
            </View>
            <Text className="text-white text-xl font-black">
              ₹{avgMonthly.toLocaleString('en-IN')}
            </Text>
            <Text className="text-[#ddb7ff] text-xs font-semibold mt-1">Direct Bank Credit</Text>
          </View>
        </View>

        {/* 3. HISTORICAL PAYSLIPS LIST */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-white text-lg font-extrabold">Payslip History</Text>
            <Text className="text-[#ddb7ff] text-xs font-bold uppercase">Session 2026-27</Text>
          </View>

          <View className="bg-[#181524] border border-white/10 rounded-3xl p-4 shadow-lg">
            {payslips.map((slip, idx) => (
              <Pressable
                key={slip.id}
                onPress={() => setSelectedSlip(slip)}
                className={`py-3.5 flex-row items-center justify-between active:opacity-75 ${
                  idx < payslips.length - 1 ? 'border-b border-white/10' : ''
                }`}
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <View className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 items-center justify-center mr-3">
                    <Calendar size={20} color="#ddb7ff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-extrabold text-base">
                      {slip.month} {slip.year}
                    </Text>
                    <Text className="text-white/50 text-xs font-medium mt-0.5">
                      Credited: {slip.payDate} • {slip.bankAccount}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-[#00f1a1] font-extrabold text-base">
                    ₹{slip.netSalary.toLocaleString('en-IN')}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-white/50 text-[10px] font-bold mr-1">VIEW SLIP</Text>
                    <ChevronRight size={12} color="rgba(255,255,255,0.5)" />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 4. SALARY STRUCTURE & BANK DETAILS */}
        <View className="mb-6">
          <Text className="text-white text-lg font-extrabold mb-3 px-1">
            Salary Account Details
          </Text>

          <View className="bg-[#181524] border border-white/10 rounded-3xl p-4 shadow-lg" style={{ gap: 12 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-white/50 text-xs font-semibold">Bank Name</Text>
              <Text className="text-white font-bold text-xs">HDFC Bank Ltd.</Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-white/50 text-xs font-semibold">Account Number</Text>
              <Text className="text-[#ddb7ff] font-bold text-xs font-mono">XXXX-XXXX-4821</Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-white/50 text-xs font-semibold">IFSC Code</Text>
              <Text className="text-white font-bold text-xs font-mono">HDFC0001928</Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-white/50 text-xs font-semibold">PAN Reference</Text>
              <Text className="text-white font-bold text-xs font-mono">ABCDE1234F</Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-white/50 text-xs font-semibold">PF Universal A/C (UAN)</Text>
              <Text className="text-white font-bold text-xs font-mono">100982347102</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* PAYSLIP DETAILS MODAL */}
      {selectedSlip && (
        <Modal
          visible={!!selectedSlip}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedSlip(null)}
        >
          <View className="flex-1 bg-black/85 items-center justify-center p-4">
            <View className="w-full max-w-md bg-[#181524] border border-[#ddb7ff]/30 rounded-3xl p-5 shadow-2xl max-h-[90%]">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between pb-3 border-b border-white/10 mb-4">
                <View className="flex-row items-center gap-2.5">
                  <View className="w-10 h-10 rounded-xl bg-[#ddb7ff]/20 items-center justify-center">
                    <FileText size={20} color="#ddb7ff" />
                  </View>
                  <View>
                    <Text className="text-white font-black text-base">Salary Payslip</Text>
                    <Text className="text-[#ddb7ff] text-xs font-bold">
                      {selectedSlip.month} {selectedSlip.year}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setSelectedSlip(null)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
                >
                  <X size={16} color="white" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Employee Details Card */}
                <View className="bg-white/5 p-3.5 rounded-2xl border border-white/10 mb-4" style={{ gap: 8 }}>
                  <View className="flex-row justify-between">
                    <Text className="text-white/50 text-xs">Faculty Name</Text>
                    <Text className="text-white font-bold text-xs">{user?.name || 'Ms. Priya Reddy'}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-white/50 text-xs">Employee ID</Text>
                    <Text className="text-[#ddb7ff] font-bold text-xs">TCH-2026-42</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-white/50 text-xs">Designation</Text>
                    <Text className="text-white font-bold text-xs">{user?.designation || 'Senior Mathematics Faculty'}</Text>
                  </View>
                </View>

                {/* Earnings & Deductions Tables */}
                <View className="mb-4">
                  <Text className="text-white font-bold text-sm mb-2 text-[#ddb7ff]">1. Earnings Breakdown</Text>
                  <View className="bg-white/5 p-3 rounded-2xl border border-white/10" style={{ gap: 6 }}>
                    <View className="flex-row justify-between">
                      <Text className="text-white/70 text-xs">Basic Salary</Text>
                      <Text className="text-white font-bold text-xs">₹{selectedSlip.basicPay.toLocaleString('en-IN')}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-white/70 text-xs">House Rent Allowance (HRA)</Text>
                      <Text className="text-white font-bold text-xs">₹{selectedSlip.hra.toLocaleString('en-IN')}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-white/70 text-xs">Special Allowances</Text>
                      <Text className="text-white font-bold text-xs">₹{selectedSlip.specialAllowance.toLocaleString('en-IN')}</Text>
                    </View>
                    <View className="flex-row justify-between pt-2 border-t border-white/10">
                      <Text className="text-white font-extrabold text-xs">Gross Earnings</Text>
                      <Text className="text-[#00f1a1] font-black text-xs">₹{selectedSlip.grossSalary.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-white font-bold text-sm mb-2 text-rose-400">2. Deductions</Text>
                  <View className="bg-white/5 p-3 rounded-2xl border border-white/10" style={{ gap: 6 }}>
                    <View className="flex-row justify-between">
                      <Text className="text-white/70 text-xs">Provident Fund (PF)</Text>
                      <Text className="text-rose-300 font-bold text-xs">₹{selectedSlip.pfDeduction.toLocaleString('en-IN')}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-white/70 text-xs">Professional Tax (PT)</Text>
                      <Text className="text-rose-300 font-bold text-xs">₹{selectedSlip.taxDeduction.toLocaleString('en-IN')}</Text>
                    </View>
                    {selectedSlip.lopDeduction > 0 && (
                      <View className="flex-row justify-between">
                        <Text className="text-white/70 text-xs">Loss of Pay (LOP)</Text>
                        <Text className="text-rose-300 font-bold text-xs">₹{selectedSlip.lopDeduction.toLocaleString('en-IN')}</Text>
                      </View>
                    )}
                    <View className="flex-row justify-between pt-2 border-t border-white/10">
                      <Text className="text-white font-extrabold text-xs">Total Deductions</Text>
                      <Text className="text-rose-400 font-black text-xs">₹{selectedSlip.totalDeductions.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                </View>

                {/* Net Salary Highlight */}
                <View className="p-4 bg-[#ddb7ff]/15 border border-[#ddb7ff]/30 rounded-2xl flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-[#ddb7ff] text-[10px] font-bold uppercase tracking-wider">Net Take-Home Pay</Text>
                    <Text className="text-white font-black text-2xl">₹{selectedSlip.netSalary.toLocaleString('en-IN')}</Text>
                  </View>
                  <View className="bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/40">
                    <Text className="text-[#00f1a1] text-xs font-black">DISBURSED</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => handleShareSlip(selectedSlip)}
                    className="flex-1 py-3.5 bg-white/10 rounded-2xl flex-row items-center justify-center border border-white/10 active:bg-white/20"
                  >
                    <Share2 size={16} color="white" style={{ marginRight: 6 }} />
                    <Text className="text-white font-bold text-xs uppercase">Share</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedSlip(null)}
                    className="flex-1 py-3.5 bg-[#ddb7ff] rounded-2xl flex-row items-center justify-center active:bg-[#c084fc]"
                  >
                    <CheckCircle2 size={16} color="#181524" style={{ marginRight: 6 }} />
                    <Text className="text-[#181524] font-black text-xs uppercase">Done</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08070d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
});

export default TeacherSalaryScreen;
