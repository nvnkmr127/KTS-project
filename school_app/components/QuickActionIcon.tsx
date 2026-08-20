import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { GlassCard } from './GlassCard';
import { useResponsive } from '../utils/responsive';

interface QuickActionIconProps {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}

export const QuickActionIcon: React.FC<QuickActionIconProps> = ({
  title,
  icon,
  onPress,
}) => {
  const { isSmallPhone } = useResponsive();

  return (
    <Pressable 
      onPress={onPress} 
      className="items-center w-1/4 mb-4 px-1"
      style={({ pressed }) => [{
        transform: [{ scale: pressed ? 0.94 : 1 }],
        opacity: pressed ? 0.85 : 1,
      }]}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
    >
      <GlassCard 
        intensity="low" 
        className={`${isSmallPhone ? 'p-3' : 'p-3.5'} rounded-2xl mb-1.5 items-center justify-center border-[#00f1a1]/20 bg-[#101415]/80 shadow-[0_4px_10px_rgba(0,241,161,0.1)]`}
      >
        {icon}
      </GlassCard>
      <Text 
        className={`text-white/80 ${isSmallPhone ? 'text-[9px]' : 'text-[10px]'} text-center font-semibold leading-tight`} 
        numberOfLines={2}
        style={{ minHeight: isSmallPhone ? 24 : 26 }}
      >
        {title}
      </Text>
    </Pressable>
  );
};

