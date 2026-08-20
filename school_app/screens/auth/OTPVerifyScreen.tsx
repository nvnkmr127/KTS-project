import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CustomInput } from '../../components/CustomInput';
import { InteractiveButton } from '../../components/InteractiveButton';
import { GlassCard } from '../../components/GlassCard';
import { ShieldCheck, Lock, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';

const otpSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be exactly 6 digits" }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type OtpFormData = z.infer<typeof otpSchema>;

export const OTPVerifyScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const email = route?.params?.email || "your email";
  const insets = useSafeAreaInsets();
  const { isSmallPhone, isTablet } = useResponsive();
  
  const { control, handleSubmit, formState: { errors } } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  // Custom alert dialog state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
    onClose?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showCustomAlert = (title: string, message: string, type: 'success' | 'error', onClose?: () => void) => {
    setCustomAlert({ visible: true, title, message, type, onClose });
  };

  const onSubmit = (data: OtpFormData) => {
    // Code validation
    if (data.otp === "123456") {
      showCustomAlert(
        "Verification Success",
        "Your password has been successfully reset. Please log in with your new credentials.",
        'success',
        () => navigation.navigate('Login')
      );
    } else {
      showCustomAlert("Verification Error", "The code you entered is invalid. Try '123456' for testing.", 'error');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-brand-darkNavy"
    >
      <ScrollView 
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: Math.max(insets.top, 16) + 16,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
          paddingHorizontal: isSmallPhone ? 16 : isTablet ? 32 : 24,
          maxWidth: isTablet ? 560 : undefined,
          alignSelf: isTablet ? 'center' : undefined,
          width: isTablet ? '100%' : undefined,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center mb-8">
          <Pressable 
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="p-1 -ml-1 active:opacity-60"
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="text-white text-2xl font-bold ml-3">Verification</Text>
        </View>

        <GlassCard className={isSmallPhone ? 'p-4' : 'p-6'}>
          <Text className="text-white/70 text-xs md:text-sm mb-6 leading-5">
            We sent a verification code to <Text className="text-white font-bold">{email}</Text>. Enter the code and set your new password. (Use <Text className="text-white font-bold">123456</Text> for demo)
          </Text>

          <Controller
            control={control}
            name="otp"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="6-Digit Verification Code"
                placeholder="e.g. 123456"
                maxLength={6}
                keyboardType="number-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.otp?.message}
                icon={<ShieldCheck size={20} color="#FFFFFF" />}
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="New Portal Password"
                placeholder="••••••••"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.newPassword?.message}
                icon={<Lock size={20} color="#FFFFFF" />}
                autoCapitalize="none"
              />
            )}
          />

          <InteractiveButton
            onPress={handleSubmit(onSubmit)}
            title="Verify & Reset"
            variant="accent"
            className="mt-4"
          />
        </GlassCard>

        {/* Custom Dialog Alert Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={customAlert.visible}
          onRequestClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
        >
          <View style={styles.alertOverlay}>
            <GlassCard 
              className="w-full max-w-[340px] p-6 border border-white/10 items-center"
              glowColor="rgba(79, 70, 229, 0.35)"
              intensity="high"
            >
              {/* Header Icon */}
              <View className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center ${
                customAlert.type === 'error' 
                  ? 'bg-red-500/10 border border-red-500/20' 
                  : 'bg-green-500/10 border border-green-500/20'
              }`}>
                {customAlert.type === 'error' ? (
                  <AlertTriangle size={24} color="#EF4444" />
                ) : (
                  <CheckCircle size={24} color="#10B981" />
                )}
              </View>

              {/* Title & Message */}
              <Text className="text-white text-lg font-bold text-center mb-2">
                {customAlert.title}
              </Text>
              <Text className="text-white/60 text-xs text-center leading-relaxed mb-6 px-1">
                {customAlert.message}
              </Text>

              {/* Action Button */}
              <Pressable 
                onPress={() => {
                  setCustomAlert(prev => ({ ...prev, visible: false }));
                  if (customAlert.onClose) customAlert.onClose();
                }}
                className="w-full py-3.5 rounded-xl bg-brand-indigo items-center active:scale-95 shadow-md shadow-brand-indigo/30"
              >
                <Text className="text-white text-xs font-bold uppercase tracking-wider">Dismiss</Text>
              </Pressable>
            </GlassCard>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 15, 38, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
});

export default OTPVerifyScreen;


