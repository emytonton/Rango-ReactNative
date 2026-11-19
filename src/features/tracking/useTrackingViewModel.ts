import { useCallback, useEffect, useRef, useState } from 'react';
import type { TimelineState } from '../../components';
import { formatClock, formatDeliveryTime } from '../../core/format/formatters';
import { ApiError } from '../../core/network/apiError';
import { apiBaseUrl } from '../../core/network/config';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type {
  OrderDetail,
  OrderRepository,
  TimelineStep,
} from '../../data/order/orderRepository';

export const TRACKING_POLL_MS = 5000;

export type TrackingStep = {
  step: number;
  label: string;
  time: string;
  state: TimelineState;
};

export type TrackingCourier = {
  name: string;
  vehicle: string;
  photoUrl: string | null;
};

export type TrackingOrder = {
  code: string;
  step: number;
  cancelled: boolean;
  label: string;
  hint: string;
  eta: string;
  steps: TrackingStep[];
  courier: TrackingCourier | null;
  mapImageUrl: string | null;
};

export type TrackingState = {
  loading: boolean;
  errorMessage: string | null;
  order: TrackingOrder | null;
};

type TrackingCallbacks = {
  onSessionExpired: () => void;
};

const initialState: TrackingState = {
  loading: true,
  errorMessage: null,
  order: null,
};

export function useTrackingViewModel(
  orderCode: string,
  orderRepository: OrderRepository,
  callbacks: TrackingCallbacks,
  pollMs: number = TRACKING_POLL_MS,
) {
  const [state, setState] = useState<TrackingState>(initialState);
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);
  const pollId = useRef(0);
  const polling = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = state;
    callbacksRef.current = callbacks;
  });

  const showError = useCallback((message: string): boolean => {
    if (stateRef.current.order) {
      return true;
    }
    setState(current => ({
      ...current,
      loading: false,
      errorMessage: message,
    }));
    return false;
  }, []);

  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const order = await orderRepository.detail(orderCode);
      setState({
        loading: false,
        errorMessage: null,
        order: toTracking(order),
      });
      return order.status === 'live';
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        callbacksRef.current.onSessionExpired();
        return false;
      }
      return showError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar o pedido.',
      );
    }
  }, [orderCode, orderRepository, showError]);

  const stopPolling = useCallback(() => {
    pollId.current += 1;
    polling.current = false;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (polling.current) {
      return;
    }
    polling.current = true;
    const id = ++pollId.current;
    const tick = async () => {
      const keepPolling = await refresh();
      if (pollId.current !== id) {
        return;
      }
      if (keepPolling) {
        timer.current = setTimeout(tick, pollMs);
      } else {
        polling.current = false;
      }
    };
    tick();
  }, [refresh, pollMs]);

  const retry = useCallback(() => {
    setState(current => ({ ...current, loading: true, errorMessage: null }));
    startPolling();
  }, [startPolling]);

  return { state, startPolling, stopPolling, retry };
}

function toTracking(order: OrderDetail): TrackingOrder {
  const { minMinutes, maxMinutes } = order.estimatedDelivery;
  return {
    code: order.code,
    step: order.step,
    cancelled: order.status === 'cancel',
    label: order.statusLabel,
    hint: order.hint,
    eta:
      order.status === 'done'
        ? 'Entregue'
        : order.status === 'cancel'
        ? 'Cancelado'
        : formatDeliveryTime(minMinutes, maxMinutes),
    steps: order.timeline.map(toStep),
    courier: order.courier && {
      name: order.courier.name,
      vehicle: order.courier.vehicle,
      photoUrl: order.courier.photoUrl
        ? apiBaseUrl + order.courier.photoUrl
        : null,
    },
    mapImageUrl: order.mapImageUrl ? apiBaseUrl + order.mapImageUrl : null,
  };
}

function toStep(step: TimelineStep): TrackingStep {
  return {
    step: step.step,
    label: step.label,
    state: step.state,
    time:
      step.state === 'done'
        ? step.reachedAt
          ? formatClock(step.reachedAt)
          : ''
        : step.state === 'current'
        ? 'agora'
        : 'previsto',
  };
}
