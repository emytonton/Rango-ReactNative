import ReactTestRenderer from 'react-test-renderer';
import { ApiError } from '../../../src/core/network/apiError';
import type { AddressRepository } from '../../../src/data/address/addressRepository';
import type { SessionRepository } from '../../../src/data/auth/sessionRepository';
import type { PaymentRepository } from '../../../src/data/payment/paymentRepository';
import type { ProfileRepository } from '../../../src/data/profile/profileRepository';
import type { ThemeRepository } from '../../../src/data/theme/themeRepository';
import {
  profileHints,
  useProfileViewModel,
} from '../../../src/features/profile/useProfileViewModel';

type ViewModel = ReturnType<typeof useProfileViewModel>;

function themeRepository(): ThemeRepository {
  let mode: 'light' | 'dark' | 'system' = 'system';
  return {
    current: () => mode,
    onRemote: jest.fn(async (remote: typeof mode) => {
      mode = remote;
    }),
    pushPending: jest.fn(() => Promise.resolve(true)),
  } as unknown as ThemeRepository;
}

async function renderViewModel(profile: Partial<ProfileRepository> = {}) {
  const repositories = {
    profile: {
      me: jest.fn(() =>
        Promise.resolve({
          id: 1,
          name: 'Marina Alves',
          email: 'marina.alves@email.com',
          phone: '(11) 98876-4410',
          avatarUrl: null,
          createdAt: '2026-11-01T10:00:00.000Z',
        }),
      ),
      settings: jest.fn(() =>
        Promise.resolve({
          theme: 'dark' as const,
          notifications: { orders: true, promos: true, news: false },
        }),
      ),
      unreadNotifications: jest.fn(() => Promise.resolve(2)),
      ...profile,
    } as ProfileRepository,
    addresses: {
      list: jest.fn(() => Promise.resolve([{}, {}])),
    } as unknown as AddressRepository,
    payments: {
      list: jest.fn(() => Promise.resolve([{}])),
    } as unknown as PaymentRepository,
    session: {
      logout: jest.fn(() => Promise.resolve()),
    } as unknown as SessionRepository,
    theme: themeRepository(),
  };
  const callbacks = {
    onMessage: jest.fn(),
    onLoggedOut: jest.fn(),
    onSessionExpired: jest.fn(),
  };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useProfileViewModel(repositories, callbacks);
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
  return { viewModel, act, repositories, callbacks };
}

test('carrega a conta e as dicas dos atalhos', async () => {
  const { viewModel } = await renderViewModel();

  const { state } = viewModel();
  expect(state).toMatchObject({
    loaded: true,
    name: 'Marina Alves',
    email: 'marina.alves@email.com',
    phone: '(11) 98876-4410',
    unreadCount: 2,
  });
  expect(profileHints(state)).toEqual({
    addresses: '2 salvos',
    payments: '1 método disponível',
    notifications: '2 não lidas',
    theme: 'Escuro',
  });
  expect(profileHints({ ...state, unreadCount: 0 }).notifications).toBe(
    'tudo lido',
  );
});

test('erro mostra a mensagem e tentar de novo recarrega', async () => {
  let fail = true;
  const me = jest.fn(() =>
    fail
      ? Promise.reject(new ApiError(500, 'INTERNAL', 'Erro no servidor.'))
      : Promise.resolve({
          id: 1,
          name: 'Marina Alves',
          email: 'marina.alves@email.com',
          phone: null,
          avatarUrl: null,
          createdAt: '2026-11-01T10:00:00.000Z',
        }),
  );
  const { viewModel, act } = await renderViewModel({ me });

  expect(viewModel().state.errorMessage).toBe('Erro no servidor.');

  fail = false;
  await act(() => viewModel().retry());

  expect(me).toHaveBeenCalledTimes(2);
  expect(viewModel().state).toMatchObject({
    errorMessage: null,
    loaded: true,
    phone: '',
  });
});

test('ajuda avisa e sair encerra a sessão uma única vez', async () => {
  const { viewModel, act, repositories, callbacks } = await renderViewModel();

  viewModel().help();
  expect(callbacks.onMessage).toHaveBeenLastCalledWith(
    'Central de ajuda em breve.',
    'warning',
  );

  await act(async () => {
    const first = viewModel().logout();
    await viewModel().logout();
    await first;
  });

  expect(repositories.session.logout).toHaveBeenCalledTimes(1);
  expect(callbacks.onMessage).toHaveBeenLastCalledWith(
    'Você saiu da conta.',
    'warning',
  );
  expect(callbacks.onLoggedOut).toHaveBeenCalledTimes(1);
});
