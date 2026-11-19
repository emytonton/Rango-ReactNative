import type { HttpClient } from '../../core/network/httpClient';
import type { AuthorizedCaller } from '../auth/authorizedCaller';

export type NewOrder = {
  paymentMethodId: number;
  changeFor?: number;
};

export type CreatedOrder = {
  id: number;
  code: string;
  status: string;
};

export type OrderRepository = {
  create(order: NewOrder): Promise<CreatedOrder>;
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
  };
}
