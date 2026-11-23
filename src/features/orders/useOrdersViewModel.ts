import { useCallback, useEffect, useRef, useState } from 'react';
import type { StatusTone, ToastKind } from '../../components';
import { formatOrderDate, formatPrice } from '../../core/format/formatters';
import { ApiError, NetworkError } from '../../core/network/apiError';
import { apiBaseUrl } from '../../core/network/config';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type {
  OrderGroup,
  OrderRepository,
  OrderSummary,
} from '../../data/order/orderRepository';

export type OrdersTab = OrderGroup;

export type OrderListItem = {
  code: string;
  date: string;
  statusLabel: string;
  statusTone: StatusTone;
  itemsSummary: string;
  countAndTotal: string;
  imageUrl: string | null;
  imageHue: number;
  live: boolean;
};

export type OrdersTabState = {
  loading: boolean;
  loaded: boolean;
  errorMessage: string | null;
  orders: OrderListItem[];
  offline: boolean;
};

export type OrdersState = {
  selectedTab: OrdersTab;
  tabs: Record<OrdersTab, OrdersTabState>;
  reorderingCode: string | null;
};

type OrdersCallbacks = {
  onOpenCart: (message: string) => void;
  onMessage: (text: string, kind: ToastKind) => void;
  onSessionExpired: () => void;
};

const emptyTab: OrdersTabState = {
  loading: false,
  loaded: false,
  errorMessage: null,
  orders: [],
  offline: false,
};

const initialState: OrdersState = {
  selectedTab: 'live',
  tabs: { live: { ...emptyTab, loading: true }, past: emptyTab },
  reorderingCode: null,
};

const systemNow = () => new Date();

export function isTabEmpty(tab: OrdersTabState): boolean {
  return tab.loaded && tab.errorMessage === null && tab.orders.length === 0;
}

export function useOrdersViewModel(
  orderRepository: OrderRepository,
  callbacks: OrdersCallbacks,
  now: () => Date = systemNow,
) {
  const [state, setState] = useState<OrdersState>(initialState);
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);
  const nowRef = useRef(now);
  const requests = useRef<Record<OrdersTab, number>>({ live: 0, past: 0 });

  useEffect(() => {
    stateRef.current = state;
    callbacksRef.current = callbacks;
    nowRef.current = now;
  });

  const updateTab = useCallback(
    (tab: OrdersTab, change: (current: OrdersTabState) => OrdersTabState) =>
      setState(current => ({
        ...current,
        tabs: { ...current.tabs, [tab]: change(current.tabs[tab]) },
      })),
    [],
  );

  const load = useCallback(
    async (tab: OrdersTab) => {
      const id = ++requests.current[tab];
      updateTab(tab, current => ({
        ...current,
        loading: true,
        errorMessage: null,
      }));
      try {
        const reference = nowRef.current();
        const orders = (await orderRepository.list(tab)).map(order =>
          toItem(order, reference),
        );
        if (requests.current[tab] !== id) {
          return;
        }
        updateTab(tab, () => ({
          loading: false,
          loaded: true,
          errorMessage: null,
          orders,
          offline: false,
        }));
      } catch (error) {
        if (requests.current[tab] !== id) {
          return;
        }
        if (error instanceof SessionExpiredError) {
          callbacksRef.current.onSessionExpired();
          return;
        }
        const cached =
          error instanceof NetworkError
            ? await orderRepository.cachedList(tab)
            : null;
        if (requests.current[tab] !== id) {
          return;
        }
        if (cached) {
          const reference = nowRef.current();
          updateTab(tab, () => ({
            loading: false,
            loaded: true,
            errorMessage: null,
            orders: cached.map(order => toItem(order, reference)),
            offline: true,
          }));
          return;
        }
        const message =
          error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar os pedidos.';
        updateTab(tab, current =>
          current.loaded
            ? { ...current, loading: false }
            : { ...current, loading: false, errorMessage: message },
        );
      }
    },
    [orderRepository, updateTab],
  );

  useEffect(() => {
    load('live');
  }, [load]);

  const selectTab = useCallback(
    (tab: OrdersTab) => {
      setState(current => ({ ...current, selectedTab: tab }));
      const current = stateRef.current.tabs[tab];
      if (!current.loaded && !current.loading) {
        load(tab);
      }
    },
    [load],
  );

  const refresh = useCallback(() => {
    const { selectedTab, tabs } = stateRef.current;
    if (tabs[selectedTab].loaded) {
      load(selectedTab);
    }
  }, [load]);

  const retry = useCallback(() => {
    load(stateRef.current.selectedTab);
  }, [load]);

  const reorder = useCallback(
    async (code: string) => {
      if (stateRef.current.reorderingCode !== null) {
        return;
      }
      stateRef.current = { ...stateRef.current, reorderingCode: code };
      setState(current => ({ ...current, reorderingCode: code }));
      try {
        const result = await orderRepository.reorder(code);
        if (result.cart.items.length === 0) {
          callbacksRef.current.onMessage(
            'Os itens deste pedido não estão mais disponíveis.',
            'error',
          );
        } else {
          callbacksRef.current.onOpenCart(
            result.skippedProductIds.length > 0
              ? 'Alguns itens não estão mais disponíveis.'
              : 'Itens adicionados ao carrinho.',
          );
        }
      } catch (error) {
        if (error instanceof SessionExpiredError) {
          callbacksRef.current.onSessionExpired();
        } else {
          callbacksRef.current.onMessage(
            error instanceof ApiError
              ? error.message
              : 'Não foi possível pedir novamente.',
            'error',
          );
        }
      } finally {
        setState(current => ({ ...current, reorderingCode: null }));
      }
    },
    [orderRepository],
  );

  return { state, selectTab, refresh, retry, reorder };
}

function toItem(order: OrderSummary, now: Date): OrderListItem {
  return {
    code: order.code,
    date: formatOrderDate(order.createdAt, now),
    statusLabel: order.statusLabel,
    statusTone:
      order.status === 'cancel'
        ? 'error'
        : order.status === 'done'
        ? 'success'
        : 'progress',
    itemsSummary: order.itemsSummary,
    countAndTotal: `${
      order.itemCount === 1 ? '1 item' : `${order.itemCount} itens`
    } · ${formatPrice(order.total)}`,
    imageUrl: order.thumbnail.imageUrl
      ? apiBaseUrl + order.thumbnail.imageUrl
      : null,
    imageHue: order.thumbnail.imageHue,
    live: order.status === 'live',
  };
}
