import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { GlassCard } from './GlassCard';

interface AdminStatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: string;
  progress?: number; // 0 to 1
  isGlowing?: boolean;
  onPress?: () => void;
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  trend,
  progress,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-1"
      style={({ pressed }) => [
        {
          transform: [{ scale: pressed ? 0.96 : 1 }],
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <GlassCard 
        intensity="low" 
        className="p-4 flex-1 bg-[#101415]/80 border border-[#00f1a1]/20"
      >
        <View className="flex-row justify-between items-start mb-3">
          <Text numberOfLines={1} className="text-white/70 text-xs font-semibold tracking-wider uppercase flex-1 mr-2">{title}</Text>
          <View className="items-center justify-center p-1.5 rounded-lg bg-white/5 border border-white/10">
            {icon}
          </View>
        </View>
        <Text numberOfLines={1} className="text-white text-2xl font-bold mb-1">{value}</Text>
        
        {progress !== undefined && (
          <View className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
            <View 
              className="h-full bg-[#00f1a1] rounded-full shadow-[0_0_8px_#00f1a1]" 
              style={{ width: `${progress * 100}%` }} 
            />
          </View>
        )}

        {subtitle && !trend && (
          <Text numberOfLines={1} className="text-white/50 text-xs mt-1">{subtitle}</Text>
        )}
        
        {trend && (
          <View className="flex-row items-center mt-1 flex-wrap">
            <Text className="text-[#00f1a1] text-[10px] font-bold mr-1">↗ {trend}</Text>
            {subtitle && <Text className="text-white/50 text-[10px]">{subtitle}</Text>}
          </View>
        )}
      </GlassCard>
    </Pressable>
  );
};
