import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Banknote, Search, Plus, Download, Filter, 
  CheckCircle2, AlertCircle, X, CreditCard, Clock, User, FileText, ChevronRight
} from 'lucide-react-native';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';

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
}

const MOCK_FEE_RECORDS: StudentFeeRecord[] = [
  {
    id: 'f1',
    name: 'B Sandeep Goud',
    rollNo: '10A01',
    className: 'Class 10 — Section A',
    totalFee: 45000,
    paidAmount: 45000,
    balanceDue: 0,
    status: 'Paid',
    lastPaymentDate: '2026-05-12'
  },
  {
    id: 'f2',
    name: 'Banda Teja Sri',
    rollNo: '10A02',
    className: 'Class 10 — Section A',
    totalFee: 45000,
    paidAmount: 30000,
    balanceDue: 15000,
    status: 'Partial',
    lastPaymentDate: '2026-05-20'
  },
  {
    id: 'f3',
    name: 'Chandippa Sragvi',
    rollNo: '10A03',
    className: 'Class 10 — Section A',
    totalFee: 45000,
    paidAmount: 0,
    balanceDue: 45000,
    status: 'Unpaid',
    lastPaymentDate: 'None'
  },
  {
    id: 'f4',
    name: 'Chilkuri Shiva Prasad',
    rollNo: '10A04',
    className: 'Class 10 — Section A',
    totalFee: 45000,
    paidAmount: 25000,
    balanceDue: 20000,
    status: 'Partial',
    lastPaymentDate: '2026-04-18'
  }
];

