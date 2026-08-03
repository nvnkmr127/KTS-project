import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Image, StyleSheet, Dimensions, Platform, Modal, Animated, Easing, LayoutAnimation, UIManager } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Reanimated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Bell,
  AlertTriangle,
  Phone,
  Check,
  MapPin,
  Bus,
  User,
  Clock,
  ChevronUp,
  ChevronDown
} from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';

const { width, height } = Dimensions.get('window');

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export const BusTrackingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Custom alert dialog state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showCustomAlert = (title: string, message: string) => {
    setCustomAlert({ visible: true, title, message });
  };

  const toggleCollapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCollapsed(prev => !prev);
  };

  const scale = useSharedValue(1.0);
  const savedScale = useSharedValue(1.0);

  const translateX = useSharedValue(-width * 0.75);
  const translateY = useSharedValue(-height * 0.3);

  const savedTranslateX = useSharedValue(-width * 0.75);
  const savedTranslateY = useSharedValue(-height * 0.3);

  const minX = -width * 1.8;
  const maxX = width * 0.3;
  const minY = -height * 1.2;
  const maxY = height * 0.2;

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(0.7, Math.min(savedScale.value * event.scale, 2.5));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = Math.max(minX, Math.min(savedTranslateX.value + event.translationX, maxX));
      translateY.value = Math.max(minY, Math.min(savedTranslateY.value + event.translationY, maxY));
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const gesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedMapStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [glowAnim]);





  const handleCallDriver = () => {
    showCustomAlert("Contacting Driver", "Dialing Raju Kumar at +91 98765 43210...");
  };

  return (
    <View style={styles.container}>
      {/* Map View background - scrollable/movable in 2D */}
      <View style={styles.mapCanvas}>
        <GestureDetector gesture={gesture}>
          <Reanimated.View style={[{ width: width * 2.5, height: height * 1.8, position: 'absolute' }, animatedMapStyle]}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfFEVZb9ZJYLf0wMtydaEImRRokxSf5Obxyk7SKnvvioXcAJw8QuF52hQOfHl4KV5w2XWR7WCKepxzJp1yEfd4zzVEJYpC8FLPyORqApYb91PuLOcwh5u86Uwb2jhIX0ifIlXfd7_ArtZRQrVv1XARKUKdlzF6YB8XtjBeFB7Yoc2VhlUxz96A7smP3dkm1o2Ei360ZX9Ua5ahbEguChSTWpuzFKXeHCzpzR_9T1enA1AjIOaMormBWpIYrnwoykIrSMAh1CShHbfB' }}
              style={{ width: '100%', height: '100%', opacity: 0.25 }}
              resizeMode="cover"
            />

            {/* Single continuous diagonal dashed route line */}
            <View
              style={{
                position: 'absolute',
                top: '38%',
                left: '-20%',
                width: '140%',
                height: 0,
                borderWidth: 2.5,
                borderColor: '#10B981',
                borderStyle: 'dashed',
                opacity: 0.65,
                transform: [{ rotate: '23deg' }]
              }}
            />
          </Reanimated.View>
        </GestureDetector>

        <LinearGradient
          colors={['rgba(13, 27, 42, 0.4)', '#0E0F26']}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      </View>

      {/* Top Header (Tab view style, no back button) */}
      <View style={styles.header}>
        <View className="flex-row items-center gap-3">
          <Pressable 
            onPress={() => navigation.navigate('StudentProfileDetails')}
            className="w-10 h-10 rounded-full overflow-hidden border border-white/20 active:scale-95"
          >
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMrIIqhz709VeW2BpRqLVg1j7U7Pl9daXfwRKA-2HDDgcA9W7mXSd5OKr4pnpdIm8PH7zmg2kpcIfjndCo00bTp-Axh-ozzk6NmCmBUgatneU-MIJXsqAP3jNupEJEVMnZddUdmfbtXx9Pf104uwZfzaiIwRgyJZ8fQhJHzGToBXPUzvkGYakj-ALyh-X-w-OuUIWQTLleEFRHfU4lEubjrHCKU1coc5G8ockGv2_JF5fyZw89gZymwweZDxq0LKQFld8hZ2gu1G6t' }}
              className="w-full h-full object-cover"
            />
          </Pressable>
          <View>
            <Text className="text-white/70 text-xs font-semibold">Good Morning,</Text>
            <Text className="text-white text-lg font-bold font-headline-md">{user?.name || 'Ramesh'} 👋</Text>
          </View>
        </View>
        <Pressable className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-95">
          <Bell size={20} color="#5E5CE6" />
        </Pressable>
      </View>



      {/* Floating Alerts Container */}
      <View style={styles.floatingAlerts} className="px-5 gap-3">
        {/* Delay Alert */}
        <View style={[styles.delayCard, { borderWidth: 1, borderRadius: 20 }]} className="overflow-hidden relative">
          <BlurView intensity={95} tint="dark" style={[StyleSheet.absoluteFillObject, { zIndex: -1 }]} />
          <View className="p-5 flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} color="#F87171" strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-[#F87171] font-bold text-[11px] uppercase tracking-widest font-headline-md">DELAY ALERT</Text>
              <Text className="text-white/80 text-[13px] font-semibold mt-1 leading-snug">
                Bus delayed 20 min —{"\n"}traffic near Hitech City
              </Text>
            </View>
          </View>
        </View>

        {/* ETA Badge */}
        <View style={{ position: 'relative', alignSelf: 'flex-start' }}>
          <Animated.View
            style={[
              styles.etaBadgeGlow,
              {
                opacity: glowAnim,
              }
            ]}
          />
          <View style={styles.etaBadge}>
            <Clock size={16} color="#34D399" strokeWidth={2.5} />
            <Text style={styles.etaText}>🚌 Arriving in 5 minutes</Text>
          </View>
        </View>
      </View>

      {/* Bottom Sheet Information Card with BlurView */}
      <View style={styles.bottomSheet} className="overflow-hidden">
        {/* Glow Background Layer */}
        <View style={[StyleSheet.absoluteFillObject, { zIndex: -2 }]}>
          {/* Base Dark Background (Translucent to let map show through) */}
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(19, 19, 26, 0.35)' }]} />

          {/* Horizontal Glow Gradient */}
          <LinearGradient
            colors={['rgba(94, 92, 230, 0.18)', 'rgba(19, 19, 26, 0)', 'rgba(34, 197, 94, 0.22)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Vertical Glow Gradient (fading glows out towards the bottom) */}
          <LinearGradient
            colors={['transparent', 'rgba(19, 19, 26, 0.35)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.85 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        <BlurView intensity={95} tint="dark" style={[StyleSheet.absoluteFillObject, { zIndex: -1 }]} />
        {/* Frosted Glass Highlight */}
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.10)',
            'rgba(255,255,255,0.03)',
            'rgba(255,255,255,0.01)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Handle */}
        <Pressable onPress={toggleCollapse} style={{ width: '100%', paddingVertical: 8, marginTop: -8 }}>
          <View style={{ 
            width: 48, 
            height: 6, 
            backgroundColor: 'rgba(255, 255, 255, 0.2)', 
            borderRadius: 3, 
            alignSelf: 'center', 
          }} />
        </Pressable>

        {/* Bus Primary Info */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCollapsed ? 0 : 16 }}>
          <Pressable onPress={toggleCollapse} style={{ flexDirection: 'row', gap: 16, flex: 1, paddingRight: 16, alignItems: 'center' }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: '#1E1B4B',
                borderWidth: 1.5,
                borderColor: 'rgba(196, 193, 251, 0.3)',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#C4C1FB',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 12,
                elevation: 8,
                overflow: 'visible',
              }}
            >
              <Bus size={30} color="#E3DFFF" strokeWidth={1.75} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#E5E1E6', fontFamily: 'Plus Jakarta Sans' }}>Bus No. 5</Text>
                {isCollapsed ? (
                  <ChevronUp size={18} color="rgba(255,255,255,0.4)" strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={18} color="rgba(255,255,255,0.4)" strokeWidth={2.5} />
                )}
              </View>
              {!isCollapsed && (
                <Text style={{ fontSize: 14, fontWeight: '400', color: '#C8C5D0', marginTop: 4, fontFamily: 'Plus Jakarta Sans' }}>Route: Madhapur → School</Text>
              )}
            </View>
          </Pressable>
          <Pressable
            onPress={handleCallDriver}
            style={styles.phoneButton}
            className="active:scale-95"
          >
            <Phone size={20} color="#003824" strokeWidth={2} />
          </Pressable>
        </View>

        {!isCollapsed && (
          <>
            {/* Driver Info */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderRadius: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.05)',
                marginTop: 16,
                marginBottom: 16,
                width: '100%',
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#201F23',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={20} color="#C8C5D0" strokeWidth={2} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#C8C5D0', fontFamily: 'Plus Jakarta Sans' }}>Driver</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#E5E1E6', marginTop: 2, fontFamily: 'Plus Jakarta Sans' }}>Raju Kumar</Text>
              </View>
              <View
                style={{
                  backgroundColor: 'rgba(78, 222, 163, 0.2)',
                  borderRadius: 9999,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ color: '#4EDEA3', fontSize: 10, fontWeight: '700', letterSpacing: -0.2, textTransform: 'uppercase' }}>Verified</Text>
              </View>
            </View>

            {/* Stop List */}
            <View style={{ position: 'relative', paddingLeft: 16, marginTop: 16 }}>
              {/* Vertical Line */}
              <View style={{
                position: 'absolute',
                left: 25, // paddingLeft (16) + indicator width (20)/2 - line width (2)/2 = 25
                top: 10,
                bottom: 10,
                width: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                zIndex: 1
              }} />

              {/* Stop 1: Madhapur */}
              <View style={{ flexDirection: 'row', alignItems: 'center', height: 20, marginBottom: 24 }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: '#C4C1FB',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(196, 193, 251, 0.4)',
                    shadowColor: '#C4C1FB',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                    elevation: 5,
                    overflow: 'visible',
                    zIndex: 10,
                  }}
                >
                  <Check size={11} color="#2D2A5B" strokeWidth={4.5} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '400', color: 'rgba(200, 197, 208, 0.6)', marginLeft: 16, fontFamily: 'Plus Jakarta Sans' }}>Madhapur</Text>
              </View>

              {/* Stop 2: Kondapur */}
              <View style={{ flexDirection: 'row', alignItems: 'center', height: 20, marginBottom: 24 }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: '#C4C1FB',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(196, 193, 251, 0.4)',
                    shadowColor: '#C4C1FB',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                    elevation: 5,
                    overflow: 'visible',
                    zIndex: 10,
                  }}
                >
                  <Check size={11} color="#2D2A5B" strokeWidth={4.5} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '400', color: 'rgba(200, 197, 208, 0.6)', marginLeft: 16, fontFamily: 'Plus Jakarta Sans' }}>Kondapur</Text>
              </View>

              {/* Stop 3: Gachibowli (Active) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', height: 20, marginBottom: 24 }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: '#4EDEA3',
                    backgroundColor: '#131316',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#4EDEA3',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.9,
                    shadowRadius: 10,
                    elevation: 6,
                    overflow: 'visible',
                    zIndex: 10,
                  }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4EDEA3' }} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#4EDEA3', marginLeft: 16, fontFamily: 'Plus Jakarta Sans' }}>Gachibowli (YOUR STOP)</Text>
              </View>
              {/* Stop 4: School */}
              <View style={{ flexDirection: 'row', alignItems: 'center', height: 20 }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    backgroundColor: '#131316',
                    zIndex: 10,
                  }}
                />
                <Text style={{ fontSize: 14, fontWeight: '400', color: 'rgba(200, 197, 208, 0.6)', marginLeft: 16, fontFamily: 'Plus Jakarta Sans' }}>School</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Custom Dialog Alert Modal */}
      <Modal
        visible={customAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.alertOverlay}>
          <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View 
            style={[styles.glassCard, styles.alertCard]}
            className="w-[85%] max-w-[340px] p-6 border border-white/10 items-center"
          >
            {/* Header Icon */}
            <View className="w-12 h-12 rounded-2xl mb-4 items-center justify-center bg-[#4EDEA3]/10 border border-[#4EDEA3]/25">
              <Phone size={24} color="#4EDEA3" />
            </View>

            {/* Title & Message */}
            <Text className="text-white text-lg font-bold font-headline-md text-center mb-2">
              {customAlert.title}
            </Text>
            <Text className="text-white/60 text-xs text-center leading-relaxed mb-6 px-1">
              {customAlert.message}
            </Text>

            {/* Action Button */}
            <Pressable 
              onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
              style={styles.dismissBtn}
              className="w-full py-3.5 rounded-xl items-center active:scale-95 shadow-md shadow-[#4EDEA3]/30"
            >
              <Text className="text-[#003824] text-xs font-bold uppercase tracking-wider">Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F26',
  },
  mapCanvas: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 65 : 52,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0E0F26',
    zIndex: 50,
  },
  floatingAlerts: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 140 : 127,
    left: 0,
    right: 0,
    zIndex: 40,
  },

  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  delayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: 'rgba(4, 120, 87, 0.2)', // Semi-transparent dark green background
    borderWidth: 1,
    borderColor: '#10B981', // Solid emerald green border
    alignSelf: 'flex-start',
    zIndex: 2,
  },
  etaBadgeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 9999,
    backgroundColor: 'rgba(4, 120, 87, 0.2)',
    borderWidth: 1,
    borderColor: '#10B981',
    zIndex: 1,
    shadowColor: '#10B981', // Emerald green shadow color
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85, // Increased intensity
    shadowRadius: 20, // Increased distance
    elevation: 20, // matching Android shadow depth
    overflow: 'visible',
    ...Platform.select({
      web: {
        boxShadow: '0 0 20px rgba(16, 185, 129, 0.85), inset 0 0 12px rgba(16, 185, 129, 0.4)',
      },
      default: {
        boxShadow: [
          {
            offsetX: 0,
            offsetY: 0,
            blurRadius: 20,
            color: 'rgba(16, 185, 129, 0.85)',
          },
          {
            offsetX: 0,
            offsetY: 0,
            blurRadius: 12,
            color: 'rgba(16, 185, 129, 0.4)',
            inset: true,
          }
        ] as any
      }
    }),
  },
  etaText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Plus Jakarta Sans',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 130 : 115,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    overflow: 'hidden',
    padding: 24,
    paddingBottom: 24,
    zIndex: 60,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  phoneButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4EDEA3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4EDEA3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: Platform.OS === 'ios' ? 4 : 0,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  verticalTimelineLine: {
    position: 'absolute',
    left: 14.5,
    top: 10,
    bottom: 10,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  alertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCard: {
    backgroundColor: '#0E0F26',
    borderRadius: 28,
    shadowColor: '#4EDEA3',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: Platform.OS === 'android' ? 0 : 8,
  },
  dismissBtn: {
    backgroundColor: '#4EDEA3',
  },
});

export default BusTrackingScreen;
