import { useMemo } from 'react';
import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useDeviceReader() {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');

  return useMemo(() => {
    const longest = Math.max(width, height);
    const hasNotch = insets.top >= 30;
    const isDynamicIsland = Platform.OS === 'ios' && insets.top >= 40;

    return {
      width,
      height,
      insets,
      hasNotch,
      isDynamicIsland,
      statusBarHeight: insets.top,
      safeAreaPadding: {
        paddingTop: insets.top || 12,
        paddingBottom: insets.bottom || 12,
      },
      horizontalGutter: Math.max(14, Math.min(20, Math.round(width * 0.04))),
      isLargeScreen: longest >= 800,
    };
  }, [height, insets.bottom, insets.top, width]);
}
