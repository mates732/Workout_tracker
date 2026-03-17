import { StyleSheet, Text } from 'react-native';
import { Screen } from '../../shared/components/Screen';
import { SectionCard } from '../../shared/components/SectionCard';
import { colors, typography } from '../../shared/theme/tokens';

export function ProgressScreen() {
  return (
    <Screen>
      <SectionCard>
        <Text style={styles.title}>Progress Insights</Text>
        <Text style={styles.body}>Review streaks, sessions, and achievements over time.</Text>
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
