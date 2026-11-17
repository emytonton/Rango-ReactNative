import type { AuthorizedCaller } from '../auth/authorizedCaller';
import type { CatalogApi, Home, ProductSummary } from './catalogApi';

export type CatalogRepository = {
  home(): Promise<Home>;
  productsByCategory(slug: string): Promise<ProductSummary[]>;
  setFavorite(productId: string, favorite: boolean): Promise<boolean>;
};

export function createCatalogRepository(
  api: CatalogApi,
  call: AuthorizedCaller,
): CatalogRepository {
  return {
    home: () => call(token => api.home(token)),
    productsByCategory: slug =>
      call(token => api.productsByCategory(token, slug)),
    setFavorite: (productId, favorite) =>
      call(token => api.setFavorite(token, productId, favorite)).then(
        result => result.isFavorite,
      ),
  };
}
