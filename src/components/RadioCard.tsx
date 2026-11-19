import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

type RadioCardProps = {
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  indicatorAtEnd?: boolean;
  children: ReactNode;
};

export function RadioCard({
  selected,
  onPress,
  accessibilityLabel,
  indicatorAtEnd = false,
  children,
}: RadioCardProps) {
  const { colors } = useTheme();
  const radio = (
    <View
      style={[
        styles.radio,
        { borderColor: selected ? colors.primary : colors.border },
      ]}
    >
      {selected && (
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
      )}
    </View>
  );
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? colors.soft : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {!indicatorAtEnd && radio}
      {children}
      {indicatorAtEnd && radio}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 17,
    borderWidth: 1.5,
  },
  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 11, height: 11, borderRadius: 6 },
});
