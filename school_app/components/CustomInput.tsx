import React, { useState, forwardRef } from 'react';
import { View, TextInput, Text, TextInputProps, Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

export interface CustomInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  activeBorderColor?: string;
}

export const CustomInput = forwardRef<TextInput, CustomInputProps>(({
  label,
  error,
  icon,
  style,
  multiline,
  secureTextEntry,
  showPasswordToggle,
  activeBorderColor = '#3B82F6',
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordHidden, setIsPasswordHidden] = useState(secureTextEntry ?? false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View className="mb-4 w-full">
      <Text className="text-white/85 text-xs md:text-sm font-medium mb-1.5 ml-1">
        {label}
      </Text>
      <View
        style={{
          borderColor: error 
            ? '#EF4444' 
            : isFocused 
              ? activeBorderColor 
              : 'rgba(255, 255, 255, 0.15)',
        }}
        className={`flex-row ${multiline ? 'items-start pt-3' : 'items-center'} bg-white/10 border rounded-2xl px-4 min-h-[52px] ${
          multiline ? 'min-h-[100px]' : ''
        }`}
      >
        {icon && <View className="mr-3 opacity-80 mt-0.5">{icon}</View>}
        <TextInput
          ref={ref}
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          className="flex-1 text-white text-sm md:text-base py-3"
          textAlignVertical={multiline ? 'top' : 'center'}
          multiline={multiline}
          secureTextEntry={showPasswordToggle ? isPasswordHidden : secureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={label}
          style={style}
          {...props}
        />
        {showPasswordToggle && (
          <Pressable
            onPress={() => setIsPasswordHidden((prev) => !prev)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={isPasswordHidden ? "Show password" : "Hide password"}
            accessibilityRole="button"
            className="w-10 h-10 items-center justify-center -mr-1"
          >
            {isPasswordHidden ? (
              <Eye size={20} color="rgba(255, 255, 255, 0.6)" />
            ) : (
              <EyeOff size={20} color="#60A5FA" />
            )}
          </Pressable>
        )}
      </View>
      {error && (
        <Text className="text-red-400 text-xs mt-1 ml-1 font-medium" accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
});

CustomInput.displayName = 'CustomInput';

export default CustomInput;

