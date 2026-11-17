import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductCardModel, ToastKind } from '../../components';
import { formatPrice, formatRating } from '../../core/format/formatters';
import { ApiError } from '../../core/network/apiError';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type { CartRepository } from '../../data/cart/cartRepository';
import type { Category } from '../../data/catalog/catalogApi';
import type { CatalogRepository } from '../../data/catalog/catalogRepository';
import type { SearchRepository } from '../../data/search/searchRepository';
import { toProductCard } from '../catalog/productCard';
import {
  activeFilters,
  defaultFilters,
  toProductQuery,
  withoutFilter,
  type FilterKey,
  type SearchFilters,
} from './searchFilters';

const DEBOUNCE_MS = 350;

export type SearchSuggestion = { name: string; hint: string };

type SearchCallbacks = {
  onMessage: (text: string, kind: ToastKind) => void;
  onSessionExpired: () => void;
};

export function useSearchViewModel(
  searchRepository: SearchRepository,
  catalogRepository: CatalogRepository,
  cartRepository: CartRepository,
  initialFilters: SearchFilters,
  callbacks: SearchCallbacks,
) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [draft, setDraft] = useState(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [results, setResults] = useState<ProductCardModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const callbacksRef = useRef(callbacks);
  const debounceNext = useRef(false);
  const sessionExpired = useRef(false);
  const idle = query.trim() === '' && activeFilters(filters).length === 0;

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const expireSession = useCallback(() => {
    if (!sessionExpired.current) {
      sessionExpired.current = true;
      callbacksRef.current.onSessionExpired();
    }
  }, []);

  const guarded = useCallback(
    async (block: () => Promise<void>) => {
      try {
        await block();
      } catch (error) {
        if (error instanceof SessionExpiredError) {
          expireSession();
        }
      }
    },
    [expireSession],
  );

  useEffect(() => {
    guarded(async () => setRecent(await searchRepository.recent()));
    guarded(async () => {
      const products = await searchRepository.suggestions();
      setSuggestions(
        products.map(product => ({
          name: product.name,
          hint: `${product.restaurant} · ${formatRating(
            product.rating,
          )} · ${formatPrice(product.price)}`,
        })),
      );
    });
    guarded(async () => setCategories(await searchRepository.categories()));
  }, [searchRepository, guarded]);

  useEffect(() => {
    if (idle) {
      setResults([]);
      setLoading(false);
      setErrorMessage(null);
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    let active = true;
    const delay = debounceNext.current ? DEBOUNCE_MS : 0;
    debounceNext.current = false;
    const timer = setTimeout(async () => {
      try {
        const products = await searchRepository.search(
          toProductQuery(filters, query),
        );
        if (active) {
          setResults(products.map(toProductCard));
          setLoading(false);
        }
      } catch (error) {
        if (!active) {
          return;
        }
        if (error instanceof SessionExpiredError) {
          expireSession();
          return;
        }
        setLoading(false);
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível buscar os produtos.',
        );
      }
    }, delay);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [idle, query, filters, retryCount, searchRepository, expireSession]);

  const changeQuery = useCallback((value: string) => {
    debounceNext.current = true;
    setQuery(value);
  }, []);

  const pickTerm = useCallback((term: string) => {
    debounceNext.current = false;
    setQuery(term);
  }, []);

  const clearRecent = useCallback(async () => {
    const previous = recent;
    setRecent([]);
    try {
      await searchRepository.clearRecent();
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        expireSession();
        return;
      }
      setRecent(previous);
      callbacksRef.current.onMessage(
        'Não foi possível limpar as buscas.',
        'error',
      );
    }
  }, [recent, searchRepository, expireSession]);

  const openFilters = useCallback(() => {
    setDraft(filters);
    setShowFilters(true);
  }, [filters]);

  const closeFilters = useCallback(() => setShowFilters(false), []);

  const clearDraft = useCallback(() => setDraft(defaultFilters), []);

  const applyFilters = useCallback(() => {
    setFilters(draft);
    setShowFilters(false);
    callbacksRef.current.onMessage('Filtros aplicados.', 'success');
  }, [draft]);

  const removeFilter = useCallback((key: FilterKey) => {
    setFilters(current => withoutFilter(current, key));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setDraft(defaultFilters);
  }, []);

  const retry = useCallback(() => setRetryCount(count => count + 1), []);

  const openProduct = useCallback(() => {
    const term = query.trim();
    if (term) {
      guarded(async () => setRecent(await searchRepository.saveRecent(term)));
    }
  }, [query, searchRepository, guarded]);

  const toggleFavorite = useCallback(
    async (productId: string) => {
      const product = results.find(item => item.id === productId);
      if (!product) {
        return;
      }
      const target = !product.isFavorite;
      const mark = (favorite: boolean) =>
        setResults(current =>
          current.map(item =>
            item.id === productId ? { ...item, isFavorite: favorite } : item,
          ),
        );
      mark(target);
      try {
        await catalogRepository.setFavorite(productId, target);
        callbacksRef.current.onMessage(
          target ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.',
          target ? 'success' : 'warning',
        );
      } catch (error) {
        mark(!target);
        if (error instanceof SessionExpiredError) {
          expireSession();
        } else {
          callbacksRef.current.onMessage(
            'Não foi possível atualizar os favoritos.',
            'error',
          );
        }
      }
    },
    [results, catalogRepository, expireSession],
  );

  const addToCart = useCallback(
    async (productId: string) => {
      try {
        await cartRepository.addItem(productId);
        callbacksRef.current.onMessage(
          'Produto adicionado ao carrinho.',
          'success',
        );
      } catch (error) {
        if (error instanceof SessionExpiredError) {
          expireSession();
        } else if (error instanceof Error) {
          callbacksRef.current.onMessage(error.message, 'error');
        }
      }
    },
    [cartRepository, expireSession],
  );

  return {
    state: {
      query,
      filters,
      draft,
      showFilters,
      categories,
      recent,
      suggestions,
      results,
      loading,
      errorMessage,
      idle,
      activeFilters: activeFilters(filters),
    },
    changeQuery,
    pickTerm,
    clearRecent,
    openFilters,
    closeFilters,
    changeDraft: setDraft,
    clearDraft,
    applyFilters,
    removeFilter,
    clearFilters,
    retry,
    openProduct,
    toggleFavorite,
    addToCart,
  };
}
