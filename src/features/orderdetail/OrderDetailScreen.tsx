import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ErrorState,
  IconInfoRow,
  OrderItemRow,
  PrimaryButton,
  SectionCard,
  Skeleton,
  StatusPill,
  SummaryCard,
  TopBar,
  useToast,
  type SummaryLine,
} from '../../components';
import type { OrderRepository } from '../../data/order/orderRepository';
import { useTheme } from '../../theme';
import {
  useOrderDetailViewModel,
  type OrderDetailModel,
} from './useOrderDetailViewModel';

type OrderDetailScreenProps = {
  orderCode: string;
  orderRepository: OrderRepository;
  onBack: () => void;
  onCart: () => void;
  onSessionExpired: () => void;
};

export function OrderDetailScreen({
  orderCode,
  orderRepository,
  onBack,
  onCart,
  onSessionExpired,
}: OrderDetailScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, retry, reorder } = useOrderDetailViewModel(
    orderCode,
    orderRepository,
    {
      onOpenCart: message => {
        toast.show(message, 'success');
        onCart();
      },
      onMessage: toast.show,
      onSessionExpired,
    },
  );
  const { order } = state;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar
        title="Detalhes do pedido"
        subtitle={orderCode}
        monospaceSubtitle
        onBack={onBack}
        trailing={
          order && (
            <StatusPill label={order.statusLabel} tone={order.statusTone} />
          )
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {order ? (
          <OrderDetailContent order={order} />
        ) : state.errorMessage ? (
          <ErrorState
            message={state.errorMessage}
            actionText="Tentar novamente"
            onAction={retry}
          />
        ) : (
          <>
            <Skeleton height={140} radius={20} />
            <Skeleton height={230} radius={20} />
            <Skeleton height={150} radius={20} />
          </>
        )}
      </ScrollView>
      {order && (
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
            text="Pedir novamente"
            icon="replay"
            loading={state.reordering}
            onPress={reorder}
          />
        </View>
      )}
    </View>
  );
}

function OrderDetailContent({ order }: { order: OrderDetailModel }) {
  const { colors } = useTheme();
  const values: SummaryLine[] = [
    { label: 'Subtotal', value: order.subtotal },
    { label: 'Taxa de entrega', value: order.deliveryFee ?? 'Grátis' },
  ];
  if (order.discount) {
    values.push({ label: 'Desconto', value: order.discount });
  }
  return (
    <>
      <SectionCard title="Produtos">
        {order.items.map(item => (
          <OrderItemRow
            key={item.key}
            quantity={item.quantity}
            name={item.name}
            total={item.total}
            imageUrl={item.imageUrl}
            imageHue={item.imageHue}
            restaurant={item.restaurant}
            large
          />
        ))}
      </SectionCard>
      <View
        style={[
          styles.infoCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <IconInfoRow
          icon="locationOn"
          label="Endereço de entrega"
          value={order.address}
        />
        <IconInfoRow
          icon={order.paymentIcon}
          label="Pagamento"
          value={order.paymentLabel}
        />
        <IconInfoRow icon="schedule" label="Realizado em" value={order.date} />
        <IconInfoRow
          icon="flag"
          label="Status final"
          value={order.statusLabel}
        />
      </View>
      <SummaryCard
        lines={values}
        total={order.total}
        totalLabel="Total pago"
        totalSize={19}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    gap: 13,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  infoCard: { gap: 13, padding: 15, borderRadius: 20, borderWidth: 1 },
  footer: { paddingTop: 12, paddingHorizontal: 18, borderTopWidth: 1 },
});
