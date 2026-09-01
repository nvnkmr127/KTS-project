import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './navigation/AppNavigator';
import "./global.css";

const queryClient = new QueryClient();

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("APP CRASH COMPONENT STACK:", errorInfo.componentStack);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/**
 * BottomControlBar provides a solid white background specifically for devices that have
 * on-screen system control buttons (3-button navigation on Android) at the bottom so that
 * the control buttons are clearly visible.
 * Devices with a home indicator (iOS or Android gesture navigation pill) are excluded and
 * retain their seamless full-height dark aesthetic.
 */
const BottomControlBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const hasControlButtons = Platform.OS === 'android' && insets.bottom > 24;

  if (!hasControlButtons) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: insets.bottom,
        backgroundColor: '#ffffff',
        zIndex: 99999,
      }}
    />
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <AppNavigator />
          </ErrorBoundary>
          <StatusBar style="light" />
          <BottomControlBar />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
