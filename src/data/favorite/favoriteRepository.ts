import { ApiError, NetworkError } from '../../core/network/apiError';
import type { HttpClient } from '../../core/network/httpClient';
import type { AuthorizedCaller } from '../auth/authorizedCaller';
import type { LocalCache } from '../cache/localCache';
import type { ProductSummary } from '../catalog/catalogApi';

const FAVORITES_PAGE_SIZE = 50;
const LIST_KEY = 'favorites';
const PENDING_KEY = 'favorites_pending';

type PendingChanges = Record<string, boolean>;

const without = (changes: PendingChanges, productId: string) =>
  Object.fromEntries(
    Object.entries(changes).filter(([id]) => id !== productId),
  );

export type FavoriteRepository = {
  list(): Promise<ProductSummary[]>;
  setFavorite(productId: string, favorite: boolean): Promise<boolean>;
  syncPending(): Promise<void>;
  favoriteIds(): ReadonlySet<string>;
  subscribe(listener: () => void): () => void;
  clearLocal(): void;
};

export function createFavoriteRepository(
  http: HttpClient,
  call: AuthorizedCaller,
  cache: LocalCache,
  findProduct: (productId: string) => Promise<ProductSummary | null> = () =>
    Promise.resolve(null),
): FavoriteRepository {
  let ids: ReadonlySet<string> = new Set();
  const listeners = new Set<() => void>();

  const update = (next: ReadonlySet<string>) => {
    ids = next;
    listeners.forEach(listener => listener());
  };

  const pending = async (): Promise<PendingChanges> =>
    (await cache.get<PendingChanges>(PENDING_KEY))?.value ?? {};

  const savePending = (changes: PendingChanges) =>
    Object.keys(changes).length === 0
      ? cache.remove(PENDING_KEY)
      : cache.put(PENDING_KEY, changes);

  const send = (accessToken: string, productId: string, favorite: boolean) =>
    http.request<{ productId: string; isFavorite: boolean }>(
      `/favorites/${encodeURIComponent(productId)}`,
      { method: favorite ? 'PUT' : 'DELETE', accessToken },
    );

  async function syncPending() {
    for (const [productId, favorite] of Object.entries(await pending())) {
      try {
        await call(accessToken => send(accessToken, productId, favorite));
      } catch (error) {
        if (!(error instanceof ApiError)) {
          throw error;
        }
      }
      await savePending(without(await pending(), productId));
    }
  }

  async function cachedList(): Promise<ProductSummary[]> {
    const cached = await cache.get<ProductSummary[]>(LIST_KEY);
    if (!cached) {
      throw new NetworkError();
    }
    const queued = await pending();
    const missing = Object.keys(queued).filter(
      id => queued[id] && !cached.value.some(product => product.id === id),
    );
    const added = (await Promise.all(missing.map(findProduct))).filter(
      (product): product is ProductSummary => product !== null,
    );
    return [
      ...cached.value.filter(product => queued[product.id] !== false),
      ...added,
    ];
  }

  return {
    list: async () => {
      let products: ProductSummary[];
      try {
        await syncPending();
        const page = await call(accessToken =>
          http.request<{ data: ProductSummary[] }>(
            `/favorites?pageSize=${FAVORITES_PAGE_SIZE}`,
            { accessToken },
          ),
        );
        products = page.data;
        cache.put(LIST_KEY, products).catch(() => undefined);
      } catch (error) {
        if (!(error instanceof NetworkError)) {
          throw error;
        }
        products = await cachedList();
      }
      const queued = await pending();
      update(
        new Set([
          ...products.map(product => product.id),
          ...Object.keys(queued).filter(id => queued[id]),
        ]),
      );
      return products;
    },

    setFavorite: async (productId, favorite) => {
      let result: boolean;
      try {
        result = (
          await call(accessToken => send(accessToken, productId, favorite))
        ).isFavorite;
        await savePending(without(await pending(), productId));
      } catch (error) {
        if (!(error instanceof NetworkError)) {
          throw error;
        }
        await savePending({ ...(await pending()), [productId]: favorite });
        result = favorite;
      }
      const next = new Set(ids);
      if (result) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      update(next);
      return result;
    },

    syncPending,

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
