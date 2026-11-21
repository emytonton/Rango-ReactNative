import type { AuthorizedCaller } from '../auth/authorizedCaller';
import type { FavoriteRepository } from '../favorite/favoriteRepository';
import type {
  CatalogApi,
  Home,
  ProductDetail,
  ProductSummary,
} from './catalogApi';

export type CatalogRepository = {
  home(): Promise<Home>;
  productsByCategory(slug: string): Promise<ProductSummary[]>;
  product(productId: string): Promise<ProductDetail>;
  setFavorite(productId: string, favorite: boolean): Promise<boolean>;
};

export function createCatalogRepository(
  api: CatalogApi,
  call: AuthorizedCaller,
  favorites: FavoriteRepository,
): CatalogRepository {
  return {
    home: () => call(token => api.home(token)),
    productsByCategory: slug =>
      call(token => api.productsByCategory(token, slug)),
    product: productId => call(token => api.product(token, productId)),
    setFavorite: (productId, favorite) =>
      favorites.setFavorite(productId, favorite),
  };
}
