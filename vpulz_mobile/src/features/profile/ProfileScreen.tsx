import { StyleSheet, Text } from 'react-native';
import { Screen } from '../../shared/components/Screen';
import { SectionCard } from '../../shared/components/SectionCard';
import { colors, typography } from '../../shared/theme/tokens';

export function ProfileScreen() {
  return (
    <Screen>
      <SectionCard>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.body}>Manage account details, preferences, and goals.</Text>
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
