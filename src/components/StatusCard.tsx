import { StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import type { IconName } from './Icon';
import { IconTile } from './IconTile';

type StatusCardProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  trailing?: string;
};

export function StatusCard({
  icon,
  title,
  subtitle,
  trailing,
}: StatusCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          boxShadow: `0px 2px 8px ${colors.shadow}`,
        },
      ]}
    >
      <IconTile icon={icon} size={46} iconSize={24} />
      <View style={styles.texts}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.text2 }]}>
          {subtitle}
        </Text>
      </View>
      {trailing !== undefined && (
        <Text style={[styles.trailing, { color: colors.primary }]}>
          {trailing}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  texts: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.extraBold, fontSize: 15 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 12 },
  trailing: { fontFamily: fonts.extraBold, fontSize: 12, textAlign: 'right' },
});
