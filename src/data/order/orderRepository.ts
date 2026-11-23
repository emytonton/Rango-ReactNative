import { NetworkError } from '../../core/network/apiError';
import type { HttpClient } from '../../core/network/httpClient';
import type { AuthorizedCaller } from '../auth/authorizedCaller';
import type { LocalCache } from '../cache/localCache';
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

const listKey = (group: OrderGroup) => `orders_${group}`;
const detailKey = (code: string) => `order_${code}`;

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
  cachedList(group: OrderGroup): Promise<OrderSummary[] | null>;
  reorder(code: string): Promise<ReorderResult>;
  liveCount(): number;
  subscribe(listener: () => void): () => void;
  refreshLiveCount(): Promise<void>;
};

export function createOrderRepository(
  http: HttpClient,
  call: AuthorizedCaller,
  cache: LocalCache,
): OrderRepository {
  const save = (key: string, value: unknown) =>
    cache.put(key, value).catch(() => undefined);
  let live = 0;
  const listeners = new Set<() => void>();
  const setLive = (count: number) => {
    if (count !== live) {
      live = count;
      listeners.forEach(listener => listener());
    }
  };

  const list = async (group: OrderGroup) => {
    const page = await call(accessToken =>
      http.request<{ data: OrderSummary[] }>(
        `/orders?group=${group}&pageSize=${ORDER_PAGE_SIZE}`,
        { accessToken },
      ),
    );
    save(listKey(group), page.data);
    if (group === 'live') {
      setLive(page.data.length);
    }
    return page.data;
  };

  return {
    liveCount: () => live,
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    refreshLiveCount: async () => {
      await list('live').catch(() => undefined);
    },
    create: async order => {
      const created = await call(accessToken =>
        http.request<CreatedOrder>('/orders', {
          method: 'POST',
          body: order,
          accessToken,
        }),
      );
      if (created.status === 'live') {
        setLive(live + 1);
      }
      return created;
    },
    detail: async code => {
      try {
        const detail = await call(accessToken =>
          http.request<OrderDetail>(`/orders/${encodeURIComponent(code)}`, {
            accessToken,
          }),
        );
        save(detailKey(code), detail);
        return detail;
      } catch (error) {
        const cached =
          error instanceof NetworkError
            ? await cache.get<OrderDetail>(detailKey(code))
            : null;
        if (!cached) {
          throw error;
        }
        return cached.value;
      }
    },
    list,
    cachedList: async group =>
      (await cache.get<OrderSummary[]>(listKey(group)))?.value ?? null,
    reorder: code =>
      call(accessToken =>
        http.request<ReorderResult>(
          `/orders/${encodeURIComponent(code)}/reorder`,
          { method: 'POST', accessToken },
        ),
      ),
  };
}
