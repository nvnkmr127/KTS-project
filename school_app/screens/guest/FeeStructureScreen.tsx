import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Info, ArrowRight, Landmark, CreditCard, Award, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../store/useAuthStore';
import { GuestHeader } from '../../components/GuestHeader';
import { useFeeStore } from '../../store/useFeeStore';

export const FeeStructureScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const logout = useAuthStore((state) => state.logout);

  // Read dynamic fee data and active categories from the global store
  const { categories, feeData } = useFeeStore();

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

  const benefits = [
    {
      icon: Landmark,
      title: 'Bank Transfers',
      desc: 'Zero processing fees for direct wire transfers.',
    },
    {
      icon: CreditCard,
      title: 'Smart Installments',
      desc: 'Spread the cost across 10 interest-free months.',
    },
    {
      icon: Award,
      title: 'Merit Rewards',
      desc: 'Up to 40% reduction for exceptional performance.',
    },
    {
      icon: Users,
      title: 'Sibling Policy',
      desc: '15% discount for the second child onwards.',
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a2a3a', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View className="px-5 mb-6">
          <Text className="text-white text-3xl font-extrabold leading-tight mb-3">
            Annual Fee Structure
          </Text>
          <Text className="text-white/60 text-sm leading-relaxed mb-5">
            Transparent investment for a visionary education. Explore our breakdown for the upcoming academic session.
          </Text>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Info size={16} color="#8ed5ff" />
            <Text className="text-white/70 text-xs flex-1 ml-3">
              Indicative only — contact school for exact fees
            </Text>
          </View>
        </View>

        {/* Fee Table */}
        <View className="px-5 mb-8">
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.4 }]}>Grade / Class</Text>
              {categories.map(cat => (
                <Text 
                  key={cat.key} 
                  style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}
                  numberOfLines={1}
                >
                  {cat.label}
                </Text>
              ))}
            </View>

            {/* Table Rows */}
            {feeData.map((row, idx) => (
              <View
                key={idx}
                style={[
                  styles.tableRow,
                  idx < feeData.length - 1 && styles.tableRowBorder,
                ]}
              >
                <Text style={[styles.tableCell, { flex: 1.4 }]}>{row.grade}</Text>
                {categories.map(cat => (
                  <Text key={cat.key} style={[styles.tableCellValue, { flex: 1, textAlign: 'center' }]}>
                    ${(row.fees[cat.key] || 0).toLocaleString()}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Custom Quote CTA */}
        <View className="px-5 mb-8">
          <View style={styles.quoteCard}>
            <Text className="text-white font-bold text-base text-center mb-3">
              Need a customized quote?
            </Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-5">
              Our administrative team is available for one-on-one consultations to discuss sibling discounts, installment plans, and scholarship opportunities.
            </Text>
            <Pressable 
              onPress={() => showCustomAlert('Prospectus Download', 'The digital Prospectus & Fee Breakdown PDF has started downloading successfully.', 'success')}
              style={styles.prospectusButton} 
              className="active:scale-95"
            >
              <Text className="text-[#004965] font-bold text-sm">Download Prospectus</Text>
            </Pressable>
          </View>
        </View>

        {/* Benefits Grid */}
        <View className="px-5 mb-8">
          <View style={styles.benefitsGrid}>
            {benefits.map((b, idx) => {
              const IconComp = b.icon;
              return (
                <View key={idx} style={styles.benefitCard}>
                  <View style={styles.benefitIconWrap}>
                    <IconComp size={22} color="#8ed5ff" />
                  </View>
                  <Text className="text-white font-bold text-sm mt-3 mb-1">{b.title}</Text>
                  <Text className="text-white/50 text-[11px] leading-relaxed">{b.desc}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Bottom spacer for footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Top App Bar */}
      <GuestHeader title="Fee Structure" showBack />

      {/* Floating Footer CTA */}
      <BlurView intensity={40} tint="dark" style={styles.footer}>
        <Pressable
          onPress={() => navigation.navigate('EnquiryForm')}
          className="flex-row items-center gap-3 px-6 py-3 rounded-full bg-white/10 active:bg-white/20 border border-[#8ed5ff]/30"
        >
          <Text className="text-xs font-bold text-[#8ed5ff]">
            Register to unlock attendance, marks & full features
          </Text>
          <ArrowRight size={16} color="#8ed5ff" />
        </Pressable>
      </BlurView>

      {/* Custom Dialog Alert Modal */}
      <Modal
        visible={customAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertOverlay}>
          <View 
            style={styles.alertCard}
            className="w-[85%] max-w-[340px] p-6 border border-[#8ed5ff]/20 items-center" 
          >
            {/* Header Icon */}
            <View className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center ${
              customAlert.type === 'error' 
                ? 'bg-red-500/10 border border-red-500/20' 
                : 'bg-[#8ed5ff]/10 border border-[#8ed5ff]/20'
            }`}>
              {customAlert.type === 'error' ? (
                <Info size={24} color="#EF4444" />
              ) : (
                <Award size={24} color="#8ed5ff" />
              )}
            </View>

            {/* Title & Message */}
            <Text className="text-white text-lg font-bold text-center mb-2">
              {customAlert.title}
            </Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-6 px-1">
              {customAlert.message}
            </Text>

            {/* Action Button */}
            <Pressable 
              onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
              style={styles.prospectusButton}
              className="w-full py-3.5 rounded-xl items-center active:scale-95 shadow-md shadow-[#38bdf8]/30"
            >
              <Text className="text-[#004965] font-bold text-xs uppercase tracking-wider">Dismiss</Text>
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
    backgroundColor: '#101415',
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : 85,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tableContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: 'rgba(142, 213, 255, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tableHeaderText: {
    color: '#8ed5ff',
    fontSize: 12,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableCell: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  tableCellValue: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
  },
  quoteCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 28,
    alignItems: 'center',
  },
  prospectusButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  benefitCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    flexGrow: 1,
    flexBasis: '45%',
  },
  benefitIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 213, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(142, 213, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(142, 213, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a2a3a',
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCard: {
    backgroundColor: '#101415',
    borderRadius: 28,
    shadowColor: '#8ed5ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: Platform.OS === 'android' ? 0 : 8,
  },
});

export default FeeStructureScreen;
