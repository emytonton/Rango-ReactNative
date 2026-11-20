import type { HttpClient } from '../../core/network/httpClient';
import type { AuthorizedCaller } from '../auth/authorizedCaller';
import type { Cart } from '../cart/cartRepository';
import type { PaymentType } from '../payment/paymentRepository';

export type NewOrder = {
  paymentMethodId: number;
  changeFor?: number;
};

export type CreatedOrder = {
  id: number;
  code: string;
  status: string;
};

export type TimelineStepState = 'done' | 'current' | 'upcoming';

export type TimelineStep = {
  step: number;
  label: string;
  state: TimelineStepState;
  reachedAt: string | null;
};

export type Courier = {
  name: string;
  vehicle: string;
  photoUrl: string | null;
};

export type OrderItem = {
  productId: string | null;
  name: string;
  restaurant: string | null;
  imageHue: number;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type OrderAddress = {
  label: string;
  line: string;
  cityLine: string;
};

export type OrderDetail = {
  id: number;
  code: string;
  status: string;
  statusLabel: string;
  step: number;
  createdAt: string;
  hint: string;
  itemCount: number;
  total: number;
  items: OrderItem[];
  address: OrderAddress | null;
  estimatedDelivery: { minMinutes: number; maxMinutes: number };
  payment: {
    type: PaymentType;
    label: string;
    detail: string;
    changeFor: number | null;
  };
  amounts: {
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    couponCode: string | null;
  };
  timeline: TimelineStep[];
  courier: Courier | null;
  mapImageUrl: string | null;
};

export type OrderGroup = 'live' | 'past';

export const ORDER_PAGE_SIZE = 50;

export type OrderSummary = {
  id: number;
  code: string;
  status: string;
  statusLabel: string;
  step: number;
  createdAt: string;
  total: number;
  itemCount: number;
  itemsSummary: string;
  thumbnail: {
    productId: string | null;
    imageHue: number;
    imageUrl: string | null;
  };
};

export type ReorderResult = {
  cart: Cart;
  skippedProductIds: string[];
};

export type OrderRepository = {
  create(order: NewOrder): Promise<CreatedOrder>;
  detail(code: string): Promise<OrderDetail>;
  list(group: OrderGroup): Promise<OrderSummary[]>;
  reorder(code: string): Promise<ReorderResult>;
};

export function createOrderRepository(
  http: HttpClient,
  call: AuthorizedCaller,
): OrderRepository {
  return {
    create: order =>
      call(accessToken =>
        http.request<CreatedOrder>('/orders', {
          method: 'POST',
          body: order,
          accessToken,
        }),
      ),
    detail: code =>
      call(accessToken =>
        http.request<OrderDetail>(`/orders/${encodeURIComponent(code)}`, {
          accessToken,
        }),
      ),
    list: group =>
      call(accessToken =>
        http.request<{ data: OrderSummary[] }>(
          `/orders?group=${group}&pageSize=${ORDER_PAGE_SIZE}`,
          { accessToken },
        ),
      ).then(page => page.data),
    reorder: code =>
      call(accessToken =>
        http.request<ReorderResult>(
          `/orders/${encodeURIComponent(code)}/reorder`,
          { method: 'POST', accessToken },
        ),
      ),
  };
}
