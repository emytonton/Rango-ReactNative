import ReactTestRenderer from 'react-test-renderer';
import { ApiError } from '../../../src/core/network/apiError';
import type { AddressRepository } from '../../../src/data/address/addressRepository';
import type {
  Cart,
  CartRepository,
} from '../../../src/data/cart/cartRepository';
import type { OrderRepository } from '../../../src/data/order/orderRepository';
import type { PaymentRepository } from '../../../src/data/payment/paymentRepository';
import { createPaymentSelection } from '../../../src/data/payment/paymentSelection';
import { useCheckoutViewModel } from '../../../src/features/checkout/useCheckoutViewModel';

type ViewModel = ReturnType<typeof useCheckoutViewModel>;

const cart: Cart = {
  items: [
    {
      id: 7,
      product: {
        id: 'p1',
        name: 'Burger duplo cheddar',
        restaurant: 'Casa do Burger',
        imageUrl: '/static/products/p1.jpg',
        imageHue: 48,
      },
      quantity: 2,
      addons: [{ id: 'a1', name: 'Bacon extra', price: 4 }],
      notes: '',
      unitPrice: 38.9,
      total: 77.8,
    },
  ],
  coupon: null,
  summary: {
    itemCount: 2,
    subtotal: 77.8,
    deliveryFee: 7.9,
    discount: 0,
    total: 85.7,
    freeDeliveryThreshold: 120,
  },
} as Cart;

async function renderViewModel(
  overrides: {
    order?: Partial<OrderRepository>;
  } = {},
) {
  const callbacks = {
    onMessage: jest.fn(),
    onSessionExpired: jest.fn(),
    onOrderPlaced: jest.fn(),
    onOpenCart: jest.fn(),
    onOpenAddress: jest.fn(),
    onOpenPayment: jest.fn(),
  };
  const paymentSelection = createPaymentSelection();
  const orderRepository: OrderRepository = {
    create: jest.fn(() =>
      Promise.resolve({ id: 10483, code: 'RG-10483', status: 'live' }),
    ),
    detail: jest.fn(),
    list: jest.fn(),
    cachedList: jest.fn(() => Promise.resolve(null)),
    liveCount: () => 0,
    subscribe: () => () => undefined,
    refreshLiveCount: jest.fn(() => Promise.resolve()),
    reorder: jest.fn(),
    ...overrides.order,
  };
  const dependencies = {
    cartRepository: {
      cart: jest.fn(() => Promise.resolve(cart)),
    } as unknown as CartRepository,
    addressRepository: {
      list: jest.fn(() =>
        Promise.resolve([
          {
            id: 2,
            label: 'Trabalho',
            line: 'Av. Faria Lima, 3400 · 9º andar',
            cityLine: 'Itaim Bibi · São Paulo',
            isSelected: true,
          },
        ]),
      ),
    } as unknown as AddressRepository,
    paymentRepository: {
      list: jest.fn(() =>
        Promise.resolve([
          {
            id: 2,
            type: 'credit',
            label: 'Cartão de crédito',
            detail: 'Visa •••• 4410',
            brand: 'Visa',
            last4: '4410',
          },
          {
            id: 1,
            type: 'pix',
            label: 'PIX',
            detail: 'Aprovação imediata',
            brand: null,
            last4: null,
          },
        ]),
      ),
    } as unknown as PaymentRepository,
    paymentSelection,
    orderRepository,
  };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useCheckoutViewModel(dependencies, callbacks);
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
  await act(vm => vm.refresh());
  return { viewModel, act, callbacks, paymentSelection, orderRepository };
}

test('carrega endereço, itens, resumo e PIX como forma padrão', async () => {
  const { viewModel } = await renderViewModel();

  expect(viewModel().state.address?.label).toBe('Trabalho');
  expect(viewModel().state.items[0]).toMatchObject({
    quantity: 2,
    name: 'Burger duplo cheddar',
    addons: 'Bacon extra',
    total: 'R$ 77,80',
  });
  expect(viewModel().state.summary.map(line => line.label)).toEqual([
    'Subtotal',
    'Taxa de entrega',
  ]);
  expect(viewModel().state.total).toBe('R$ 85,70');
  expect(viewModel().payment?.label).toBe('PIX');
});

test('confirmar envia a forma escolhida e abre a confirmação', async () => {
  const { act, callbacks, orderRepository } = await renderViewModel();

  await act(vm => vm.confirm());

  expect(orderRepository.create).toHaveBeenCalledWith({ paymentMethodId: 1 });
  expect(callbacks.onOrderPlaced).toHaveBeenCalledWith('RG-10483');
});

test('dinheiro envia o troco no pedido', async () => {
  const { act, paymentSelection, orderRepository } = await renderViewModel();

  await act(() =>
    paymentSelection.select({
      methodId: 4,
      type: 'cash',
      label: 'Dinheiro',
      detail: 'Troco para R$ 100,00',
      changeFor: 100,
    }),
  );
  await act(vm => vm.confirm());

  expect(orderRepository.create).toHaveBeenCalledWith({
    paymentMethodId: 4,
    changeFor: 100,
  });
});

test('toque duplo envia o pedido uma vez só', async () => {
  let resolve: (value: {
    id: number;
    code: string;
    status: string;
  }) => void = () => {};
  const create = jest.fn(
    () =>
      new Promise<{ id: number; code: string; status: string }>(done => {
        resolve = done;
      }),
  );
  const { viewModel, act } = await renderViewModel({ order: { create } });

  await act(vm => {
    vm.confirm();
  });
  expect(viewModel().state.placing).toBe(true);
  await act(vm => {
    vm.confirm();
  });
  await act(() => resolve({ id: 1, code: 'RG-1', status: 'live' }));

  expect(create).toHaveBeenCalledTimes(1);
});

test.each([
  ['EMPTY_CART', 'onOpenCart'],
  ['ADDRESS_REQUIRED', 'onOpenAddress'],
  ['INVALID_CHANGE', 'onOpenPayment'],
] as const)('erro %s leva à tela correspondente', async (code, callback) => {
  const { viewModel, act, callbacks } = await renderViewModel({
    order: {
      create: () => Promise.reject(new ApiError(422, code, 'Erro do pedido.')),
    },
  });

  await act(vm => vm.confirm());

  expect(callbacks.onMessage).toHaveBeenCalledWith('Erro do pedido.', 'error');
  expect(callbacks[callback]).toHaveBeenCalled();
  expect(viewModel().state.placing).toBe(false);
});
