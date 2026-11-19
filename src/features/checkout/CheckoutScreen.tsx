import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ErrorState,
  IconTile,
  OrderItemRow,
  PrimaryButton,
  SectionCard,
  Skeleton,
  SummaryCard,
  TopBar,
  useToast,
} from '../../components';
import type { AddressRepository } from '../../data/address/addressRepository';
import type { CartRepository } from '../../data/cart/cartRepository';
import type { OrderRepository } from '../../data/order/orderRepository';
import type { PaymentRepository } from '../../data/payment/paymentRepository';
import type {
  PaymentSelection,
  SelectedPayment,
} from '../../data/payment/paymentSelection';
import { fonts, useTheme } from '../../theme';
import { paymentTypeIcons } from '../payment/paymentTypeIcon';
import {
  useCheckoutViewModel,
  type CheckoutState,
} from './useCheckoutViewModel';

type CheckoutScreenProps = {
  cartRepository: CartRepository;
  addressRepository: AddressRepository;
  paymentRepository: PaymentRepository;
  paymentSelection: PaymentSelection;
  orderRepository: OrderRepository;
  onBack: () => void;
  onOpenCart: () => void;
  onOpenAddress: () => void;
  onOpenPayment: () => void;
  onOrderPlaced: (code: string) => void;
  onSessionExpired: () => void;
};

export function CheckoutScreen({
  onBack,
  onOpenCart,
  onOpenAddress,
  onOpenPayment,
  onOrderPlaced,
  onSessionExpired,
  ...dependencies
}: CheckoutScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, payment, refresh, confirm } = useCheckoutViewModel(
    dependencies,
    {
      onMessage: toast.show,
      onSessionExpired,
      onOrderPlaced,
      onOpenCart,
      onOpenAddress,
      onOpenPayment,
    },
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar title="Finalizar pedido" onBack={onBack} />
      {state.errorMessage ? (
        <View style={styles.error}>
          <ErrorState
            message={state.errorMessage}
            actionText="Tentar novamente"
            onAction={refresh}
          />
        </View>
      ) : state.loading ? (
        <View style={styles.content}>
          <Skeleton height={112} radius={20} />
          <Skeleton height={112} radius={20} />
          <Skeleton height={220} radius={20} />
        </View>
      ) : (
        <CheckoutContent
          state={state}
          payment={payment}
          onChangeAddress={onOpenAddress}
          onChangePayment={onOpenPayment}
        />
      )}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: 20 + insets.bottom,
          },
        ]}
      >
        <PrimaryButton
          text="Confirmar pedido"
          loadingText="Processando pagamento..."
          onPress={confirm}
          loading={state.placing}
          disabled={state.loading || state.errorMessage !== null}
        />
      </View>
    </View>
  );
}

type CheckoutContentProps = {
  state: CheckoutState;
  payment: SelectedPayment | null;
  onChangeAddress: () => void;
  onChangePayment: () => void;
};

function CheckoutContent({
  state,
  payment,
  onChangeAddress,
  onChangePayment,
}: CheckoutContentProps) {
  const { colors } = useTheme();
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <SectionCard
        title="Endereço de entrega"
        icon="locationOn"
        actionText="Alterar"
        onAction={onChangeAddress}
      >
        {state.address ? (
          <View style={styles.texts}>
            <Text style={[styles.addressLabel, { color: colors.primary }]}>
              {state.address.label}
            </Text>
            <Text style={[styles.strong, { color: colors.text }]}>
              {state.address.line}
            </Text>
            <Text style={[styles.city, { color: colors.text2 }]}>
              {state.address.cityLine}
            </Text>
          </View>
        ) : (
          <Text style={[styles.empty, { color: colors.text2 }]}>
            Nenhum endereço selecionado.
          </Text>
        )}
      </SectionCard>
      <SectionCard
        title="Forma de pagamento"
        icon="wallet"
        actionText="Alterar"
        onAction={onChangePayment}
      >
        {payment ? (
          <View style={styles.payment}>
            <IconTile
              icon={paymentTypeIcons[payment.type]}
              size={40}
              iconSize={21}
            />
            <View>
              <Text style={[styles.strong, { color: colors.text }]}>
                {payment.label}
              </Text>
              <Text style={[styles.hint, { color: colors.text2 }]}>
                {payment.detail}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.empty, { color: colors.text2 }]}>
            Nenhuma forma de pagamento escolhida.
          </Text>
        )}
      </SectionCard>
      <SummaryCard
        title="Resumo do pedido"
        lines={state.summary}
        total={state.total}
        header={state.items.map(item => (
          <OrderItemRow
            key={item.id}
            quantity={item.quantity}
            name={item.name}
            total={item.total}
            imageUrl={item.imageUrl}
            imageHue={item.imageHue}
            addons={item.addons}
          />
        ))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  error: { flex: 1, justifyContent: 'center', paddingHorizontal: 18 },
  content: {
    gap: 14,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  texts: { gap: 2 },
  addressLabel: { fontFamily: fonts.extraBold, fontSize: 12 },
  strong: { fontFamily: fonts.bold, fontSize: 13.5 },
  city: { fontFamily: fonts.medium, fontSize: 12 },
  hint: { fontFamily: fonts.medium, fontSize: 11.5 },
  empty: { fontFamily: fonts.medium, fontSize: 13 },
  payment: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 18,
    borderTopWidth: 1,
  },
});
