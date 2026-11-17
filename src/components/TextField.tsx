import type { ReactNode, Ref } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  icon: IconName;
  error?: string;
  valid?: boolean;
  trailing?: ReactNode;
  ref?: Ref<TextInputInstance>;
};

export function TextField({
  label,
  icon,
  error,
  valid = false,
  trailing,
  ref,
  ...inputProps
}: TextFieldProps) {
  const { colors, typography } = useTheme();
  const borderColor = error
    ? colors.error
    : valid
    ? colors.success
    : colors.border;

  return (
    <View style={styles.container}>
      <Text style={[typography.label, styles.label, { color: colors.text }]}>
        {label}
      </Text>
      <View
        style={[styles.box, { backgroundColor: colors.surface2, borderColor }]}
      >
        <Icon name={icon} size={19} color={colors.text2} />
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={colors.text2}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          style={[styles.input, { color: colors.text }]}
          {...inputProps}
        />
        {trailing}
        {valid && !error && (
          <Icon name="checkCircle" size={19} color={colors.success} />
        )}
      </View>
      {error && <FieldError message={error} />}
    </View>
  );
}

export function FieldError({ message }: { message: string }) {
  const { colors, typography } = useTheme();
  return (
    <View style={styles.error}>
      <Icon name="error" size={15} color={colors.error} />
      <Text
        style={[typography.label, styles.errorText, { color: colors.error }]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 7 },
  label: { fontFamily: fonts.bold },
  box: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    padding: 0,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  error: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontSize: 11.5 },
});
