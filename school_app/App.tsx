import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import AppNavigator, { appDarkTheme } from './navigation/AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigation/navigationRef';
import "./global.css";

// Configure Reanimated logger to disable strict mode warning during component renders
try {
  configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
  });
} catch (_) {}

const queryClient = new QueryClient();

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
  componentStack?: string;
}

class ErrorBoundary extends Component<{children: ReactNode}, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: undefined, componentStack: undefined };
  static getDerivedStateFromError(error: Error): ErrorBoundaryState { 
    return { hasError: true, errorMessage: error?.message || 'An unexpected error occurred' }; 
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const stack = errorInfo?.componentStack || '';
    console.error("=== APP CRASH ===");
    console.error("MESSAGE:", error?.message);
    console.error("JS STACK:", error?.stack);
    console.error("COMPONENT STACK:", stack);
    console.error("=================");
    this.setState({ componentStack: stack.split('\n').slice(1, 6).join(' → ') });
  }
  handleReset = () => {
    this.setState({ hasError: false, errorMessage: undefined, componentStack: undefined });
  };
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0d2a24', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(244, 63, 94, 0.15)', borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 28 }}>⚠️</Text>
          </View>
          <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' }}>
            Screen Error
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 8, textAlign: 'center', lineHeight: 18, fontFamily: 'monospace' }}>
            {this.state.errorMessage || 'An unexpected state occurred in this view.'}
          </Text>
          {this.state.componentStack ? (
            <Text style={{ color: 'rgba(255,100,100,0.8)', fontSize: 10, marginBottom: 16, textAlign: 'center', lineHeight: 16, fontFamily: 'monospace' }}>
              {this.state.componentStack}
            </Text>
          ) : null}
          <Pressable
            onPress={this.handleReset}
            style={{ backgroundColor: '#00f1a1', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16, shadowColor: '#00f1a1', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 }}
          >
            <Text style={{ color: '#0d2a24', fontWeight: '800', fontSize: 14 }}>Reload View</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

/**
 * BottomControlBar manages the bottom navigation bar styling:
 * - Mobiles with navigation buttons (3-button navigation on Android, insets.bottom >= 36dp):
 *   Renders a solid white background specifically behind the 3 navigation buttons for high contrast.
 * - Mobiles with home button / gesture bar / home indicator (iOS or Android gesture navigation):
 *   Renders NO white background, seamlessly blending into the app's dark theme (#101415).
 */
const BottomControlBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const hasNavigationButtons = Platform.OS === 'android' && insets.bottom >= 36;

  if (!hasNavigationButtons) return null;

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
          <NavigationContainer ref={navigationRef} theme={appDarkTheme}>
            <ErrorBoundary>
              <AppNavigator />
            </ErrorBoundary>
            <StatusBar style="light" />
            <BottomControlBar />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
