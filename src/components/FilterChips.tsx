import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon } from './Icon';

type RemovableChipProps = {
  label: string;
  onRemove: () => void;
};

export function RemovableChip({ label, onRemove }: RemovableChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Remover filtro ${label}`}
      onPress={onRemove}
      style={[
        styles.removable,
        { backgroundColor: colors.soft, borderColor: colors.primary },
      ]}
    >
      <Text style={[styles.removableText, { color: colors.primary }]}>
        {label}
      </Text>
      <Icon name="close" size={15} color={colors.primary} />
    </Pressable>
  );
}

type OptionChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function OptionChip({ label, selected, onPress }: OptionChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.option,
        selected
          ? { backgroundColor: colors.soft, borderColor: colors.primary }
          : { backgroundColor: colors.surface2, borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          styles.optionText,
          { color: selected ? colors.primary : colors.text2 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type RadioOptionProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function RadioOption({ label, selected, onPress }: RadioOptionProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.radioRow, selected && { backgroundColor: colors.soft }]}
    >
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
      <Text style={[styles.radioLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  removable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 11,
    borderWidth: 1,
  },
  removableText: { fontFamily: fonts.bold, fontSize: 11.5 },
  option: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionText: { fontFamily: fonts.bold, fontSize: 12.5 },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
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
  radioLabel: { flex: 1, fontFamily: fonts.semiBold, fontSize: 13.5 },
});
