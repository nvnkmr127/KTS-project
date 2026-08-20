import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { InteractiveButton } from '../../components/InteractiveButton';
import { Shield, BookOpen, Truck, MessageSquare } from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';

const slides = [
  {
    title: "Elite School ERP",
    desc: "A premium, unified hub connecting parents, teachers, and admins with enterprise-grade flow.",
    icon: Shield,
    color: "#4F46E5"
  },
  {
    title: "Academic Analytics",
    desc: "Detailed mark sheets, real-time homework status, subject performance analysis, and rankings.",
    icon: BookOpen,
    color: "#7C3AED"
  },
  {
    title: "Fleet Tracking",
    desc: "Live GPS tracking of school buses with real-time ETA, route visualization, and driver details.",
    icon: Truck,
    color: "#1E3A8A"
  },
  {
    title: "Secure Messaging",
    desc: "Instant communication channels between parents and teachers with encrypted attachments.",
    icon: MessageSquare,
    color: "#10B981"
  }
];

export const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const setOnboarded = useAuthStore((state) => state.setOnboarded);
  const insets = useSafeAreaInsets();
  const { isSmallPhone } = useResponsive();

  const handleNext = () => {
    if (activeIdx < slides.length - 1) {
      setActiveIdx(activeIdx + 1);
    } else {
      setOnboarded(true);
      navigation.replace('Login');
    }
  };

  const ActiveIcon = slides[activeIdx].icon;

  return (
    <View className="flex-1 bg-brand-darkNavy">
      <ScrollView 
        contentContainerStyle={{ 
          flexGrow: 1, 
          justifyContent: 'space-between',
          paddingTop: Math.max(insets.top, 16) + 8,
          paddingBottom: Math.max(insets.bottom, 16) + 12,
          paddingHorizontal: isSmallPhone ? 16 : 24,
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-white text-xl font-bold tracking-wider">EduVision</Text>
          <Pressable 
            onPress={() => { setOnboarded(true); navigation.replace('Login'); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="text-white/60 text-sm font-semibold">Skip</Text>
          </Pressable>
        </View>

        {/* Slide Content */}
        <View className="items-center my-auto py-6">
          <View
            style={{ backgroundColor: `${slides[activeIdx].color}20` }}
            className={`${isSmallPhone ? 'p-6 mb-6' : 'p-8 mb-8'} rounded-full border border-white/10`}
          >
            <ActiveIcon size={isSmallPhone ? 56 : 72} color={slides[activeIdx].color} strokeWidth={1.5} />
          </View>
          <Text className={`text-white ${isSmallPhone ? 'text-2xl' : 'text-3xl'} font-extrabold text-center mb-3 px-4`}>
            {slides[activeIdx].title}
          </Text>
          <Text className={`text-white/60 ${isSmallPhone ? 'text-sm' : 'text-base'} text-center px-4 leading-6 max-w-md`}>
            {slides[activeIdx].desc}
          </Text>
        </View>

        {/* Footer Controls */}
        <View className="mt-6">
          {/* Indicators */}
          <View className="flex-row justify-center gap-2 mb-6">
            {slides.map((_, idx) => (
              <View
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === activeIdx ? 'w-6 bg-brand-indigo' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </View>

          {/* Action Button */}
          <InteractiveButton
            onPress={handleNext}
            title={activeIdx === slides.length - 1 ? "Get Started" : "Continue"}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default OnboardingScreen;


