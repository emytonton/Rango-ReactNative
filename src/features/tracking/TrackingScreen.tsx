import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CourierCard,
  ErrorState,
  Skeleton,
  StatusCard,
  Timeline,
  TopBar,
  TrackingMap,
  useToast,
  type IconName,
} from '../../components';
import type { OrderRepository } from '../../data/order/orderRepository';
import { useTheme } from '../../theme';
import {
  useTrackingViewModel,
  type TrackingOrder,
} from './useTrackingViewModel';

const stepIcons: IconName[] = [
  'receiptLong',
  'taskAlt',
  'skillet',
  'deliveryDining',
  'home',
];

function stepIcon(step: number): IconName {
  return stepIcons[step] ?? 'receiptLong';
}

type TrackingScreenProps = {
  orderCode: string;
  orderRepository: OrderRepository;
  onBack: () => void;
  onSessionExpired: () => void;
};

export function TrackingScreen({
  orderCode,
  orderRepository,
  onBack,
  onSessionExpired,
}: TrackingScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, startPolling, stopPolling, retry } = useTrackingViewModel(
    orderCode,
    orderRepository,
    { onSessionExpired },
  );

  useFocusEffect(
    useCallback(() => {
      startPolling();
      return stopPolling;
    }, [startPolling, stopPolling]),
  );

  const contact = () =>
    toast.show(
      'Contato com o entregador indisponível na demonstração.',
      'warning',
    );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar
        title="Acompanhar pedido"
        subtitle={orderCode}
        monospaceSubtitle
        onBack={onBack}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 22 + insets.bottom },
        ]}
      >
        {state.order ? (
          <TrackingContent order={state.order} onContact={contact} />
        ) : state.errorMessage ? (
          <ErrorState
            message={state.errorMessage}
            actionText="Tentar novamente"
            onAction={retry}
          />
        ) : (
          <>
            <Skeleton height={150} radius={22} />
            <Skeleton height={78} radius={20} />
            <Skeleton height={250} radius={20} />
            <Skeleton height={74} radius={20} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function TrackingContent({
  order,
  onContact,
}: {
  order: TrackingOrder;
  onContact: () => void;
}) {
  return (
    <>
      <TrackingMap
        imageUrl={order.mapImageUrl}
        caption="mapa · rota em tempo real"
      />
      <StatusCard
        icon={order.cancelled ? 'close' : stepIcon(order.step)}
        title={order.label}
        subtitle={order.hint}
        trailing={order.eta}
      />
      <Timeline
        entries={order.steps.map(step => ({
          label: step.label,
          time: step.time,
          icon: stepIcon(step.step),
          state: step.state,
        }))}
      />
      {order.courier && (
        <CourierCard
          name={order.courier.name}
          subtitle={`Entregador · ${order.courier.vehicle}`}
          photoUrl={order.courier.photoUrl}
          onChat={onContact}
          onCall={onContact}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 14, paddingTop: 16, paddingHorizontal: 18 },
});
