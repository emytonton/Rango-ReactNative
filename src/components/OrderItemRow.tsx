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
  restaurant?: string | null;
  large?: boolean;
};

export function OrderItemRow({
  quantity,
  name,
  total,
  imageUrl,
  imageHue,
  addons,
  restaurant,
  large = false,
}: OrderItemRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <ProductImage
        imageUrl={imageUrl}
        hue={imageHue}
        style={large ? styles.largeImage : styles.image}
      />
      <View style={styles.texts}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
          {quantity}× {name}
        </Text>
        {addons ? (
          <Text style={[styles.addons, { color: colors.text2 }]}>
            + {addons}
          </Text>
        ) : null}
        {restaurant ? (
          <Text style={[styles.secondary, { color: colors.text2 }]}>
            {restaurant}
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
  largeImage: { width: 38, height: 38, borderRadius: 12 },
  texts: { flex: 1, minWidth: 0, gap: 1 },
  name: { fontFamily: fonts.bold, fontSize: 13 },
  addons: { fontFamily: fonts.medium, fontSize: 11 },
  secondary: { fontFamily: fonts.medium, fontSize: 11 },
  total: { fontFamily: fonts.bold, fontSize: 13 },
});
