import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';
import { Icon } from './Icon';

type SearchBarButtonProps = {
  placeholder: string;
  onPress: () => void;
};

export function SearchBarButton({
  placeholder,
  onPress,
}: SearchBarButtonProps) {
  const { colors, typography } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={placeholder}
      onPress={onPress}
      style={[
        styles.bar,
        { backgroundColor: colors.surface2, borderColor: colors.border },
      ]}
    >
      <Icon name="search" size={20} color={colors.text2} />
      <Text
        numberOfLines={1}
        style={[typography.body, styles.placeholder, { color: colors.text2 }]}
      >
        {placeholder}
      </Text>
      <Icon name="tune" size={19} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
  },
  placeholder: { flex: 1 },
});
