import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Icon,
  ProductImage,
  StatusPill,
  type StatusTone,
} from '../../../components';
import { fonts, useTheme } from '../../../theme';

const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

type OrderCardProps = {
  code: string;
  date: string;
  statusLabel: string;
  statusTone: StatusTone;
  itemsSummary: string;
  countAndTotal: string;
  imageUrl: string | null;
  imageHue: number;
  live: boolean;
  reorderDisabled?: boolean;
  onOpen: () => void;
  onTrack: () => void;
  onReorder: () => void;
};

export function OrderCard({
  code,
  date,
  statusLabel,
  statusTone,
  itemsSummary,
  countAndTotal,
  imageUrl,
  imageHue,
  live,
  reorderDisabled = false,
  onOpen,
  onTrack,
  onReorder,
}: OrderCardProps) {
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
      <View style={styles.header}>
        <View style={styles.headerTexts}>
          <Text style={[styles.code, { color: colors.text }]}>{code}</Text>
          <Text style={[styles.secondary, { color: colors.text2 }]}>
            {date}
          </Text>
        </View>
        <StatusPill label={statusLabel} tone={statusTone} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir pedido ${code}`}
        onPress={onOpen}
        style={({ pressed }) => [styles.items, { opacity: pressed ? 0.7 : 1 }]}
      >
        <ProductImage imageUrl={imageUrl} hue={imageHue} style={styles.image} />
        <View style={styles.itemTexts}>
          <Text
            numberOfLines={1}
            style={[styles.summary, { color: colors.text }]}
          >
            {itemsSummary}
          </Text>
          <Text style={[styles.secondary, { color: colors.text2 }]}>
            {countAndTotal}
          </Text>
        </View>
        <Icon name="chevronRight" size={20} color={colors.text2} />
      </Pressable>
      <View style={styles.actions}>
        {live && (
          <Pressable
            accessibilityRole="button"
            onPress={onTrack}
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.actionText, { color: colors.onPrimary }]}>
              Acompanhar
            </Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: reorderDisabled }}
          disabled={reorderDisabled}
          onPress={onReorder}
          style={({ pressed }) => [
            styles.action,
            styles.outlined,
            {
              borderColor: colors.border,
              backgroundColor: pressed ? colors.surface2 : 'transparent',
            },
          ]}
        >
          <Text
            style={[
              styles.actionText,
              { color: reorderDisabled ? colors.text2 : colors.text },
            ]}
          >
            Pedir novamente
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 11,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerTexts: { flex: 1, gap: 2 },
  code: { fontFamily: monospace, fontSize: 12.5, fontWeight: '700' },
  secondary: { fontFamily: fonts.semiBold, fontSize: 11.5 },
  items: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  image: { width: 44, height: 44, borderRadius: 13 },
  itemTexts: { flex: 1, gap: 2 },
  summary: { fontFamily: fonts.semiBold, fontSize: 12.5 },
  actions: { flexDirection: 'row', gap: 9 },
  action: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: { borderWidth: 1.5 },
  actionText: { fontFamily: fonts.bold, fontSize: 13 },
});
