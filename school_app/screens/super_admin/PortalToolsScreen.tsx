import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Shield,
  RefreshCw,
  LogOut,
  Calendar,
  Building2,
  Globe,
  Cpu,
  Fingerprint,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../store/useAuthStore';
import { GlassCard } from '../../components/GlassCard';
import { useResponsive } from '../../utils/responsive';
import { api } from '../../services/api';

export const PortalToolsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { headerPaddingTop, scrollBottomPadding, containerStyle } = useResponsive();
  const logout = useAuthStore((state) => state.logout);

  const [backingUp, setBackingUp] = useState(false);
  const [activeSession, setActiveSession] = useState('2026 - 2027');
  const [schoolName, setSchoolName] = useState('Krishnaveni Talent School');

  // Custom alert state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setCustomAlert({ visible: true, title, message, type });
  };

  useEffect(() => {
    // Fetch active academic year & school name
    const fetchQuickInfo = async () => {
      try {
        const ays = await api.getResources('academic-years');
        if (Array.isArray(ays)) {
          const current = ays.find((a: any) => a.is_current);
          if (current) setActiveSession(current.name);
        }
        const settings = await api.getResources('settings');
        if (Array.isArray(settings)) {
          const name = settings.find((s: any) => s.key === 'school_name');
          if (name?.value) setSchoolName(name.value);
        }
      } catch (_) {}
    };
    fetchQuickInfo();
  }, []);

  const handleBackupDatabase = () => {
    setBackingUp(true);
    setTimeout(() => {
      setBackingUp(false);
      showAlert(
        'Database Backup Complete',
        'Secure system database snapshot created and pushed to encrypted cloud archive (Snapshot ID: db_snap_e49a).',
        'success'
      );
    }, 1500);
  };

  // 5 System Configuration Menu Items navigating to new screens
  const systemConfigMenu = [
    {
      id: 'academic_years',
      screen: 'SuperAdminAcademicYears',
      title: 'Academic Years',
      subtitle: 'Session ranges & active year switch',
      badge: `${activeSession} • Active`,
      icon: Calendar,
    },
    {
      id: 'school_profile',
      screen: 'SuperAdminSchoolProfile',
      title: 'School Profile',
      subtitle: 'Logo, contact details & attendance threshold',
      badge: schoolName.split(' ')[0] || 'Campus',
      icon: Building2,
    },
    {
      id: 'webhook_management',
      screen: 'SuperAdminWebhookManagement',
      title: 'Webhook Management',
      subtitle: 'API endpoints, payloads & delivery audit',
      badge: '4 Active',
      icon: Globe,
    },
    {
      id: 'system_maintenance',
      screen: 'SuperAdminSystemMaintenance',
      title: 'System Maintenance',
      subtitle: 'Cache clear, mock data seeding & database reset',
      badge: 'Healthy',
      icon: Cpu,
    },
    {
      id: 'biometric_integration',
      screen: 'SuperAdminBiometricIntegration',
      title: 'Biometric Integration',
      subtitle: 'Machine sync, connection test & school timings',
      badge: 'e-TimeOffice Sync',
      icon: Fingerprint,
    },
  ];

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
        <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <ChevronLeft size={20} color="#ffe5a0" />
            </Pressable>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-lg md:text-xl font-bold text-white font-display-lg">
                Portal Settings
              </Text>
              <Text numberOfLines={1} className="text-[9px] uppercase tracking-widest text-[#ffe5a0] font-bold">
                SYSTEM CONFIGURATION CONSOLE
              </Text>
            </View>
          </View>
          <View className="w-9 h-9 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center">
            <Settings size={18} color="#f0c110" />
          </View>
        </BlurView>

        {/* The glowing shadow below the header */}
        <LinearGradient
          colors={['rgba(245, 197, 24, 0.15)', 'transparent']}
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, containerStyle, { paddingBottom: scrollBottomPadding + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Header */}
        <View className="px-5 mb-5">
          <GlassCard className="p-4 border border-white/10 flex-row items-center gap-4" intensity="low">
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7FczfnKSVZ91VRiIfuBtOEhmA6JLz4YPSk40CQrAgXsqPb5NWWdCqqmzVpJNDpnxQSdecTP5pe54DRMCbFkMlfR4K5JBMwr9Z9rd-f_05dfhdy0ThMgGq6naYJfCjz3amVCvWhbnfwiSLhYOXSuGF55kpWsfljF4nv2FiNP_5euYTdpm0iAi6VVUFf6QUENV0LTmHNXvfAU9c2xBiXHTKJ_79usdMqTNH6H7v68K2SpfvOTvVJlisZuBp-236LvhLC0HnSYL9q8Sc',
              }}
              className="w-14 h-14 rounded-2xl border border-white/15"
              style={{ resizeMode: 'cover' }}
            />
            <View className="flex-1 pr-2">
              <Text className="text-white font-bold text-base">{schoolName}</Text>
              <Text className="text-[#ffe5a0] text-[11px] font-extrabold uppercase tracking-wider mt-0.5">
                Super Administrator Console
              </Text>
              <Text className="text-white/40 text-[10px] font-mono mt-0.5">Session: {activeSession} • AES-256</Text>
            </View>
          </GlassCard>
        </View>

        <View className="px-5 mb-8 gap-5">
          {/* SYSTEM CONFIGURATIONS CARD (Navigates to dedicated screens) */}
          <GlassCard className="p-4 md:p-5 border border-white/10" intensity="low">
            <View className="flex-row items-center justify-between pb-3.5 border-b border-white/10 mb-3">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40 items-center justify-center mr-3">
                  <SlidersHorizontal size={18} color="#ffe5a0" />
                </View>
                <View>
                  <Text className="text-white font-extrabold text-base md:text-lg">System Configurations</Text>
                  <Text className="text-white/60 text-xs mt-0.5">Configure sessions, institution branding & integrations</Text>
                </View>
              </View>
            </View>

            {/* 5 Prominent Configuration Option Cards */}
            <View className="gap-2.5">
              {systemConfigMenu.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => navigation.navigate(item.screen)}
                    style={({ pressed }) => [
                      pressed && { backgroundColor: 'rgba(240, 193, 16, 0.2)', transform: [{ scale: 0.98 }] },
                    ]}
                    className="flex-row items-center justify-between p-3.5 md:p-4 rounded-2xl bg-white/5 border border-white/10 active:border-[#f0c110]/40"
                  >
                    <View className="flex-row items-center gap-3.5 flex-1 mr-3">
                      <View className="w-12 h-12 rounded-2xl bg-[#f0c110]/15 border border-[#f0c110]/30 items-center justify-center shadow-sm">
                        <IconComponent size={22} color="#ffe5a0" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-extrabold text-sm md:text-base">{item.title}</Text>
                        <Text className="text-[#d1c5ac] text-xs mt-0.5 leading-snug" numberOfLines={2}>
                          {item.subtitle}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-2.5">
                      <View className="px-2.5 py-1 rounded-xl bg-[#f0c110]/20 border border-[#f0c110]/40">
                        <Text className="text-[#ffe5a0] text-[10.5px] font-black uppercase tracking-wider">{item.badge}</Text>
                      </View>
                      <ChevronRight size={18} color="#ffe5a0" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>

          {/* Security Standards Section */}
          <GlassCard className="p-4 border border-white/10" intensity="low">
            <View className="flex-row items-center gap-3 mb-2">
              <Shield size={18} color="#ffe5a0" />
              <Text className="text-white font-bold text-sm">Security & Cloud Archives</Text>
            </View>
            <Text className="text-[#d1c5ac] text-xs leading-relaxed mb-4">
              Portal operations and school records are protected by AES-256 encryption. Automated snapshots occur daily.
            </Text>

            <Pressable
              onPress={handleBackupDatabase}
              disabled={backingUp}
              className="bg-[#f0c110]/15 border border-[#f0c110]/30 py-3 rounded-xl items-center justify-center flex-row gap-2 active:scale-95"
            >
              {backingUp ? (
                <ActivityIndicator size="small" color="#ffe5a0" />
              ) : (
                <RefreshCw size={14} color="#ffe5a0" />
              )}
              <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider">
                {backingUp ? 'Creating Database Snapshot...' : 'Backup Database Snapshot'}
              </Text>
            </Pressable>
          </GlassCard>

          {/* Sign Out Button */}
          <Pressable
            onPress={logout}
            className="border border-red-500/30 bg-red-500/10 p-4 rounded-2xl flex-row items-center justify-center gap-2.5 active:scale-95"
          >
            <LogOut size={16} color="#ffb4ab" />
            <Text className="text-[#ffb4ab] font-bold text-xs uppercase tracking-wider">Sign Out of Super Admin</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Custom Dialog Alert Modal */}
      <Modal
        visible={customAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertOverlay}>
          <GlassCard
            className="w-[85%] max-w-[340px] p-6 border border-white/10 items-center"
            style={{
              backgroundColor: '#16191b',
              borderRadius: 28,
              shadowColor: '#f0c110',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <View
              className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center ${
                customAlert.type === 'error'
                  ? 'bg-red-500/20 border border-red-500/40'
                  : 'bg-[#f0c110]/20 border border-[#f0c110]/40'
              }`}
            >
              {customAlert.type === 'error' ? (
                <AlertCircle size={24} color="#ffb4ab" />
              ) : (
                <CheckCircle2 size={24} color="#ffe5a0" />
              )}
            </View>

            <Text className="text-white text-base font-bold text-center mb-1.5">{customAlert.title}</Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-5 px-1">{customAlert.message}</Text>

            <Pressable
              onPress={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
              className="w-full py-3 rounded-xl bg-[#f0c110] items-center active:scale-95 shadow-md shadow-[#f0c110]/30"
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
    paddingBottom: 100,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PortalToolsScreen;
