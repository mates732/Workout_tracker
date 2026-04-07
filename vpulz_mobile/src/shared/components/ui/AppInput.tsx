import { TextInput, type TextInputProps, StyleSheet } from 'react-native';
import { colors, radius, typography } from '../../theme/tokens';

type AppInputProps = TextInputProps;

export function AppInput(props: AppInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.mutedText}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: 16,
    fontSize: typography.body,
    fontWeight: '600',
  },
});
