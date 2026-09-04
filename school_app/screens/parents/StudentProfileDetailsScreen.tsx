import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image, Platform, Modal } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Search,
  Phone,
  MessageCircle,
  MapPin,
  Award,
  Bus,
  CreditCard,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Navigation as NavigationIcon,
  ShieldCheck,
  ChevronRight
} from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, activeChildId } = useAuthStore();
  const { isSmallPhone, insets, headerPaddingTop } = useResponsive();
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
    village: 'Chevella',
    address: 'Chevella Main Road, Near Bus Station, Chevella, Telangana',
    guardians: [
      { name: 'Marcus Voss', relation: 'Primary Guardian', phone: '+91 98765 43210' },
      { name: 'Elena Voss', relation: 'Secondary Guardian', phone: '+91 98765 43211' }
    ],
    kpi: currentChild.id === 'stud_001' ? { performance: '88.4%', rank: '4th / 32' } : { performance: '91.2%', rank: '2nd / 28' },
    transport: {
      route: 'Route #4 — Chevella / DharmaSagar Express',
      busNo: 'TS-07-UA-8821',
      driverName: 'Ramesh Kumar',
      driverPhone: '+91 98480 12345',
      pickupPoint: 'Chevella Main Arch Gate',
      pickupTime: '07:45 AM',
      dropTime: '04:30 PM',
      village: 'Chevella',
      annualFee: 7000,
      feeStatus: 'Active Bus Pass',
      stops: ['Chevella Arch (07:45 AM)', 'DharmaSagar (08:00 AM)', 'Urella Jn (08:15 AM)', 'School Campus (08:35 AM)']
    },
    fees: {
      total: 42000,
      paid: 35000,
      due: 7000,
      breakdown: [
        { name: 'Tuition Fee (Term 1 & 2)', amount: 35000, status: 'Paid', date: '12 May 2026' },
        { name: 'Transport / Bus Fee (Chevella Route)', amount: 7000, status: 'Pending', dueDate: '30 Jun 2026' }
      ]
    }
  };

  const handleCall = (name: string, phone: string) => {
    showCustomAlert("Calling Contact", `Dialing ${name} at ${phone}...`, 'info');
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
        style={StyleSheet.absoluteFill}
      />

      {/* Top Header */}
      <View 
        style={[
          styles.header,
          { paddingTop: headerPaddingTop }
        ]}
      >
        <View className="flex-row items-center gap-3">
          <Pressable 
            onPress={() => navigation.goBack()} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-95"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <ChevronLeft size={24} color="#46f1c5" />
          </Pressable>
          <Text className="text-white text-lg md:text-xl font-extrabold font-headline-md">Student Profile</Text>
        </View>
        <Pressable 
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-95"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Search size={22} color="#46f1c5" />
        </Pressable>
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 }
        ]} 
        showsVerticalScrollIndicator={false}
      >
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

        {/* Transport Tab Content */}
        {activeTab === 'transport' && (
          <View className="px-5 mb-8 gap-4">
            {/* Bus Route Hero Card */}
            <View style={styles.glassCard} className="p-5 rounded-2xl border border-purple-400/30 gap-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-row items-center gap-2.5">
                  <View className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 items-center justify-center">
                    <Bus size={22} color="#c084fc" />
                  </View>
                  <View>
                    <Text className="text-white font-extrabold text-base">{studentInfo.transport.route}</Text>
                    <Text className="text-purple-300 text-xs font-semibold">Bus No: {studentInfo.transport.busNo}</Text>
                  </View>
                </View>
                <View className="bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/30">
                  <Text className="text-emerald-400 text-[10px] font-bold">{studentInfo.transport.feeStatus}</Text>
                </View>
              </View>

              <View className="h-[1px] bg-white/10 w-full my-1" />

              {/* Pickup & Drop Times Bento */}
              <View className="flex-row gap-3">
                <View className="flex-1 bg-black/40 p-3 rounded-xl border border-white/5">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Clock size={12} color="#46f1c5" />
                    <Text className="text-white/50 text-[10px] font-bold uppercase">Morning Pickup</Text>
                  </View>
                  <Text className="text-white font-black text-sm">{studentInfo.transport.pickupTime}</Text>
                  <Text className="text-white/60 text-[10px] mt-0.5" numberOfLines={1}>{studentInfo.transport.pickupPoint}</Text>
                </View>

                <View className="flex-1 bg-black/40 p-3 rounded-xl border border-white/5">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Clock size={12} color="#f0c110" />
                    <Text className="text-white/50 text-[10px] font-bold uppercase">Evening Drop</Text>
                  </View>
                  <Text className="text-white font-black text-sm">{studentInfo.transport.dropTime}</Text>
                  <Text className="text-white/60 text-[10px] mt-0.5" numberOfLines={1}>Return to {studentInfo.transport.village}</Text>
                </View>
              </View>
            </View>

            {/* Village Transport Fee Rate Card */}
            <View style={styles.glassCard} className="p-4 rounded-xl border border-white/5 gap-2">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2">
                  <MapPin size={16} color="#46f1c5" />
                  <Text className="text-white/50 text-[10px] font-bold uppercase">Registered Transport Route</Text>
                </View>
                <View className="bg-purple-500/20 px-2.5 py-0.5 rounded-lg border border-purple-400/30">
                  <Text className="text-purple-300 font-extrabold text-xs">
                    ₹{studentInfo.transport.annualFee.toLocaleString()} / year
                  </Text>
                </View>
              </View>
              <Text className="text-white font-bold text-sm">{studentInfo.transport.village} Area Route</Text>
              <Text className="text-white/60 text-xs leading-relaxed">
                Covers daily pickup & drop from {studentInfo.transport.village} village with GPS tracking and verified bus attendant.
              </Text>
            </View>

            {/* Bus Driver & Support Contact */}
            <View style={styles.glassCard} className="p-4 rounded-xl border border-white/5 gap-3">
              <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Driver / Transport Incharge</Text>
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-white font-bold text-sm">{studentInfo.transport.driverName}</Text>
                  <Text className="text-white/50 text-xs mt-0.5">Assigned Bus Driver ({studentInfo.transport.busNo})</Text>
                </View>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handleCall(studentInfo.transport.driverName, studentInfo.transport.driverPhone)}
                    style={styles.insetCard}
                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 items-center justify-center active:scale-90"
                  >
                    <Phone size={14} color="#46f1c5" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleChat(studentInfo.transport.driverName)}
                    style={styles.insetCard}
                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 items-center justify-center active:scale-90"
                  >
                    <MessageCircle size={14} color="#25D366" />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Route Stops Timeline */}
            <View style={styles.glassCard} className="p-4 rounded-xl border border-white/5 gap-3">
              <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Route Stops & Timetable</Text>
              {studentInfo.transport.stops.map((stop, idx) => (
                <View key={idx} className="flex-row items-center gap-3">
                  <View className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 items-center justify-center">
                    <Text className="text-emerald-400 text-[10px] font-black">{idx + 1}</Text>
                  </View>
                  <Text className="text-white/90 text-xs font-semibold">{stop}</Text>
                </View>
              ))}
            </View>

            {/* Live Tracking Shortcut */}
            <Pressable
              onPress={() => {
                if (navigation?.navigate) {
                  navigation.navigate('BusTracking');
                } else {
                  showCustomAlert('Live Tracking', 'Connecting to bus GPS stream...', 'info');
                }
              }}
              className="w-full py-3.5 rounded-xl bg-[#00d4aa] flex-row items-center justify-center gap-2 shadow-lg shadow-[#00d4aa]/30 active:scale-95"
            >
              <NavigationIcon size={16} color="#002118" />
              <Text className="text-[#002118] text-xs font-black uppercase tracking-wider">Open Live Bus GPS Tracking</Text>
            </Pressable>
          </View>
        )}

        {/* Fees Tab Content */}
        {activeTab === 'fees' && (
          <View className="px-5 mb-8 gap-4">
            {/* Fee Summary Bento */}
            <View style={styles.glassCard} className="p-5 rounded-2xl border border-[#46f1c5]/20 gap-3">
              <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Fee Summary (2026-2027)</Text>
              <View className="flex-row justify-between items-end">
                <View>
                  <Text className="text-white/50 text-xs">Total Academic & Transport Fee</Text>
                  <Text className="text-2xl font-black text-white mt-0.5">₹{studentInfo.fees.total.toLocaleString()}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-rose-400 text-xs font-bold">Outstanding Due</Text>
                  <Text className="text-xl font-extrabold text-rose-400 mt-0.5">₹{studentInfo.fees.due.toLocaleString()}</Text>
                </View>
              </View>

              <View className="h-[1px] bg-white/10 w-full my-1" />

              <View className="flex-row justify-between text-xs">
                <Text className="text-white/50 text-xs">Paid Till Date:</Text>
                <Text className="text-emerald-400 font-bold text-xs">₹{studentInfo.fees.paid.toLocaleString()}</Text>
              </View>
            </View>

            {/* Itemized Fee Breakdown */}
            <View style={styles.glassCard} className="p-4 rounded-xl border border-white/5 gap-3">
              <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Allocated Fee Categories</Text>

              {studentInfo.fees.breakdown.map((item, idx) => (
                <View key={idx} className="p-3 bg-black/40 rounded-xl border border-white/5 mb-1">
                  <View className="flex-row justify-between items-start mb-1.5">
                    <View className="flex-1 pr-2">
                      <Text className="text-white font-bold text-xs">{item.name}</Text>
                      <Text className="text-white/40 text-[10px] mt-0.5">
                        {item.status === 'Paid' ? `Paid on ${item.date}` : `Due by ${item.dueDate}`}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-white font-extrabold text-xs">₹{item.amount.toLocaleString()}</Text>
                      <View className={`px-2 py-0.5 rounded-full mt-1 ${item.status === 'Paid' ? 'bg-emerald-500/20 border border-emerald-400/30' : 'bg-rose-500/20 border border-rose-400/30'}`}>
                        <Text className={`text-[9px] font-bold ${item.status === 'Paid' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Fee Receipt CTA */}
            <Pressable
              onPress={() => showCustomAlert('Fee Receipt', 'Downloading official fee payment receipt (PDF)...', 'success')}
              className="w-full py-3.5 rounded-xl bg-white/10 border border-white/20 flex-row items-center justify-center gap-2 active:scale-95"
            >
              <Download size={16} color="#46f1c5" />
              <Text className="text-white text-xs font-bold uppercase tracking-wider">Download Fee Receipt PDF</Text>
            </Pressable>
          </View>
        )}

        {/* Attendance Tab Content */}
        {activeTab === 'attendance' && (
          <View className="px-5 mb-8 gap-4">
            <View style={styles.glassCard} className="p-5 rounded-2xl border border-emerald-400/30 gap-3">
              <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Academic Attendance</Text>
              <View className="flex-row justify-between items-end">
                <View>
                  <Text className="text-3xl font-black text-emerald-400">94.2%</Text>
                  <Text className="text-white/60 text-xs mt-0.5">Overall Academic Attendance</Text>
                </View>
                <View className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/30">
                  <Text className="text-emerald-400 text-xs font-bold">Good Standing</Text>
                </View>
              </View>

              <View className="h-[1px] bg-white/10 w-full my-1" />

              <View className="flex-row justify-between">
                <View className="items-center">
                  <Text className="text-white font-bold text-sm">22</Text>
                  <Text className="text-white/40 text-[10px]">Present Days</Text>
                </View>
                <View className="items-center">
                  <Text className="text-rose-400 font-bold text-sm">1</Text>
                  <Text className="text-white/40 text-[10px]">Absent Days</Text>
                </View>
                <View className="items-center">
                  <Text className="text-amber-400 font-bold text-sm">0</Text>
                  <Text className="text-white/40 text-[10px]">Late Mark</Text>
                </View>
                <View className="items-center">
                  <Text className="text-white/60 font-bold text-sm">7</Text>
                  <Text className="text-white/40 text-[10px]">Holidays</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Documents Tab Content */}
        {activeTab === 'docs' && (
          <View className="px-5 mb-8 gap-3">
            {[
              { name: 'Admission Application Form', size: '1.2 MB', verified: true },
              { name: 'Transfer Certificate (TC)', size: '840 KB', verified: true },
              { name: 'Student Bus Transport Pass (2026-27)', size: '450 KB', verified: true },
              { name: 'Birth Certificate Copy', size: '920 KB', verified: true },
              { name: 'Student Aadhar Card Copy', size: '680 KB', verified: true },
            ].map((doc, idx) => (
              <View key={idx} style={styles.glassCard} className="p-3.5 rounded-xl border border-white/5 flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 items-center justify-center">
                    <FileText size={18} color="#46f1c5" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-xs">{doc.name}</Text>
                    <Text className="text-white/40 text-[10px] mt-0.5">{doc.size} • Verified</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => showCustomAlert('Document Download', `Downloading ${doc.name}...`, 'success')}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center active:scale-90"
                >
                  <Download size={14} color="#46f1c5" />
                </Pressable>
              </View>
            ))}
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
    backgroundColor: '#0d2a24',
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
