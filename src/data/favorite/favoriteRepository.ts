import type { HttpClient } from '../../core/network/httpClient';
import type { AuthorizedCaller } from '../auth/authorizedCaller';
import type { ProductSummary } from '../catalog/catalogApi';

const FAVORITES_PAGE_SIZE = 50;

export type FavoriteRepository = {
  list(): Promise<ProductSummary[]>;
  setFavorite(productId: string, favorite: boolean): Promise<boolean>;
  favoriteIds(): ReadonlySet<string>;
  subscribe(listener: () => void): () => void;
  clearLocal(): void;
};

export function createFavoriteRepository(
  http: HttpClient,
  call: AuthorizedCaller,
): FavoriteRepository {
  let ids: ReadonlySet<string> = new Set();
  const listeners = new Set<() => void>();

  const update = (next: ReadonlySet<string>) => {
    ids = next;
    listeners.forEach(listener => listener());
  };

  return {
    list: async () => {
      const page = await call(accessToken =>
        http.request<{ data: ProductSummary[] }>(
          `/favorites?pageSize=${FAVORITES_PAGE_SIZE}`,
          { accessToken },
        ),
      );
      update(new Set(page.data.map(product => product.id)));
      return page.data;
    },

    setFavorite: async (productId, favorite) => {
      const result = await call(accessToken =>
        http.request<{ productId: string; isFavorite: boolean }>(
          `/favorites/${encodeURIComponent(productId)}`,
          { method: favorite ? 'PUT' : 'DELETE', accessToken },
        ),
      );
      const next = new Set(ids);
      if (result.isFavorite) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      update(next);
      return result.isFavorite;
    },

    favoriteIds: () => ids,

    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    clearLocal: () => update(new Set()),
  };
}
