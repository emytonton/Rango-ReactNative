import { useCallback, useEffect, useRef, useState } from 'react';
import type { SummaryLine, ToastKind } from '../../components';
import { formatPrice } from '../../core/format/formatters';
import { ApiError, NetworkError } from '../../core/network/apiError';
import { apiBaseUrl } from '../../core/network/config';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type { Cart, CartRepository } from '../../data/cart/cartRepository';

const COUPON_MAX_LENGTH = 30;

export type CartLineModel = {
  id: number;
  productId: string;
  name: string;
  unitPrice: string;
  addons: string | null;
  notes: string | null;
  quantity: number;
  total: string;
  imageUrl: string | null;
  imageHue: number;
};

export type CartState = {
  loading: boolean;
  errorMessage: string | null;
  lines: CartLineModel[];
  itemCount: number;
  subtotal: string;
  summary: SummaryLine[];
  total: string;
  couponInput: string;
  couponApplied: boolean;
};

type CartCallbacks = {
  onMessage: (text: string, kind: ToastKind) => void;
  onSessionExpired: () => void;
};

const initialState: CartState = {
  loading: true,
  errorMessage: null,
  lines: [],
  itemCount: 0,
  subtotal: formatPrice(0),
  summary: [],
  total: formatPrice(0),
  couponInput: '',
  couponApplied: false,
};

export function useCartViewModel(
  cartRepository: CartRepository,
  callbacks: CartCallbacks,
) {
  const [state, setState] = useState<CartState>(initialState);
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    stateRef.current = state;
    callbacksRef.current = callbacks;
  });

  const load = useCallback(async () => {
    setState(current => ({ ...current, loading: true, errorMessage: null }));
    try {
      const cart = await cartRepository.cart();
      setState(current => withCart(current, cart, true));
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
            : 'Não foi possível carregar o carrinho.',
      }));
    }
  }, [cartRepository]);

  useEffect(() => {
    load();
  }, [load]);

  const mutate = useCallback(
    (
      block: () => Promise<Cart | null>,
      success?: (cart: Cart) => [string, ToastKind] | null,
    ) => {
      queue.current = queue.current.then(async () => {
        try {
          const cart = await block();
          if (!cart) {
            return;
          }
          setState(current => withCart(current, cart, false));
          const toast = success?.(cart);
          if (toast) {
            callbacksRef.current.onMessage(...toast);
          }
        } catch (error) {
          if (error instanceof SessionExpiredError) {
            callbacksRef.current.onSessionExpired();
          } else if (
            error instanceof ApiError ||
            error instanceof NetworkError
          ) {
            callbacksRef.current.onMessage(error.message, 'error');
          }
        }
      });
      return queue.current;
    },
    [],
  );

  const findLine = (lineId: number) =>
    stateRef.current.lines.find(line => line.id === lineId);

  const refresh = useCallback(() => {
    if (!stateRef.current.loading) {
      mutate(() => cartRepository.cart());
    }
  }, [cartRepository, mutate]);

  const increase = useCallback(
    (lineId: number) =>
      mutate(async () => {
        const line = findLine(lineId);
        return line
          ? cartRepository.updateQuantity(lineId, line.quantity + 1)
          : null;
      }),
    [cartRepository, mutate],
  );

  const decrease = useCallback(
    (lineId: number) =>
      mutate(async () => {
        const line = findLine(lineId);
        if (!line) {
          return null;
        }
        return line.quantity <= 1
          ? cartRepository.removeItem(lineId)
          : cartRepository.updateQuantity(lineId, line.quantity - 1);
      }),
    [cartRepository, mutate],
  );

  const remove = useCallback(
    (lineId: number) =>
      mutate(
        () => cartRepository.removeItem(lineId),
        () => ['Produto removido.', 'warning'],
      ),
    [cartRepository, mutate],
  );

  const clear = useCallback(
    () =>
      mutate(
        () => cartRepository.clear(),
        () => ['Carrinho esvaziado.', 'warning'],
      ),
    [cartRepository, mutate],
  );

  const changeCoupon = useCallback((value: string) => {
    setState(current => ({
      ...current,
      couponInput: value.slice(0, COUPON_MAX_LENGTH),
      couponApplied: false,
    }));
  }, []);

  const applyCoupon = useCallback(() => {
    const code = stateRef.current.couponInput.trim().toUpperCase();
    if (!code) {
      return Promise.resolve();
    }
    return mutate(
      () => cartRepository.applyCoupon(code),
      cart =>
        cart.coupon
          ? [
              `Cupom ${cart.coupon.code} aplicado · ${cart.coupon.percentOff}% off.`,
              'success',
            ]
          : null,
    );
  }, [cartRepository, mutate]);

  return {
    state: {
      ...state,
      empty: !state.loading && !state.errorMessage && state.lines.length === 0,
    },
    load,
    refresh,
    increase,
    decrease,
    remove,
    clear,
    changeCoupon,
    applyCoupon,
  };
}

function withCart(
  state: CartState,
  cart: Cart,
  syncCoupon: boolean,
): CartState {
  const { summary } = cart;
  const coupon = cart.coupon?.applied ? cart.coupon : null;
  const freeDelivery = summary.deliveryFee === 0 && summary.subtotal > 0;
  const lines: SummaryLine[] = [
    { label: 'Subtotal', value: formatPrice(summary.subtotal) },
    {
      label: 'Taxa de entrega',
      value: freeDelivery ? 'Grátis' : formatPrice(summary.deliveryFee),
      highlight: freeDelivery,
    },
  ];
  if (summary.discount > 0) {
    lines.push({
      label: `Desconto · ${coupon?.code ?? ''}`,
      value: `- ${formatPrice(summary.discount)}`,
      highlight: true,
    });
  }
  return {
    ...state,
    loading: false,
    errorMessage: null,
    lines: cart.items.map(item => ({
      id: item.id,
      productId: item.product.id,
      name: item.product.name,
      unitPrice: formatPrice(item.unitPrice),
      addons: item.addons.length
        ? item.addons.map(addon => addon.name).join(' · ')
        : null,
      notes: item.notes.trim() || null,
      quantity: item.quantity,
      total: formatPrice(item.total),
      imageUrl: item.product.imageUrl
        ? apiBaseUrl + item.product.imageUrl
        : null,
      imageHue: item.product.imageHue,
    })),
    itemCount: summary.itemCount,
    subtotal: formatPrice(summary.subtotal),
    summary: lines,
    total: formatPrice(summary.total),
    couponInput: coupon ? coupon.code : syncCoupon ? '' : state.couponInput,
    couponApplied: coupon !== null,
  };
}
