import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type MenuRowProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  hint?: string | null;
  danger?: boolean;
};

export function MenuRow({
  icon,
  label,
  onPress,
  hint,
  danger = false,
}: MenuRowProps) {
  const { colors } = useTheme();
  const accent = danger ? colors.error : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.surface2 : colors.surface,
          borderColor: danger ? `${colors.error}59` : colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: danger ? `${colors.error}1F` : colors.soft },
        ]}
      >
        <Icon name={icon} size={19} color={accent} />
      </View>
      <View style={styles.texts}>
        <Text
          style={[styles.label, { color: danger ? colors.error : colors.text }]}
        >
          {label}
        </Text>
        {hint ? (
          <Text style={[styles.hint, { color: colors.text2 }]}>{hint}</Text>
        ) : null}
      </View>
      {!danger && <Icon name="chevronRight" size={20} color={colors.text2} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 1 },
  label: { fontFamily: fonts.bold, fontSize: 14 },
  hint: { fontFamily: fonts.medium, fontSize: 11 },
});
