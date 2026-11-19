import { Platform, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';

const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

export type InfoValueStyle = 'default' | 'code' | 'highlight';

export type InfoRow = {
  label: string;
  value: string;
  style?: InfoValueStyle;
};

type InfoCardProps = {
  rows: InfoRow[];
  footerLabel?: string;
  footerValue?: string;
};

export function InfoCard({ rows, footerLabel, footerValue }: InfoCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface2, borderColor: colors.border },
      ]}
    >
      {rows.map(row => (
        <View key={row.label} style={styles.row}>
          <Text style={[styles.label, { color: colors.text2 }]}>
            {row.label}
          </Text>
          <Text
            style={[
              styles.value,
              row.style === 'code' && styles.code,
              row.style === 'highlight' && styles.highlight,
              {
                color:
                  row.style === 'highlight' ? colors.primary : colors.text,
              },
            ]}
          >
            {row.value}
          </Text>
        </View>
      ))}
      {footerLabel !== undefined && footerValue !== undefined && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.footerLabel, { color: colors.text }]}>
              {footerLabel}
            </Text>
            <Text style={[styles.footerValue, { color: colors.primary }]}>
              {footerValue}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  label: { fontFamily: fonts.semiBold, fontSize: 12 },
  value: { fontFamily: fonts.bold, fontSize: 13 },
  code: { fontFamily: monospace, fontWeight: '700' },
  highlight: { fontFamily: fonts.extraBold },
  divider: { height: 1 },
  footerLabel: { fontFamily: fonts.extraBold, fontSize: 13 },
  footerValue: { fontFamily: fonts.extraBold, fontSize: 17 },
});
