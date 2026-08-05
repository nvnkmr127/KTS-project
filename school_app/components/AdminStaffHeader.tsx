import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Bell } from 'lucide-react-native';

interface AdminStaffHeaderProps {
  onBackPress?: () => void;
  onIconPress?: () => void;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  rightAction?: React.ReactNode;
  onNotificationPress?: () => void;
  unreadCount?: number;
}

export const AdminStaffHeader: React.FC<AdminStaffHeaderProps> = ({ 
  onBackPress,
  onIconPress,
  title,
  subtitle,
  icon,
  rightAction,
  onNotificationPress,
  unreadCount = 3
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ zIndex: 50 }}>
      {/* Top App Bar */}
      <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 28 : 20) }]}>
        <View className="flex-row items-center gap-3">
          {onBackPress && (
            <Pressable onPress={onBackPress} className="mr-1 active:opacity-60">
              <ChevronLeft size={24} color="#00f1a1" />
            </Pressable>
          )}

          {onIconPress ? (
            <Pressable onPress={onIconPress} className="active:opacity-70">
              {icon}
            </Pressable>
          ) : (
            icon
          )}

          <View>
            <Text className={`font-bold text-white ${subtitle ? 'text-xl font-display-lg' : 'text-lg tracking-tight'}`}>{title}</Text>
            {subtitle && <Text className="text-[9px] uppercase tracking-[0.2em] text-[#00f1a1]">{subtitle}</Text>}
          </View>
        </View>

        {rightAction ? (
          rightAction
        ) : onNotificationPress ? (
          <Pressable 
            onPress={onNotificationPress}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center relative active:bg-white/10 shadow-[0_0_10px_rgba(0,241,161,0.1)]"
          >
            <Bell size={18} color="#00f1a1" />
            {unreadCount > 0 && (
              <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#ff516a] rounded-full items-center justify-center shadow-[0_0_6px_rgba(255,81,106,0.8)]" />
            )}
          </Pressable>
        ) : null}
      </BlurView>
      
      {/* The glowing shadow below the line */}
      <LinearGradient 
        colors={['rgba(0, 241, 161, 0.15)', 'transparent']} 
        style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
        pointerEvents="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default AdminStaffHeader;
