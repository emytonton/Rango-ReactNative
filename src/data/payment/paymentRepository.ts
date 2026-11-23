import type { HttpClient } from '../../core/network/httpClient';
import type { AuthorizedCaller } from '../auth/authorizedCaller';
import type { LocalCache } from '../cache/localCache';

export type PaymentType = 'pix' | 'credit' | 'debit' | 'cash';

export type PaymentMethod = {
  id: number;
  type: PaymentType;
  label: string;
  detail: string;
  brand: string | null;
  last4: string | null;
};

export type NewCard = {
  type: 'credit' | 'debit';
  brand: string;
  last4: string;
};

export type PaymentRepository = {
  list(): Promise<PaymentMethod[]>;
  createCard(card: NewCard): Promise<PaymentMethod>;
};

export function createPaymentRepository(
  http: HttpClient,
  call: AuthorizedCaller,
  cache: LocalCache,
): PaymentRepository {
  return {
    list: () =>
      cache.fetchOrCached('payment_methods', () =>
        call(accessToken =>
          http.request<{ data: PaymentMethod[] }>('/payment-methods', {
            accessToken,
          }),
        ).then(response => response.data),
      ),
    createCard: card =>
      call(accessToken =>
        http.request<PaymentMethod>('/payment-methods', {
          method: 'POST',
          body: card,
          accessToken,
        }),
      ),
  };
}
