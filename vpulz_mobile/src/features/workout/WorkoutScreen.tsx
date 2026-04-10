// Legacy file — workout flow is now handled by ActiveWorkoutScreen.tsx
// This file is kept as a stub to avoid breaking any remaining imports.

import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../shared/theme/tokens';

export function WorkoutScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.text}>Use the active workout screen instead.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.mutedText,
    fontSize: typography.body,
  },
});
