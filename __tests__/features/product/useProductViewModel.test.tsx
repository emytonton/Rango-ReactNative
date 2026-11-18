import ReactTestRenderer from 'react-test-renderer';
import { ApiError, NetworkError } from '../../../src/core/network/apiError';
import type { CartRepository } from '../../../src/data/cart/cartRepository';
import type { ProductDetail } from '../../../src/data/catalog/catalogApi';
import type { CatalogRepository } from '../../../src/data/catalog/catalogRepository';
import { useProductViewModel } from '../../../src/features/product/useProductViewModel';

type ViewModel = ReturnType<typeof useProductViewModel>;

const burger: ProductDetail = {
  id: 'p1',
  name: 'Burger duplo cheddar',
  restaurant: 'Casa do Burger',
  category: { name: 'Hambúrguer', slug: 'hamburguer' },
  description: 'Dois blends de 120g com cheddar inglês',
  price: 34.9,
  oldPrice: 42.9,
  rating: 4.8,
  deliveryTime: { min: 25, max: 35 },
  imageUrl: null,
  imageHue: 48,
  isAvailable: true,
  isFavorite: false,
  ingredients: 'Pão brioche, 2 blends de 120g.',
  addons: [
    { id: 'a1', name: 'Bacon extra', price: 4 },
    { id: 'a2', name: 'Cheddar extra', price: 3.5 },
  ],
};

async function renderViewModel(
  catalog: Partial<CatalogRepository> = {},
  cart: Partial<CartRepository> = {},
) {
  const onMessage = jest.fn();
  const onAdded = jest.fn();
  const catalogRepository: CatalogRepository = {
    home: jest.fn(),
    productsByCategory: jest.fn(),
    product: jest.fn(() => Promise.resolve(burger)),
    setFavorite: jest.fn(() => Promise.resolve(true)),
    ...catalog,
  };
  const cartRepository: CartRepository = {
    addItem: jest.fn(() => Promise.resolve(2)),
    ...cart,
  };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useProductViewModel(
      'p1',
      catalogRepository,
      cartRepository,
      {
        onMessage,
        onAdded,
        onSessionExpired: jest.fn(),
      },
    );
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
  return { viewModel, act, onMessage, onAdded, cartRepository };
}

test('carrega o produto com subtítulo, estatísticas e entrega', async () => {
  const { viewModel } = await renderViewModel();
  const { product } = viewModel().state;

  expect(product).toMatchObject({
    subtitle: 'Casa do Burger · Hambúrguer',
    priceLabel: 'R$ 34,90',
    oldPrice: 'R$ 42,90',
    rating: '4,8',
    deliveryMinutes: '25-35',
    deliveryFee: 'R$ 7,90',
  });
  expect(viewModel().state.totalLabel).toBe('R$ 34,90');
});

test('total soma adicionais e multiplica pela quantidade com mínimo 1', async () => {
  const { viewModel, act } = await renderViewModel();

  await act(vm => vm.toggleAddon('a1'));
  await act(vm => vm.increase());
  expect(viewModel().state.totalLabel).toBe('R$ 77,80');

  await act(vm => vm.toggleAddon('a1'));
  await act(vm => vm.decrease());
  await act(vm => vm.decrease());
  expect(viewModel().state.quantity).toBe(1);
  expect(viewModel().state.totalLabel).toBe('R$ 34,90');
});

test('adicionar envia adicionais e observações e volta', async () => {
  const { act, onMessage, onAdded, cartRepository } = await renderViewModel();

  await act(vm => vm.toggleAddon('a2'));
  await act(vm => vm.changeNotes('  sem cebola  '));
  await act(vm => vm.increase());
  await act(vm => vm.addToCart());

  expect(cartRepository.addItem).toHaveBeenCalledWith(
    'p1',
    2,
    ['a2'],
    'sem cebola',
  );
  expect(onMessage).toHaveBeenCalledWith(
    'Produto adicionado ao carrinho.',
    'success',
  );
  expect(onAdded).toHaveBeenCalledTimes(1);
});

test('erro ao adicionar mostra a mensagem e não volta', async () => {
  const { act, onMessage, onAdded } = await renderViewModel(
    {},
    {
      addItem: () =>
        Promise.reject(
          new ApiError(409, 'PRODUCT_UNAVAILABLE', 'Produto indisponível.'),
        ),
    },
  );

  await act(vm => vm.addToCart());

  expect(onMessage).toHaveBeenCalledWith('Produto indisponível.', 'error');
  expect(onAdded).not.toHaveBeenCalled();
});

test('favoritar desfaz quando o servidor falha', async () => {
  const { viewModel, act, onMessage } = await renderViewModel({
    setFavorite: () => Promise.reject(new NetworkError()),
  });

  await act(vm => vm.toggleFavorite());

  expect(viewModel().state.product?.isFavorite).toBe(false);
  expect(onMessage).toHaveBeenCalledWith(
    'Não foi possível atualizar os favoritos.',
    'error',
  );
});

test('falha ao carregar mostra erro', async () => {
  const { viewModel } = await renderViewModel({
    product: () => Promise.reject(new NetworkError()),
  });

  expect(viewModel().state.errorMessage).toBe(
    'Não foi possível carregar o produto.',
  );
});
