import { useCallback, useEffect, useRef, useState } from 'react';
import { formatDeliveryTime, formatPrice } from '../../core/format/formatters';
import { ApiError } from '../../core/network/apiError';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type {
  OrderDetail,
  OrderRepository,
} from '../../data/order/orderRepository';

export type ConfirmedOrder = {
  code: string;
  eta: string;
  payment: string;
  items: string;
  total: string;
};

export type ConfirmedState = {
  loading: boolean;
  errorMessage: string | null;
  order: ConfirmedOrder | null;
};

type ConfirmedCallbacks = {
  onSessionExpired: () => void;
};

const initialState: ConfirmedState = {
  loading: true,
  errorMessage: null,
  order: null,
};

export function useConfirmedViewModel(
  orderCode: string,
  orderRepository: OrderRepository,
  callbacks: ConfirmedCallbacks,
) {
  const [state, setState] = useState<ConfirmedState>(initialState);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const load = useCallback(async () => {
    setState(current => ({ ...current, loading: true, errorMessage: null }));
    try {
      const order = await orderRepository.detail(orderCode);
      setState({
        loading: false,
        errorMessage: null,
        order: toConfirmed(order),
      });
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

  return { state, load };
}

function toConfirmed(order: OrderDetail): ConfirmedOrder {
  const { minMinutes, maxMinutes } = order.estimatedDelivery;
  return {
    code: order.code,
    eta:
      order.status === 'done'
        ? 'Entregue'
        : formatDeliveryTime(minMinutes, maxMinutes),
    payment: order.payment.label,
    items: order.itemCount === 1 ? '1 item' : `${order.itemCount} itens`,
    total: formatPrice(order.amounts.total),
  };
}
