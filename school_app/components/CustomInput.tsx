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
  multiline,
  ...props
}) => {
  return (
    <View className="mb-4 w-full">
      <Text className="text-white/80 text-xs md:text-sm font-medium mb-1.5 ml-1">{label}</Text>
      <View
        className={`flex-row ${multiline ? 'items-start pt-3' : 'items-center'} bg-white/10 border rounded-2xl px-4 ${
          multiline ? 'min-h-[100px]' : 'py-3.5'
        } ${
          error ? 'border-red-500' : 'border-white/10 focus:border-brand-blue'
        }`}
      >
        {icon && <View className="mr-3 opacity-80 mt-0.5">{icon}</View>}
        <TextInput
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          className="flex-1 text-white text-sm md:text-base"
          textAlignVertical={multiline ? 'top' : 'center'}
          multiline={multiline}
          style={style}
          {...props}
        />
      </View>
      {error && <Text className="text-red-400 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
};

export default CustomInput;

