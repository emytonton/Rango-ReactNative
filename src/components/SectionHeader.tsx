import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type SectionHeaderProps = {
  title: string;
  icon?: IconName;
  trailingText?: string;
  actionText?: string;
  onAction?: () => void;
};

export function SectionHeader({
  title,
  icon,
  trailingText,
  actionText,
  onAction,
}: SectionHeaderProps) {
  const { colors, typography } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.title}>
        {icon && <Icon name={icon} size={19} color={colors.primary} />}
        <Text style={[typography.section, { color: colors.text }]}>
          {title}
        </Text>
      </View>
      {trailingText && (
        <Text style={[typography.label, { color: colors.text2 }]}>
          {trailingText}
        </Text>
      )}
      {actionText && onAction && (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={[styles.action, { color: colors.primary }]}>
            {actionText}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  action: { fontFamily: fonts.bold, fontSize: 12.5 },
});
