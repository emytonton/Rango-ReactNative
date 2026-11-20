import { useCallback, useEffect, useRef, useState } from 'react';
import type { IconName, StatusTone, ToastKind } from '../../components';
import { formatOrderDate, formatPrice } from '../../core/format/formatters';
import { ApiError } from '../../core/network/apiError';
import { apiBaseUrl } from '../../core/network/config';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type {
  OrderDetail,
  OrderRepository,
} from '../../data/order/orderRepository';
import { paymentTypeIcons } from '../payment/paymentTypeIcon';

export type OrderDetailItem = {
  key: string;
  quantity: number;
  name: string;
  restaurant: string | null;
  total: string;
  imageUrl: string | null;
  imageHue: number;
};

export type OrderDetailModel = {
  code: string;
  statusLabel: string;
  statusTone: StatusTone;
  items: OrderDetailItem[];
  address: string;
  paymentLabel: string;
  paymentIcon: IconName;
  date: string;
  subtotal: string;
  deliveryFee: string | null;
  discount: string | null;
  total: string;
};

export type OrderDetailState = {
  loading: boolean;
  errorMessage: string | null;
  order: OrderDetailModel | null;
  reordering: boolean;
};

type OrderDetailCallbacks = {
  onOpenCart: (message: string) => void;
  onMessage: (text: string, kind: ToastKind) => void;
  onSessionExpired: () => void;
};

const initialState: OrderDetailState = {
  loading: true,
  errorMessage: null,
  order: null,
  reordering: false,
};

const systemNow = () => new Date();

export function useOrderDetailViewModel(
  orderCode: string,
  orderRepository: OrderRepository,
  callbacks: OrderDetailCallbacks,
  now: () => Date = systemNow,
) {
  const [state, setState] = useState<OrderDetailState>(initialState);
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);
  const nowRef = useRef(now);

  useEffect(() => {
    stateRef.current = state;
    callbacksRef.current = callbacks;
    nowRef.current = now;
  });

  const load = useCallback(async () => {
    setState(current => ({ ...current, loading: true, errorMessage: null }));
    try {
      const order = await orderRepository.detail(orderCode);
      setState(current => ({
        ...current,
        loading: false,
        order: toModel(order, nowRef.current()),
      }));
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        callbacksRef.current.onSessionExpired();
        return;
      }
      setState(current => ({
        ...current,
        loading: false,
        errorMessage:
          error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar o pedido.',
      }));
    }
  }, [orderCode, orderRepository]);

  useEffect(() => {
    load();
  }, [load]);

  const reorder = useCallback(async () => {
    const current = stateRef.current;
    if (current.order === null || current.reordering) {
      return;
    }
    stateRef.current = { ...current, reordering: true };
    setState(previous => ({ ...previous, reordering: true }));
    try {
      const result = await orderRepository.reorder(orderCode);
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
      setState(previous => ({ ...previous, reordering: false }));
    }
  }, [orderCode, orderRepository]);

  return { state, retry: load, reorder };
}

function toModel(order: OrderDetail, now: Date): OrderDetailModel {
  const { subtotal, deliveryFee, discount, total } = order.amounts;
  return {
    code: order.code,
    statusLabel: order.statusLabel,
    statusTone:
      order.status === 'cancel'
        ? 'error'
        : order.status === 'done'
        ? 'success'
        : 'progress',
    items: order.items.map((item, index) => ({
      key: `${item.productId ?? item.name}-${index}`,
      quantity: item.quantity,
      name: item.name,
      restaurant: item.restaurant,
      total: formatPrice(item.total),
      imageUrl: item.imageUrl ? apiBaseUrl + item.imageUrl : null,
      imageHue: item.imageHue,
    })),
    address: order.address?.line ?? '',
    paymentLabel: order.payment.label,
    paymentIcon: paymentTypeIcons[order.payment.type] ?? 'payments',
    date: order.createdAt ? formatOrderDate(order.createdAt, now) : '',
    subtotal: formatPrice(subtotal),
    deliveryFee: deliveryFee > 0 ? formatPrice(deliveryFee) : null,
    discount: discount > 0 ? `- ${formatPrice(discount)}` : null,
    total: formatPrice(total),
  };
}
