import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Image, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Calendar, FileText, CheckCircle2, XCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../components/GlassCard';
import { useResponsive } from '../../utils/responsive';

export const LeaveApprovalsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isSmallPhone, headerPaddingTop } = useResponsive();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'approved' as 'approved' | 'rejected',
  });

  const initialLeaves = [
    { 
      id: '1', 
      name: 'Dr. Julian Vance', 
      role: 'Senior Faculty', 
      type: 'MEDICAL LEAVE', 
      dates: 'Oct 12 - Oct 15', 
      days: '4 Days', 
      reason: 'Surgical procedure recovery. Medical certificate attached for validation.', 
      status: 'pending',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqHr6Au3VnzOzqMxNk1nW-Aop4jJ1do4Pwc9gYDOaVe2MSWH4qA-JtBq4FGEgzoBWX4LuSkVlNSf-IqunuixwBgkuCOuWcPiTJeLOHLKdx-HLP-zAg5vmB-PNEh3giaC3KF0ucRBYJoSR9I41HUpChClpV80z2u85_4zYqQjaE3qIdu28OV2vaXXxbk4ZTDr3DRZOt16TdB30I3XreH9qT9RojsdEjZF-9XgTKohHRsU3E1quoJP5mi4LrSIw1GKfps7QICk4R0Dxz'
    },
    { 
      id: '2', 
      name: 'Sarah Jenkins', 
      role: 'Admin Support', 
      type: 'ANNUAL LEAVE', 
      dates: 'Oct 20 - Oct 22', 
      days: '3 Days', 
      reason: 'Family vacation planned since January. All duties handed over to Marcus.', 
      status: 'pending',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDh4EQkipax34NuTu0Zpqa4fN_3AH2_WnLVWVNLlEeBd9qUxVMLNkrbhjmjodAZy02RP_I3I3gNxkKhuTGlSiDnSazieS8yo9dvrQuGhNodzhzydXIYdJR5lWIs9-OdJIPNVe1A3U-CmkDGPXurKbZI0CWxone4i5xEfJXg4Bwf78PF2TbEvMk3JUrGMbLSHYGh8fOEPsXnnw-H1i7YnX7d6eHpyDHL2mf7Br8qluOWKwBHLaugdcQ7fh-5JOYyn0DNcPSxIqN5MYzb'
    },
    { 
      id: '3', 
      name: 'Prof. Michael Chen', 
      role: 'Department Head', 
      type: 'CASUAL LEAVE', 
      dates: 'Oct 15 - Oct 15', 
      days: '1 Day', 
      reason: 'Attending a research symposium at the National University.', 
      status: 'pending',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXgcbompV9nFiHodhPhwUC-kI2_LhvQwmFAKEEr29znmzkZ4HSPZebud4D_8qwAPWssipJaQZfdS_NwF5mcgTW6bmvh7GscBm7nvhGpb2_dGGD2ffhHZ-7qrCUIdpxDQTS9oBbbn9yONHNLFTq9xjOdUBJLKuTTeCVMwhl1KQRXuxTA1erwB-QjCXBJd09RnjnwXFwu725PvPKFMsC1FaXjlc4KYoDm-Uw4kg1pkhYefaSMQGcercjLCQdU4-_yz06k_1ZNRV_P1JH'
    }
  ];

  const [leaves, setLeaves] = useState(initialLeaves);

  const handleAction = (id: string, name: string, status: 'approved' | 'rejected') => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    setCustomAlert({
      visible: true,
      title: 'Action Successful',
      message: `Leave request for ${name} has been ${status}.`,
      type: status,
    });
  };

  const filteredLeaves = leaves.filter(l => l.status === activeTab);
  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'rejected').length;

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1d2022', '#101415']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header with Custom Glow Shadow */}
      <View style={{ zIndex: 50 }}>
        {/* Top App Bar */}
        <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <Pressable 
              onPress={() => navigation.goBack()} 
              className="p-1 active:scale-95"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <ChevronLeft size={24} color="#ffe5a0" />
            </Pressable>
            <Text numberOfLines={1} className="text-lg md:text-xl font-bold text-white font-display-lg flex-1">Leave Approvals</Text>
          </View>
        </BlurView>
        
        {/* The glowing shadow below the line */}
        <LinearGradient 
          colors={['rgba(245, 197, 24, 0.15)', 'transparent']} 
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View className="px-5 mb-6">
          <Text className="text-white text-2xl font-bold font-display-lg leading-tight">Leave Requests</Text>
          <Text className="text-[#d1c5ac] text-xs font-body-sm mt-1">Review and manage pending absence requests from faculty and staff members.</Text>
        </View>

        {/* Tab Selector */}
        <View className="px-5 mb-6">
          <View className="flex-row bg-white/5 p-1 rounded-2xl border border-white/5 w-full justify-between">
            <Pressable
              onPress={() => setActiveTab('pending')}
              className={`flex-1 py-3.5 rounded-xl items-center justify-center flex-row gap-1.5 ${
                activeTab === 'pending' ? 'bg-[#ffe5a0]' : ''
              }`}
            >
              <Text className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'pending' ? 'text-[#000]' : 'text-white/40'}`}>Pending</Text>
              <View className={`w-5 h-5 rounded-full items-center justify-center ${activeTab === 'pending' ? 'bg-[#241a00]' : 'bg-white/10'}`}>
                <Text className={`text-[10px] font-bold ${activeTab === 'pending' ? 'text-[#ffe5a0]' : 'text-white/60'}`}>{pendingCount}</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('approved')}
              className={`flex-1 py-3.5 rounded-xl items-center justify-center flex-row gap-1.5 ${
                activeTab === 'approved' ? 'bg-[#ffe5a0]' : ''
              }`}
            >
              <Text className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'approved' ? 'text-[#000]' : 'text-white/40'}`}>Approved</Text>
              <View className={`w-5 h-5 rounded-full items-center justify-center ${activeTab === 'approved' ? 'bg-[#241a00]' : 'bg-white/10'}`}>
                <Text className={`text-[10px] font-bold ${activeTab === 'approved' ? 'text-[#ffe5a0]' : 'text-white/60'}`}>{approvedCount}</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('rejected')}
              className={`flex-1 py-3.5 rounded-xl items-center justify-center flex-row gap-1.5 ${
                activeTab === 'rejected' ? 'bg-[#ffe5a0]' : ''
              }`}
            >
              <Text className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'rejected' ? 'text-[#000]' : 'text-white/40'}`}>Rejected</Text>
              <View className={`w-5 h-5 rounded-full items-center justify-center ${activeTab === 'rejected' ? 'bg-[#241a00]' : 'bg-white/10'}`}>
                <Text className={`text-[10px] font-bold ${activeTab === 'rejected' ? 'text-[#ffe5a0]' : 'text-white/60'}`}>{rejectedCount}</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Leaves List */}
        <View className="px-5 gap-6 mb-8">
          {filteredLeaves.length === 0 ? (
            <GlassCard className="p-8 items-center justify-center border border-white/10" intensity="low">
              <Text className="text-white/40 text-sm font-semibold">No leave requests in this category.</Text>
            </GlassCard>
          ) : (
            filteredLeaves.map((l) => (
              <GlassCard key={l.id} className="p-5 border border-white/10" intensity="low">
                {/* Staff Profile Row */}
                <View className="flex-row items-center gap-4 mb-4 pb-4 border-b border-white/5">
                  <Image 
                    source={{ uri: l.avatar }} 
                    className="w-14 h-14 rounded-2xl border border-white/10"
                    style={{ resizeMode: 'cover' }}
                  />
                  <View>
                    <Text className="text-white font-bold text-base">{l.name}</Text>
                    <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider mt-0.5">{l.role}</Text>
                  </View>
                </View>

                {/* Details Section */}
                <View className="gap-3 mb-5">
                  <View className="flex-row items-center justify-between">
                    <View className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                      <Text className="text-[#ffb4ab] text-[10px] font-bold uppercase tracking-wider">{l.type}</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <Calendar size={14} color="#ffe5a0" />
                      <Text className="text-white text-xs">{l.dates}</Text>
                    </View>
                  </View>

                  <View className="flex-row gap-3 items-center mt-1">
                    <View className="bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
                      <Text className="text-white/40 text-[9px] font-bold uppercase tracking-widest">DURATION</Text>
                      <Text className="text-[#ffe5a0] font-bold text-base mt-0.5">{l.days}</Text>
                    </View>
                    
                    <View className="flex-1 flex-row gap-2 items-start bg-white/5 border border-white/5 p-3 rounded-xl min-h-[50px]">
                      <FileText size={14} color="rgba(255,255,255,0.4)" style={{ marginTop: 2 }} />
                      <Text className="text-[#d1c5ac] text-xs leading-relaxed italic flex-1 pr-1" numberOfLines={2}>
                        "{l.reason}"
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action buttons (only for pending tab) */}
                {l.status === 'pending' && (
                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => handleAction(l.id, l.name, 'approved')}
                      className="flex-1 bg-[#41eec2] py-3.5 rounded-xl items-center justify-center flex-row gap-2 active:scale-95 shadow-[0_0_12px_rgba(65,238,194,0.3)]"
                    >
                      <CheckCircle2 size={14} color="#00382b" />
                      <Text className="text-[#00382b] font-bold text-xs uppercase tracking-wider">Approve</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleAction(l.id, l.name, 'rejected')}
                      className="flex-1 border border-red-500/30 bg-red-500/10 py-3.5 rounded-xl items-center justify-center flex-row gap-2 active:scale-95"
                    >
                      <XCircle size={14} color="#ffb4ab" />
                      <Text className="text-[#ffb4ab] font-bold text-xs uppercase tracking-wider">Reject</Text>
                    </Pressable>
                  </View>
                )}

                {/* Completed Banner */}
                {l.status !== 'pending' && (
                  <View className="py-2.5 rounded-xl bg-white/5 border border-white/10 items-center justify-center flex-row gap-2">
                    {l.status === 'approved' ? (
                      <>
                        <CheckCircle2 size={14} color="#41eec2" />
                        <Text className="text-[#41eec2] font-bold text-xs uppercase tracking-wider">Approved Leave</Text>
                      </>
                    ) : (
                      <>
                        <XCircle size={14} color="#ffb4ab" />
                        <Text className="text-[#ffb4ab] font-bold text-xs uppercase tracking-wider">Rejected Leave</Text>
                      </>
                    )}
                  </View>
                )}

              </GlassCard>
            ))
          )}
        </View>

      </ScrollView>
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
              backgroundColor: '#16191b',
              borderRadius: 28,
              shadowColor: customAlert.type === 'approved' ? '#41eec2' : '#ffb4ab',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            {/* Header Icon */}
            <View className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center ${
              customAlert.type === 'approved' 
                ? 'bg-[#41eec2]/10 border border-[#41eec2]/20' 
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              {customAlert.type === 'approved' ? (
                <CheckCircle2 size={24} color="#41eec2" />
              ) : (
                <XCircle size={24} color="#ffb4ab" />
              )}
            </View>

            {/* Title & Message */}
            <Text className="text-white text-lg font-bold font-display-md text-center mb-2">
              {customAlert.title}
            </Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-6 px-1">
              {customAlert.message}
            </Text>

            {/* Action Button */}
            <Pressable
              onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
              className="w-full py-3.5 rounded-xl bg-[#f0c110] items-center active:scale-95 shadow-md shadow-[#f0c110]/30"
            >
              <Text className="text-[#000] text-xs font-bold uppercase tracking-wider">Dismiss</Text>
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
    backgroundColor: '#101415',
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LeaveApprovalsScreen;
