import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, ProductImage } from '../../../components';
import { fonts, useTheme } from '../../../theme';

type FavoriteCardProps = {
  name: string;
  subtitle: string;
  price: string;
  imageUrl: string | null;
  imageHue: number;
  onOpen: () => void;
  onRemove: () => void;
  onAdd: () => void;
};

export function FavoriteCard({
  name,
  subtitle,
  price,
  imageUrl,
  imageHue,
  onOpen,
  onRemove,
  onAdd,
}: FavoriteCardProps) {
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${name}`}
        onPress={onOpen}
      >
        <ProductImage imageUrl={imageUrl} hue={imageHue} style={styles.image} />
      </Pressable>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text onPress={onOpen} style={[styles.name, { color: colors.text }]}>
            {name}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remover dos favoritos"
            onPress={onRemove}
            hitSlop={8}
          >
            <Icon name="favorite" size={21} color={colors.error} />
          </Pressable>
        </View>
        <Text
          numberOfLines={1}
          style={[styles.subtitle, { color: colors.text2 }]}
        >
          {subtitle}
        </Text>
        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.primary }]}>{price}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Adicionar ${name} ao carrinho`}
            onPress={onAdd}
            style={({ pressed }) => [
              styles.add,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Icon name="addShoppingCart" size={17} color={colors.onPrimary} />
            <Text style={[styles.addText, { color: colors.onPrimary }]}>
              Adicionar
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 13,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  image: { width: 84, height: 84, borderRadius: 16 },
  body: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: { flex: 1, fontFamily: fonts.bold, fontSize: 14.5 },
  subtitle: { fontFamily: fonts.medium, fontSize: 11.5 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 3,
  },
  price: { fontFamily: fonts.extraBold, fontSize: 15 },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 12,
  },
  addText: { fontFamily: fonts.bold, fontSize: 12.5 },
});
