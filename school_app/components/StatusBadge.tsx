import React from 'react';
import { View, Text } from 'react-native';

interface StatusBadgeProps {
  status: 'ACTIVE' | 'NEW' | 'CONTACTED' | 'FOLLOW-UP' | 'CONVERTED' | 'DROPPED' | 'UPCOMING' | 'DRAFT' | string;
  variant?: 'solid' | 'outline' | 'glass';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'glass' }) => {
  const getColors = () => {
    const s = status.toUpperCase();
    switch (s) {
      case 'ACTIVE':
      case 'NEW':
      case 'CONVERTED':
        return { text: 'text-emerald-300', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' };
      case 'CONTACTED':
      case 'UPCOMING':
        return { text: 'text-blue-300', bg: 'bg-blue-500/20', border: 'border-blue-500/30' };
      case 'FOLLOW-UP':
        return { text: 'text-amber-300', bg: 'bg-amber-500/20', border: 'border-amber-500/30' };
      case 'DROPPED':
      case 'DRAFT':
      default:
        return { text: 'text-white/60', bg: 'bg-white/10', border: 'border-white/20' };
    }
  };

  const colors = getColors();

  if (variant === 'solid') {
    return (
      <View className={`${colors.bg.replace('/20', '')} px-2.5 py-1 rounded-full`}>
        <Text className="text-white text-[10px] font-bold tracking-wider">{status.toUpperCase()}</Text>
      </View>
    );
  }

  return (
    <View className={`${colors.bg} ${colors.border} border px-2.5 py-0.5 rounded-full`}>
      <Text className={`${colors.text} text-[10px] font-bold tracking-wider`}>{status.toUpperCase()}</Text>
    </View>
  );
};
