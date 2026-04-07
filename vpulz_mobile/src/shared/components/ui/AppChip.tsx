import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, typography } from '../../theme/tokens';

type AppChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function AppChip({ label, selected, onPress }: AppChipProps) {
  return (
    <Pressable style={[styles.chip, selected && styles.selected]} onPress={onPress}>
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: 'rgba(10,132,255,0.16)',
    borderColor: colors.primary,
  },
  label: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  selectedLabel: {
    color: colors.primary,
  },
});
