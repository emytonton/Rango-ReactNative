import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToastKind } from '../../components';
import { formatPrice } from '../../core/format/formatters';
import { ApiError } from '../../core/network/apiError';
import { apiBaseUrl } from '../../core/network/config';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type { CartRepository } from '../../data/cart/cartRepository';
import type { ProductSummary } from '../../data/catalog/catalogApi';
import type { FavoriteRepository } from '../../data/favorite/favoriteRepository';

export type FavoriteItem = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  imageUrl: string | null;
  imageHue: number;
};

export type FavoritesState = {
  loading: boolean;
  loaded: boolean;
  errorMessage: string | null;
  items: FavoriteItem[];
};

type FavoritesCallbacks = {
  onMessage: (text: string, kind: ToastKind) => void;
  onSessionExpired: () => void;
};

const initialState: FavoritesState = {
  loading: true,
  loaded: false,
  errorMessage: null,
  items: [],
};

export function favoritesCountLabel(count: number): string {
  return count === 1 ? '1 item salvo' : `${count} itens salvos`;
}

export function isFavoritesEmpty(state: FavoritesState): boolean {
  return (
    state.loaded && state.errorMessage === null && state.items.length === 0
  );
}

export function useFavoritesViewModel(
  favoriteRepository: FavoriteRepository,
  cartRepository: CartRepository,
  callbacks: FavoritesCallbacks,
) {
  const [state, setState] = useState<FavoritesState>(initialState);
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);
  const request = useRef(0);

  useEffect(() => {
    stateRef.current = state;
    callbacksRef.current = callbacks;
  });

  const handleSessionError = (error: unknown): boolean => {
    if (error instanceof SessionExpiredError) {
      callbacksRef.current.onSessionExpired();
      return true;
    }
    return false;
  };

  const load = useCallback(async () => {
    const id = ++request.current;
    setState(current => ({ ...current, loading: true, errorMessage: null }));
    try {
      const items = (await favoriteRepository.list()).map(toItem);
      if (request.current !== id) {
        return;
      }
      setState({ loading: false, loaded: true, errorMessage: null, items });
    } catch (error) {
      if (request.current !== id || handleSessionError(error)) {
        return;
      }
      const message =
        error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar os favoritos.';
      setState(current =>
        current.loaded
          ? { ...current, loading: false }
          : { ...current, loading: false, errorMessage: message },
      );
    }
  }, [favoriteRepository]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    if (stateRef.current.loaded) {
      load();
    }
  }, [load]);

  const remove = useCallback(
    async (productId: string) => {
      const items = stateRef.current.items;
      const index = items.findIndex(item => item.id === productId);
      if (index < 0) {
        return;
      }
      const removed = items[index];
      setState(current => ({
        ...current,
        items: current.items.filter(item => item.id !== productId),
      }));
      try {
        await favoriteRepository.setFavorite(productId, false);
        callbacksRef.current.onMessage('Removido dos favoritos.', 'warning');
      } catch (error) {
        if (handleSessionError(error)) {
          return;
        }
        setState(current => {
          const restored = [...current.items];
          restored.splice(Math.min(index, restored.length), 0, removed);
          return { ...current, items: restored };
        });
        callbacksRef.current.onMessage(
          'Não foi possível atualizar os favoritos.',
          'error',
        );
      }
    },
    [favoriteRepository],
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
        if (handleSessionError(error)) {
          return;
        }
        callbacksRef.current.onMessage(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível adicionar ao carrinho.',
          'error',
        );
      }
    },
    [cartRepository],
  );

  return { state, retry: load, refresh, remove, addToCart };
}

function toItem(product: ProductSummary): FavoriteItem {
  return {
    id: product.id,
    name: product.name,
    subtitle: `${product.restaurant} · ${product.category.name}`,
    price: formatPrice(product.price),
    imageUrl: product.imageUrl ? apiBaseUrl + product.imageUrl : null,
    imageHue: product.imageHue,
  };
}
