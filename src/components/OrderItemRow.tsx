import { StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { ProductImage } from './ProductImage';

type OrderItemRowProps = {
  quantity: number;
  name: string;
  total: string;
  imageUrl: string | null;
  imageHue: number;
  addons?: string | null;
};

export function OrderItemRow({
  quantity,
  name,
  total,
  imageUrl,
  imageHue,
  addons,
}: OrderItemRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <ProductImage imageUrl={imageUrl} hue={imageHue} style={styles.image} />
      <View style={styles.texts}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
          {quantity}× {name}
        </Text>
        {addons ? (
          <Text style={[styles.addons, { color: colors.text2 }]}>
            + {addons}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.total, { color: colors.text }]}>{total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  image: { width: 36, height: 36, borderRadius: 11 },
  texts: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.bold, fontSize: 13 },
  addons: { fontFamily: fonts.medium, fontSize: 11 },
  total: { fontFamily: fonts.bold, fontSize: 13 },
});
