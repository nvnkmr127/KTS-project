import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Shield } from 'lucide-react-native';

export const SplashScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 90 });
    opacity.value = withTiming(1, { duration: 1000 });

    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-brand-darkNavy">
      <Animated.View style={logoStyle} className="items-center justify-center">
        <View className="p-6 bg-white/10 rounded-3xl border border-white/20 shadow-2xl">
          <Shield size={64} color="#FFFFFF" strokeWidth={1.5} />
        </View>
        <Text className="text-white text-3xl font-extrabold mt-6 tracking-wider">EduVision</Text>
        <Text className="text-white/60 text-xs font-semibold uppercase tracking-widest mt-2">Elite Campus Management</Text>
      </Animated.View>
    </View>
  );
};

export default SplashScreen;

