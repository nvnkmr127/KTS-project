import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Modal, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, FileText, CheckCircle2, XCircle, Clock, UserCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AdminStaffHeader } from '../../components/AdminStaffHeader';
import { GlassCard } from '../../components/GlassCard';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminStaffLeavesScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'approved' as 'approved' | 'rejected',
  });

  // Handle Hardware Back Button & System Back Gesture
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (customAlert.visible) {
          setCustomAlert(prev => ({ ...prev, visible: false }));
          return true;
        }
        if (navigation?.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [customAlert.visible, navigation])
  );

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
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'
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
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150'
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
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150'
    }
  ];

  const [leaves, setLeaves] = useState(initialLeaves);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await api.getResources('leaves');
        if (Array.isArray(res) && res.length > 0) {
          const mapped = res.map((l: any) => ({
            id: String(l.id),
            name: l.applicant_name || l.user_name || l.staff_name || 'Staff Member',
            role: l.designation || l.department || 'Faculty',
            type: (l.leave_type || l.type || 'CASUAL LEAVE').toUpperCase(),
            dates: l.start_date ? `${l.start_date} - ${l.end_date || l.start_date}` : 'Oct 12 - Oct 15',
            days: l.days ? `${l.days} Days` : '1 Day',
            reason: l.reason || 'Leave request submitted via portal.',
            status: (l.status || 'pending').toLowerCase() as any,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
          }));
          setLeaves(mapped);
        }
      } catch (err) {
        console.log('Error fetching leaves:', err);
      }
    };
    fetchLeaves();
  }, []);

  const handleAction = async (id: string, name: string, status: 'approved' | 'rejected') => {
    try {
      await api.updateResource('leaves', id, { status });
    } catch (e) {
      console.log('Error updating leave status in DB:', e);
    }

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

  const primaryColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryGold = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const primaryTextClass = isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]';
  const primaryBtnClass = isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]';
  const primaryBadgeClass = isSuperAdmin ? 'bg-[#f0c110]/20 border border-[#f0c110]/40' : 'bg-[#00f1a1]/20 border border-[#00f1a1]/40';

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
        title="Staff Leaves Management"
        subtitle="Review & Process Absence Requests"
        icon={
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${primaryBadgeClass}`}>
            <Calendar size={20} color={primaryColor} />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View className="px-5 mb-5">
          <Text className="text-white text-xl font-extrabold">Faculty & Staff Absences</Text>
          <Text className="text-white/50 text-xs mt-0.5">Review and manage pending leave applications from teachers and staff members.</Text>
        </View>

        {/* Tab Selector */}
        <View className="px-5 mb-5">
          <View className="flex-row bg-[#101415]/90 p-1.5 rounded-2xl border border-white/10 w-full justify-between">
            <Pressable
              onPress={() => setActiveTab('pending')}
              className={`flex-1 py-3 rounded-xl items-center justify-center flex-row ${
                activeTab === 'pending' ? (isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]') : ''
              }`}
            >
              <Text className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'pending' ? 'text-[#101415]' : 'text-white/40'}`}>Pending</Text>
              <View className={`w-5 h-5 rounded-full items-center justify-center ml-1.5 ${activeTab === 'pending' ? 'bg-[#101415]/20' : 'bg-white/10'}`}>
                <Text className={`text-[10px] font-bold ${activeTab === 'pending' ? 'text-[#101415]' : 'text-white/60'}`}>{pendingCount}</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('approved')}
              className={`flex-1 py-3 rounded-xl items-center justify-center flex-row ${
                activeTab === 'approved' ? (isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]') : ''
              }`}
            >
              <Text className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'approved' ? 'text-[#101415]' : 'text-white/40'}`}>Approved</Text>
              <View className={`w-5 h-5 rounded-full items-center justify-center ml-1.5 ${activeTab === 'approved' ? 'bg-[#101415]/20' : 'bg-white/10'}`}>
                <Text className={`text-[10px] font-bold ${activeTab === 'approved' ? 'text-[#101415]' : 'text-white/60'}`}>{approvedCount}</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('rejected')}
              className={`flex-1 py-3 rounded-xl items-center justify-center flex-row ${
                activeTab === 'rejected' ? (isSuperAdmin ? 'bg-[#f0c110]' : 'bg-[#00f1a1]') : ''
              }`}
            >
              <Text className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'rejected' ? 'text-[#101415]' : 'text-white/40'}`}>Rejected</Text>
              <View className={`w-5 h-5 rounded-full items-center justify-center ml-1.5 ${activeTab === 'rejected' ? 'bg-[#101415]/20' : 'bg-white/10'}`}>
                <Text className={`text-[10px] font-bold ${activeTab === 'rejected' ? 'text-[#101415]' : 'text-white/60'}`}>{rejectedCount}</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Leaves List */}
        <View className="px-5 mb-8">
          {filteredLeaves.length === 0 ? (
            <GlassCard className="p-8 items-center justify-center border border-white/10 bg-[#101415]/90" intensity="low">
              <Text className="text-white/40 text-xs font-bold">No leave requests in this category.</Text>
            </GlassCard>
          ) : (
            filteredLeaves.map((l) => (
              <GlassCard key={l.id} className="p-4 mb-3.5 border border-white/10 bg-[#101415]/90" intensity="low">
                {/* Staff Profile Row */}
                <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-white/10">
                  <View className="flex-row items-center flex-1 mr-2">
                    <Image 
                      source={{ uri: l.avatar }} 
                      className="w-12 h-12 rounded-2xl border border-white/10 mr-3"
                      style={{ resizeMode: 'cover' }}
                    />
                    <View className="flex-1">
                      <Text className="text-white font-extrabold text-sm">{l.name}</Text>
                      <Text className={`${primaryTextClass} text-[10px] font-extrabold uppercase mt-0.5`}>{l.role}</Text>
                    </View>
                  </View>

                  <View className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40">
                    <Text className="text-rose-300 text-[9px] font-bold uppercase tracking-wider">{l.type}</Text>
                  </View>
                </View>

                {/* Details Section */}
                <View className="mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <Calendar size={13} color={primaryColor} style={{ marginRight: 4 }} />
                      <Text className="text-white text-xs font-bold">{l.dates}</Text>
                    </View>
                    <View className="bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg">
                      <Text className={`${primaryTextClass} font-bold text-xs`}>{l.days}</Text>
                    </View>
                  </View>

                  <View className="bg-black/40 border border-white/5 p-3 rounded-xl flex-row items-start">
                    <FileText size={13} color="rgba(255,255,255,0.4)" style={{ marginRight: 6, marginTop: 2 }} />
                    <Text className="text-white/70 text-xs leading-relaxed italic flex-1" numberOfLines={2}>
                      "{l.reason}"
                    </Text>
                  </View>
                </View>

                {/* Action buttons */}
                {l.status === 'pending' && (
                  <View className="flex-row" style={{ gap: 8 }}>
                    <Pressable
                      onPress={() => handleAction(l.id, l.name, 'approved')}
                      className={`flex-1 ${primaryBtnClass} py-3 rounded-xl items-center justify-center flex-row shadow-lg`}
                    >
                      <CheckCircle2 size={14} color="#101415" style={{ marginRight: 4 }} />
                      <Text className="text-[#101415] font-extrabold text-xs uppercase tracking-wider">Approve</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleAction(l.id, l.name, 'rejected')}
                      className="flex-1 border border-rose-500/40 bg-rose-500/15 py-3 rounded-xl items-center justify-center flex-row"
                    >
                      <XCircle size={14} color="#ff516a" style={{ marginRight: 4 }} />
                      <Text className="text-rose-400 font-extrabold text-xs uppercase tracking-wider">Reject</Text>
                    </Pressable>
                  </View>
                )}

                {/* Completed Status Banner */}
                {l.status !== 'pending' && (
                  <View className="py-2.5 rounded-xl bg-white/5 border border-white/10 items-center justify-center flex-row">
                    {l.status === 'approved' ? (
                      <>
                        <CheckCircle2 size={14} color="#00f1a1" style={{ marginRight: 4 }} />
                        <Text className="text-[#00f1a1] font-bold text-xs uppercase tracking-wider">Approved Leave</Text>
                      </>
                    ) : (
                      <>
                        <XCircle size={14} color="#ff516a" style={{ marginRight: 4 }} />
                        <Text className="text-rose-400 font-bold text-xs uppercase tracking-wider">Rejected Leave</Text>
                      </>
                    )}
                  </View>
                )}
              </GlassCard>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Dialog Alert Modal */}
      <Modal
        visible={customAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
      >
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <GlassCard
            className="w-full max-w-sm p-6 border border-white/10 items-center bg-[#101415] rounded-3xl"
            intensity="low"
          >
            <View className={`w-14 h-14 rounded-full mb-4 items-center justify-center border ${
              customAlert.type === 'approved' 
                ? 'bg-[#00f1a1]/20 border-[#00f1a1]/40' 
                : 'bg-rose-500/20 border-rose-500/40'
            }`}>
              {customAlert.type === 'approved' ? (
                <CheckCircle2 size={28} color="#00f1a1" />
              ) : (
                <XCircle size={28} color="#ff516a" />
              )}
            </View>

            <Text className="text-white text-lg font-extrabold text-center mb-1">
              {customAlert.title}
            </Text>
            <Text className="text-white/70 text-xs text-center leading-relaxed mb-6 px-1">
              {customAlert.message}
            </Text>

            <Pressable
              onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
              className="w-full py-3.5 rounded-xl bg-[#00f1a1] items-center shadow-[0_0_12px_rgba(0,241,161,0.4)]"
            >
              <Text className="text-[#101415] text-xs font-extrabold uppercase tracking-wider">Dismiss</Text>
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
    backgroundColor: '#0d2a24',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
});

export default AdminStaffLeavesScreen;
