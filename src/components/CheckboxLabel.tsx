import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';
import { Checkbox } from './Checkbox';

type CheckboxLabelProps = {
  checked: boolean;
  label: string;
  onToggle: () => void;
};

export function CheckboxLabel({
  checked,
  label,
  onToggle,
}: CheckboxLabelProps) {
  const { colors, typography } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      hitSlop={6}
      style={styles.row}
    >
      <Checkbox checked={checked} />
      <Text style={[typography.label, styles.label, { color: colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 12.5 },
});
