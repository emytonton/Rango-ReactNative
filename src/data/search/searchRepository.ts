import type { HttpClient } from '../../core/network/httpClient';
import type { AuthorizedCaller } from '../auth/authorizedCaller';
import type { LocalCache } from '../cache/localCache';
import type { Category, ProductSummary } from '../catalog/catalogApi';

export type ProductSort = 'relevance' | 'price_asc' | 'price_desc' | 'rating';

export type ProductQuery = {
  term?: string;
  categorySlug?: string;
  section?: string;
  maxPrice?: number;
  minRating?: number;
  maxDeliveryTime?: number;
  sort?: ProductSort;
  pageSize?: number;
};

const RECENT_KEY = 'recent_searches';
const CATEGORIES_KEY = 'categories';
const SUGGESTIONS_KEY = 'suggestions';

export type SearchRepository = {
  recent(): Promise<string[]>;
  saveRecent(term: string): Promise<string[]>;
  clearRecent(): Promise<void>;
  categories(): Promise<Category[]>;
  suggestions(): Promise<ProductSummary[]>;
  search(query: ProductQuery): Promise<ProductSummary[]>;
};

type DataList<T> = { data: T[] };

export function createSearchRepository(
  http: HttpClient,
  call: AuthorizedCaller,
  cache: LocalCache,
): SearchRepository {
  const products = (query: ProductQuery) =>
    call(accessToken =>
      http.request<DataList<ProductSummary>>(`/products?${toParams(query)}`, {
        accessToken,
      }),
    ).then(page => page.data);

  return {
    recent: () =>
      cache.fetchOrCached(RECENT_KEY, () =>
        call(accessToken =>
          http.request<DataList<string>>('/search/recent', { accessToken }),
        ).then(list => list.data),
      ),

    saveRecent: term =>
      call(accessToken =>
        http.request<DataList<string>>('/search/recent', {
          method: 'POST',
          body: { term },
          accessToken,
        }),
      ).then(list => {
        cache.put(RECENT_KEY, list.data).catch(() => undefined);
        return list.data;
      }),

    clearRecent: async () => {
      await call(accessToken =>
        http.request<void>('/search/recent', {
          method: 'DELETE',
          accessToken,
        }),
      );
      cache.put(RECENT_KEY, []).catch(() => undefined);
    },

    categories: () =>
      cache.fetchOrCached(CATEGORIES_KEY, () =>
        call(accessToken =>
          http.request<DataList<Category>>('/categories', { accessToken }),
        ).then(list => list.data),
      ),

    suggestions: () =>
      cache.fetchOrCached(SUGGESTIONS_KEY, () =>
        products({ section: 'popular', sort: 'rating', pageSize: 4 }),
      ),

    search: products,
  };
}

function toParams(query: ProductQuery): string {
  const params: [string, string | number | undefined][] = [
    ['q', query.term],
    ['category', query.categorySlug],
    ['section', query.section],
    ['maxPrice', query.maxPrice],
    ['minRating', query.minRating],
    ['maxDeliveryTime', query.maxDeliveryTime],
    ['sort', query.sort ?? 'relevance'],
    ['pageSize', query.pageSize ?? 50],
  ];
  return params
    .filter(([, value]) => value !== undefined && value !== '')
    .map(
      ([key, value]) =>
        `${key}=${encodeURIComponent(String(value as string | number))}`,
    )
    .join('&');
}
