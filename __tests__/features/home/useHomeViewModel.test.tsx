import ReactTestRenderer from 'react-test-renderer';
import { NetworkError } from '../../../src/core/network/apiError';
import { SessionExpiredError } from '../../../src/data/auth/authorizedCaller';
import type { CartRepository } from '../../../src/data/cart/cartRepository';
import type {
  Home,
  ProductSummary,
} from '../../../src/data/catalog/catalogApi';
import type { CatalogRepository } from '../../../src/data/catalog/catalogRepository';
import { useHomeViewModel } from '../../../src/features/home/useHomeViewModel';

type ViewModel = ReturnType<typeof useHomeViewModel>;

const burger: ProductSummary = {
  id: 'p1',
  name: 'Burger duplo cheddar',
  restaurant: 'Casa do Burger',
  category: { name: 'Hambúrguer', slug: 'hamburguer' },
  description: 'Dois blends de 120g com cheddar inglês',
  price: 34.9,
  oldPrice: 42.9,
  rating: 4.8,
  deliveryTime: { min: 25, max: 35 },
  imageUrl: '/static/products/p1.jpg',
  imageHue: 48,
  isAvailable: true,
  isFavorite: false,
};

const home: Home = {
  user: { name: 'Marina Alves', firstName: 'Marina', avatarUrl: null },
  selectedAddress: { line: 'Av. Faria Lima, 3400 · 9º andar' },
  cartItemCount: 2,
  unreadNotifications: 3,
  categories: [{ name: 'Hambúrguer', slug: 'hamburguer' }],
  sections: [{ key: 'offers', title: 'Ofertas para você', products: [burger] }],
};

async function renderViewModel(
  catalog: Partial<CatalogRepository>,
  cart: Partial<CartRepository> = {},
) {
  const onMessage = jest.fn();
  const onSessionExpired = jest.fn();
  const catalogRepository: CatalogRepository = {
    home: jest.fn(() => Promise.resolve(home)),
    cachedHome: jest.fn(() => Promise.resolve(null)),
    cachedProduct: jest.fn(() => Promise.resolve(null)),
    productsByCategory: jest.fn(() => Promise.resolve([])),
    product: jest.fn(),
    setFavorite: jest.fn(() => Promise.resolve(true)),
    ...catalog,
  };
  const cartRepository: CartRepository = {
    addItem: jest.fn(() => Promise.resolve(3)),
    cart: jest.fn(),
    updateQuantity: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    applyCoupon: jest.fn(),
    ...cart,
  };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useHomeViewModel(catalogRepository, cartRepository, {
      onMessage,
      onSessionExpired,
    });
    return null;
  }
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<Harness />);
  });
  const viewModel = () => current.value as ViewModel;
  const act = (action: (vm: ViewModel) => unknown) =>
    ReactTestRenderer.act(async () => {
      await action(viewModel());
    });
  return { viewModel, act, onMessage, onSessionExpired, catalogRepository };
}

test('carrega o cabeçalho e os trilhos da home', async () => {
  const { viewModel } = await renderViewModel({});
  const { state } = viewModel();

  expect(state.loading).toBe(false);
  expect(state.initials).toBe('MA');
  expect(state.addressShort).toBe('Av. Faria Lima, 3400');
  expect(state.cartCount).toBe(2);
  expect(state.hasUnreadNotifications).toBe(true);
  expect(state.sections[0].products[0]).toMatchObject({
    price: 'R$ 34,90',
    oldPrice: 'R$ 42,90',
    rating: '4,8',
    deliveryTime: '25-35 min',
  });
});

test('mostra erro quando o catálogo não carrega', async () => {
  const { viewModel } = await renderViewModel({
    home: () => Promise.reject(new NetworkError()),
  });

  expect(viewModel().state.errorMessage).toBe(
    'Não foi possível carregar o catálogo.',
  );
});

test('sem conexão mostra a home salva e a última sincronização', async () => {
  const { viewModel } = await renderViewModel({
    home: () => Promise.reject(new NetworkError()),
    cachedHome: () =>
      Promise.resolve({
        value: home,
        savedAt: new Date(Date.now() - 8 * 60_000),
      }),
  });
  const { state } = viewModel();

  expect(state.errorMessage).toBeNull();
  expect(state.sections[0].products[0].name).toBe('Burger duplo cheddar');
  expect(state.offlineNote).toBe(
    'Não foi possível atualizar o catálogo.\nÚltima sincronização há 8 min.',
  );
});

test('sessão expirada volta para o início', async () => {
  const { onSessionExpired } = await renderViewModel({
    home: () => Promise.reject(new SessionExpiredError()),
  });

  expect(onSessionExpired).toHaveBeenCalledTimes(1);
});

test('categoria lista os produtos dela', async () => {
  const { viewModel, act, catalogRepository } = await renderViewModel({
    productsByCategory: () => Promise.resolve([burger]),
  });

  await act(vm => vm.selectCategory(home.categories[0]));
  expect(viewModel().state.categoryProducts).toHaveLength(1);
  expect(catalogRepository.home).toHaveBeenCalledTimes(1);

  await act(vm => vm.selectCategory(null));
  expect(viewModel().state.selectedCategory).toBeNull();
  expect(viewModel().state.categoryProducts).toEqual([]);
});

test('favoritar desfaz a marcação quando o servidor falha', async () => {
  const { viewModel, act, onMessage } = await renderViewModel({
    setFavorite: () => Promise.reject(new NetworkError()),
  });

  await act(vm => vm.toggleFavorite('p1'));

  expect(viewModel().state.sections[0].products[0].isFavorite).toBe(false);
  expect(onMessage).toHaveBeenCalledWith(
    'Não foi possível atualizar os favoritos.',
    'error',
  );
});

test('adicionar ao carrinho atualiza o selo', async () => {
  const { viewModel, act, onMessage } = await renderViewModel({});

  await act(vm => vm.addToCart('p1'));

  expect(viewModel().state.cartCount).toBe(3);
  expect(onMessage).toHaveBeenCalledWith(
    'Produto adicionado ao carrinho.',
    'success',
  );
});
