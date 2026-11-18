import type { AuthorizedCaller } from '../auth/authorizedCaller';
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
): CatalogRepository {
  return {
    home: () => call(token => api.home(token)),
    productsByCategory: slug =>
      call(token => api.productsByCategory(token, slug)),
    product: productId => call(token => api.product(token, productId)),
    setFavorite: (productId, favorite) =>
      call(token => api.setFavorite(token, productId, favorite)).then(
        result => result.isFavorite,
      ),
  };
}
