import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useResponsive } from '../utils/responsive';

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
  unreadCount = 0
}) => {
  const { user } = useAuthStore();
  const { headerPaddingTop, isSmallPhone, isTablet, horizontalPadding } = useResponsive();
  const isSuperAdmin = user?.role === 'super_admin';

  const accentColor = isSuperAdmin ? '#ffe5a0' : '#00f1a1';
  const primaryColor = isSuperAdmin ? '#f0c110' : '#00f1a1';
  const glowColors: [string, string] = isSuperAdmin 
    ? ['rgba(245, 197, 24, 0.18)', 'transparent'] 
    : ['rgba(0, 241, 161, 0.18)', 'transparent'];

  return (
    <View style={{ zIndex: 50 }}>
      {/* Top App Bar */}
      <BlurView 
        intensity={35} 
        tint="dark" 
        style={[
          styles.header, 
          { 
            paddingTop: headerPaddingTop,
            paddingHorizontal: horizontalPadding,
            maxWidth: isTablet ? 720 : undefined,
            alignSelf: isTablet ? 'center' : undefined,
            width: '100%',
          }
        ]}
      >
        <View className="flex-row items-center gap-2 flex-1 min-w-0 mr-2">
          {onBackPress && (
            <Pressable 
              onPress={onBackPress} 
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="w-10 h-10 -ml-1.5 items-center justify-center rounded-full active:bg-white/10 active:opacity-70"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ChevronLeft size={24} color={accentColor} />
            </Pressable>
          )}

          {onIconPress ? (
            <Pressable 
              onPress={onIconPress} 
              accessibilityRole="button"
              className="active:opacity-70 justify-center items-center"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {icon}
            </Pressable>
          ) : (
            <View className="justify-center items-center">
              {icon}
            </View>
          )}

          <View className="flex-1 min-w-0 justify-center">
            <Text 
              numberOfLines={1} 
              adjustsFontSizeToFit 
              minimumFontScale={0.9}
              className="font-extrabold text-white text-lg md:text-xl tracking-tight"
            >
              {title}
            </Text>
            {subtitle && (
              <Text 
                numberOfLines={1} 
                className={`text-xs uppercase tracking-wider font-bold mt-0.5 ${
                  isSuperAdmin ? 'text-[#ffe5a0]' : 'text-[#00f1a1]'
                }`}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {rightAction ? (
          <View className="flex-shrink-0 justify-center items-center">
            {rightAction}
          </View>
        ) : onNotificationPress ? (
          <Pressable 
            onPress={onNotificationPress}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center relative active:bg-white/15"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Bell size={22} color={primaryColor} />
            {unreadCount > 0 && (
              <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#ff516a] rounded-full items-center justify-center shadow-[0_0_6px_rgba(255,81,106,0.8)]" />
            )}
          </Pressable>
        ) : null}
      </BlurView>
      
      {/* The glowing shadow below the line */}
      <LinearGradient 
        colors={glowColors} 
        style={{ position: 'absolute', bottom: -14, left: 0, right: 0, height: 14 }}
        pointerEvents="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default AdminStaffHeader;
