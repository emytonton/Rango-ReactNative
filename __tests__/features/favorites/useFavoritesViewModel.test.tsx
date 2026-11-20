import ReactTestRenderer from 'react-test-renderer';
import { ApiError, NetworkError } from '../../../src/core/network/apiError';
import type { CartRepository } from '../../../src/data/cart/cartRepository';
import type { ProductSummary } from '../../../src/data/catalog/catalogApi';
import type { FavoriteRepository } from '../../../src/data/favorite/favoriteRepository';
import {
  favoritesCountLabel,
  isFavoritesEmpty,
  useFavoritesViewModel,
} from '../../../src/features/favorites/useFavoritesViewModel';

type ViewModel = ReturnType<typeof useFavoritesViewModel>;

function product(id: string, name: string): ProductSummary {
  return {
    id,
    name,
    restaurant: 'Casa do Burger',
    category: { name: 'Hambúrguer', slug: 'hamburguer' },
    description: '',
    price: 34.9,
    oldPrice: null,
    rating: 4.8,
    deliveryTime: { min: 25, max: 35 },
    imageUrl: '/static/products/burger.jpg',
    imageHue: 30,
    isAvailable: true,
    isFavorite: true,
  };
}

async function renderViewModel(
  favorites: Partial<FavoriteRepository>,
  cart: Partial<CartRepository> = {},
) {
  const favoriteRepository = {
    list: jest.fn(() =>
      Promise.resolve([
        product('burger-duplo-cheddar', 'Burger duplo cheddar'),
        product('smash-bacon', 'Smash burger bacon'),
      ]),
    ),
    setFavorite: jest.fn(() => Promise.resolve(false)),
    favoriteIds: () => new Set<string>(),
    subscribe: () => () => undefined,
    ...favorites,
  } as FavoriteRepository;
  const cartRepository = {
    addItem: jest.fn(() => Promise.resolve(1)),
    ...cart,
  } as unknown as CartRepository;
  const callbacks = { onMessage: jest.fn(), onSessionExpired: jest.fn() };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useFavoritesViewModel(
      favoriteRepository,
      cartRepository,
      callbacks,
    );
    return null;
  }
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<Harness />);
  });
  const viewModel = () => current.value as ViewModel;
  const act = (action: () => unknown) =>
    ReactTestRenderer.act(async () => {
      await action();
    });
  return { viewModel, act, favoriteRepository, cartRepository, callbacks };
}

test('carrega a lista com restaurante, categoria e preço', async () => {
  const { viewModel } = await renderViewModel({});

  const { items } = viewModel().state;
  expect(items.map(item => item.name)).toEqual([
    'Burger duplo cheddar',
    'Smash burger bacon',
  ]);
  expect(items[0]).toMatchObject({
    subtitle: 'Casa do Burger · Hambúrguer',
    price: 'R$ 34,90',
  });
  expect(items[0].imageUrl).toMatch(/\/static\/products\/burger\.jpg$/);
  expect(favoritesCountLabel(items.length)).toBe('2 itens salvos');
  expect(favoritesCountLabel(1)).toBe('1 item salvo');
});

test('lista vazia fica vazia e erro mostra a mensagem e tenta de novo', async () => {
  let fail = true;
  const list = jest.fn(() =>
    fail
      ? Promise.reject(new ApiError(500, 'INTERNAL', 'Erro no servidor.'))
      : Promise.resolve([]),
  );
  const { viewModel, act } = await renderViewModel({ list });

  expect(viewModel().state.errorMessage).toBe('Erro no servidor.');

  fail = false;
  await act(() => viewModel().retry());

  expect(list).toHaveBeenCalledTimes(2);
  expect(isFavoritesEmpty(viewModel().state)).toBe(true);
});

test('remover tira o item e avisa, e volta o item se falhar', async () => {
  let fail = false;
  const setFavorite = jest.fn(() =>
    fail ? Promise.reject(new NetworkError()) : Promise.resolve(false),
  );
  const { viewModel, act, callbacks } = await renderViewModel({ setFavorite });

  await act(() => viewModel().remove('burger-duplo-cheddar'));
  expect(setFavorite).toHaveBeenCalledWith('burger-duplo-cheddar', false);
  expect(viewModel().state.items.map(item => item.id)).toEqual(['smash-bacon']);
  expect(callbacks.onMessage).toHaveBeenLastCalledWith(
    'Removido dos favoritos.',
    'warning',
  );

  fail = true;
  await act(() => viewModel().remove('smash-bacon'));
  expect(viewModel().state.items.map(item => item.id)).toEqual(['smash-bacon']);
  expect(callbacks.onMessage).toHaveBeenLastCalledWith(
    'Não foi possível atualizar os favoritos.',
    'error',
  );
});

test('adicionar coloca no carrinho e mostra o aviso', async () => {
  const { viewModel, act, cartRepository, callbacks } = await renderViewModel(
    {},
  );

  await act(() => viewModel().addToCart('smash-bacon'));

  expect(cartRepository.addItem).toHaveBeenCalledWith('smash-bacon');
  expect(callbacks.onMessage).toHaveBeenCalledWith(
    'Produto adicionado ao carrinho.',
    'success',
  );
});
