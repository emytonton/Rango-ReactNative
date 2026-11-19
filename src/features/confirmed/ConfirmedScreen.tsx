import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ErrorState,
  InfoCard,
  PrimaryButton,
  SecondaryButton,
  Skeleton,
  SuccessBadge,
} from '../../components';
import type { OrderRepository } from '../../data/order/orderRepository';
import { fonts, useTheme } from '../../theme';
import {
  useConfirmedViewModel,
  type ConfirmedState,
} from './useConfirmedViewModel';

type ConfirmedScreenProps = {
  orderCode: string;
  orderRepository: OrderRepository;
  onTrack: () => void;
  onHome: () => void;
  onSessionExpired: () => void;
};

export function ConfirmedScreen({
  orderCode,
  orderRepository,
  onTrack,
  onHome,
  onSessionExpired,
}: ConfirmedScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { state, load } = useConfirmedViewModel(orderCode, orderRepository, {
    onSessionExpired,
  });

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.surface,
          paddingTop: 24 + insets.top,
          paddingBottom: 22 + insets.bottom,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SuccessBadge />
        <Text style={[styles.title, { color: colors.text }]}>
          {'Pedido realizado\ncom sucesso!'}
        </Text>
        <Text style={[styles.message, { color: colors.text2 }]}>
          Você receberá notificações sobre cada etapa do preparo e da entrega.
        </Text>
        <OrderInfo state={state} onRetry={load} />
      </ScrollView>
      <View style={styles.actions}>
        <PrimaryButton
          text="Acompanhar pedido"
          icon="deliveryDining"
          onPress={onTrack}
        />
        <SecondaryButton
          text="Voltar ao início"
          onPress={onHome}
          style={styles.home}
        />
      </View>
    </View>
  );
}

type OrderInfoProps = {
  state: ConfirmedState;
  onRetry: () => void;
};

function OrderInfo({ state, onRetry }: OrderInfoProps) {
  if (state.errorMessage) {
    return (
      <View style={styles.info}>
        <ErrorState
          message={state.errorMessage}
          actionText="Tentar novamente"
          onAction={onRetry}
        />
      </View>
    );
  }
  if (!state.order) {
    return (
      <View style={styles.info}>
        <Skeleton height={170} radius={20} />
      </View>
    );
  }
  const { order } = state;
  return (
    <View style={styles.info}>
      <InfoCard
        rows={[
          { label: 'Número do pedido', value: order.code, style: 'code' },
          {
            label: 'Previsão de entrega',
            value: order.eta,
            style: 'highlight',
          },
          { label: 'Pagamento', value: order.payment },
        ]}
        footerLabel={order.items}
        footerValue={order.total}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 22 },
  content: { alignItems: 'center', paddingTop: 22 },
  title: {
    marginTop: 20,
    fontFamily: fonts.extraBold,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  message: {
    marginTop: 9,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
  },
  info: { alignSelf: 'stretch', marginTop: 22 },
  actions: { gap: 10, paddingTop: 16 },
  home: { height: 50, borderRadius: 16 },
});
