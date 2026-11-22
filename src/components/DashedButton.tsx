import { Pressable, StyleSheet, Text } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type DashedButtonProps = {
  text: string;
  icon: IconName;
  onPress: () => void;
  accent?: boolean;
};

export function DashedButton({
  text,
  icon,
  onPress,
  accent = false,
}: DashedButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: accent ? colors.primary : colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Icon name={icon} size={20} color={colors.primary} />
      <Text
        style={[styles.text, { color: accent ? colors.primary : colors.text }]}
      >
        {text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  text: { fontFamily: fonts.bold, fontSize: 13.5 },
});
