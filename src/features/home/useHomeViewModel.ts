import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductCardModel, ToastKind } from '../../components';
import { ApiError, NetworkError } from '../../core/network/apiError';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type { CartRepository } from '../../data/cart/cartRepository';
import type { Category, Home } from '../../data/catalog/catalogApi';
import type { CatalogRepository } from '../../data/catalog/catalogRepository';
import { toProductCard } from '../catalog/productCard';

export type HomeSectionModel = {
  key: string;
  title: string;
  products: ProductCardModel[];
};

export type HomeState = {
  loading: boolean;
  errorMessage: string | null;
  firstName: string;
  initials: string;
  addressShort: string | null;
  cartCount: number;
  hasUnreadNotifications: boolean;
  categories: Category[];
  selectedCategory: Category | null;
  sections: HomeSectionModel[];
  categoryProducts: ProductCardModel[];
  categoryLoading: boolean;
};

type HomeCallbacks = {
  onMessage: (text: string, kind: ToastKind) => void;
  onSessionExpired: () => void;
};

const initialState: HomeState = {
  loading: true,
  errorMessage: null,
  firstName: '',
  initials: '',
  addressShort: null,
  cartCount: 0,
  hasUnreadNotifications: false,
  categories: [],
  selectedCategory: null,
  sections: [],
  categoryProducts: [],
  categoryLoading: false,
};

export function useHomeViewModel(
  catalogRepository: CatalogRepository,
  cartRepository: CartRepository,
  callbacks: HomeCallbacks,
) {
  const [state, setState] = useState<HomeState>(initialState);
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);
  const categoryRequest = useRef(0);

  useEffect(() => {
    stateRef.current = state;
    callbacksRef.current = callbacks;
  });

  const handleFailure = useCallback((error: unknown, fallback: string) => {
    if (error instanceof SessionExpiredError) {
      callbacksRef.current.onSessionExpired();
      return;
    }
    const message =
      error instanceof ApiError || error instanceof NetworkError
        ? error.message
        : fallback;
    callbacksRef.current.onMessage(message, 'error');
  }, []);

  const load = useCallback(async () => {
    setState(current => ({ ...current, loading: true, errorMessage: null }));
    try {
      const home = await catalogRepository.home();
      setState(current => ({ ...withHome(current, home), loading: false }));
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        callbacksRef.current.onSessionExpired();
        return;
      }
      setState(current => ({
        ...current,
        loading: false,
        errorMessage:
          error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar o catálogo.',
      }));
    }
  }, [catalogRepository]);

  useEffect(() => {
    load();
  }, [load]);

  const selectCategory = useCallback(
    async (category: Category | null) => {
      const request = ++categoryRequest.current;
      setState(current => ({
        ...current,
        selectedCategory: category,
        categoryProducts: [],
        categoryLoading: category !== null,
      }));
      if (!category) {
        return;
      }
      try {
        const products = await catalogRepository.productsByCategory(
          category.slug,
        );
        if (request === categoryRequest.current) {
          setState(current => ({
            ...current,
            categoryProducts: products.map(toProductCard),
            categoryLoading: false,
          }));
        }
      } catch (error) {
        if (request === categoryRequest.current) {
          setState(current => ({ ...current, categoryLoading: false }));
          handleFailure(error, 'Não foi possível carregar a categoria.');
        }
      }
    },
    [catalogRepository, handleFailure],
  );

  const toggleFavorite = useCallback(
    async (productId: string) => {
      const product = findProduct(stateRef.current, productId);
      if (!product) {
        return;
      }
      const target = !product.isFavorite;
      setState(current => markFavorite(current, productId, target));
      try {
        await catalogRepository.setFavorite(productId, target);
        callbacksRef.current.onMessage(
          target ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.',
          target ? 'success' : 'warning',
        );
      } catch (error) {
        setState(current => markFavorite(current, productId, !target));
        if (error instanceof SessionExpiredError) {
          callbacksRef.current.onSessionExpired();
        } else {
          callbacksRef.current.onMessage(
            'Não foi possível atualizar os favoritos.',
            'error',
          );
        }
      }
    },
    [catalogRepository],
  );

  const addToCart = useCallback(
    async (productId: string) => {
      try {
        const count = await cartRepository.addItem(productId);
        setState(current => ({ ...current, cartCount: count }));
        callbacksRef.current.onMessage(
          'Produto adicionado ao carrinho.',
          'success',
        );
      } catch (error) {
        handleFailure(error, 'Não foi possível adicionar ao carrinho.');
      }
    },
    [cartRepository, handleFailure],
  );

  const refresh = useCallback(async () => {
    if (stateRef.current.loading) {
      return;
    }
    try {
      const home = await catalogRepository.home();
      setState(current => ({ ...withHome(current, home), errorMessage: null }));
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        callbacksRef.current.onSessionExpired();
      }
    }
  }, [catalogRepository]);

  return { state, load, refresh, selectCategory, toggleFavorite, addToCart };
}

function withHome(state: HomeState, home: Home): HomeState {
  return {
    ...state,
    firstName: home.user.firstName,
    initials: initialsOf(home.user.name),
    addressShort: home.selectedAddress?.line.split(' · ')[0] ?? null,
    cartCount: home.cartItemCount,
    hasUnreadNotifications: home.unreadNotifications > 0,
    categories: home.categories,
    sections: home.sections.map(section => ({
      key: section.key,
      title: section.title,
      products: section.products.map(toProductCard),
    })),
  };
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');
}

function findProduct(state: HomeState, productId: string) {
  return [
    ...state.sections.flatMap(section => section.products),
    ...state.categoryProducts,
  ].find(product => product.id === productId);
}

function markFavorite(
  state: HomeState,
  productId: string,
  favorite: boolean,
): HomeState {
  const mark = (products: ProductCardModel[]) =>
    products.map(product =>
      product.id === productId ? { ...product, isFavorite: favorite } : product,
    );
  return {
    ...state,
    sections: state.sections.map(section => ({
      ...section,
      products: mark(section.products),
    })),
    categoryProducts: mark(state.categoryProducts),
  };
}
