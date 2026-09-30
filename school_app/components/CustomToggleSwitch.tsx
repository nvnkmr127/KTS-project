import React, { useEffect, useRef } from 'react';
import { Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';

export interface CustomToggleSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  activeTrackColor?: string;
  inactiveTrackColor?: string;
  activeThumbColor?: string;
  inactiveThumbColor?: string;
  activeBorderColor?: string;
  inactiveBorderColor?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

export const CustomToggleSwitch: React.FC<CustomToggleSwitchProps> = ({
  value,
  onValueChange,
  activeTrackColor = '#00f1a1',
  inactiveTrackColor = '#27272a',
  activeThumbColor = '#ffffff',
  inactiveThumbColor = '#a1a1aa',
  activeBorderColor = '#00f1a1',
  inactiveBorderColor = 'rgba(255, 255, 255, 0.15)',
  style,
  disabled = false,
}) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      damping: 18,
      stiffness: 240,
      mass: 0.8,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveTrackColor, activeTrackColor],
  });

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveBorderColor, activeBorderColor],
  });

  const thumbColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveThumbColor, activeThumbColor],
  });

  return (
    <Pressable
      onPress={() => {
        if (!disabled) {
          onValueChange(!value);
        }
      }}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[styles.container, style]}
    >
      <Animated.View
        style={[
          styles.track,
          {
            backgroundColor,
            borderColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX }],
              backgroundColor: thumbColor,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 3,
  },
});

export default CustomToggleSwitch;
