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
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  selectedLabel: {
    color: colors.primaryText,
  },
});
