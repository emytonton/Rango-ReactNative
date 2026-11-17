import { formatPrice } from '../../core/format/formatters';
import type { Category } from '../../data/catalog/catalogApi';
import type {
  ProductQuery,
  ProductSort,
} from '../../data/search/searchRepository';

export const PRICE_MIN = 10;
export const PRICE_MAX = 80;
export const PRICE_STEP = 5;
export const TIME_ANY = 60;

export const sortOptions: {
  value: ProductSort;
  option: string;
  short: string;
}[] = [
  { value: 'relevance', option: 'Relevância', short: 'Relevância' },
  { value: 'price_asc', option: 'Preço · crescente', short: 'Menor preço' },
  { value: 'price_desc', option: 'Preço · decrescente', short: 'Maior preço' },
  { value: 'rating', option: 'Melhor avaliados', short: 'Melhor avaliados' },
];

export const ratingOptions: [number, string][] = [
  [0, 'Todas'],
  [4, '4,0+'],
  [4.5, '4,5+'],
  [4.8, '4,8+'],
];

export const timeOptions: [number, string][] = [
  [TIME_ANY, 'Qualquer'],
  [30, 'até 30 min'],
  [25, 'até 25 min'],
];

export type SearchFilters = {
  category: Category | null;
  maxPrice: number;
  minRating: number;
  maxTime: number;
  sort: ProductSort;
};

export type FilterKey = 'category' | 'price' | 'rating' | 'time' | 'sort';

export type ActiveFilter = { key: FilterKey; label: string };

export const defaultFilters: SearchFilters = {
  category: null,
  maxPrice: PRICE_MAX,
  minRating: 0,
  maxTime: TIME_ANY,
  sort: 'relevance',
};

export function sortLabel(sort: ProductSort): string {
  return sortOptions.find(option => option.value === sort)?.short ?? '';
}

export function activeFilters(filters: SearchFilters): ActiveFilter[] {
  const active: ActiveFilter[] = [];
  if (filters.category) {
    active.push({ key: 'category', label: filters.category.name });
  }
  if (filters.maxPrice !== PRICE_MAX) {
    active.push({
      key: 'price',
      label: `até ${formatPrice(filters.maxPrice)}`,
    });
  }
  if (filters.minRating > 0) {
    const rating = String(filters.minRating).replace('.', ',');
    active.push({ key: 'rating', label: `${rating}+ estrelas` });
  }
  if (filters.maxTime !== TIME_ANY) {
    active.push({ key: 'time', label: `até ${filters.maxTime} min` });
  }
  if (filters.sort !== 'relevance') {
    active.push({ key: 'sort', label: sortLabel(filters.sort) });
  }
  return active;
}

export function withoutFilter(
  filters: SearchFilters,
  key: FilterKey,
): SearchFilters {
  switch (key) {
    case 'category':
      return { ...filters, category: null };
    case 'price':
      return { ...filters, maxPrice: PRICE_MAX };
    case 'rating':
      return { ...filters, minRating: 0 };
    case 'time':
      return { ...filters, maxTime: TIME_ANY };
    case 'sort':
      return { ...filters, sort: 'relevance' };
  }
}

export function toProductQuery(
  filters: SearchFilters,
  term: string,
): ProductQuery {
  return {
    term: term.trim() || undefined,
    categorySlug: filters.category?.slug,
    maxPrice: filters.maxPrice !== PRICE_MAX ? filters.maxPrice : undefined,
    minRating: filters.minRating > 0 ? filters.minRating : undefined,
    maxDeliveryTime: filters.maxTime !== TIME_ANY ? filters.maxTime : undefined,
    sort: filters.sort,
  };
}

export function filtersForHomeSection(section?: string): SearchFilters {
  switch (section) {
    case 'offers':
      return { ...defaultFilters, sort: 'price_asc' };
    case 'popular':
      return { ...defaultFilters, sort: 'rating' };
    case 'recommended':
      return { ...defaultFilters, minRating: 4.5, sort: 'rating' };
    case 'fast':
      return { ...defaultFilters, maxTime: 30 };
    default:
      return defaultFilters;
  }
}
