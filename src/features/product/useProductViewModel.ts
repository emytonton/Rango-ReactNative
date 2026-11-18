import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToastKind } from '../../components';
import { formatPrice, formatRating } from '../../core/format/formatters';
import { ApiError } from '../../core/network/apiError';
import { apiBaseUrl } from '../../core/network/config';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type { CartRepository } from '../../data/cart/cartRepository';
import type {
  ProductAddon,
  ProductDetail,
} from '../../data/catalog/catalogApi';
import type { CatalogRepository } from '../../data/catalog/catalogRepository';

const NOTES_MAX_LENGTH = 200;
const FREE_DELIVERY_FROM = 50;
const DELIVERY_FEE = 7.9;

export type ProductModel = {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  priceLabel: string;
  oldPrice: string | null;
  rating: string;
  deliveryMinutes: string;
  deliveryFee: string;
  description: string;
  ingredients: string;
  imageUrl: string | null;
  imageHue: number;
  isFavorite: boolean;
  addons: ProductAddon[];
};

type ProductCallbacks = {
  onMessage: (text: string, kind: ToastKind) => void;
  onAdded: () => void;
  onSessionExpired: () => void;
};

export function useProductViewModel(
  productId: string,
  catalogRepository: CatalogRepository,
  cartRepository: CartRepository,
  callbacks: ProductCallbacks,
) {
  const [product, setProduct] = useState<ProductModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const detail = await catalogRepository.product(productId);
      setProduct(toModel(detail));
      setLoading(false);
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        callbacksRef.current.onSessionExpired();
        return;
      }
      setLoading(false);
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar o produto.',
      );
    }
  }, [catalogRepository, productId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleAddon = useCallback((addonId: string) => {
    setSelectedAddons(current =>
      current.includes(addonId)
        ? current.filter(id => id !== addonId)
        : [...current, addonId],
    );
  }, []);

  const increase = useCallback(() => setQuantity(value => value + 1), []);

  const decrease = useCallback(
    () => setQuantity(value => Math.max(1, value - 1)),
    [],
  );

  const changeNotes = useCallback(
    (value: string) => setNotes(value.slice(0, NOTES_MAX_LENGTH)),
    [],
  );

  const toggleFavorite = useCallback(async () => {
    if (!product) {
      return;
    }
    const target = !product.isFavorite;
    const mark = (favorite: boolean) =>
      setProduct(current =>
        current ? { ...current, isFavorite: favorite } : current,
      );
    mark(target);
    try {
      await catalogRepository.setFavorite(product.id, target);
      callbacksRef.current.onMessage(
        target ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.',
        target ? 'success' : 'warning',
      );
    } catch (error) {
      mark(!target);
      if (error instanceof SessionExpiredError) {
        callbacksRef.current.onSessionExpired();
      } else {
        callbacksRef.current.onMessage(
          'Não foi possível atualizar os favoritos.',
          'error',
        );
      }
    }
  }, [product, catalogRepository]);

  const addToCart = useCallback(async () => {
    if (!product || adding) {
      return;
    }
    setAdding(true);
    try {
      await cartRepository.addItem(
        product.id,
        quantity,
        product.addons
          .map(addon => addon.id)
          .filter(id => selectedAddons.includes(id)),
        notes.trim(),
      );
      callbacksRef.current.onMessage(
        'Produto adicionado ao carrinho.',
        'success',
      );
      callbacksRef.current.onAdded();
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        callbacksRef.current.onSessionExpired();
      } else if (error instanceof Error) {
        callbacksRef.current.onMessage(error.message, 'error');
      }
    } finally {
      setAdding(false);
    }
  }, [product, adding, cartRepository, quantity, selectedAddons, notes]);

  const addonsTotal = (product?.addons ?? [])
    .filter(addon => selectedAddons.includes(addon.id))
    .reduce((sum, addon) => sum + addon.price, 0);
  const total = product ? (product.price + addonsTotal) * quantity : 0;

  return {
    state: {
      product,
      loading,
      errorMessage,
      selectedAddons,
      quantity,
      notes,
      adding,
      total,
      totalLabel: formatPrice(total),
    },
    load,
    toggleAddon,
    increase,
    decrease,
    changeNotes,
    toggleFavorite,
    addToCart,
  };
}

function toModel(detail: ProductDetail): ProductModel {
  return {
    id: detail.id,
    name: detail.name,
    subtitle: `${detail.restaurant} · ${detail.category.name}`,
    price: detail.price,
    priceLabel: formatPrice(detail.price),
    oldPrice: detail.oldPrice ? formatPrice(detail.oldPrice) : null,
    rating: formatRating(detail.rating),
    deliveryMinutes: `${detail.deliveryTime.min}-${detail.deliveryTime.max}`,
    deliveryFee:
      detail.price >= FREE_DELIVERY_FROM ? 'Grátis' : formatPrice(DELIVERY_FEE),
    description: detail.description,
    ingredients: detail.ingredients,
    imageUrl: detail.imageUrl ? apiBaseUrl + detail.imageUrl : null,
    imageHue: detail.imageHue,
    isFavorite: detail.isFavorite,
    addons: detail.addons,
  };
}