export const FeeCollectionScreen: React.FC<any> = ({ navigation }) => {
  const [feeRecords, setFeeRecords] = useState<StudentFeeRecord[]>(MOCK_FEE_RECORDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partial' | 'Unpaid'>('All');

  useEffect(() => {
    const fetchFeeRecords = async () => {
      try {
        const res = await api.getResources('student-fees');
        if (Array.isArray(res) && res.length > 0) {
          const mapped: StudentFeeRecord[] = res.map((f: any) => ({
            id: String(f.id),
            name: f.student_name || f.name || 'Student',
            rollNo: f.roll_no || `10A0${f.id}`,
            className: f.class_name || 'Class 10 — Section A',
            totalFee: Number(f.total_fee || f.amount || 45000),
            paidAmount: Number(f.paid_amount || 0),
            balanceDue: Number(f.due_amount || f.balance_due || (f.total_fee ? f.total_fee - (f.paid_amount || 0) : 45000)),
            status: (f.status === 'paid' ? 'Paid' : f.status === 'partial' ? 'Partial' : 'Unpaid') as any,
            lastPaymentDate: f.updated_at ? f.updated_at.split('T')[0] : 'None',
          }));
          setFeeRecords(mapped);
        }
      } catch (err) {
        console.log('Error loading fee records:', err);
      }
    };
    fetchFeeRecords();
  }, []);

  // Modal States
  const [selectedFeeStudent, setSelectedFeeStudent] = useState<StudentFeeRecord | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentModeInput, setPaymentModeInput] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('UPI');
  const [refNoInput, setRefNoInput] = useState('');

  // Custom Toast State
  const [toastData, setToastData] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'warning' }>({
    visible: false, title: '', message: '', type: 'success'
  });

  const showToast = (title: string, message: string, type: 'success' | 'warning' = 'success') => {
    setToastData({ visible: true, title, message, type });
  };

  const handleOpenCollectModal = (rec: StudentFeeRecord) => {
    setSelectedFeeStudent(rec);
    setPaymentAmountInput(String(rec.balanceDue > 0 ? rec.balanceDue : 5000));
    setPaymentModeInput('UPI');
    setRefNoInput(`UPI${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleProcessFeePayment = async () => {
    if (!selectedFeeStudent) return;
    const amount = parseFloat(paymentAmountInput);
    if (isNaN(amount) || amount <= 0) {
      showToast('Invalid Amount', 'Please enter a valid positive payment amount.', 'warning');
      return;
    }

    const newPaid = selectedFeeStudent.paidAmount + amount;
    const newBal = Math.max(0, selectedFeeStudent.totalFee - newPaid);
    const newStatus = newBal === 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';

    try {
      await api.updateResource('student-fees', selectedFeeStudent.id, {
        paid_amount: newPaid,
        due_amount: newBal,
        status: newStatus.toLowerCase(),
        payment_mode: paymentModeInput,
        reference_no: refNoInput,
      });
    } catch (e) {
      console.log('Error updating fee in DB:', e);
    }

    setFeeRecords(prev => prev.map(f => {
      if (f.id === selectedFeeStudent.id) {
        return {
          ...f,
          paidAmount: newPaid,
          balanceDue: newBal,
          status: newStatus,
          lastPaymentDate: new Date().toISOString().split('T')[0]
        };
      }
      return f;
    }));

    setSelectedFeeStudent(null);
    showToast('Payment Collected', `Successfully recorded ₹${amount.toLocaleString()} for ${selectedFeeStudent.name}.`, 'success');
  };

  const filteredRecords = feeRecords.filter(item => {
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.className.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate Metrics
  const totalExpected = feeRecords.reduce((sum, f) => sum + f.totalFee, 0);
  const totalCollected = feeRecords.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalDue = feeRecords.reduce((sum, f) => sum + f.balanceDue, 0);
  const collectionPct = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0d2a24', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <AdminStaffHeader
        onBackPress={navigation?.canGoBack && navigation.canGoBack() ? () => navigation.goBack() : undefined}
        title="Fee Collection Console"
        subtitle="Tuition, Receipts & Due Balances Management"
        icon={
          <View className="w-10 h-10 rounded-xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center">
            <Banknote size={20} color="#00f1a1" />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top 4 KPI Cards */}
        <View className="px-5 mb-5 flex-row flex-wrap justify-between" style={{ gap: 10 }}>
          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Total Expected</Text>
              <Banknote size={14} color="#00f1a1" />
            </View>
            <Text className="text-white text-xl font-extrabold">₹{totalExpected.toLocaleString()}</Text>
            <Text className="text-[#00f1a1] text-[10px] font-semibold mt-0.5">● Annual Tuition</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Total Collected</Text>
              <CheckCircle2 size={14} color="#38bdf8" />
            </View>
            <Text className="text-sky-400 text-xl font-extrabold">₹{totalCollected.toLocaleString()}</Text>
            <Text className="text-sky-300 text-[10px] font-semibold mt-0.5">● {collectionPct}% Recovered</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Total Due Balance</Text>
              <AlertCircle size={14} color="#ff516a" />
            </View>
            <Text className="text-rose-400 text-xl font-extrabold">₹{totalDue.toLocaleString()}</Text>
            <Text className="text-rose-300 text-[10px] font-semibold mt-0.5">● Outstanding Dues</Text>
          </GlassCard>

          <GlassCard intensity="low" className="w-[48%] p-3.5 border-white/10 bg-[#101415]/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white/40 text-[10px] font-bold uppercase">Recovery Rate</Text>
              <CreditCard size={14} color="#c084fc" />
            </View>
            <Text className="text-purple-300 text-xl font-extrabold">{collectionPct}%</Text>
            <Text className="text-purple-400 text-[10px] font-semibold mt-0.5">● Collection Target</Text>
          </GlassCard>
        </View>

        {/* Search & Filter Bar */}
        <View className="px-5 mb-4">
          <View className="bg-[#101415] border border-white/15 rounded-2xl flex-row items-center px-3.5 py-2.5 mb-3 shadow-md">
            <Search size={16} color="#00f1a1" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search student name, roll number, or class..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white text-xs"
              style={{ paddingVertical: 0 }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={15} color="rgba(255, 255, 255, 0.5)" />
              </Pressable>
            )}
          </View>

          {/* Status Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {(['All', 'Paid', 'Partial', 'Unpaid'] as const).map(st => {
                const isSelected = statusFilter === st;
                return (
                  <Pressable
                    key={st}
                    onPress={() => setStatusFilter(st)}
                    className={`px-4 py-1.5 rounded-xl border ${isSelected ? 'bg-[#00f1a1] border-[#00f1a1]' : 'bg-white/5 border-white/15'}`}
                  >
                    <Text className={`text-xs font-bold ${isSelected ? 'text-[#101415]' : 'text-white/70'}`}>
                      {st === 'All' ? 'All Status' : st}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Student Fee Roster */}
        <View className="px-5">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Student Fee Registry ({filteredRecords.length})</Text>

          {filteredRecords.map(rec => {
            const badgeColor = rec.status === 'Paid' ? 'bg-[#00f1a1]/20 border-[#00f1a1]/40 text-[#00f1a1]' :
                              rec.status === 'Partial' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' :
                              'bg-rose-500/20 border-rose-500/40 text-rose-400';

            return (
              <GlassCard key={rec.id} intensity="low" className="mb-4 p-4 border-white/10 bg-[#101415]/90">
                <View className="flex-row justify-between items-start pb-3 border-b border-white/10 mb-3">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-10 h-10 rounded-2xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center mr-3">
                      <User size={20} color="#00f1a1" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-extrabold text-sm">{rec.name}</Text>
                      <Text className="text-white/50 text-[10.5px]">Roll: {rec.rollNo} • {rec.className}</Text>
                    </View>
                  </View>

                  <View className={`${badgeColor} border px-2.5 py-1 rounded-xl`}>
                    <Text className={`${badgeColor.split(' ').pop()} text-[10px] font-bold`}>{rec.status}</Text>
                  </View>
                </View>

                {/* Amount Breakdowns */}
                <View className="flex-row justify-between bg-black/40 p-3 rounded-2xl mb-3 border border-white/5">
                  <View className="flex-1">
                    <Text className="text-white/40 text-[9.5px] uppercase font-bold">Total Fee</Text>
                    <Text className="text-white font-extrabold text-xs mt-0.5">₹{rec.totalFee.toLocaleString()}</Text>
                  </View>

                  <View className="flex-1 items-center border-x border-white/10">
                    <Text className="text-white/40 text-[9.5px] uppercase font-bold">Paid</Text>
                    <Text className="text-sky-400 font-extrabold text-xs mt-0.5">₹{rec.paidAmount.toLocaleString()}</Text>
                  </View>

                  <View className="flex-1 items-end">
                    <Text className="text-white/40 text-[9.5px] uppercase font-bold">Due Balance</Text>
                    <Text className="text-rose-400 font-extrabold text-xs mt-0.5">₹{rec.balanceDue.toLocaleString()}</Text>
                  </View>
                </View>

                {/* Action Collect Button */}
                <View className="flex-row justify-between items-center">
                  <Text className="text-white/40 text-[10px]">Last Payment: {rec.lastPaymentDate}</Text>

                  {rec.balanceDue > 0 ? (
                    <Pressable
                      onPress={() => handleOpenCollectModal(rec)}
                      className="bg-[#00f1a1] px-4 py-2 rounded-xl flex-row items-center shadow-[0_0_12px_rgba(0,241,161,0.3)]"
                    >
                      <CreditCard size={13} color="#101415" style={{ marginRight: 5 }} />
                      <Text className="text-[#101415] text-xs font-extrabold">Collect Fee</Text>
                    </Pressable>
                  ) : (
                    <View className="bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-xl">
                      <Text className="text-[#00f1a1] text-[10px] font-bold">Fully Paid ✓</Text>
                    </View>
                  )}
                </View>
              </GlassCard>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* COLLECT FEE PAYMENT MODAL */}
      <Modal visible={Boolean(selectedFeeStudent)} transparent animationType="slide" onRequestClose={() => setSelectedFeeStudent(null)}>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-[#101415] border-2 border-[#00f1a1]/40 rounded-3xl w-full max-w-md p-5 shadow-[0_0_30px_rgba(0,241,161,0.3)]">
            <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-4">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-xl bg-[#00f1a1]/20 border border-[#00f1a1]/40 items-center justify-center mr-2.5">
                  <CreditCard size={16} color="#00f1a1" />
                </View>
                <View>
                  <Text className="text-white font-bold text-base">Collect Fee Payment</Text>
                  <Text className="text-white/50 text-[10px]">{selectedFeeStudent?.name} ({selectedFeeStudent?.rollNo})</Text>
                </View>
              </View>
              <Pressable onPress={() => setSelectedFeeStudent(null)} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              <View className="bg-white/5 border border-white/10 p-3 rounded-2xl mb-4 flex-row justify-between">
                <View>
                  <Text className="text-white/40 text-[9.5px] uppercase">Outstanding Due</Text>
                  <Text className="text-rose-400 font-extrabold text-sm">₹{selectedFeeStudent?.balanceDue.toLocaleString()}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-white/40 text-[9.5px] uppercase">Already Paid</Text>
                  <Text className="text-sky-400 font-extrabold text-sm">₹{selectedFeeStudent?.paidAmount.toLocaleString()}</Text>
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Collection Amount (₹) *</Text>
                <TextInput
                  value={paymentAmountInput}
                  onChangeText={setPaymentAmountInput}
                  keyboardType="numeric"
                  placeholder="e.g. 15000"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs font-mono"
                />
              </View>

              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Payment Mode *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row" style={{ gap: 6 }}>
                    {(['UPI', 'Cash', 'Bank Transfer', 'Cheque'] as const).map(pm => {
                      const isSel = paymentModeInput === pm;
                      return (
                        <Pressable
                          key={pm}
                          onPress={() => setPaymentModeInput(pm)}
                          className={`px-3 py-1.5 rounded-xl border ${isSel ? 'bg-[#00f1a1] border-[#00f1a1]' : 'bg-white/5 border-white/15'}`}
                        >
                          <Text className={`text-xs font-bold ${isSel ? 'text-[#101415]' : 'text-white/70'}`}>{pm}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              <View className="mb-3">
                <Text className="text-white/70 text-xs font-bold mb-1">Transaction Ref / Receipt No.</Text>
                <TextInput
                  value={refNoInput}
                  onChangeText={setRefNoInput}
                  placeholder="e.g. UPI8837192"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="bg-black/40 border border-white/15 rounded-xl text-white px-3 py-2 text-xs font-mono"
                />
              </View>
            </ScrollView>

            <View className="flex-row border-t border-white/10 pt-3 mt-2" style={{ gap: 10 }}>
              <Pressable onPress={() => setSelectedFeeStudent(null)} className="flex-1 py-3 rounded-xl bg-white/10 items-center">
                <Text className="text-white font-bold text-xs">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleProcessFeePayment} className="flex-1 py-3 rounded-xl bg-[#00f1a1] items-center shadow-[0_0_12px_rgba(0,241,161,0.4)]">
                <Text className="text-[#101415] font-extrabold text-xs">Record Receipt</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUSTOM TOAST MODAL */}
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
    paddingTop: 16,
    paddingBottom: 100,
  },
});

export default FeeCollectionScreen;
