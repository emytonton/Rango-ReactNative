import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { radius, sizes, useTheme } from '../theme';
import { Icon } from './Icon';

type ButtonProps = {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

type PrimaryButtonProps = ButtonProps & {
  loading?: boolean;
  loadingText?: string;
  dimmed?: boolean;
  successText?: string;
};

export function PrimaryButton({
  text,
  onPress,
  disabled,
  style,
  loading = false,
  loadingText,
  dimmed = false,
  successText,
}: PrimaryButtonProps) {
  const { colors, typography } = useTheme();
  const success = successText !== undefined;
  const label = success
    ? successText
    : loading && loadingText
    ? loadingText
    : text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled }}
      onPress={loading || success ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles.row,
        !(dimmed || disabled || success) && styles.primaryShadow,
        {
          backgroundColor: success ? colors.success : colors.primary,
          opacity: dimmed || disabled ? 0.55 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading && !success && (
        <ActivityIndicator size={19} color={colors.onPrimary} />
      )}
      {success && (
        <Icon name="checkCircle" size={22} color={colors.onPrimary} />
      )}
      <Text style={[typography.button, { color: colors.onPrimary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({
  text,
  onPress,
  disabled,
  style,
}: ButtonProps) {
  const { colors, typography } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles.secondaryBorder,
        {
          backgroundColor: pressed ? colors.surface2 : colors.surface,
          borderColor: colors.border,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Text style={[typography.button, { color: colors.text }]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: sizes.buttonHeight,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    gap: 9,
  },
  primaryShadow: {
    boxShadow: '0px 10px 22px -10px rgba(255, 107, 0, 0.75)',
  },
  secondaryBorder: {
    borderWidth: 1.5,
  },
});
