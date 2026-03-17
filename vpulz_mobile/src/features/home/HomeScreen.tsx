import { StyleSheet, Text } from 'react-native';
import { Screen } from '../../shared/components/Screen';
import { SectionCard } from '../../shared/components/SectionCard';
import { colors, typography } from '../../shared/theme/tokens';

export function HomeScreen() {
  return (
    <Screen>
      <SectionCard>
        <Text style={styles.title}>Welcome to VPulz</Text>
        <Text style={styles.body}>Your personalized fitness dashboard starts here.</Text>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  body: {
    color: colors.mutedText,
    fontSize: typography.body,
  },
});
