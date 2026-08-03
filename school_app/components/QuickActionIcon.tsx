import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { GlassCard } from './GlassCard';

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
  return (
    <Pressable onPress={onPress} className="items-center w-1/4 mb-5">
      <GlassCard intensity="low" className="p-4 rounded-2xl mb-2 items-center justify-center border-[#00f1a1]/20 bg-[#101415]/80 shadow-[0_4px_10px_rgba(0,241,161,0.1)]">
        {icon}
      </GlassCard>
      <Text className="text-white/80 text-[10px] text-center px-1 font-semibold" numberOfLines={2}>
        {title}
      </Text>
    </Pressable>
  );
};
