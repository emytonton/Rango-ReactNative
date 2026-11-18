import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  EmptyState,
  ErrorState,
  GhostButton,
  PrimaryButton,
  SummaryCard,
  TopBar,
  useToast,
} from '../../components';
import type { CartRepository } from '../../data/cart/cartRepository';
import { useTheme } from '../../theme';
import { ProductRowSkeleton } from '../home/components/HomeSkeleton';
import { CartLineCard } from './components/CartLineCard';
import { CouponField } from './components/CouponField';
import { useCartViewModel, type CartState } from './useCartViewModel';

type CartScreenProps = {
  cartRepository: CartRepository;
  onBack: () => void;
  onHome: () => void;
  onOpenProduct: (productId: string) => void;
  onCheckout: () => void;
  onSessionExpired: () => void;
};

export function CartScreen({
  cartRepository,
  onBack,
  onHome,
  onOpenProduct,
  onCheckout,
  onSessionExpired,
}: CartScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const viewModel = useCartViewModel(cartRepository, {
    onMessage: toast.show,
    onSessionExpired,
  });
  const { state, refresh } = viewModel;

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const hasLines = state.lines.length > 0;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <TopBar
        title="Carrinho"
        subtitle={cartSubtitle(state)}
        onBack={onBack}
        actionText={hasLines ? 'Limpar' : undefined}
        actionColor={colors.error}
        onAction={viewModel.clear}
      />
      {state.loading ? (
        <View style={styles.content}>
          <ProductRowSkeleton />
          <ProductRowSkeleton />
        </View>
      ) : state.errorMessage ? (
        <View style={styles.content}>
          <ErrorState
            message={state.errorMessage}
            actionText="Tentar novamente"
            onAction={viewModel.load}
          />
        </View>
      ) : state.empty ? (
        <View style={[styles.empty, { paddingBottom: insets.bottom }]}>
          <EmptyState
            icon="removeShoppingCart"
            title="Seu carrinho está vazio"
            message="Explore os restaurantes e adicione seus pratos favoritos."
            actionText="Explorar produtos"
            onAction={onHome}
            large
            primaryAction
          />
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {state.lines.map(line => (
              <CartLineCard
                key={line.id}
                line={line}
                onOpen={() => onOpenProduct(line.productId)}
                onIncrease={() => viewModel.increase(line.id)}
                onDecrease={() => viewModel.decrease(line.id)}
                onRemove={() => viewModel.remove(line.id)}
              />
            ))}
            <CouponField
              value={state.couponInput}
              applied={state.couponApplied}
              onChange={viewModel.changeCoupon}
              onApply={viewModel.applyCoupon}
            />
            <SummaryCard lines={state.summary} total={state.total} />
          </ScrollView>
          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                paddingBottom: 12 + insets.bottom,
              },
            ]}
          >
            <PrimaryButton
              text="Finalizar pedido"
              trailingText={state.total}
              onPress={onCheckout}
            />
            <GhostButton text="Continuar comprando" onPress={onHome} />
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

function cartSubtitle(state: CartState): string {
  if (state.loading) {
    return '';
  }
  if (state.itemCount === 0) {
    return 'nenhum item';
  }
  const items = state.itemCount === 1 ? 'item' : 'itens';
  return `${state.itemCount} ${items} · ${state.subtotal}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    gap: 14,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  empty: { flex: 1, justifyContent: 'center' },
  footer: {
    gap: 9,
    paddingTop: 12,
    paddingHorizontal: 18,
    borderTopWidth: 1,
  },
});
