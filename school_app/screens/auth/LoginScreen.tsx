import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Pressable, 
  ScrollView, 
  Platform, 
  Modal, 
  KeyboardAvoidingView, 
  TextInput 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore, UserRole } from '../../store/useAuthStore';
import { CustomInput } from '../../components/CustomInput';
import { InteractiveButton } from '../../components/InteractiveButton';
import { GlassCard } from '../../components/GlassCard';
import { 
  Mail, 
  Lock, 
  CheckCircle, 
  Users, 
  GraduationCap, 
  Briefcase, 
  Shield, 
  Compass, 
  AlertTriangle,
  KeyRound,
  ChevronRight
} from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid institutional email address" }),
  password: z.string().min(4, { message: "Password must be at least 4 characters" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface RoleConfig {
  role: UserRole;
  label: string;
  badgeTitle: string;
  description: string;
  defaultEmail: string;
  defaultPassword: string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  glowColor: string;
  activeColor: string;
  icon: React.ComponentType<any>;
  variant: 'superadmin' | 'admin' | 'secondary' | 'accent' | 'primary';
}

const ROLES_CONFIG: RoleConfig[] = [
  {
    role: 'super_admin',
    label: 'Super Admin',
    badgeTitle: 'School Owner & Principal',
    description: 'Full system configs, staff salary, fee structures & audit logs',
    defaultEmail: 'admin@uvchm.com',
    defaultPassword: 'password',
    colorClass: 'text-purple-300',
    borderClass: 'border-purple-500/70',
    bgClass: 'bg-purple-600/25',
    glowColor: 'rgba(139, 92, 246, 0.55)',
    activeColor: '#A78BFA',
    icon: Shield,
    variant: 'superadmin',
  },
  {
    role: 'admin_staff',
    label: 'Admin Staff',
    badgeTitle: 'Campus Operations',
    description: 'Fee collections, student directory, timetable & transport',
    defaultEmail: 'admin@eduvision.edu',
    defaultPassword: 'password123',
    colorClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/70',
    bgClass: 'bg-emerald-600/25',
    glowColor: 'rgba(16, 185, 129, 0.55)',
    activeColor: '#34D399',
    icon: Briefcase,
    variant: 'admin',
  },
  {
    role: 'teacher',
    label: 'Teacher',
    badgeTitle: 'Academic Faculty',
    description: 'Classroom attendance, daily diary, homework & marks entry',
    defaultEmail: 'teacher@eduvision.edu',
    defaultPassword: 'password123',
    colorClass: 'text-blue-300',
    borderClass: 'border-blue-500/70',
    bgClass: 'bg-blue-600/25',
    glowColor: 'rgba(59, 130, 246, 0.55)',
    activeColor: '#60A5FA',
    icon: GraduationCap,
    variant: 'primary',
  },
  {
    role: 'parent',
    label: 'Parent',
    badgeTitle: 'Parent Portal',
    description: 'Student attendance, report cards, fees & live bus tracking',
    defaultEmail: 'parent@eduvision.edu',
    defaultPassword: 'password123',
    colorClass: 'text-pink-300',
    borderClass: 'border-pink-500/70',
    bgClass: 'bg-pink-600/25',
    glowColor: 'rgba(236, 72, 153, 0.55)',
    activeColor: '#F472B6',
    icon: Users,
    variant: 'secondary',
  },
  {
    role: 'guest',
    label: 'Guest',
    badgeTitle: 'Public Showcase',
    description: 'Explore campus infrastructure, achievements & admissions',
    defaultEmail: 'guest@eduvision.edu',
    defaultPassword: 'password123',
    colorClass: 'text-orange-300',
    borderClass: 'border-orange-500/70',
    bgClass: 'bg-orange-600/25',
    glowColor: 'rgba(249, 115, 22, 0.55)',
    activeColor: '#FB923C',
    icon: Compass,
    variant: 'primary',
  },
];

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isSmallPhone, isTablet } = useResponsive();
  const [selectedRole, setSelectedRole] = useState<UserRole>('super_admin');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const passwordInputRef = useRef<TextInput>(null);
  const login = useAuthStore((state) => state.login);

  const currentRoleConfig = ROLES_CONFIG.find((r) => r.role === selectedRole) || ROLES_CONFIG[0];

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: currentRoleConfig.defaultEmail,
      password: currentRoleConfig.defaultPassword,
    }
  });

  // Handle role selection and auto-fill credentials
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setAuthError(null);
    const config = ROLES_CONFIG.find((r) => r.role === role);
    if (config) {
      setValue('email', config.defaultEmail, { shouldValidate: true });
      setValue('password', config.defaultPassword, { shouldValidate: true });
    }
  };

  // Custom alert dialog state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'error',
  });

  const showCustomAlert = (title: string, message: string, type: 'success' | 'error') => {
    setCustomAlert({ visible: true, title, message, type });
  };

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await login(data.email.trim(), selectedRole, data.password);
      if (!result.success) {
        const errorMsg = result.error || "Authentication failed. Please verify credentials.";
        setAuthError(errorMsg);
        showCustomAlert("Authentication Failed", errorMsg, 'error');
      }
    } catch (err: any) {
      const errorMsg = err?.message || "An unexpected error occurred while contacting the server.";
      setAuthError(errorMsg);
      showCustomAlert("Error", errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setLoading(true);
    setAuthError(null);
    await login('guest@eduvision.edu', 'guest', 'password123');
    setLoading(false);
  };

  const handleQuickBypass = async () => {
    setLoading(true);
    setAuthError(null);
    await login(currentRoleConfig.defaultEmail, selectedRole, currentRoleConfig.defaultPassword);
    setLoading(false);
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
          paddingHorizontal: isSmallPhone ? 16 : isTablet ? 32 : 20,
          maxWidth: isTablet ? 600 : undefined,
          alignSelf: isTablet ? 'center' : undefined,
          width: isTablet ? '100%' : undefined,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View className="items-center mb-6">
          <View className="flex-row items-center gap-2 mb-1.5">
            <View className="w-9 h-9 rounded-2xl bg-brand-blue/80 items-center justify-center border border-white/20 shadow-md">
              <Shield size={20} color="#FFFFFF" />
            </View>
            <Text className={`text-white ${isSmallPhone ? 'text-2xl' : 'text-3xl'} font-extrabold tracking-wider`}>
              EduVision
            </Text>
          </View>
          <Text className="text-white/65 text-xs md:text-sm font-medium text-center">
            Elite Campus Management & ERP Portal
          </Text>
        </View>

        <GlassCard className={isSmallPhone ? 'p-4' : 'p-5'}>
          {/* Section Title */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-base md:text-lg font-bold">
              Select Portal Profile
            </Text>
            <View className="flex-row items-center bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
              <Text className="text-white/80 text-[10px] font-bold uppercase tracking-wider">
                {currentRoleConfig.label}
              </Text>
            </View>
          </View>
          
          {/* Role Selector Grid */}
          <View className="flex-row flex-wrap justify-between mb-3">
            {ROLES_CONFIG.map((item) => {
              const isSelected = selectedRole === item.role;
              const isFullWidth = item.role === 'guest';
              const IconComponent = item.icon;
              
              return (
                <Pressable
                  key={item.role}
                  onPress={() => handleSelectRole(item.role)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.label} portal`}
                  accessibilityState={{ selected: isSelected }}
                  style={{
                    width: isFullWidth ? '100%' : '48.5%',
                    shadowColor: isSelected ? item.glowColor : 'transparent',
                    shadowOffset: isSelected ? { width: 0, height: 4 } : { width: 0, height: 0 },
                    shadowOpacity: isSelected ? 0.45 : 0,
                    shadowRadius: isSelected ? 10 : 0,
                    elevation: Platform.OS === 'android' ? 0 : (isSelected ? 5 : 0),
                  }}
                  className={`${isSmallPhone ? 'p-2.5' : 'p-3.5'} rounded-2xl mb-2.5 flex-col items-center justify-center border min-h-[96px] transition-all duration-300 ${
                    isSelected
                      ? `${item.bgClass} ${item.borderClass}`
                      : 'bg-black/30 border-white/10 active:bg-white/5'
                  }`}
                >
                  <View 
                    className={`p-2 rounded-xl mb-1.5 flex items-center justify-center border ${
                      isSelected ? 'bg-white/15 border-white/30' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <IconComponent 
                      size={isSmallPhone ? 20 : 24} 
                      color={isSelected ? item.activeColor : '#FFFFFF'} 
                    />
                  </View>
                  <Text className={`text-xs md:text-sm font-bold text-center mb-0.5 ${item.colorClass}`}>
                    {item.label}
                  </Text>
                  <Text 
                    className="text-white/50 text-[9.5px] md:text-[10.5px] text-center font-medium leading-3.5 px-0.5" 
                    numberOfLines={1}
                  >
                    {item.badgeTitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Active Role Info Banner */}
          <View 
            style={{ borderColor: `${currentRoleConfig.activeColor}40` }}
            className={`p-3 rounded-xl mb-4 border bg-white/5 flex-row items-start`}
          >
            <View className="p-1 rounded-lg mr-2.5 mt-0.5" style={{ backgroundColor: `${currentRoleConfig.activeColor}20` }}>
              <KeyRound size={14} color={currentRoleConfig.activeColor} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-xs">
                {currentRoleConfig.label} Access
              </Text>
              <Text className="text-white/60 text-[11px] leading-4 mt-0.5">
                {currentRoleConfig.description}
              </Text>
            </View>
          </View>

          {/* Inline Error Banner */}
          {authError && (
            <View className="flex-row items-center p-3 mb-4 rounded-xl bg-red-500/20 border border-red-500/40">
              <AlertTriangle size={16} color="#EF4444" className="mr-2 flex-shrink-0" />
              <Text className="text-red-300 text-xs flex-1 ml-2 font-medium">
                {authError}
              </Text>
            </View>
          )}

          {/* Email Input */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="Institutional Email"
                placeholder="e.g. admin@uvchm.com"
                onBlur={onBlur}
                onChangeText={(text) => {
                  setAuthError(null);
                  onChange(text);
                }}
                value={value}
                error={errors.email?.message}
                icon={<Mail size={18} color="rgba(255, 255, 255, 0.7)" />}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                activeBorderColor={currentRoleConfig.activeColor}
                editable={!loading}
              />
            )}
          />

          {/* Password Input */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                ref={passwordInputRef}
                label="Portal Password"
                placeholder="Enter password"
                secureTextEntry
                showPasswordToggle
                onBlur={onBlur}
                onChangeText={(text) => {
                  setAuthError(null);
                  onChange(text);
                }}
                value={value}
                error={errors.password?.message}
                icon={<Lock size={18} color="rgba(255, 255, 255, 0.7)" />}
                autoCapitalize="none"
                returnKeyType="go"
                onSubmitEditing={handleSubmit(onSubmit)}
                activeBorderColor={currentRoleConfig.activeColor}
                editable={!loading}
              />
            )}
          />

          {/* Forgot Password Link */}
          <View className="flex-row justify-between items-center mb-5 mt-1">
            <Text className="text-white/40 text-[11px]">Demo seeded login ready</Text>
            <Pressable 
              onPress={() => navigation.navigate('ForgotPassword')} 
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Forgot Password"
            >
              <Text className="text-brand-indigo font-semibold text-xs active:opacity-70">
                Forgot Password?
              </Text>
            </Pressable>
          </View>

          {/* Action Buttons */}
          <View className="gap-2.5">
            <InteractiveButton
              onPress={handleSubmit(onSubmit)}
              title={`Sign In as ${currentRoleConfig.label}`}
              variant={currentRoleConfig.variant}
              loading={loading}
              disabled={loading}
              icon={<ChevronRight size={18} color="#FFFFFF" />}
            />
            
            <InteractiveButton
              onPress={handleQuickBypass}
              title={`⚡ Quick Demo Login (${currentRoleConfig.label})`}
              variant="glass"
              disabled={loading}
            />
          </View>
        </GlassCard>

        {/* Guest Showcase Option */}
        <View className="mt-6 items-center">
          <Text className="text-white/45 text-xs mb-2.5 font-medium">
            Prospective Parent or Campus Visitor?
          </Text>
          <Pressable 
            onPress={handleGuestAccess} 
            disabled={loading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Explore as Guest"
            className="bg-white/5 px-6 py-3 rounded-full border border-white/15 active:bg-white/15 min-h-[44px] justify-center items-center flex-row"
          >
            <Compass size={16} color="#FB923C" className="mr-2" />
            <Text className="text-white/90 font-bold text-xs ml-2">
              Explore Campus Showcase as Guest
            </Text>
          </Pressable>
        </View>

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
              <View className={`w-12 h-12 rounded-2xl mb-4 items-center justify-center ${
                customAlert.type === 'error' 
                  ? 'bg-red-500/15 border border-red-500/30' 
                  : 'bg-green-500/15 border border-green-500/30'
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
              <Text className="text-white/70 text-xs text-center leading-relaxed mb-6 px-1">
                {customAlert.message}
              </Text>

              {/* Dismiss Action Button */}
              <Pressable 
                onPress={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Dismiss Alert"
                className="w-full py-3.5 rounded-xl bg-brand-indigo items-center active:scale-95 shadow-md shadow-brand-indigo/30 min-h-[48px] justify-center"
              >
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Dismiss
                </Text>
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

export default LoginScreen;
