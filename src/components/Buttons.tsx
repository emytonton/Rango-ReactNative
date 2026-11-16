import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { radius, sizes, useTheme } from '../theme';

type ButtonProps = {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ text, onPress, disabled, style }: ButtonProps) {
  const { colors, typography } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles.primaryShadow,
        {
          backgroundColor: colors.primary,
          opacity: pressed || disabled ? 0.8 : 1,
        },
        style,
      ]}
    >
      <Text style={[typography.button, { color: colors.onPrimary }]}>
        {text}
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
  primaryShadow: {
    boxShadow: '0px 10px 22px -10px rgba(255, 107, 0, 0.75)',
  },
  secondaryBorder: {
    borderWidth: 1.5,
  },
});
