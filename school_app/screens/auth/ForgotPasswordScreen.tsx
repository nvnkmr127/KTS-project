import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CustomInput } from '../../components/CustomInput';
import { InteractiveButton } from '../../components/InteractiveButton';
import { GlassCard } from '../../components/GlassCard';
import { Mail, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';

const forgotSchema = z.object({
  email: z.string().email({ message: "Please enter a valid institutional email address" }),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isSmallPhone, isTablet } = useResponsive();
  const [loading, setLoading] = useState(false);
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

  const onSubmit = async (data: ForgotFormData) => {
    setLoading(true);
    // Simulate OTP dispatch
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(false);

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
      style={{ backgroundColor: '#0B0F19' }}
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
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back to login"
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10 active:opacity-60"
          >
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
          <Text className="text-white text-2xl font-bold ml-3.5">Reset Password</Text>
        </View>

        <GlassCard className={isSmallPhone ? 'p-4' : 'p-6'}>
          <View className="w-12 h-12 rounded-2xl bg-brand-indigo/20 border border-brand-indigo/40 items-center justify-center mb-4">
            <KeyRound size={24} color="#818CF8" />
          </View>

          <Text className="text-white text-lg font-bold mb-1.5">Forgot Account Password?</Text>
          <Text className="text-white/65 text-xs md:text-sm mb-6 leading-5">
            Enter your registered institutional email address. We will send you a 6-digit verification code to reset your account credentials.
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="Institutional Email"
                placeholder="e.g. admin@uvchm.com"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
                icon={<Mail size={20} color="#FFFFFF" />}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="go"
                onSubmitEditing={handleSubmit(onSubmit)}
                editable={!loading}
              />
            )}
          />

          <InteractiveButton
            onPress={handleSubmit(onSubmit)}
            title="Send OTP Verification"
            variant="secondary"
            loading={loading}
            disabled={loading}
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
              className="w-full max-w-[340px] p-6 border border-white/15 items-center"
              glowColor="rgba(79, 70, 229, 0.35)"
              intensity="high"
            >
              {/* Header Icon */}
              <View className="w-12 h-12 rounded-2xl mb-4 items-center justify-center bg-green-500/15 border border-green-500/30">
                <CheckCircle size={24} color="#10B981" />
              </View>

              {/* Title & Message */}
              <Text className="text-white text-lg font-bold text-center mb-2">
                {customAlert.title}
              </Text>
              <Text className="text-white/70 text-xs text-center leading-relaxed mb-6 px-1">
                {customAlert.message}
              </Text>

              {/* Action Button */}
              <Pressable 
                onPress={() => {
                  setCustomAlert(prev => ({ ...prev, visible: false }));
                  if (customAlert.onClose) customAlert.onClose();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Dismiss Alert"
                className="w-full py-3.5 rounded-xl bg-brand-indigo items-center active:scale-95 shadow-md shadow-brand-indigo/30 min-h-[48px] justify-center"
              >
                <Text className="text-white text-xs font-bold uppercase tracking-wider">Continue</Text>
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
    backgroundColor: 'rgba(11, 15, 25, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
});

export default ForgotPasswordScreen;
