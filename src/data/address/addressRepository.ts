import type { HttpClient } from '../../core/network/httpClient';
import type { AuthorizedCaller } from '../auth/authorizedCaller';
import type { LocalCache } from '../cache/localCache';

export type SavedAddress = {
  id: number;
  label: string;
  cep: string;
  street: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  line: string;
  cityLine: string;
  isSelected: boolean;
  mapImageUrl: string | null;
};

export type NewAddress = {
  label: string;
  cep: string;
  street: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  select: boolean;
};

export type AddressRepository = {
  list(): Promise<SavedAddress[]>;
  create(address: NewAddress): Promise<SavedAddress>;
  select(addressId: number): Promise<SavedAddress>;
};

export function createAddressRepository(
  http: HttpClient,
  call: AuthorizedCaller,
  cache: LocalCache,
): AddressRepository {
  return {
    list: () =>
      cache.fetchOrCached('addresses', () =>
        call(accessToken =>
          http.request<{ data: SavedAddress[] }>('/addresses', { accessToken }),
        ).then(response => response.data),
      ),
    create: address =>
      call(accessToken =>
        http.request<SavedAddress>('/addresses', {
          method: 'POST',
          body: address,
          accessToken,
        }),
      ),
    select: addressId =>
      call(accessToken =>
        http.request<SavedAddress>(`/addresses/${addressId}/select`, {
          method: 'POST',
          accessToken,
        }),
      ),
  };
}
