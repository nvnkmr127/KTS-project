import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image, Dimensions, Platform, Modal } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Search,
  Phone,
  MessageCircle,
  MapPin,
  Award
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, activeChildId } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'fees' | 'docs' | 'transport'>('overview');

  // Custom alert dialog state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showCustomAlert = (title: string, message: string, type: 'success' | 'info') => {
    setCustomAlert({ visible: true, title, message, type });
  };

  if (!user || !user.children) return null;

  const currentChild = user.children.find(c => c.id === activeChildId) || user.children[0];

  // Map dynamic student info based on switcher selection
  const studentInfo = {
    name: currentChild.name,
    class: currentChild.class,
    id: currentChild.id === 'stud_001' ? 'EV-2024-8831' : 'EV-2025-4122',
    dob: currentChild.id === 'stud_001' ? '14 May 2012' : '08 Oct 2015',
    admissionDate: currentChild.id === 'stud_001' ? '02 Jan 2024' : '11 Jun 2025',
    bloodGroup: currentChild.id === 'stud_001' ? 'A+ Pos' : 'O+ Pos',
    house: currentChild.id === 'stud_001' ? 'Emerald' : 'Ruby',
    address: '42 Quantum Heights, Silicon Valley District, EdTech City, 94043',
    guardians: [
      { name: 'Marcus Voss', relation: 'Primary Guardian', phone: '+1 (555) 019-2834' },
      { name: 'Elena Voss', relation: 'Secondary Guardian', phone: '+1 (555) 019-5821' }
    ],
    kpi: currentChild.id === 'stud_001' ? { performance: '88.4%', rank: '4th / 32' } : { performance: '91.2%', rank: '2nd / 28' }
  };

  const handleCall = (name: string, phone: string) => {
    showCustomAlert("Calling Guardian", `Dialing ${name} at ${phone}...`, 'info');
  };

  const handleChat = (name: string) => {
    showCustomAlert("WhatsApp Chat", `Opening chat with ${name}...`, 'success');
  };

  return (
    <View style={styles.container}>
      {/* Dark Emerald Gradient Background */}
      <LinearGradient
        colors={['#004d3d', '#121414']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Header */}
      <View style={styles.header}>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => navigation.goBack()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-95">
            <ChevronLeft size={20} color="#46f1c5" />
          </Pressable>
          <Text className="text-white text-lg font-bold font-headline-md">Student Profile</Text>
        </View>
        <Pressable className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-95">
          <Search size={18} color="#46f1c5" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Student Hero Header */}
        <View className="items-center mb-6">
          <View className="relative mb-4">
            <View style={styles.avatarBorder} className="w-28 h-28 rounded-full border-4 border-[#00d4aa] overflow-hidden">
              <Image
                source={{ uri: currentChild.avatar || 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=120' }}
                className="w-full h-full object-cover"
              />
            </View>
            <View className="absolute bottom-0 bg-[#00d4aa] px-3 py-0.5 rounded-full self-center shadow-md">
              <Text className="text-[#002118] text-[9px] font-black uppercase tracking-wider">Active</Text>
            </View>
          </View>
          <Text className="text-white text-xl font-bold font-headline-lg">{studentInfo.name}</Text>
          <View className="flex-row gap-2 mt-2">
            <View style={styles.glassCard} className="px-3.5 py-1 rounded-full border border-[#46f1c5]/20">
              <Text className="text-[#46f1c5] text-[10px] font-bold uppercase tracking-wider">{studentInfo.class}</Text>
            </View>
            <View style={styles.glassCard} className="px-3.5 py-1 rounded-full border border-white/5">
              <Text className="text-white/50 text-[10px] font-bold uppercase tracking-wider">ID: {studentInfo.id}</Text>
            </View>
          </View>
        </View>

        {/* Navigation Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-5 pl-5"
          contentContainerStyle={{ paddingRight: 30 }}
        >
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'fees', label: 'Fees' },
            { id: 'docs', label: 'Documents' },
            { id: 'transport', label: 'Transport' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable 
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                style={[
                  isActive ? styles.activeTabShadow : styles.glassCard,
                  isActive ? { backgroundColor: '#00d4aa', borderColor: '#00d4aa' } : { borderColor: 'rgba(255,255,255,0.08)' }
                ]}
                className="px-5 py-2 rounded-lg mr-2 border active:scale-95"
              >
                <Text className={`text-xs font-bold ${isActive ? 'text-[#002118]' : 'text-white/60'}`}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <View className="px-5 mb-8 gap-4">
            {/* Info Bento Grid */}
            <View className="flex-row flex-wrap gap-3">
              <View style={styles.glassCard} className="w-[47%] p-4 rounded-xl border border-white/5 gap-1">
                <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider">DOB</Text>
                <Text className="text-white font-bold text-sm">{studentInfo.dob}</Text>
              </View>

              <View style={styles.glassCard} className="w-[47%] p-4 rounded-xl border border-white/5 gap-1">
                <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Admission Date</Text>
                <Text className="text-white font-bold text-sm">{studentInfo.admissionDate}</Text>
              </View>

              <View style={styles.glassCard} className="w-[47%] p-4 rounded-xl border border-[#46f1c5]/20 gap-1">
                <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Blood Group</Text>
                <Text className="text-[#46f1c5] font-black text-sm">{studentInfo.bloodGroup}</Text>
              </View>

              <View style={styles.glassCard} className="w-[47%] p-4 rounded-xl border border-white/5 gap-1">
                <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider">House</Text>
                <Text className="text-white font-bold text-sm">{studentInfo.house}</Text>
              </View>
            </View>

            {/* Address */}
            <View style={styles.glassCard} className="p-4 rounded-xl border border-white/5 gap-2">
              <View className="flex-row items-center gap-2">
                <MapPin size={16} color="#46f1c5" />
                <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Current Address</Text>
              </View>
              <Text className="text-white/80 text-xs font-semibold leading-relaxed">
                {studentInfo.address}
              </Text>
            </View>

            {/* Guardians Contact Details */}
            <View style={styles.glassCard} className="p-4 rounded-xl border border-white/5 gap-4">
              <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Parent Contact</Text>
              
              {studentInfo.guardians.map((g, index) => (
                <View key={index}>
                  {index > 0 && <View className="h-[1px] bg-white/10 w-full my-3" />}
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-white font-bold text-sm">{g.name}</Text>
                      <Text className="text-white/50 text-[10px] font-semibold mt-0.5">{g.relation}</Text>
                    </View>
                    <View className="flex-row gap-2">
                      <Pressable 
                        onPress={() => handleCall(g.name, g.phone)}
                        style={styles.insetCard}
                        className="w-9 h-9 rounded-full bg-white/5 border border-white/10 items-center justify-center active:scale-90"
                      >
                        <Phone size={14} color="#46f1c5" />
                      </Pressable>
                      <Pressable 
                        onPress={() => handleChat(g.name)}
                        style={styles.insetCard}
                        className="w-9 h-9 rounded-full bg-white/5 border border-white/10 items-center justify-center active:scale-90"
                      >
                        <MessageCircle size={14} color="#25D366" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Academic Performance KPI */}
            <View style={[styles.glassCard, styles.kpiCard]} className="p-5 rounded-xl border-l-4 border-l-[#46f1c5]">
              <View className="flex-row justify-between items-end">
                <View>
                  <Text className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Academic Performance</Text>
                  <Text className="text-2xl font-extrabold text-[#46f1c5] mt-1">{studentInfo.kpi.performance}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Class Rank</Text>
                  <Text className="text-sm font-bold text-white mt-1">{studentInfo.kpi.rank}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Custom Dialog Alert Modal */}
      <Modal
        visible={customAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertOverlay}>
          <View 
            style={[styles.glassCard, styles.alertCard]}
            className="w-[85%] max-w-[340px] p-6 border border-[#46f1c5]/20 items-center"
          >
            {/* Header Icon */}
            <View className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center ${
              customAlert.type === 'info' 
                ? 'bg-[#46f1c5]/10 border border-[#46f1c5]/20' 
                : 'bg-green-500/10 border border-green-500/20'
            }`}>
              {customAlert.type === 'info' ? (
                <Phone size={24} color="#46f1c5" />
              ) : (
                <MessageCircle size={24} color="#25D366" />
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
              style={styles.dismissBtn}
              className="w-full py-3.5 rounded-xl items-center active:scale-95 shadow-md shadow-[#46f1c5]/30"
            >
              <Text className="text-[#002118] text-xs font-bold uppercase tracking-wider">Dismiss</Text>
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
    backgroundColor: '#121414',
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
  avatarBorder: {
    shadowColor: '#00d4aa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  insetCard: {
    shadowOffset: { width: 2, height: 2 },
    shadowRadius: 5,
    shadowOpacity: 0.4,
    shadowColor: '#000000',
  },
  kpiCard: {
    shadowColor: '#00d4aa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: Platform.OS === 'ios' ? 4 : 0,
  },
  activeTabShadow: {
    shadowColor: '#00d4aa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: Platform.OS === 'ios' ? 6 : 0,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 20, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCard: {
    backgroundColor: '#121414',
    borderRadius: 28,
    shadowColor: '#46f1c5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: Platform.OS === 'android' ? 0 : 8,
  },
  dismissBtn: {
    backgroundColor: '#00d4aa',
  },
});

export default ProfileScreen;
