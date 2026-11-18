import type { HttpClient } from '../../core/network/httpClient';
import type { AuthorizedCaller } from '../auth/authorizedCaller';

type AddCartItemRequest = {
  productId: string;
  quantity: number;
  addonIds: string[];
  notes: string;
};

type Cart = { summary: { itemCount: number } };

export type CartRepository = {
  addItem(
    productId: string,
    quantity?: number,
    addonIds?: string[],
    notes?: string,
  ): Promise<number>;
};

export function createCartRepository(
  http: HttpClient,
  call: AuthorizedCaller,
): CartRepository {
  return {
    addItem: (productId, quantity = 1, addonIds = [], notes = '') => {
      const body: AddCartItemRequest = {
        productId,
        quantity,
        addonIds,
        notes,
      };
      return call(accessToken =>
        http.request<Cart>('/cart/items', {
          method: 'POST',
          body,
          accessToken,
        }),
      ).then(cart => cart.summary.itemCount);
    },
  };
}
