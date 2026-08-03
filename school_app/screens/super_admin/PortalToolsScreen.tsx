import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Image, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Settings, Shield, RefreshCw, LogOut, HardDrive, Cpu, Terminal, Key } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../store/useAuthStore';
import { GlassCard } from '../../components/GlassCard';

export const PortalToolsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((state) => state.logout);
  const [backingUp, setBackingUp] = useState(false);
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const handleBackup = () => {
    setBackingUp(true);
    setTimeout(() => {
      setBackingUp(false);
      setCustomAlert({
        visible: true,
        title: 'Database Backup Complete',
        message: 'Secure system database snapshot created and pushed to encrypted cloud archive (Snapshot ID: db_snap_e49a).',
      });
    }, 2000);
  };

  const sysConfigs = [
    { label: 'Academic Year', value: '2024 - 2025', icon: Terminal },
    { label: 'System Version', value: 'v2.4.0 (Expo SDK 56)', icon: Cpu },
    { label: 'Server Region', value: 'AP-South-1 (Online)', icon: HardDrive },
    { label: 'Encryption Standard', value: 'AES-256 Protocols', icon: Key },
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
        {/* Top App Bar */}
        <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 28 : 20) }]}>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => navigation.goBack()} className="p-1 active:scale-95">
              <ChevronLeft size={24} color="#ffe5a0" />
            </Pressable>
            <Text className="text-xl font-bold text-white font-display-lg">Portal Settings</Text>
          </View>
        </BlurView>
        
        {/* The glowing shadow below the line */}
        <LinearGradient 
          colors={['rgba(245, 197, 24, 0.15)', 'transparent']} 
          style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
          pointerEvents="none"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card Header */}
        <View className="px-5 mb-6">
          <GlassCard className="p-5 border border-white/10 flex-row items-center gap-4" intensity="low">
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7FczfnKSVZ91VRiIfuBtOEhmA6JLz4YPSk40CQrAgXsqPb5NWWdCqqmzVpJNDpnxQSdecTP5pe54DRMCbFkMlfR4K5JBMwr9Z9rd-f_05dfhdy0ThMgGq6naYJfCjz3amVCvWhbnfwiSLhYOXSuGF55kpWsfljF4nv2FiNP_5euYTdpm0iAi6VVUFf6QUENV0LTmHNXvfAU9c2xBiXHTKJ_79usdMqTNH6H7v68K2SpfvOTvVJlisZuBp-236LvhLC0HnSYL9q8Sc' }} 
              className="w-16 h-16 rounded-2xl border border-white/10"
              style={{ resizeMode: 'cover' }}
            />
            <View className="flex-1 pr-2">
              <Text className="text-white font-bold text-lg">Dr. Aris Thorne</Text>
              <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider mt-0.5">Super Administrator</Text>
              <Text className="text-white/40 text-[10px] font-semibold mt-1">ID: ED-001 • System Live</Text>
            </View>
          </GlassCard>
        </View>

        <View className="px-5 mb-8 gap-5">
          {/* Security Standards Section */}
          <GlassCard className="p-5 border border-white/10" intensity="low">
            <View className="flex-row items-center gap-3 mb-4">
              <Shield size={20} color="#ffe5a0" />
              <Text className="text-white font-bold text-base">Security Standards</Text>
            </View>
            <Text className="text-[#d1c5ac] text-xs leading-relaxed mb-5">
              Portal operations are fully encrypted using military-grade AES-256 protocols. Automated database snapshot backups occur daily at 00:00 UTC.
            </Text>
            
            <Pressable
              onPress={handleBackup}
              disabled={backingUp}
              className="bg-white/5 border border-white/10 py-3.5 rounded-2xl items-center justify-center flex-row gap-2 active:scale-95"
            >
              {backingUp ? (
                <ActivityIndicator size="small" color="#ffe5a0" />
              ) : (
                <RefreshCw size={14} color="#ffe5a0" />
              )}
              <Text className="text-[#ffe5a0] text-xs font-bold uppercase tracking-wider">
                {backingUp ? 'Backing up Database...' : 'Backup Database Now'}
              </Text>
            </Pressable>
          </GlassCard>

          {/* Configuration Tools Card */}
          <GlassCard className="p-5 border border-white/10" intensity="low">
            <View className="flex-row items-center gap-3 mb-5">
              <Settings size={20} color="#ffe5a0" />
              <Text className="text-white font-bold text-base">System Configurations</Text>
            </View>
            
            <View className="gap-4">
              {sysConfigs.map((config, idx) => {
                const Icon = config.icon;
                return (
                  <View key={idx} className="flex-row items-center justify-between py-1 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                    <View className="flex-row items-center gap-3">
                      <View className="w-8 h-8 rounded-lg bg-white/5 items-center justify-center border border-white/5">
                        <Icon size={14} color="#ffe5a0" />
                      </View>
                      <Text className="text-[#d1c5ac] text-xs font-semibold">{config.label}</Text>
                    </View>
                    <Text className="text-white font-bold text-xs">{config.value}</Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>

          {/* Logout Action */}
          <Pressable 
            onPress={logout}
            className="border border-red-500/30 bg-red-500/10 p-5 rounded-[24px] flex-row items-center justify-center gap-3 active:scale-95"
          >
            <LogOut size={18} color="#ffb4ab" />
            <Text className="text-[#ffb4ab] font-bold text-sm uppercase tracking-wider">Sign Out of Account</Text>
          </Pressable>
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
              shadowColor: '#f0c110',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            {/* Header Icon */}
            <View className="w-12 h-12 rounded-2xl mb-4 items-center justify-center bg-[#41eec2]/10 border border-[#41eec2]/20">
              <Shield size={24} color="#41eec2" />
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
