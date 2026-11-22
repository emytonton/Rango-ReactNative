import ReactTestRenderer from 'react-test-renderer';
import { ApiError } from '../../../src/core/network/apiError';
import type { Cart } from '../../../src/data/cart/cartRepository';
import type {
  OrderGroup,
  OrderRepository,
  OrderSummary,
  ReorderResult,
} from '../../../src/data/order/orderRepository';
import { useOrdersViewModel } from '../../../src/features/orders/useOrdersViewModel';

type ViewModel = ReturnType<typeof useOrdersViewModel>;

const now = new Date(2026, 10, 19, 8, 30);

function summary(
  id: number,
  status: string,
  statusLabel: string,
  itemCount = 1,
): OrderSummary {
  return {
    id,
    code: `RG-${id}`,
    status,
    statusLabel,
    step: status === 'live' ? 2 : 4,
    createdAt: new Date(2026, 10, 19, 7, 42).toISOString(),
    total: 42.8,
    itemCount,
    itemsSummary: '1× Burger duplo cheddar',
    thumbnail: {
      productId: 'burger-duplo-cheddar',
      imageHue: 30,
      imageUrl: '/static/products/burger.jpg',
    },
  };
}

function reorderResult(items: number, skipped: string[] = []): ReorderResult {
  return {
    cart: { items: Array.from({ length: items }) } as unknown as Cart,
    skippedProductIds: skipped,
  };
}

async function renderViewModel(
  list: (group: OrderGroup) => Promise<OrderSummary[]>,
  reorder: OrderRepository['reorder'] = () => Promise.resolve(reorderResult(1)),
) {
  const orderRepository: OrderRepository = {
    create: jest.fn(),
    detail: jest.fn(),
    list: jest.fn(list),
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
    current.value = useOrdersViewModel(orderRepository, callbacks, () => now);
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

test('carrega os pedidos em andamento e monta o cartão', async () => {
  const { viewModel, orderRepository } = await renderViewModel(() =>
    Promise.resolve([summary(10502, 'live', 'Em preparação', 3)]),
  );

  const tab = viewModel().state.tabs.live;
  expect(orderRepository.list).toHaveBeenCalledWith('live');
  expect(tab.loaded).toBe(true);
  expect(tab.orders[0]).toMatchObject({
    code: 'RG-10502',
    date: 'Hoje · 07:42',
    statusLabel: 'Em preparação',
    statusTone: 'progress',
    countAndTotal: '3 itens · R$ 42,80',
    live: true,
  });
  expect(tab.orders[0].imageUrl).toMatch(/\/static\/products\/burger\.jpg$/);
});

test('trocar para anteriores carrega uma vez e marca entregue e cancelado', async () => {
  const { viewModel, act, orderRepository } = await renderViewModel(group =>
    Promise.resolve(
      group === 'live'
        ? []
        : [
            summary(10497, 'done', 'Entregue'),
            summary(10490, 'cancel', 'Cancelado'),
          ],
    ),
  );

  await act(() => viewModel().selectTab('past'));
  await act(() => viewModel().selectTab('live'));
  await act(() => viewModel().selectTab('past'));

  const past = viewModel().state.tabs.past;
  expect(orderRepository.list).toHaveBeenCalledTimes(2);
  expect(past.orders.map(order => [order.statusTone, order.live])).toEqual([
    ['success', false],
    ['error', false],
  ]);
  expect(past.orders[0].countAndTotal).toBe('1 item · R$ 42,80');
});

test('lista vazia fica vazia e erro sem dados mostra a mensagem e tenta de novo', async () => {
  let fail = true;
  const { viewModel, act } = await renderViewModel(group =>
    group === 'past' && fail
      ? Promise.reject(new ApiError(500, 'INTERNAL', 'Erro no servidor.'))
      : Promise.resolve([]),
  );

  expect(viewModel().state.tabs.live).toMatchObject({
    loaded: true,
    errorMessage: null,
    orders: [],
  });

  await act(() => viewModel().selectTab('past'));
  expect(viewModel().state.tabs.past.errorMessage).toBe('Erro no servidor.');

  fail = false;
  await act(() => viewModel().retry());
  expect(viewModel().state.tabs.past).toMatchObject({
    loaded: true,
    errorMessage: null,
  });
});

test('atualizar ao voltar para a tela busca de novo e mantém a lista se falhar', async () => {
  let call = 0;
  const { viewModel, act, orderRepository } = await renderViewModel(() =>
    call++ === 0
      ? Promise.resolve([summary(10502, 'live', 'Pedido confirmado')])
      : Promise.reject(new ApiError(500, 'INTERNAL', 'Erro.')),
  );

  await act(() => viewModel().refresh());

  expect(orderRepository.list).toHaveBeenCalledTimes(2);
  expect(viewModel().state.tabs.live.errorMessage).toBeNull();
  expect(viewModel().state.tabs.live.orders).toHaveLength(1);
});

test('pedir novamente abre o carrinho ou avisa quando os itens acabaram', async () => {
  const results = [
    reorderResult(1),
    reorderResult(1, ['suco-verde-detox']),
    reorderResult(0, ['burger-duplo-cheddar']),
  ];
  let call = 0;
  const { viewModel, act, callbacks } = await renderViewModel(
    () => Promise.resolve([summary(10497, 'done', 'Entregue')]),
    () => Promise.resolve(results[call++]),
  );

  await act(() => viewModel().reorder('RG-10497'));
  await act(() => viewModel().reorder('RG-10497'));
  await act(() => viewModel().reorder('RG-10497'));

  expect(callbacks.onOpenCart.mock.calls).toEqual([
    ['Itens adicionados ao carrinho.'],
    ['Alguns itens não estão mais disponíveis.'],
  ]);
  expect(callbacks.onMessage).toHaveBeenCalledWith(
    'Os itens deste pedido não estão mais disponíveis.',
    'error',
  );
  expect(viewModel().state.reorderingCode).toBeNull();
});
