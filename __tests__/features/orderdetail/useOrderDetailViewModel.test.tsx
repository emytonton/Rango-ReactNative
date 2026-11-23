import ReactTestRenderer from 'react-test-renderer';
import { ApiError } from '../../../src/core/network/apiError';
import type { Cart } from '../../../src/data/cart/cartRepository';
import type {
  OrderDetail,
  OrderRepository,
  ReorderResult,
} from '../../../src/data/order/orderRepository';
import { useOrderDetailViewModel } from '../../../src/features/orderdetail/useOrderDetailViewModel';

type ViewModel = ReturnType<typeof useOrderDetailViewModel>;

const now = new Date(2026, 10, 20, 10, 0);

function detail(overrides: Partial<OrderDetail> = {}): OrderDetail {
  return {
    id: 10497,
    code: 'RG-10497',
    status: 'done',
    statusLabel: 'Entregue',
    step: 4,
    createdAt: new Date(2026, 10, 20, 9, 12).toISOString(),
    hint: 'Bom apetite!',
    itemCount: 3,
    total: 66.6,
    items: [
      {
        productId: 'burger-duplo-cheddar',
        name: 'Burger duplo cheddar',
        restaurant: 'Casa do Burger',
        imageHue: 30,
        imageUrl: '/static/products/burger.jpg',
        quantity: 1,
        unitPrice: 38.9,
        total: 38.9,
      },
      {
        productId: 'limonada-suica',
        name: 'Limonada suíça',
        restaurant: null,
        imageHue: 120,
        imageUrl: null,
        quantity: 2,
        unitPrice: 9.9,
        total: 19.8,
      },
    ],
    address: {
      label: 'Casa',
      line: 'Rua das Palmeiras, 128 · apto 42',
      cityLine: 'Pinheiros, São Paulo · SP',
    },
    estimatedDelivery: { minMinutes: 25, maxMinutes: 35 },
    payment: {
      type: 'debit',
      label: 'Cartão de débito',
      detail: 'Na entrega',
      changeFor: null,
    },
    amounts: {
      subtotal: 58.7,
      deliveryFee: 7.9,
      discount: 0,
      total: 66.6,
      couponCode: null,
    },
    timeline: [],
    courier: null,
    mapImageUrl: null,
    ...overrides,
  };
}

function reorderResult(items: number, skipped: string[] = []): ReorderResult {
  return {
    cart: { items: Array.from({ length: items }) } as unknown as Cart,
    skippedProductIds: skipped,
  };
}

async function renderViewModel(
  load: OrderRepository['detail'],
  reorder: OrderRepository['reorder'] = () => Promise.resolve(reorderResult(1)),
) {
  const orderRepository: OrderRepository = {
    create: jest.fn(),
    detail: jest.fn(load),
    list: jest.fn(),
    cachedList: jest.fn(() => Promise.resolve(null)),
    reorder: jest.fn(reorder),
  };
  const callbacks = {
    onOpenCart: jest.fn(),
    onMessage: jest.fn(),
    onSessionExpired: jest.fn(),
  };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useOrderDetailViewModel(
      'RG-10497',
      orderRepository,
      callbacks,
      () => now,
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
  return { viewModel, act, orderRepository, callbacks };
}

test('carrega o pedido com itens, informações e valores', async () => {
  const { viewModel, orderRepository } = await renderViewModel(() =>
    Promise.resolve(detail()),
  );

  const order = viewModel().state.order;
  expect(orderRepository.detail).toHaveBeenCalledWith('RG-10497');
  expect(order).toMatchObject({
    code: 'RG-10497',
    statusLabel: 'Entregue',
    statusTone: 'success',
    address: 'Rua das Palmeiras, 128 · apto 42',
    paymentLabel: 'Cartão de débito',
    paymentIcon: 'creditScore',
    date: 'Hoje · 09:12',
    subtotal: 'R$ 58,70',
    deliveryFee: 'R$ 7,90',
    discount: null,
    total: 'R$ 66,60',
  });
  expect(
    order?.items.map(item => [item.quantity, item.restaurant, item.total]),
  ).toEqual([
    [1, 'Casa do Burger', 'R$ 38,90'],
    [2, null, 'R$ 19,80'],
  ]);
  expect(order?.items[0].imageUrl).toMatch(/\/static\/products\/burger\.jpg$/);
});

test('entrega grátis e desconto aparecem nos valores e cancelado fica vermelho', async () => {
  const { viewModel } = await renderViewModel(() =>
    Promise.resolve(
      detail({
        status: 'cancel',
        statusLabel: 'Cancelado',
        amounts: {
          subtotal: 58.7,
          deliveryFee: 0,
          discount: 5.87,
          total: 52.83,
          couponCode: 'RANGO10',
        },
      }),
    ),
  );

  expect(viewModel().state.order).toMatchObject({
    statusTone: 'error',
    deliveryFee: null,
    discount: '- R$ 5,87',
    total: 'R$ 52,83',
  });
});

test('erro mostra a mensagem e tentar novamente carrega de novo', async () => {
  let fail = true;
  const { viewModel, act, orderRepository } = await renderViewModel(() =>
    fail
      ? Promise.reject(new ApiError(404, 'NOT_FOUND', 'Pedido não encontrado.'))
      : Promise.resolve(detail()),
  );

  expect(viewModel().state.errorMessage).toBe('Pedido não encontrado.');

  fail = false;
  await act(() => viewModel().retry());

  expect(orderRepository.detail).toHaveBeenCalledTimes(2);
  expect(viewModel().state.errorMessage).toBeNull();
  expect(viewModel().state.order?.code).toBe('RG-10497');
});

test('pedir novamente abre o carrinho ou avisa quando os itens acabaram', async () => {
  const results = [
    reorderResult(2),
    reorderResult(1, ['limonada-suica']),
    reorderResult(0, ['burger-duplo-cheddar', 'limonada-suica']),
  ];
  let call = 0;
  const { viewModel, act, orderRepository, callbacks } = await renderViewModel(
    () => Promise.resolve(detail()),
    () => Promise.resolve(results[call++]),
  );

  await act(() => viewModel().reorder());
  await act(() => viewModel().reorder());
  await act(() => viewModel().reorder());

  expect(orderRepository.reorder).toHaveBeenCalledWith('RG-10497');
  expect(callbacks.onOpenCart.mock.calls).toEqual([
    ['Itens adicionados ao carrinho.'],
    ['Alguns itens não estão mais disponíveis.'],
  ]);
  expect(callbacks.onMessage).toHaveBeenCalledWith(
    'Os itens deste pedido não estão mais disponíveis.',
    'error',
  );
  expect(viewModel().state.reordering).toBe(false);
});
