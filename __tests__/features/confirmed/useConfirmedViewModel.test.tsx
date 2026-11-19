import ReactTestRenderer from 'react-test-renderer';
import { ApiError } from '../../../src/core/network/apiError';
import { SessionExpiredError } from '../../../src/data/auth/authorizedCaller';
import type {
  OrderDetail,
  OrderRepository,
} from '../../../src/data/order/orderRepository';
import { useConfirmedViewModel } from '../../../src/features/confirmed/useConfirmedViewModel';

type ViewModel = ReturnType<typeof useConfirmedViewModel>;

function order(status = 'live', itemCount = 3): OrderDetail {
  return {
    id: 10483,
    code: 'RG-10483',
    status,
    statusLabel: 'Pedido confirmado',
    step: 1,
    itemCount,
    total: 86.9,
    estimatedDelivery: { minMinutes: 25, maxMinutes: 35 },
    payment: {
      type: 'pix',
      label: 'PIX',
      detail: 'Aprovação imediata',
      changeFor: null,
    },
    amounts: {
      subtotal: 79,
      deliveryFee: 7.9,
      discount: 0,
      total: 86.9,
      couponCode: null,
    },
  };
}

async function renderViewModel(detail: OrderRepository['detail']) {
  const onSessionExpired = jest.fn();
  const orderRepository: OrderRepository = {
    create: jest.fn(),
    detail: jest.fn(detail),
  };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useConfirmedViewModel('RG-10483', orderRepository, {
      onSessionExpired,
    });
    return null;
  }
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<Harness />);
  });
  const viewModel = () => current.value as ViewModel;
  return { viewModel, orderRepository, onSessionExpired };
}

test('mostra número, previsão, pagamento, itens e total', async () => {
  const { viewModel, orderRepository } = await renderViewModel(() =>
    Promise.resolve(order()),
  );

  expect(orderRepository.detail).toHaveBeenCalledWith('RG-10483');
  expect(viewModel().state.loading).toBe(false);
  expect(viewModel().state.order).toEqual({
    code: 'RG-10483',
    eta: '25-35 min',
    payment: 'PIX',
    items: '3 itens',
    total: 'R$ 86,90',
  });
});

test('item único e pedido entregue', async () => {
  const { viewModel } = await renderViewModel(() =>
    Promise.resolve(order('done', 1)),
  );

  expect(viewModel().state.order?.items).toBe('1 item');
  expect(viewModel().state.order?.eta).toBe('Entregue');
});

test('erro mostra a mensagem e tentar novamente carrega de novo', async () => {
  let fail = true;
  const { viewModel, orderRepository } = await renderViewModel(() =>
    fail
      ? Promise.reject(new ApiError(404, 'NOT_FOUND', 'Pedido não encontrado.'))
      : Promise.resolve(order()),
  );

  expect(viewModel().state.errorMessage).toBe('Pedido não encontrado.');
  expect(viewModel().state.order).toBeNull();

  fail = false;
  await ReactTestRenderer.act(async () => {
    await viewModel().load();
  });

  expect(orderRepository.detail).toHaveBeenCalledTimes(2);
  expect(viewModel().state.errorMessage).toBeNull();
  expect(viewModel().state.order?.code).toBe('RG-10483');
});

test('sessão expirada leva às boas-vindas', async () => {
  const { onSessionExpired } = await renderViewModel(() =>
    Promise.reject(new SessionExpiredError()),
  );

  expect(onSessionExpired).toHaveBeenCalled();
});
