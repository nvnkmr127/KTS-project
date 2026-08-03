import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'low' | 'medium' | 'high';
  glowColor?: string;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 'medium',
  glowColor,
  className
}) => {
  const getBackgroundColor = () => {
    switch (intensity) {
      case 'low':
        return 'rgba(255, 255, 255, 0.08)';
      case 'high':
        return 'rgba(255, 255, 255, 0.22)';
      case 'medium':
      default:
        return 'rgba(255, 255, 255, 0.14)';
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          shadowColor: glowColor || 'rgba(30, 58, 138, 0.25)',
        },
        style
      ]}
      className={className}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: Platform.OS === 'android' ? 0 : 8,
    overflow: 'hidden',
  },
});
export default GlassCard;
