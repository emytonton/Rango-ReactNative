import ReactTestRenderer from 'react-test-renderer';
import { NetworkError } from '../../../src/core/network/apiError';
import type {
  AppNotification,
  NotificationRepository,
} from '../../../src/data/notification/notificationRepository';
import type { PushWatcher } from '../../../src/data/push/pushWatcher';
import {
  unreadLabel,
  useNotificationsViewModel,
} from '../../../src/features/notifications/useNotificationsViewModel';

type ViewModel = ReturnType<typeof useNotificationsViewModel>;

function notification(
  id: number,
  patch: Partial<AppNotification> = {},
): AppNotification {
  return {
    id,
    kind: 'order',
    title: 'Seu pedido saiu para entrega',
    body: 'Pedido RG-10497 · Rafael está a caminho.',
    orderId: 10497,
    orderCode: 'RG-10497',
    isRead: false,
    createdAt: new Date().toISOString(),
    ...patch,
  };
}

const pushState = { banner: null, arrivals: 0 };
const pushWatcher = {
  subscribe: () => () => undefined,
  state: () => pushState,
} as unknown as PushWatcher;

async function renderViewModel(repository: Partial<NotificationRepository>) {
  const notificationRepository = {
    list: jest.fn(() =>
      Promise.resolve({
        data: [
          notification(2),
          notification(1, {
            kind: 'promo',
            orderId: null,
            orderCode: null,
            isRead: true,
          }),
        ],
        unreadCount: 1,
      }),
    ),
    markRead: jest.fn(() => Promise.resolve()),
    markAllRead: jest.fn(() => Promise.resolve()),
    ...repository,
  } as NotificationRepository;
  const callbacks = {
    onMessage: jest.fn(),
    onOpenOrder: jest.fn(),
    onSessionExpired: jest.fn(),
  };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useNotificationsViewModel(
      notificationRepository,
      pushWatcher,
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
  return { viewModel, act, notificationRepository, callbacks };
}

test('lista com tipo, tempo e não lidas', async () => {
  const { viewModel } = await renderViewModel({});

  const { items } = viewModel().state;
  expect(items.map(item => [item.tone, item.unread, item.time])).toEqual([
    ['order', true, 'agora'],
    ['promo', false, 'agora'],
  ]);
  expect(unreadLabel(items)).toBe('1 não lidas');
});

test('tocar marca como lida e abre o rastreio do pedido', async () => {
  const { viewModel, act, notificationRepository, callbacks } =
    await renderViewModel({});

  await act(() => viewModel().open(2));

  expect(notificationRepository.markRead).toHaveBeenCalledWith(2);
  expect(callbacks.onOpenOrder).toHaveBeenCalledWith('RG-10497');
  expect(unreadLabel(viewModel().state.items)).toBe('tudo lido');
});

test('marcar todas avisa e volta as não lidas se falhar', async () => {
  let fail = false;
  const markAllRead = jest.fn(() =>
    fail ? Promise.reject(new NetworkError()) : Promise.resolve(),
  );
  const { viewModel, act, callbacks } = await renderViewModel({ markAllRead });

  fail = true;
  await act(() => viewModel().readAll());
  expect(unreadLabel(viewModel().state.items)).toBe('1 não lidas');
  expect(callbacks.onMessage).toHaveBeenLastCalledWith(
    'Não foi possível marcar as notificações.',
    'error',
  );

  fail = false;
  await act(() => viewModel().readAll());
  expect(unreadLabel(viewModel().state.items)).toBe('tudo lido');
  expect(callbacks.onMessage).toHaveBeenLastCalledWith(
    'Notificações marcadas como lidas.',
    'success',
  );
});
