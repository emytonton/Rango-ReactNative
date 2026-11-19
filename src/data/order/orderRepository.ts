import type { HttpClient } from '../../core/network/httpClient';
import type { AuthorizedCaller } from '../auth/authorizedCaller';
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

export type OrderDetail = {
  id: number;
  code: string;
  status: string;
  statusLabel: string;
  step: number;
  itemCount: number;
  total: number;
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
};

export type OrderRepository = {
  create(order: NewOrder): Promise<CreatedOrder>;
  detail(code: string): Promise<OrderDetail>;
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
  };
}
