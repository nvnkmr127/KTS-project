import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';

interface AdminStaffHeaderProps {
  onBackPress?: () => void;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  rightAction?: React.ReactNode;
}

export const AdminStaffHeader: React.FC<AdminStaffHeaderProps> = ({ 
  onBackPress,
  title,
  subtitle,
  icon,
  rightAction
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ zIndex: 50 }}>
      {/* Top App Bar */}
      <BlurView intensity={30} tint="dark" style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 28 : 20) }]}>
        <View className="flex-row items-center gap-3">
          {onBackPress && (
            <Pressable onPress={onBackPress} className="mr-1">
              <ChevronLeft size={24} color="#00f1a1" />
            </Pressable>
          )}
          {icon}
          <View>
            <Text className={`font-bold text-white ${subtitle ? 'text-xl font-display-lg' : 'text-lg tracking-tight'}`}>{title}</Text>
            {subtitle && <Text className="text-[9px] uppercase tracking-[0.2em] text-[#00f1a1]">{subtitle}</Text>}
          </View>
        </View>

        {rightAction}
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
