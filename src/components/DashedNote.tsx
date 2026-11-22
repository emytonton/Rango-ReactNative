import { Pressable, StyleSheet, Text } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type DashedNoteProps = {
  icon: IconName;
  text: string;
  iconColor: string;
  onPress?: () => void;
};

export function DashedNote({
  icon,
  text,
  iconColor,
  onPress,
}: DashedNoteProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.note,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Icon name={icon} size={17} color={iconColor} />
      <Text style={[styles.text, { color: colors.text2 }]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  text: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    lineHeight: 17,
  },
});
