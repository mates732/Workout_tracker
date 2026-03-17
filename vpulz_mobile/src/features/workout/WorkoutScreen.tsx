import { StyleSheet, Text } from 'react-native';
import { Screen } from '../../shared/components/Screen';
import { SectionCard } from '../../shared/components/SectionCard';
import { colors, typography } from '../../shared/theme/tokens';

export function WorkoutScreen() {
  return (
    <Screen>
      <SectionCard>
        <Text style={styles.title}>Workout Planner</Text>
        <Text style={styles.body}>Build and track guided workout routines.</Text>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  body: {
    color: colors.mutedText,
    fontSize: typography.body,
  },
});
