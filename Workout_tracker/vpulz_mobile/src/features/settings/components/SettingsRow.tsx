import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSettings } from '../state/SettingsContext';
import { reusableStyles } from '../../../shared/theme/reusableStyles';

type SettingsRowProps = {
  label: string;
  value?: string;
  helper?: string;
  onPress?: () => void;
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
};

export function SettingsRow({
  label,
  value,
  helper,
  onPress,
  toggleValue,
  onToggleChange,
}: SettingsRowProps) {
  const { colors } = useSettings();
  const isToggle = typeof toggleValue === 'boolean' && onToggleChange;

  const content = (
    <View style={[styles.row, { borderBottomColor: colors.border }]}> 
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: colors.text }]}>{label.toUpperCase()}</Text>
        {helper ? <Text style={[styles.helper, { color: colors.textMuted }]}>{helper}</Text> : null}
      </View>
      {isToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggleChange}
          trackColor={{ true: '#3A3A3A', false: colors.border }}
          thumbColor={colors.text}
        />
      ) : (
        <Text style={[styles.value, { color: colors.textMuted }]}>{value ?? '›'}</Text>
      )}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  row: {
    minHeight: 54,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
    gap: reusableStyles.spacing.sm,
  },
  textWrap: {
    flex: 1,
    gap: reusableStyles.spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  helper: {
    fontSize: 11,
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '45%',
    textAlign: 'right',
  },
});
