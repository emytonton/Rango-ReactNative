import type { HttpClient } from '../../core/network/httpClient';

export type Category = { name: string; slug: string };

export type ProductSummary = {
  id: string;
  name: string;
  restaurant: string;
  category: Category;
  description: string;
  price: number;
  oldPrice: number | null;
  rating: number;
  deliveryTime: { min: number; max: number };
  imageUrl: string | null;
  imageHue: number;
  isAvailable: boolean;
  isFavorite: boolean;
};

export type ProductAddon = { id: string; name: string; price: number };

export type ProductDetail = ProductSummary & {
  ingredients: string;
  addons: ProductAddon[];
};

export type HomeSection = {
  key: string;
  title: string;
  products: ProductSummary[];
};

export type Home = {
  user: { name: string; firstName: string; avatarUrl: string | null };
  selectedAddress: { line: string } | null;
  cartItemCount: number;
  unreadNotifications: number;
  categories: Category[];
  sections: HomeSection[];
};

type Page<T> = { data: T[] };

export type CatalogApi = ReturnType<typeof createCatalogApi>;

export function createCatalogApi(http: HttpClient) {
  return {
    home: (accessToken: string) => http.request<Home>('/home', { accessToken }),

    productsByCategory: (accessToken: string, slug: string) =>
      http
        .request<Page<ProductSummary>>(
          `/products?category=${encodeURIComponent(slug)}&pageSize=50`,
          { accessToken },
        )
        .then(page => page.data),

    product: (accessToken: string, productId: string) =>
      http.request<ProductDetail>(
        `/products/${encodeURIComponent(productId)}`,
        { accessToken },
      ),

    setFavorite: (accessToken: string, productId: string, favorite: boolean) =>
      http.request<{ productId: string; isFavorite: boolean }>(
        `/favorites/${encodeURIComponent(productId)}`,
        { method: favorite ? 'PUT' : 'DELETE', accessToken },
      ),
  };
}
