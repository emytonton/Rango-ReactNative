import type { AuthorizedCaller } from '../auth/authorizedCaller';
import type { Cached, LocalCache } from '../cache/localCache';
import type { FavoriteRepository } from '../favorite/favoriteRepository';
import type {
  CatalogApi,
  Home,
  ProductDetail,
  ProductSummary,
} from './catalogApi';

const HOME_KEY = 'home';

export type CatalogRepository = {
  home(): Promise<Home>;
  cachedHome(): Promise<Cached<Home> | null>;
  cachedProduct(productId: string): Promise<ProductSummary | null>;
  productsByCategory(slug: string): Promise<ProductSummary[]>;
  product(productId: string): Promise<ProductDetail>;
  setFavorite(productId: string, favorite: boolean): Promise<boolean>;
};

export function createCatalogRepository(
  api: CatalogApi,
  call: AuthorizedCaller,
  favorites: FavoriteRepository,
  cache: LocalCache,
): CatalogRepository {
  const cachedHome = () => cache.get<Home>(HOME_KEY);

  return {
    home: async () => {
      const home = await call(token => api.home(token));
      cache.put(HOME_KEY, home).catch(() => undefined);
      return home;
    },
    cachedHome,
    cachedProduct: async productId => {
      const home = (await cachedHome())?.value;
      return (
        home?.sections
          .flatMap(section => section.products)
          .find(product => product.id === productId) ?? null
      );
    },
    productsByCategory: slug =>
      call(token => api.productsByCategory(token, slug)),
    product: productId => call(token => api.product(token, productId)),
    setFavorite: (productId, favorite) =>
      favorites.setFavorite(productId, favorite),
  };
}
