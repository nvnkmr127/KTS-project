import { useWindowDimensions, Platform, PixelRatio, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ResponsiveValues {
  // Screen dimensions
  width: number;
  height: number;

  // Breakpoints
  isSmallPhone: boolean;     // < 360px (e.g. iPhone SE 1st gen, small Androids)
  isStandardPhone: boolean;  // 360px - 413px (e.g. iPhone 13/14/15, Pixel 7)
  isLargePhone: boolean;     // 414px - 767px (e.g. iPhone Plus/Max, Pro Max)
  isTablet: boolean;         // >= 768px (iPad, Android tablets)
  isLandscape: boolean;

  // Spacing & padding tokens
  horizontalPadding: number; // 12 (<360), 16 (360-400), 20 (>400)
  cardPadding: number;       // 12 (<360), 16 (>=360)
  gap: number;               // 8 (<360), 12 (>=360)
  
  // Safe area insets
  insets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Safe header / bottom spacing
  headerPaddingTop: number;
  tabBarBottomPadding: number;
  scrollBottomPadding: number;

  // System navigation bar / control button detection
  hasControlButtons: boolean;
  hasHomeIndicator: boolean;
  bottomControlBarHeight: number;

  // Layout container constraints for consistent multi-device rendering
  containerMaxWidth?: number;
  containerStyle: ViewStyle;

  // Sizing helpers
  scale: (size: number, factor?: number) => number;
  fontScale: (size: number) => number;
  wp: (percentage: number) => number;
  hp: (percentage: number) => number;
}

// Base guideline dimensions based on standard mobile viewport (iPhone 11/13/14 baseline: 375 x 812)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmallPhone = width < 360;
  const isStandardPhone = width >= 360 && width < 414;
  const isLargePhone = width >= 414 && width < 768;
  const isTablet = width >= 768;
  const isLandscape = width > height;

  const horizontalPadding = isSmallPhone ? 12 : width < 400 ? 16 : 20;
  const cardPadding = isSmallPhone ? 12 : 16;
  const gap = isSmallPhone ? 8 : 12;

  // Header top padding accounts for status bar / Dynamic Island / camera notches without collision
  const headerPaddingTop = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24) + (Platform.OS === 'android' ? 6 : 4);

  // System navigation bar / control buttons detection:
  // - On iOS: All iPhones / iPads (gesture bar or physical home button) -> NO white bg.
  // - On Android: Gesture navigation pill has insets.bottom < 36 (typically 12-24dp) -> NO white bg.
  // - On Android: 3-button navigation (Back, Home, Recents buttons) has insets.bottom >= 36 (typically 48dp) -> White bg for navigation buttons.
  const isAndroid = Platform.OS === 'android';
  const isIOS = Platform.OS === 'ios';
  const hasControlButtons = isAndroid && insets.bottom >= 36;
  const hasHomeIndicator = (isIOS && insets.bottom > 0) || (isAndroid && insets.bottom > 0 && insets.bottom < 36);
  const bottomControlBarHeight = hasControlButtons ? insets.bottom : 0;

  // Bottom padding for floating tab bar (elevated slightly upwards for optimal ergonomic reach and clear spacing):
  // - Devices with on-screen navigation buttons (insets.bottom >= 36): insets.bottom + 14
  // - Devices with gesture navigation / home indicator (insets.bottom > 0): insets.bottom + 14
  // - Devices with physical home button / 0 inset: 20
  const tabBarBottomPadding = hasControlButtons
    ? insets.bottom + 14
    : insets.bottom > 0
    ? insets.bottom + 14
    : 20;
  const scrollBottomPadding = tabBarBottomPadding + (isSmallPhone ? 72 : 78) + 16;

  // Layout container constraint for tablets & wide screens
  const containerMaxWidth = isTablet ? 720 : undefined;
  const containerStyle: ViewStyle = {
    maxWidth: containerMaxWidth,
    alignSelf: isTablet ? 'center' : undefined,
    width: '100%',
  };

  // Scale dimension with moderation factor to prevent excessive shrinking or tablet bloat
  const scale = (size: number, factor = 0.5): number => {
    const scaleFactor = width / BASE_WIDTH;
    const newSize = size + (scaleFactor * size - size) * factor;
    return Math.round(PixelRatio.roundToNearestPixel(Math.max(size * 0.85, Math.min(newSize, size * 1.35))));
  };

  // Subtle font scale helper keeping typography consistent and legible
  const fontScale = (size: number): number => {
    if (isSmallPhone) return Math.max(size - 1.5, 9);
    if (isTablet) return Math.min(size + 2, size * 1.15);
    return size;
  };

  // Width & height percentage helpers
  const wp = (percentage: number): number => {
    return Math.round((percentage * width) / 100);
  };

  const hp = (percentage: number): number => {
    return Math.round((percentage * height) / 100);
  };

  return {
    width,
    height,
    isSmallPhone,
    isStandardPhone,
    isLargePhone,
    isTablet,
    isLandscape,
    horizontalPadding,
    cardPadding,
    gap,
    insets,
    headerPaddingTop,
    tabBarBottomPadding,
    scrollBottomPadding,
    hasControlButtons,
    hasHomeIndicator,
    bottomControlBarHeight,
    containerMaxWidth,
    containerStyle,
    scale,
    fontScale,
    wp,
    hp,
  };
}

export default useResponsive;
