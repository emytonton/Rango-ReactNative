import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomBar,
  DashedNote,
  EmptyState,
  ErrorState,
  Skeleton,
  UnderlineTabs,
  useToast,
  type BottomTab,
} from '../../components';
import { useConnectionChange } from '../../core/connectivity/useConnectivity';
import type { ConnectivityMonitor } from '../../core/native/connectivityMonitor';
import type { OrderRepository } from '../../data/order/orderRepository';
import { fonts, useTheme } from '../../theme';
import { OrderCard } from './components/OrderCard';
import {
  isTabEmpty,
  useOrdersViewModel,
  type OrdersTab,
} from './useOrdersViewModel';

const tabs: { key: OrdersTab; label: string }[] = [
  { key: 'live', label: 'Em andamento' },
  { key: 'past', label: 'Anteriores' },
];

type OrdersScreenProps = {
  orderRepository: OrderRepository;
  connectivityMonitor: ConnectivityMonitor;
  onOpenOrder: (code: string) => void;
  onTrack: (code: string) => void;
  onCart: () => void;
  onHome: () => void;
  onTab: (tab: BottomTab) => void;
  onSessionExpired: () => void;
};

export function OrdersScreen({
  orderRepository,
  connectivityMonitor,
  onOpenOrder,
  onTrack,
  onCart,
  onHome,
  onTab,
  onSessionExpired,
}: OrdersScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const viewModel = useOrdersViewModel(orderRepository, {
    onOpenCart: message => {
      toast.show(message, 'success');
      onCart();
    },
    onMessage: toast.show,
    onSessionExpired,
  });
  const { state, refresh } = viewModel;
  const tab = state.tabs[state.selectedTab];

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
  useConnectionChange(connectivityMonitor, refresh);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 6,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Meus pedidos</Text>
        <UnderlineTabs
          tabs={tabs}
          selected={state.selectedTab}
          onSelect={viewModel.selectTab}
        />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {tab.offline && (
          <DashedNote
            icon="save"
            text="Histórico carregado do armazenamento local."
            iconColor={colors.success}
          />
        )}
        {tab.orders.length > 0 ? (
          tab.orders.map(order => (
            <OrderCard
              key={order.code}
              {...order}
              reorderDisabled={state.reorderingCode !== null}
              onOpen={() => onOpenOrder(order.code)}
              onTrack={() => onTrack(order.code)}
              onReorder={() => viewModel.reorder(order.code)}
            />
          ))
        ) : isTabEmpty(tab) ? (
          <EmptyState
            icon="receiptLong"
            title={
              state.selectedTab === 'live'
                ? 'Nenhum pedido em andamento'
                : 'Nenhum pedido anterior'
            }
            message="Quando você fizer um pedido, ele aparece aqui."
            actionText="Fazer um pedido"
            onAction={onHome}
            primaryAction
          />
        ) : tab.errorMessage ? (
          <ErrorState
            message={tab.errorMessage}
            actionText="Tentar novamente"
            onAction={viewModel.retry}
          />
        ) : (
          [0, 1, 2].map(index => (
            <Skeleton key={index} height={168} radius={20} />
          ))
        )}
      </ScrollView>
      <BottomBar selected="orders" onSelect={onTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    gap: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 21,
    letterSpacing: -0.6,
  },
  content: {
    gap: 13,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
});
