import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Bell, AlertTriangle, Info, Send, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../components/GlassCard';
import { mockNotifications } from '../../services/mockData';

export const NotificationCenterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'academic' | 'finance' | 'emergency'>('academic');
  const [notifications, setNotifications] = useState(mockNotifications);
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const handleBroadcast = () => {
    if (!broadcastMessage.trim()) {
      setCustomAlert({
        visible: true,
        title: 'Error',
        message: 'Broadcast message cannot be empty.',
        type: 'error',
      });
      return;
    }

    const priority = selectedCategory === 'emergency' ? 'high' : selectedCategory === 'finance' ? 'medium' : 'low';
    const newNotice = {
      id: `notice_${Date.now()}`,
      title: selectedCategory === 'emergency' ? 'Emergency Alert' : selectedCategory === 'finance' ? 'Financial Advisory' : 'Academic Notice',
      message: broadcastMessage,
      time: 'Just Now',
      category: selectedCategory,
      priority: priority,
    };

    setNotifications([newNotice, ...notifications]);
    setCustomAlert({
      visible: true,
      title: 'Notice Dispatched',
      message: 'Announcement successfully broadcast to all parent, student, and teacher dashboards.',
      type: 'success',
    });
    setBroadcastMessage('');
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'emergency':
        return <AlertTriangle size={18} color="#ffb4ab" />;
      case 'finance':
        return <Info size={18} color="#ffe5a0" />;
      case 'academic':
      default:
        return <Bell size={18} color="#41eec2" />;
    }
  };

  const getBorderColor = (priority: string) => {
    if (priority === 'high') return '#ffb4ab';
    if (priority === 'medium') return '#ffe5a0';
    return '#41eec2';
  };

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
            <Text className="text-xl font-bold text-white font-display-lg">Noticeboard Center</Text>
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
        
        {/* Broadcast Creator Panel */}
        <View className="px-5 mb-8">
          <GlassCard className="p-5 border border-white/10" intensity="low">
            <Text className="text-white text-base font-bold mb-3">Publish New Announcement</Text>
            
            <TextInput
              placeholder="Type message to broadcast to all portals..."
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={broadcastMessage}
              onChangeText={setBroadcastMessage}
              multiline
              numberOfLines={3}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm mb-4"
              style={{ textAlignVertical: 'top', minHeight: 80 }}
            />

            {/* Category selection */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[#d1c5ac] text-xs font-semibold">Category:</Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setSelectedCategory('academic')}
                  className={`px-3 py-1.5 rounded-full border ${
                    selectedCategory === 'academic' 
                      ? 'bg-[#41eec2]/10 border-[#41eec2]' 
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <Text className={`text-[9px] font-bold uppercase tracking-wider ${
                    selectedCategory === 'academic' ? 'text-[#41eec2]' : 'text-white/40'
                  }`}>Academic</Text>
                </Pressable>

                <Pressable
                  onPress={() => setSelectedCategory('finance')}
                  className={`px-3 py-1.5 rounded-full border ${
                    selectedCategory === 'finance' 
                      ? 'bg-[#ffe5a0]/10 border-[#ffe5a0]' 
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <Text className={`text-[9px] font-bold uppercase tracking-wider ${
                    selectedCategory === 'finance' ? 'text-[#ffe5a0]' : 'text-white/40'
                  }`}>Finance</Text>
                </Pressable>

                <Pressable
                  onPress={() => setSelectedCategory('emergency')}
                  className={`px-3 py-1.5 rounded-full border ${
                    selectedCategory === 'emergency' 
                      ? 'bg-[#ffb4ab]/10 border-[#ffb4ab]' 
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <Text className={`text-[9px] font-bold uppercase tracking-wider ${
                    selectedCategory === 'emergency' ? 'text-[#ffb4ab]' : 'text-white/40'
                  }`}>Emergency</Text>
                </Pressable>
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleBroadcast}
              className="bg-[#f0c110] py-3.5 rounded-2xl flex-row items-center justify-center gap-2 active:scale-95 shadow-[0_0_12px_rgba(240,193,16,0.3)]"
            >
              <Send size={14} color="#000" />
              <Text className="text-[#000] text-xs font-bold uppercase tracking-wider">Dispatch Broadcast</Text>
            </Pressable>
          </GlassCard>
        </View>

        {/* Noticeboard List */}
        <View className="px-5 mb-8">
          <Text className="text-white text-base font-bold mb-4">Active Notices & Bulletins</Text>

          <View className="gap-4">
            {notifications.map((not) => (
              <GlassCard
                key={not.id}
                className="p-4 border border-white/10"
                intensity="low"
                style={{ borderLeftWidth: 4, borderLeftColor: getBorderColor(not.priority) }}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-row items-center flex-1 mr-2">
                    {getIcon(not.category)}
                    <Text className="text-white font-bold text-sm ml-2.5">{not.title}</Text>
                  </View>
                  <Text className="text-white/40 text-[9px] font-semibold">{not.time}</Text>
                </View>
                <Text className="text-[#d1c5ac] text-xs leading-relaxed pl-7">{not.message}</Text>
              </GlassCard>
            ))}
          </View>
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
              shadowColor: customAlert.type === 'error' ? '#ef4444' : '#f0c110',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            {/* Header Icon */}
            <View className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center ${
              customAlert.type === 'error' 
                ? 'bg-red-500/10 border border-red-500/20' 
                : 'bg-[#41eec2]/10 border border-[#41eec2]/20'
            }`}>
              {customAlert.type === 'error' ? (
                <AlertTriangle size={24} color="#ffb4ab" />
              ) : (
                <CheckCircle2 size={24} color="#41eec2" />
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
    paddingBottom: 100,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 21, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationCenterScreen;
