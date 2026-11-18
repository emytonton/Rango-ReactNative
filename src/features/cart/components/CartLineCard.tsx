import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, ProductImage, QuantityStepper } from '../../../components';
import { fonts, useTheme } from '../../../theme';
import type { CartLineModel } from '../useCartViewModel';

type CartLineCardProps = {
  line: CartLineModel;
  onOpen: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
};

export function CartLineCard({
  line,
  onOpen,
  onIncrease,
  onDecrease,
  onRemove,
}: CartLineCardProps) {
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
      <Pressable accessibilityRole="button" onPress={onOpen}>
        <ProductImage
          imageUrl={line.imageUrl}
          hue={line.imageHue}
          style={styles.image}
        />
      </Pressable>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.text }]}>{line.name}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remover ${line.name}`}
            onPress={onRemove}
            hitSlop={8}
          >
            <Icon name="deleteOutline" size={19} color={colors.text2} />
          </Pressable>
        </View>
        <Text style={[styles.detail, { color: colors.text2 }]}>
          {line.unitPrice} · un.
        </Text>
        {line.addons && (
          <Text style={[styles.detail, { color: colors.primary }]}>
            + {line.addons}
          </Text>
        )}
        {line.notes && (
          <Text style={[styles.notes, { color: colors.text2 }]}>
            “{line.notes}”
          </Text>
        )}
        <View style={styles.footer}>
          <QuantityStepper
            value={line.quantity}
            onDecrease={onDecrease}
            onIncrease={onIncrease}
            compact
          />
          <Text style={[styles.total, { color: colors.primary }]}>
            {line.total}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  image: { width: 80, height: 80, borderRadius: 16 },
  body: { flex: 1, minWidth: 0, gap: 3 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: { flex: 1, fontFamily: fonts.bold, fontSize: 14 },
  detail: { fontFamily: fonts.semiBold, fontSize: 11 },
  notes: { fontFamily: fonts.medium, fontSize: 11, fontStyle: 'italic' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 5,
  },
  total: { fontFamily: fonts.extraBold, fontSize: 15 },
});
