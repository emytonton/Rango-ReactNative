import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon } from './Icon';
import { ProductImage } from './ProductImage';

export type ProductCardModel = {
  id: string;
  name: string;
  restaurant: string;
  description: string;
  price: string;
  oldPrice: string | null;
  rating: string;
  deliveryTime: string;
  imageUrl: string | null;
  imageHue: number;
  isFavorite: boolean;
};

type ProductCardProps = {
  product: ProductCardModel;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onAdd: () => void;
};

export function ProductTile({
  product,
  onOpen,
  onToggleFavorite,
  onAdd,
}: ProductCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          boxShadow: `0px 3px 10px ${colors.shadow}`,
        },
      ]}
    >
      <Pressable accessibilityRole="button" onPress={onOpen}>
        <ProductImage
          imageUrl={product.imageUrl}
          hue={product.imageHue}
          style={styles.tileImage}
        >
          {product.oldPrice && (
            <View style={[styles.offer, { backgroundColor: colors.error }]}>
              <Text style={styles.offerText}>OFERTA</Text>
            </View>
          )}
          <FavoriteButton
            favorite={product.isFavorite}
            onPress={onToggleFavorite}
            floating
          />
        </ProductImage>
      </Pressable>
      <View style={styles.tileBody}>
        <Text
          onPress={onOpen}
          numberOfLines={2}
          style={[styles.tileName, { color: colors.text }]}
        >
          {product.name}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.tileRestaurant, { color: colors.text2 }]}
        >
          {product.restaurant}
        </Text>
        <View style={styles.meta}>
          <Rating value={product.rating} size={13} fontSize={10.5} />
          <View style={styles.metaItem}>
            <Icon name="schedule" size={13} color={colors.text2} />
            <Text style={[styles.metaText, { color: colors.text2 }]}>
              {product.deliveryTime}
            </Text>
          </View>
        </View>
        <View style={styles.tileFooter}>
          <View>
            {product.oldPrice && (
              <Text style={[styles.oldPrice, { color: colors.text2 }]}>
                {product.oldPrice}
              </Text>
            )}
            <Text style={[styles.tilePrice, { color: colors.primary }]}>
              {product.price}
            </Text>
          </View>
          <AddButton onPress={onAdd} size={34} iconSize={20} radius={12} />
        </View>
      </View>
    </View>
  );
}

export function ProductRow({
  product,
  onOpen,
  onToggleFavorite,
  onAdd,
}: ProductCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          boxShadow: `0px 2px 8px ${colors.shadow}`,
        },
      ]}
    >
      <Pressable accessibilityRole="button" onPress={onOpen}>
        <ProductImage
          imageUrl={product.imageUrl}
          hue={product.imageHue}
          style={styles.rowImage}
        />
      </Pressable>
      <View style={styles.rowBody}>
        <Text
          onPress={onOpen}
          numberOfLines={1}
          style={[styles.rowName, { color: colors.text }]}
        >
          {product.name}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.rowDescription, { color: colors.text2 }]}
        >
          {product.description}
        </Text>
        <View style={styles.meta}>
          <Rating value={product.rating} size={14} fontSize={11} />
          <Text style={[styles.rowTime, { color: colors.text2 }]}>
            {product.deliveryTime}
          </Text>
        </View>
        <View style={styles.rowFooter}>
          <Text style={[styles.rowPrice, { color: colors.primary }]}>
            {product.price}
          </Text>
          <View style={styles.rowActions}>
            <FavoriteButton
              favorite={product.isFavorite}
              onPress={onToggleFavorite}
            />
            <AddButton onPress={onAdd} size={32} iconSize={19} radius={11} />
          </View>
        </View>
      </View>
    </View>
  );
}

type RatingProps = { value: string; size: number; fontSize: number };

function Rating({ value, size, fontSize }: RatingProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.metaItem}>
      <Icon name="star" size={size} color={STAR_COLOR} />
      <Text style={[styles.metaText, { fontSize, color: colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

type FavoriteButtonProps = {
  favorite: boolean;
  onPress: () => void;
  floating?: boolean;
};

function FavoriteButton({ favorite, onPress, floating }: FavoriteButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
      }
      onPress={onPress}
      hitSlop={6}
      style={
        floating
          ? styles.favoriteFloating
          : [
              styles.favorite,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]
      }
    >
      <Icon
        name={favorite ? 'favorite' : 'favoriteBorder'}
        size={19}
        color={favorite ? colors.error : colors.text2}
      />
    </Pressable>
  );
}

type AddButtonProps = {
  onPress: () => void;
  size: number;
  iconSize: number;
  radius: number;
};

function AddButton({ onPress, size, iconSize, radius }: AddButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Adicionar ao carrinho"
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.add,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.primary,
        },
        size > 32 && styles.addShadow,
        pressed && styles.pressed,
      ]}
    >
      <Icon name="add" size={iconSize} color={colors.onPrimary} />
    </Pressable>
  );
}

const STAR_COLOR = '#F5A623';

const styles = StyleSheet.create({
  tile: {
    width: 180,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tileImage: { height: 118 },
  offer: {
    position: 'absolute',
    top: 9,
    left: 9,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  offerText: { fontFamily: fonts.extraBold, fontSize: 10, color: '#FFFFFF' },
  favoriteFloating: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.16)',
  },
  tileBody: {
    paddingTop: 11,
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 5,
  },
  tileName: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 17.5 },
  tileRestaurant: { fontFamily: fonts.medium, fontSize: 11 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontFamily: fonts.semiBold, fontSize: 10.5 },
  tileFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 3,
  },
  oldPrice: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    textDecorationLine: 'line-through',
  },
  tilePrice: { fontFamily: fonts.extraBold, fontSize: 16, letterSpacing: -0.3 },
  add: { alignItems: 'center', justifyContent: 'center' },
  addShadow: { boxShadow: '0px 6px 14px -6px rgba(255, 107, 0, 0.9)' },
  pressed: { opacity: 0.85 },
  row: {
    flexDirection: 'row',
    gap: 13,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  rowImage: { width: 84, height: 84, borderRadius: 16 },
  rowBody: { flex: 1, minWidth: 0, gap: 4 },
  rowName: { fontFamily: fonts.bold, fontSize: 14.5 },
  rowDescription: { fontFamily: fonts.medium, fontSize: 11.5 },
  rowTime: { fontFamily: fonts.semiBold, fontSize: 11 },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  rowPrice: { fontFamily: fonts.extraBold, fontSize: 15 },
  rowActions: { flexDirection: 'row', gap: 7 },
  favorite: {
    width: 32,
    height: 32,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
