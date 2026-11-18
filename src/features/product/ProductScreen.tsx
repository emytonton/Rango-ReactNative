import { useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckRow,
  ErrorState,
  OverlayIconButton,
  PrimaryButton,
  ProductImage,
  QuantityStepper,
  StatCard,
  TextArea,
  useToast,
} from '../../components';
import { formatPrice } from '../../core/format/formatters';
import type { CartRepository } from '../../data/cart/cartRepository';
import type { CatalogRepository } from '../../data/catalog/catalogRepository';
import { fonts, useTheme } from '../../theme';
import { ProductSkeleton } from './components/ProductSkeleton';
import { useProductViewModel, type ProductModel } from './useProductViewModel';

const HERO_HEIGHT = 296;
const STAR_COLOR = '#F5A623';

type ProductScreenProps = {
  productId: string;
  catalogRepository: CatalogRepository;
  cartRepository: CartRepository;
  onBack: () => void;
  onAdded: () => void;
  onSessionExpired: () => void;
};

type ProductViewModel = ReturnType<typeof useProductViewModel>;

export function ProductScreen({
  productId,
  catalogRepository,
  cartRepository,
  onBack,
  onAdded,
  onSessionExpired,
}: ProductScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const viewModel = useProductViewModel(
    productId,
    catalogRepository,
    cartRepository,
    { onMessage: toast.show, onAdded, onSessionExpired },
  );
  const { product, errorMessage } = viewModel.state;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.screen, { backgroundColor: colors.surface }]}
    >
      {product ? (
        <>
          <ProductContent
            product={product}
            viewModel={viewModel}
            onBack={onBack}
          />
          <ProductFooter viewModel={viewModel} />
        </>
      ) : (
        <View style={styles.screen}>
          {errorMessage ? (
            <View style={styles.error}>
              <ErrorState
                message={errorMessage}
                actionText="Tentar novamente"
                onAction={viewModel.load}
              />
            </View>
          ) : (
            <ProductSkeleton />
          )}
          <View style={[styles.topButtons, { top: insets.top + 12 }]}>
            <OverlayIconButton
              icon="arrowBack"
              accessibilityLabel="Voltar"
              onPress={onBack}
            />
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

type ProductContentProps = {
  product: ProductModel;
  viewModel: ProductViewModel;
  onBack: () => void;
};

function ProductContent({ product, viewModel, onBack }: ProductContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [heroCovered, setHeroCovered] = useState(false);
  const { selectedAddons, notes } = viewModel.state;

  return (
    <View style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={event =>
          setHeroCovered(
            event.nativeEvent.contentOffset.y > HERO_HEIGHT - 22 - insets.top,
          )
        }
      >
        <ProductImage
          imageUrl={product.imageUrl}
          hue={product.imageHue}
          style={styles.hero}
        />
        <View style={[styles.topButtons, { top: insets.top + 12 }]}>
          <OverlayIconButton
            icon="arrowBack"
            accessibilityLabel="Voltar"
            onPress={onBack}
          />
          <OverlayIconButton
            icon={product.isFavorite ? 'favorite' : 'favoriteBorder'}
            accessibilityLabel={
              product.isFavorite
                ? 'Remover dos favoritos'
                : 'Adicionar aos favoritos'
            }
            color={product.isFavorite ? colors.error : undefined}
            onPress={viewModel.toggleFavorite}
          />
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.block}>
            <View style={styles.titleRow}>
              <Text style={[styles.name, { color: colors.text }]}>
                {product.name}
              </Text>
              <View style={styles.prices}>
                {product.oldPrice && (
                  <Text style={[styles.oldPrice, { color: colors.text2 }]}>
                    {product.oldPrice}
                  </Text>
                )}
                <Text style={[styles.price, { color: colors.primary }]}>
                  {product.priceLabel}
                </Text>
              </View>
            </View>
            <Text style={[styles.subtitle, { color: colors.text2 }]}>
              {product.subtitle}
            </Text>
          </View>
          <View style={styles.stats}>
            <StatCard
              icon="star"
              iconColor={STAR_COLOR}
              value={product.rating}
              label="avaliação"
            />
            <StatCard
              icon="schedule"
              iconColor={colors.primary}
              value={product.deliveryMinutes}
              label="minutos"
            />
            <StatCard
              icon="deliveryDining"
              iconColor={colors.primary}
              value={product.deliveryFee}
              label="entrega"
            />
          </View>
          <View style={styles.block}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Descrição
            </Text>
            <Text style={[styles.description, { color: colors.text2 }]}>
              {product.description}
            </Text>
          </View>
          <View style={styles.block}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Ingredientes
            </Text>
            <Text style={[styles.ingredients, { color: colors.text2 }]}>
              {product.ingredients}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {product.addons.length > 0 && (
            <View style={styles.addons}>
              <View style={styles.addonsHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Adicionais
                </Text>
                <Text style={[styles.optional, { color: colors.text2 }]}>
                  opcional
                </Text>
              </View>
              {product.addons.map(addon => (
                <CheckRow
                  key={addon.id}
                  label={addon.name}
                  trailing={`+ ${formatPrice(addon.price)}`}
                  checked={selectedAddons.includes(addon.id)}
                  onToggle={() => viewModel.toggleAddon(addon.id)}
                />
              ))}
            </View>
          )}
          <View style={styles.notes}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Observações
            </Text>
            <TextArea
              value={notes}
              placeholder="Ex: sem cebola, ponto da carne bem passado..."
              onChangeText={viewModel.changeNotes}
            />
          </View>
        </View>
      </ScrollView>
      {heroCovered && (
        <View
          style={[
            styles.statusCover,
            { height: insets.top, backgroundColor: colors.surface },
          ]}
        />
      )}
    </View>
  );
}

function ProductFooter({ viewModel }: { viewModel: ProductViewModel }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { quantity, adding, totalLabel } = viewModel.state;
  return (
    <View
      style={[
        styles.footer,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 13 + insets.bottom,
        },
      ]}
    >
      <QuantityStepper
        value={quantity}
        onDecrease={viewModel.decrease}
        onIncrease={viewModel.increase}
      />
      <PrimaryButton
        text={`Adicionar · ${totalLabel}`}
        icon="addShoppingCart"
        loading={adding}
        onPress={viewModel.addToCart}
        style={styles.add}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  error: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  hero: { height: HERO_HEIGHT },
  topButtons: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    marginTop: -22,
    gap: 16,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  block: { gap: 7 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 23,
    lineHeight: 27.6,
    letterSpacing: -0.7,
  },
  prices: { alignItems: 'flex-end' },
  oldPrice: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  price: { fontFamily: fonts.extraBold, fontSize: 20 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 13 },
  stats: { flexDirection: 'row', gap: 8 },
  sectionTitle: { fontFamily: fonts.extraBold, fontSize: 14 },
  description: { fontFamily: fonts.medium, fontSize: 13.5, lineHeight: 21 },
  ingredients: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 20 },
  divider: { height: 1 },
  addons: { gap: 11 },
  addonsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  optional: { fontFamily: fonts.semiBold, fontSize: 11.5 },
  notes: { gap: 9 },
  statusCover: { position: 'absolute', top: 0, left: 0, right: 0 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 13,
    paddingHorizontal: 18,
    borderTopWidth: 1,
  },
  add: { flex: 1 },
});
