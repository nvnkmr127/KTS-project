import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CustomInput } from '../../components/CustomInput';
import { InteractiveButton } from '../../components/InteractiveButton';
import { GlassCard } from '../../components/GlassCard';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';

const forgotSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isSmallPhone, isTablet } = useResponsive();
  const { control, handleSubmit, formState: { errors } } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  // Custom alert dialog state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onClose?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showCustomAlert = (title: string, message: string, onClose?: () => void) => {
    setCustomAlert({ visible: true, title, message, onClose });
  };

  const onSubmit = (data: ForgotFormData) => {
    showCustomAlert(
      "OTP Dispatched",
      `A 6-digit OTP verification code has been dispatched to ${data.email}.`,
      () => navigation.navigate('OTPVerify', { email: data.email })
    );
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
          <Text className="text-white text-2xl font-bold ml-3">Reset Password</Text>
        </View>

        <GlassCard className={isSmallPhone ? 'p-4' : 'p-6'}>
          <Text className="text-white/70 text-xs md:text-sm mb-6 leading-5">
            Enter your registered institutional email address. We will send you a 6-digit verification code to reset your account credentials.
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="Institutional Email"
                placeholder="e.g. parent@eduvision.edu"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
                icon={<Mail size={20} color="#FFFFFF" />}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            )}
          />

          <InteractiveButton
            onPress={handleSubmit(onSubmit)}
            title="Send OTP Verification"
            variant="secondary"
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
              <View className="w-12 h-12 rounded-2xl mb-4 items-center justify-center bg-green-500/10 border border-green-500/20">
                <CheckCircle size={24} color="#10B981" />
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

export default ForgotPasswordScreen;


