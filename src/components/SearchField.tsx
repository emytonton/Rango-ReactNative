import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon } from './Icon';

type SearchFieldProps = {
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  onSubmit?: () => void;
};

export function SearchField({
  value,
  placeholder,
  onChangeText,
  onSubmit,
}: SearchFieldProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.field,
        { backgroundColor: colors.surface2, borderColor: colors.border },
      ]}
    >
      <Icon name="search" size={20} color={colors.text2} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.text2}
        returnKeyType="search"
        autoCorrect={false}
        style={[styles.input, { color: colors.text }]}
      />
      {value.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
          onPress={() => onChangeText('')}
          hitSlop={8}
        >
          <Icon name="close" size={19} color={colors.text2} />
        </Pressable>
      )}
    </View>
  );
}

type FilterButtonProps = {
  count: number;
  onPress: () => void;
};

export function FilterButton({ count, onPress }: FilterButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Filtros"
      onPress={onPress}
      style={[styles.filter, { backgroundColor: colors.primary }]}
    >
      <Icon name="tune" size={22} color={colors.onPrimary} />
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
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  filter: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontFamily: fonts.extraBold, fontSize: 10 },
});
