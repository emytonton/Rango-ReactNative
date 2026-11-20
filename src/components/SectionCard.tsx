import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type SectionCardProps = {
  title: string;
  icon?: IconName;
  actionText?: string;
  onAction?: () => void;
  children: ReactNode;
};

export function SectionCard({
  title,
  icon,
  actionText,
  onAction,
  children,
}: SectionCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {icon && <Icon name={icon} size={19} color={colors.primary} />}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>
        {actionText && onAction && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${actionText} ${title.toLowerCase()}`}
            onPress={onAction}
            hitSlop={8}
          >
            <Text style={[styles.action, { color: colors.primary }]}>
              {actionText}
            </Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 11, padding: 15, borderRadius: 20, borderWidth: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontFamily: fonts.extraBold, fontSize: 13.5 },
  action: { fontFamily: fonts.bold, fontSize: 12.5 },
});
