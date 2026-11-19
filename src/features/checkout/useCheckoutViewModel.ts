import { useCallback, useEffect, useRef, useState } from 'react';
import type { SummaryLine, ToastKind } from '../../components';
import { formatPrice } from '../../core/format/formatters';
import { ApiError, NetworkError } from '../../core/network/apiError';
import { apiBaseUrl } from '../../core/network/config';
import type { AddressRepository } from '../../data/address/addressRepository';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type { CartRepository } from '../../data/cart/cartRepository';
import type { OrderRepository } from '../../data/order/orderRepository';
import type { PaymentRepository } from '../../data/payment/paymentRepository';
import type {
  PaymentSelection,
  SelectedPayment,
} from '../../data/payment/paymentSelection';
import { summaryLines } from '../cart/cartSummary';

export type CheckoutAddress = {
  label: string;
  line: string;
  cityLine: string;
};

export type CheckoutItem = {
  id: number;
  quantity: number;
  name: string;
  addons: string | null;
  total: string;
  imageUrl: string | null;
  imageHue: number;
};

export type CheckoutState = {
  loading: boolean;
  errorMessage: string | null;
  address: CheckoutAddress | null;
  items: CheckoutItem[];
  summary: SummaryLine[];
  total: string;
  placing: boolean;
};

type CheckoutCallbacks = {
  onMessage: (text: string, kind: ToastKind) => void;
  onSessionExpired: () => void;
  onOrderPlaced: (code: string) => void;
  onOpenCart: () => void;
  onOpenAddress: () => void;
  onOpenPayment: () => void;
};

type CheckoutDependencies = {
  cartRepository: CartRepository;
  addressRepository: AddressRepository;
  paymentRepository: PaymentRepository;
  paymentSelection: PaymentSelection;
  orderRepository: OrderRepository;
};

const initialState: CheckoutState = {
  loading: true,
  errorMessage: null,
  address: null,
  items: [],
  summary: [],
  total: formatPrice(0),
  placing: false,
};

export function useCheckoutViewModel(
  dependencies: CheckoutDependencies,
  callbacks: CheckoutCallbacks,
) {
  const {
    cartRepository,
    addressRepository,
    paymentRepository,
    paymentSelection,
    orderRepository,
  } = dependencies;
  const [state, setState] = useState<CheckoutState>(initialState);
  const [payment, setPayment] = useState<SelectedPayment | null>(
    paymentSelection.current,
  );
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    stateRef.current = state;
    callbacksRef.current = callbacks;
  });

  useEffect(
    () =>
      paymentSelection.subscribe(() => setPayment(paymentSelection.current())),
    [paymentSelection],
  );

  const selectDefaultPayment = useCallback(async () => {
    const methods = await paymentRepository.list();
    const method =
      methods.find(item => item.type === 'pix') ?? methods[0] ?? null;
    if (method) {
      paymentSelection.select({
        methodId: method.id,
        type: method.type,
        label: method.label,
        detail: method.detail,
        changeFor: null,
      });
    }
  }, [paymentRepository, paymentSelection]);

  const refresh = useCallback(async () => {
    if (stateRef.current.placing) {
      return;
    }
    setState(current => ({ ...current, errorMessage: null }));
    try {
      const [cart, addresses] = await Promise.all([
        cartRepository.cart(),
        addressRepository.list(),
        paymentSelection.current() ? null : selectDefaultPayment(),
      ]);
      const address = addresses.find(item => item.isSelected);
      setState(current => ({
        ...current,
        loading: false,
        address: address
          ? {
              label: address.label,
              line: address.line,
              cityLine: address.cityLine,
            }
          : null,
        items: cart.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          name: item.product.name,
          addons: item.addons.length
            ? item.addons.map(addon => addon.name).join(' · ')
            : null,
          total: formatPrice(item.total),
          imageUrl: item.product.imageUrl
            ? apiBaseUrl + item.product.imageUrl
            : null,
          imageHue: item.product.imageHue,
        })),
        summary: summaryLines(cart),
        total: formatPrice(cart.summary.total),
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
  }, [
    cartRepository,
    addressRepository,
    paymentSelection,
    selectDefaultPayment,
  ]);

  const confirm = useCallback(async () => {
    const { placing, loading } = stateRef.current;
    if (placing || loading) {
      return;
    }
    const selected = paymentSelection.current();
    if (!selected) {
      callbacksRef.current.onOpenPayment();
      return;
    }
    setState(current => ({ ...current, placing: true }));
    try {
      const order = await orderRepository.create({
        paymentMethodId: selected.methodId,
        ...(selected.changeFor !== null && { changeFor: selected.changeFor }),
      });
      callbacksRef.current.onOrderPlaced(order.code);
    } catch (error) {
      setState(current => ({ ...current, placing: false }));
      if (error instanceof SessionExpiredError) {
        callbacksRef.current.onSessionExpired();
      } else if (error instanceof ApiError) {
        callbacksRef.current.onMessage(error.message, 'error');
        if (error.code === 'EMPTY_CART') {
          callbacksRef.current.onOpenCart();
        } else if (error.code === 'ADDRESS_REQUIRED') {
          callbacksRef.current.onOpenAddress();
        } else if (error.code === 'INVALID_CHANGE') {
          callbacksRef.current.onOpenPayment();
        }
      } else if (error instanceof NetworkError) {
        callbacksRef.current.onMessage(error.message, 'error');
      }
    }
  }, [orderRepository, paymentSelection]);

  return { state, payment, refresh, confirm };
}
