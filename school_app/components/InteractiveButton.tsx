import React from 'react';
import { Pressable, Text, ViewStyle, TextStyle, ActivityIndicator, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface InteractiveButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'glass' | 'superadmin' | 'admin';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
  loading = false,
  icon,
  className = '',
  accessibilityLabel,
}) => {
  const scale = useSharedValue(1);
  const isInteractive = !disabled && !loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isInteractive) scale.value = withSpring(0.96, { damping: 10, stiffness: 200 });
  };

  const handlePressOut = () => {
    if (isInteractive) scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  const getVariantStyles = () => {
    if (disabled) return "bg-gray-600/60 opacity-60 border border-white/5";
    switch (variant) {
      case 'superadmin':
        return 'bg-[#8B5CF6] shadow-lg shadow-purple-600/40 border border-purple-400/30';
      case 'admin':
        return 'bg-[#10B981] shadow-lg shadow-emerald-600/40 border border-emerald-400/30';
      case 'secondary':
        return 'bg-brand-indigo shadow-md shadow-brand-indigo/30';
      case 'accent':
        return 'bg-brand-emerald shadow-md shadow-brand-emerald/30';
      case 'glass':
        return 'bg-white/10 border border-white/20 shadow-sm';
      case 'primary':
      default:
        return 'bg-brand-blue shadow-lg shadow-brand-blue/40 border border-blue-400/20';
    }
  };

  return (
    <AnimatedPressable
      onPress={isInteractive ? onPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={[animatedStyle, style]}
      className={`py-3.5 px-5 md:py-4 md:px-6 rounded-2xl min-h-[50px] flex-row items-center justify-center ${getVariantStyles()} ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && <View className="mr-2.5">{icon}</View>}
          <Text
            style={textStyle}
            className="font-bold text-center text-sm md:text-base tracking-wide text-white"
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

export default InteractiveButton;

