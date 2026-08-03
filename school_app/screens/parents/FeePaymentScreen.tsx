import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet, Dimensions, Platform, Alert, ActivityIndicator, Modal } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useFeeStore } from '../../store/useFeeStore';
import { mockFees } from '../../services/mockData';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Bell,
  Download,
  CreditCard,
  ChevronDown,
  ChevronUp,
  History,
  Sparkles,
  X,
  ArrowRight,
  ShieldAlert,
  Wallet,
  Building,
  AlertTriangle,
  CheckCircle
} from 'lucide-react-native';
import GlassCard from '../../components/GlassCard';

const { width } = Dimensions.get('window');

export const FeePaymentScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, activeChildId } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'net'>('upi');
  const [isPaying, setIsPaying] = useState(false);
  const [term2Status, setTerm2Status] = useState<'due' | 'paid'>('due');
  const [breakdownOpen, setBreakdownOpen] = useState(true);

  // Custom alert dialog state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showCustomAlert = (title: string, message: string, type: 'success' | 'error') => {
    setCustomAlert({ visible: true, title, message, type });
  };

  const { categories, feeData } = useFeeStore();

  if (!user || !user.children) return null;

  const currentChild = user.children.find(c => c.id === activeChildId) || user.children[0];

  // Map student's class (e.g. "Grade 9-A") to "Class 9" or "Class 5" from store
  const classKey = currentChild.class.replace('Grade ', 'Class ').split('-')[0].trim();
  const classFeeInfo = feeData.find(f => f.grade === classKey) || feeData[8]; // Fallback to Class 9

  // Calculate annual fees and term fees (divided by 3 terms, converted to rupees)
  const totalClassFeeAnnual = Object.values(classFeeInfo.fees).reduce((sum, val) => sum + val, 0);
  const convertedTotalRupees = Math.round(totalClassFeeAnnual * 2.2);

  const amount = Math.round(convertedTotalRupees / 3);
  const t1Amount = Math.round(convertedTotalRupees / 3);
  const t3Amount = Math.round(convertedTotalRupees / 3);

  const handlePayNow = () => {
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setShowModal(false);
      setTerm2Status('paid');
      showCustomAlert(
        "Payment Approved",
        "Transaction verified successfully! Receipt has been sent to your registered email address.",
        'success'
      );
    }, 1800);
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0E0F26', '#121330']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => navigation?.goBack()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-95">
            <ChevronLeft size={20} color="#818CF8" />
          </Pressable>
          <View>
            <Text className="text-white text-lg font-bold font-headline-md">Good Morning, Ramesh 👋</Text>
            <Text className="text-white/50 text-xs font-semibold mt-0.5">
              {currentChild.name}'s Fees | Class {currentChild.class.replace('Grade ', '')} | 2025-26
            </Text>
          </View>
        </View>
        <Pressable className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-95">
          <Bell size={20} color="#5E5CE6" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Payment Timeline */}
        <View className="mb-6">
          <Text className="text-[#A5B4FC] text-base font-bold font-headline-md mb-3 px-5">Payment Timeline</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="pl-5"
            contentContainerStyle={{ paddingRight: 30 }}
          >
            {/* Card 1: Term 1 (Paid) */}
            <View style={styles.glassCard} className="w-72 p-4 rounded-2xl mr-4 gap-4 border border-white/10">
              <View className="flex-row justify-between items-center">
                <View className="bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                  <Text className="text-green-400 font-bold text-[9px] uppercase tracking-wider">✅ Paid</Text>
                </View>
                <Text className="text-white/40 text-xs font-semibold">Term 1</Text>
              </View>
              <View>
                <Text className="text-white text-2xl font-black">₹{t1Amount.toLocaleString('en-IN')}</Text>
                <Text className="text-white/50 text-xs font-semibold mt-1">Cleared on Aug 12, 2024</Text>
              </View>
              <Pressable className="w-full py-2.5 rounded-lg border border-white/10 flex-row items-center justify-center gap-2 active:scale-95">
                <Download size={14} color="#FFFFFF" />
                <Text className="text-white text-xs font-semibold">Download Receipt</Text>
              </Pressable>
            </View>

            {/* Card 2: Term 2 (Due / Paid) */}
            <View
              style={[
                styles.glassCard,
                term2Status === 'due' ? styles.dueCardBorder : {}
              ]}
              className="w-72 p-4 rounded-2xl mr-4 gap-4 border border-white/10"
            >
              <View className="flex-row justify-between items-center">
                <View
                  className={`px-3 py-1 rounded-full border ${term2Status === 'due'
                    ? 'bg-amber-500/20 border-amber-500/30'
                    : 'bg-green-500/20 border-green-500/30'
                    }`}
                >
                  <Text className={`font-bold text-[9px] uppercase tracking-wider ${term2Status === 'due' ? 'text-amber-400' : 'text-green-400'
                    }`}>
                    {term2Status === 'due' ? '⚠️ Due' : '✅ Paid'}
                  </Text>
                </View>
                <Text className="text-white/40 text-xs font-semibold">Term 2</Text>
              </View>
              <View>
                <Text className="text-white text-2xl font-black">₹{amount.toLocaleString('en-IN')}</Text>
                <Text className={`text-xs font-semibold mt-1 ${term2Status === 'due' ? 'text-amber-400' : 'text-white/50'}`}>
                  {term2Status === 'due' ? 'Due by Jan 15, 2025' : 'Cleared just now'}
                </Text>
              </View>
              {term2Status === 'due' ? (
                <Pressable
                  onPress={() => setShowModal(true)}
                  className="w-full py-2.5 rounded-lg bg-[#10B981] flex-row items-center justify-center gap-2 active:scale-95 shadow-md shadow-[#10B981]/30"
                >
                  <CreditCard size={14} color="#FFFFFF" />
                  <Text className="text-white text-xs font-bold">Pay Now</Text>
                </Pressable>
              ) : (
                <Pressable className="w-full py-2.5 rounded-lg border border-white/10 flex-row items-center justify-center gap-2 active:scale-95">
                  <Download size={14} color="#FFFFFF" />
                  <Text className="text-white text-xs font-semibold">Download Receipt</Text>
                </Pressable>
              )}
            </View>

            {/* Card 3: Term 3 (Upcoming) */}
            <View style={styles.glassCard} className="w-72 p-4 rounded-2xl mr-4 gap-4 border border-white/10 opacity-60">
              <View className="flex-row justify-between items-center">
                <View className="bg-white/10 px-3 py-1 rounded-full">
                  <Text className="text-white/50 font-bold text-[9px] uppercase tracking-wider">🔒 Upcoming</Text>
                </View>
                <Text className="text-white/40 text-xs font-semibold">Term 3</Text>
              </View>
              <View>
                <Text className="text-white text-2xl font-black">₹{t3Amount.toLocaleString('en-IN')}</Text>
                <Text className="text-white/50 text-xs font-semibold mt-1">Opening April 2025</Text>
              </View>
              <View className="w-full py-2.5 items-center justify-center">
                <Text className="text-white/30 text-xs italic font-semibold">Unavailable</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Fee Breakdown Accordion */}
        <View className="px-5 mb-6">
          <Text className="text-[#A5B4FC] text-base font-bold font-headline-md mb-3">Fee Breakdown</Text>
          <View style={styles.glassCard} className="rounded-2xl border border-white/10 overflow-hidden">
            <Pressable
              onPress={() => setBreakdownOpen(!breakdownOpen)}
              className="p-4 flex-row justify-between items-center bg-white/5 border-b border-white/5"
            >
              <Text className="text-white font-bold text-sm">Academic Year 2025-26</Text>
              {breakdownOpen ? <ChevronUp size={18} color="#10B981" /> : <ChevronDown size={18} color="#10B981" />}
            </Pressable>

            {breakdownOpen && (
              <View className="p-4 gap-3">
                {categories.map(cat => {
                  const annualCatAmount = classFeeInfo.fees[cat.key] || 0;
                  const termCatAmountRupees = Math.round((annualCatAmount * 2.2) / 3);
                  return (
                    <View key={cat.key} className="flex-row justify-between">
                      <Text className="text-white/60 text-xs font-semibold">{cat.label}</Text>
                      <Text className="text-white text-xs font-bold">
                        ₹{termCatAmountRupees.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  );
                })}
                <View className="pt-3 mt-2 border-t border-white/10 flex-row justify-between">
                  <Text className="text-[#10B981] font-black text-sm">Total Term Amount</Text>
                  <Text className="text-[#10B981] font-black text-sm">₹{amount.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Insights Section */}
        <View className="px-5 mb-8 flex-row gap-4">
          <View style={styles.glassCard} className="flex-1 p-4 rounded-2xl border border-white/10 items-center gap-1.5">
            <View className="w-11 h-11 rounded-full bg-[#5E5CE6]/15 flex items-center justify-center">
              <History size={20} color="#818CF8" />
            </View>
            <Text className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Payment History</Text>
            <Text className="text-white font-bold text-sm">4 Records</Text>
          </View>

          <View style={styles.glassCard} className="flex-1 p-4 rounded-2xl border border-white/10 items-center gap-1.5">
            <View className="w-11 h-11 rounded-full bg-[#10B981]/15 flex items-center justify-center">
              <Sparkles size={20} color="#34D399" />
            </View>
            <Text className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Scholarship</Text>
            <Text className="text-white font-bold text-sm">15% Off</Text>
          </View>
        </View>
      </ScrollView>

      {/* Payment Overlay Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          onPress={() => setShowModal(false)}
          style={styles.modalOverlay}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.glassCard, styles.modalContent]}
          >
            {/* Close button */}
            <Pressable
              onPress={() => setShowModal(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-90"
            >
              <X size={16} color="#FFFFFF" />
            </Pressable>

            {/* Title / Info */}
            <View className="items-center gap-1 mb-6">
              <Text className="text-[#10B981] text-lg font-bold">Complete Payment</Text>
              <Text className="text-white/50 text-xs font-semibold">Term 2 Fee for {currentChild.name}</Text>
              <Text className="text-white text-3xl font-black mt-2">₹{amount.toLocaleString('en-IN')}</Text>
            </View>

            {/* Payment Method Selectors */}
            <View className="gap-3 mb-6">
              <Text className="text-white/45 text-[10px] font-bold uppercase tracking-widest px-1">Select Payment Method</Text>

              {/* UPI */}
              <Pressable
                onPress={() => setSelectedMethod('upi')}
                className={`p-3 rounded-xl flex-row items-center justify-between border ${selectedMethod === 'upi' ? 'bg-[#10B981]/10 border-[#10B981]' : 'bg-white/5 border-white/10'
                  }`}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <Wallet size={18} color="#34D399" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-xs">UPI</Text>
                    <Text className="text-white/40 text-[9px] mt-0.5">Google Pay, PhonePe, BHIM</Text>
                  </View>
                </View>
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selectedMethod === 'upi' ? 'border-[#10B981]' : 'border-white/30'
                  }`}>
                  {selectedMethod === 'upi' && <View className="w-2.5 h-2.5 bg-[#10B981] rounded-full" />}
                </View>
              </Pressable>

              {/* Cards */}
              <Pressable
                onPress={() => setSelectedMethod('card')}
                className={`p-3 rounded-xl flex-row items-center justify-between border ${selectedMethod === 'card' ? 'bg-[#10B981]/10 border-[#10B981]' : 'bg-white/5 border-white/10'
                  }`}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <CreditCard size={18} color="#34D399" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-xs">Debit/Credit Card</Text>
                    <Text className="text-white/40 text-[9px] mt-0.5">Visa, Mastercard, RuPay</Text>
                  </View>
                </View>
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selectedMethod === 'card' ? 'border-[#10B981]' : 'border-white/30'
                  }`}>
                  {selectedMethod === 'card' && <View className="w-2.5 h-2.5 bg-[#10B981] rounded-full" />}
                </View>
              </Pressable>

              {/* Net Banking */}
              <Pressable
                onPress={() => setSelectedMethod('net')}
                className={`p-3 rounded-xl flex-row items-center justify-between border ${selectedMethod === 'net' ? 'bg-[#10B981]/10 border-[#10B981]' : 'bg-white/5 border-white/10'
                  }`}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <Building size={18} color="#34D399" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-xs">Net Banking</Text>
                    <Text className="text-white/40 text-[9px] mt-0.5">All major Indian banks</Text>
                  </View>
                </View>
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selectedMethod === 'net' ? 'border-[#10B981]' : 'border-white/30'
                  }`}>
                  {selectedMethod === 'net' && <View className="w-2.5 h-2.5 bg-[#10B981] rounded-full" />}
                </View>
              </Pressable>
            </View>

            {/* Action button */}
            <Pressable
              onPress={handlePayNow}
              disabled={isPaying}
              className="w-full py-4 rounded-xl bg-[#10B981] flex-row items-center justify-center gap-2 active:scale-95 shadow-lg shadow-[#10B981]/30 mb-2"
            >
              {isPaying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-white font-bold text-sm uppercase tracking-wide">
                    Pay ₹{amount.toLocaleString('en-IN')}
                  </Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </>
              )}
            </Pressable>
            <Text className="text-center text-[10px] text-white/30 font-semibold uppercase tracking-wider">
              Secured by 256-bit SSL encryption
            </Text>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Custom Dialog Alert Modal */}
      <Modal
        visible={customAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertOverlay}>
          <GlassCard
            className="w-[85%] max-w-[340px] p-6 border border-white/10 items-center"
            style={{
              backgroundColor: '#16162D',
              borderRadius: 28,
              shadowColor: '#5E5CE6',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            {/* Header Icon */}
            <View className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center ${customAlert.type === 'error'
              ? 'bg-red-500/10 border border-red-500/20'
              : 'bg-[#5E5CE6]/15 border border-[#5E5CE6]/25'
              }`}>
              {customAlert.type === 'error' ? (
                <AlertTriangle size={24} color="#EF4444" />
              ) : (
                <CheckCircle size={24} color="#5E5CE6" />
              )}
            </View>

            {/* Title & Message */}
            <Text className="text-white text-lg font-bold font-headline-md text-center mb-2">
              {customAlert.title}
            </Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-6 px-1">
              {customAlert.message}
            </Text>

            {/* Action Button */}
            <Pressable
              onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
              className="w-full py-3.5 rounded-xl bg-[#5E5CE6] items-center active:scale-95 shadow-md shadow-[#5E5CE6]/30"
            >
              <Text className="text-white text-xs font-bold uppercase tracking-wider">Dismiss</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F26',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 65 : 52,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 50,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  dueCardBorder: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: Platform.OS === 'ios' ? 6 : 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 15, 38, 0.85)',
    justifyContent: 'flex-end',
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 15, 38, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#16162D',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default FeePaymentScreen;
