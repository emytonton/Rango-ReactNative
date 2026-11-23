import type { HttpClient } from '../../core/network/httpClient';
import type { AuthorizedCaller } from '../auth/authorizedCaller';
import type { LocalCache } from '../cache/localCache';
import type { ProductAddon } from '../catalog/catalogApi';

type AddCartItemRequest = {
  productId: string;
  quantity: number;
  addonIds: string[];
  notes: string;
};

export type CartItem = {
  id: number;
  product: {
    id: string;
    name: string;
    restaurant: string;
    imageUrl: string | null;
    imageHue: number;
  };
  quantity: number;
  addons: ProductAddon[];
  notes: string;
  unitPrice: number;
  total: number;
};

export type CartCoupon = {
  code: string;
  description: string;
  percentOff: number;
  minSubtotal: number;
  applied: boolean;
};

export type CartSummary = {
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  freeDeliveryThreshold: number;
};

export type Cart = {
  items: CartItem[];
  coupon: CartCoupon | null;
  summary: CartSummary;
};

const CART_KEY = 'cart';

export type CartRepository = {
  addItem(
    productId: string,
    quantity?: number,
    addonIds?: string[],
    notes?: string,
  ): Promise<number>;
  cart(): Promise<Cart>;
  updateQuantity(itemId: number, quantity: number): Promise<Cart>;
  removeItem(itemId: number): Promise<Cart>;
  clear(): Promise<Cart>;
  applyCoupon(code: string): Promise<Cart>;
};

export function createCartRepository(
  http: HttpClient,
  call: AuthorizedCaller,
  cache: LocalCache,
): CartRepository {
  const saved = (cart: Cart) => {
    cache.put(CART_KEY, cart).catch(() => undefined);
    return cart;
  };

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
      ).then(cart => saved(cart).summary.itemCount);
    },

    cart: () =>
      cache.fetchOrCached(CART_KEY, () =>
        call(accessToken => http.request<Cart>('/cart', { accessToken })),
      ),

    updateQuantity: (itemId, quantity) =>
      call(accessToken =>
        http.request<Cart>(`/cart/items/${itemId}`, {
          method: 'PATCH',
          body: { quantity },
          accessToken,
        }),
      ).then(saved),

    removeItem: itemId =>
      call(accessToken =>
        http.request<Cart>(`/cart/items/${itemId}`, {
          method: 'DELETE',
          accessToken,
        }),
      ).then(saved),

    clear: () =>
      call(accessToken =>
        http.request<Cart>('/cart', { method: 'DELETE', accessToken }),
      ).then(saved),

    applyCoupon: code =>
      call(accessToken =>
        http.request<Cart>('/cart/coupon', {
          method: 'PUT',
          body: { code },
          accessToken,
        }),
      ).then(saved),
  };
}
