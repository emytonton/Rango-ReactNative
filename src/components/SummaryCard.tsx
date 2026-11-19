import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';

export type SummaryLine = {
  label: string;
  value: string;
  highlight?: boolean;
};

type SummaryCardProps = {
  lines: SummaryLine[];
  total: string;
  title?: string;
  header?: ReactNode;
};

export function SummaryCard({ lines, total, title, header }: SummaryCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {title && (
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      )}
      {header}
      {header && (
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      )}
      {lines.map(line => (
        <View key={line.label} style={styles.row}>
          <Text style={[styles.label, { color: colors.text2 }]}>
            {line.label}
          </Text>
          <Text
            style={[
              styles.value,
              { color: line.highlight ? colors.success : colors.text },
            ]}
          >
            {line.value}
          </Text>
        </View>
      ))}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
        <Text style={[styles.total, { color: colors.primary }]}>{total}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 11, padding: 16, borderRadius: 20, borderWidth: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: { fontFamily: fonts.extraBold, fontSize: 13.5 },
  label: { fontFamily: fonts.semiBold, fontSize: 13 },
  value: { fontFamily: fonts.bold, fontSize: 13 },
  divider: { height: 1 },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  totalLabel: { fontFamily: fonts.extraBold, fontSize: 14.5 },
  total: { fontFamily: fonts.extraBold, fontSize: 22, letterSpacing: -0.6 },
});
