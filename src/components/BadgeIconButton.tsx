import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type BadgeIconButtonProps = {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  filled?: boolean;
  showDot?: boolean;
  count?: number;
  compact?: boolean;
};

export function BadgeIconButton({
  icon,
  accessibilityLabel,
  onPress,
  filled = false,
  showDot = false,
  count = 0,
  compact = false,
}: BadgeIconButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        filled
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <Icon
        name={icon}
        size={compact ? 20 : 21}
        color={filled ? colors.onPrimary : colors.text}
      />
      {showDot && (
        <View
          style={[
            styles.dot,
            compact && styles.compactDot,
            { backgroundColor: colors.error, borderColor: colors.surface },
          ]}
        />
      )}
      {count > 0 && (
        <View
          style={[
            styles.count,
            { backgroundColor: colors.text, borderColor: colors.surface },
          ]}
        >
          <Text style={[styles.countText, { color: colors.surface }]}>
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { width: 40, height: 40, borderRadius: 13 },
  pressed: { opacity: 0.85 },
  dot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  compactDot: { top: 7, right: 8 },
  count: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontFamily: fonts.extraBold, fontSize: 10.5 },
});
