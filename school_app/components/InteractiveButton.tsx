import React from 'react';
import { Pressable, Text, ViewStyle, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface InteractiveButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'glass';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  className?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
  className = '',
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) scale.value = withSpring(0.96, { damping: 10, stiffness: 200 });
  };

  const handlePressOut = () => {
    if (!disabled) scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  const getVariantStyles = () => {
    if (disabled) return "bg-gray-400 opacity-60";
    switch (variant) {
      case 'secondary':
        return 'bg-brand-indigo shadow-md shadow-brand-indigo/30';
      case 'accent':
        return 'bg-brand-emerald shadow-md shadow-brand-emerald/30';
      case 'glass':
        return 'bg-white/20 border border-white/20 shadow-sm';
      case 'primary':
      default:
        return 'bg-brand-blue shadow-lg shadow-brand-blue/40';
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, style]}
      className={`py-4 px-6 rounded-2xl flex items-center justify-center ${getVariantStyles()} ${className}`}
    >
      <Text
        style={textStyle}
        className={`font-semibold text-center tracking-wide ${
          variant === 'glass' ? 'text-white' : 'text-white'
        }`}
      >
        {title}
      </Text>
    </AnimatedPressable>
  );
};

export default InteractiveButton;
