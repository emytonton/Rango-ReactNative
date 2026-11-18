import { Pressable, StyleSheet, Text } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Checkbox } from './Checkbox';

type CheckRowProps = {
  label: string;
  trailing: string;
  checked: boolean;
  onToggle: () => void;
};

export function CheckRow({
  label,
  trailing,
  checked,
  onToggle,
}: CheckRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={[
        styles.row,
        checked
          ? { backgroundColor: colors.soft, borderColor: colors.primary }
          : { backgroundColor: colors.surface2, borderColor: colors.border },
      ]}
    >
      <Checkbox checked={checked} />
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.trailing, { color: colors.primary }]}>
        {trailing}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderRadius: 15,
    borderWidth: 1.5,
  },
  label: { flex: 1, fontFamily: fonts.semiBold, fontSize: 13.5 },
  trailing: { fontFamily: fonts.bold, fontSize: 13 },
});
