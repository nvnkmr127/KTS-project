import React from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';

interface CustomInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  icon,
  style,
  ...props
}) => {
  return (
    <View className="mb-5 w-full">
      <Text className="text-white/80 text-sm font-medium mb-2 ml-1">{label}</Text>
      <View
        className={`flex-row items-center bg-white/10 border rounded-2xl px-4 py-3.5 ${
          error ? 'border-red-500' : 'border-white/10 focus:border-brand-blue'
        }`}
      >
        {icon && <View className="mr-3 opacity-80">{icon}</View>}
        <TextInput
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          className="flex-1 text-white text-base"
          style={style}
          {...props}
        />
      </View>
      {error && <Text className="text-red-400 text-xs mt-1.5 ml-1">{error}</Text>}
    </View>
  );
};

export default CustomInput;
