import { View, type ViewStyle } from 'react-native';
import type { PropsWithChildren } from 'react';
import { useSettings } from '../state/SettingsContext';
import { getReusableStyles } from '../../../shared/theme/reusableStyles';

export function SettingsCard({ children, style, alt = false }: PropsWithChildren<{ style?: ViewStyle; alt?: boolean }>) {
  const { colors } = useSettings();
  const themeStyles = getReusableStyles(colors);

  return (
    <View
      style={[
        alt ? themeStyles.cardAlt : themeStyles.card,
        {
          borderRadius: 10,
          borderColor: colors.border,
          backgroundColor: alt ? colors.surfaceAlt : colors.surface,
          paddingVertical: 6,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
