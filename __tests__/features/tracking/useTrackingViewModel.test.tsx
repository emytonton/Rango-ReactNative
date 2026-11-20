import ReactTestRenderer from 'react-test-renderer';
import { ApiError } from '../../../src/core/network/apiError';
import type {
  OrderDetail,
  OrderRepository,
  TimelineStepState,
} from '../../../src/data/order/orderRepository';
import {
  TRACKING_POLL_MS,
  useTrackingViewModel,
} from '../../../src/features/tracking/useTrackingViewModel';

type ViewModel = ReturnType<typeof useTrackingViewModel>;

const labels = [
  'Pedido recebido',
  'Pedido confirmado',
  'Em preparação',
  'Saiu para entrega',
  'Entregue',
];
const reachedAt = '2026-11-19T19:42:00.000Z';

function order(step: number, status = 'live'): OrderDetail {
  return {
    id: 10483,
    code: 'RG-10483',
    status,
    statusLabel: labels[step],
    step,
    hint: 'O restaurante aceitou seu pedido',
    itemCount: 1,
    total: 46.8,
    estimatedDelivery: { minMinutes: 25, maxMinutes: 35 },
    payment: {
      type: 'pix',
      label: 'PIX',
      detail: 'Aprovação imediata',
      changeFor: null,
    },
    amounts: {
      subtotal: 38.9,
      deliveryFee: 7.9,
      discount: 0,
      total: 46.8,
      couponCode: null,
    },
    timeline: labels.map((label, index) => {
      const state: TimelineStepState =
        index < step || status === 'done'
          ? 'done'
          : index === step
          ? 'current'
          : 'upcoming';
      return {
        step: index,
        label,
        state,
        reachedAt: state === 'done' ? reachedAt : null,
      };
    }),
    courier: {
      name: 'Rafael Souza',
      vehicle: 'Honda CG 160',
      photoUrl: '/static/couriers/rafael.jpg',
    },
    mapImageUrl: '/static/maps/area.jpg',
  };
}

async function renderViewModel(detail: OrderRepository['detail']) {
  const orderRepository: OrderRepository = {
    create: jest.fn(),
    detail: jest.fn(detail),
    list: jest.fn(),
    reorder: jest.fn(),
  };
  const onSessionExpired = jest.fn();
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useTrackingViewModel('RG-10483', orderRepository, {
      onSessionExpired,
    });
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
  const advance = () => act(() => jest.advanceTimersByTime(TRACKING_POLL_MS));
  return { viewModel, act, advance, orderRepository };
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('monta a timeline com horários, agora e previsto', async () => {
  const { viewModel, act } = await renderViewModel(() =>
    Promise.resolve(order(2)),
  );

  await act(() => viewModel().startPolling());

  const tracking = viewModel().state.order;
  const date = new Date(reachedAt);
  const clock = `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
  expect(tracking?.label).toBe('Em preparação');
  expect(tracking?.eta).toBe('25-35 min');
  expect(tracking?.steps.map(step => [step.state, step.time])).toEqual([
    ['done', clock],
    ['done', clock],
    ['current', 'agora'],
    ['upcoming', 'previsto'],
    ['upcoming', 'previsto'],
  ]);
  expect(tracking?.courier?.photoUrl).toMatch(
    /\/static\/couriers\/rafael\.jpg$/,
  );
  expect(tracking?.mapImageUrl).toMatch(/\/static\/maps\/area\.jpg$/);
});

test('atualiza a cada 5 s enquanto o pedido está em andamento e para ao ser entregue', async () => {
  const steps = [order(1), order(3), order(4, 'done')];
  let call = 0;
  const { viewModel, act, advance, orderRepository } = await renderViewModel(
    () => Promise.resolve(steps[Math.min(call++, steps.length - 1)]),
  );

  await act(() => viewModel().startPolling());
  expect(viewModel().state.order?.step).toBe(1);

  await advance();
  expect(viewModel().state.order?.step).toBe(3);

  await advance();
  expect(viewModel().state.order?.eta).toBe('Entregue');

  await advance();
  await advance();
  expect(orderRepository.detail).toHaveBeenCalledTimes(3);
});

test('parar a atualização ao sair da tela não busca mais o pedido', async () => {
  const { viewModel, act, advance, orderRepository } = await renderViewModel(
    () => Promise.resolve(order(1)),
  );

  await act(() => viewModel().startPolling());
  await act(() => viewModel().stopPolling());
  await advance();
  await advance();

  expect(orderRepository.detail).toHaveBeenCalledTimes(1);
});

test('erro sem pedido mostra a mensagem e tentar novamente busca de novo', async () => {
  let fail = true;
  const { viewModel, act, orderRepository } = await renderViewModel(() =>
    fail
      ? Promise.reject(new ApiError(404, 'NOT_FOUND', 'Pedido não encontrado.'))
      : Promise.resolve(order(1)),
  );

  await act(() => viewModel().startPolling());
  expect(viewModel().state.errorMessage).toBe('Pedido não encontrado.');

  fail = false;
  await act(() => viewModel().retry());

  expect(orderRepository.detail).toHaveBeenCalledTimes(2);
  expect(viewModel().state.errorMessage).toBeNull();
  expect(viewModel().state.order?.step).toBe(1);
});

test('erro depois de carregar mantém o pedido e continua atualizando', async () => {
  let call = 0;
  const { viewModel, act, advance, orderRepository } = await renderViewModel(
    () =>
      call++ === 1
        ? Promise.reject(new ApiError(500, 'INTERNAL', 'Erro.'))
        : Promise.resolve(order(call === 1 ? 1 : 2)),
  );

  await act(() => viewModel().startPolling());
  await advance();
  expect(viewModel().state.errorMessage).toBeNull();
  expect(viewModel().state.order?.step).toBe(1);

  await advance();
  expect(orderRepository.detail).toHaveBeenCalledTimes(3);
  expect(viewModel().state.order?.step).toBe(2);
});
