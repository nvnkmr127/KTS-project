import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';

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
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  const accentColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryColor = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const glowColors: [string, string] = isSuperAdmin ? ['rgba(245, 197, 24, 0.15)', 'transparent'] : ['rgba(0, 241, 161, 0.15)', 'transparent'];
  
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 12 : 16) + (Platform.OS === 'android' ? 8 : 4);

  return (
    <View style={{ zIndex: 50 }}>
      {/* Top App Bar */}
      <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: topPadding }]}>
        <View className="flex-row items-center gap-2.5 flex-1 mr-2">
          {onBackPress && (
            <Pressable 
              onPress={onBackPress} 
              className="mr-0.5 active:opacity-60"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={24} color={accentColor} />
            </Pressable>
          )}

          {onIconPress ? (
            <Pressable onPress={onIconPress} className="active:opacity-70">
              {icon}
            </Pressable>
          ) : (
            icon
          )}

          <View className="flex-1">
            <Text numberOfLines={1} adjustsFontSizeToFit className={`font-bold text-white ${subtitle ? 'text-base md:text-lg' : 'text-sm md:text-base tracking-tight'}`}>{title}</Text>
            {subtitle && (
              <Text numberOfLines={1} className={`text-[8.5px] md:text-[9px] uppercase tracking-[0.12em] font-bold ${isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]'}`}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {rightAction ? (
          rightAction
        ) : onNotificationPress ? (
          <Pressable 
            onPress={onNotificationPress}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center relative active:bg-white/10 shadow-[0_0_10px_rgba(0,241,161,0.1)]"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Bell size={18} color={primaryColor} />
            {unreadCount > 0 && (
              <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#ff516a] rounded-full items-center justify-center shadow-[0_0_6px_rgba(255,81,106,0.8)]" />
            )}
          </Pressable>
        ) : null}
      </BlurView>
      
      {/* The glowing shadow below the line */}
      <LinearGradient 
        colors={glowColors} 
        style={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 15 }}
        pointerEvents="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default AdminStaffHeader;

