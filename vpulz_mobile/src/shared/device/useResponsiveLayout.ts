import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const shortest = Math.min(width, height);
    const longest = Math.max(width, height);
    const isLandscape = width > height;
    const isTablet = shortest >= 768;
    const horizontalPadding = clamp(width * (isTablet ? 0.06 : 0.045), 14, isTablet ? 52 : 24);
    const contentMaxWidth = isTablet ? 920 : 680;
    const scale = clamp(shortest / 390, 0.84, isTablet ? 1.35 : 1.12);

    const space = (base: number): number => Math.round(base * scale);
    const font = (base: number): number => Math.round(base * clamp(scale, 0.9, 1.22));

    return {
      width,
      height,
      shortest,
      longest,
      isTablet,
      isLandscape,
      insets,
      horizontalPadding,
      contentMaxWidth,
      space,
      font,
    };
  }, [height, insets, width]);
}

export default useResponsiveLayout;
