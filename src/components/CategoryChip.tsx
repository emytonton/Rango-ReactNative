import { Pressable, StyleSheet, Text } from 'react-native';
import { fonts, useTheme } from '../theme';

type CategoryChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function CategoryChip({ label, selected, onPress }: CategoryChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? colors.onPrimary : colors.text2 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 13,
    borderWidth: 1,
  },
  label: { fontFamily: fonts.bold, fontSize: 12.5 },
});
