import ReactTestRenderer from 'react-test-renderer';
import { NetworkError } from '../../../src/core/network/apiError';
import type { SessionRepository } from '../../../src/data/auth/sessionRepository';
import type { ConnectionRepository } from '../../../src/data/connection/connectionRepository';
import type { FavoriteRepository } from '../../../src/data/favorite/favoriteRepository';
import type { PaymentSelection } from '../../../src/data/payment/paymentSelection';
import type { ProfileRepository } from '../../../src/data/profile/profileRepository';
import type { ThemeRepository } from '../../../src/data/theme/themeRepository';
import type { DataSync } from '../../../src/data/sync/dataSync';
import {
  connectionHint,
  formatLastSync,
  themeLabel,
  useSettingsViewModel,
} from '../../../src/features/settings/useSettingsViewModel';

type ViewModel = ReturnType<typeof useSettingsViewModel>;

const mounted: ReactTestRenderer.ReactTestRenderer[] = [];

afterEach(() => {
  ReactTestRenderer.act(() => {
    mounted.splice(0).forEach(renderer => renderer.unmount());
  });
});

const settings = {
  theme: 'dark' as const,
  notifications: { orders: true, promos: true, news: false },
};

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

async function renderViewModel(options: {
  online?: () => Promise<boolean>;
  syncNow?: () => Promise<typeof settings>;
}) {
  let syncedAt: Date | null = null;
  const listeners = new Set<() => void>();
  const dataSync = {
    lastSyncedAt: () => syncedAt,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    syncNow: jest.fn(
      options.syncNow ??
        (() => {
          syncedAt = new Date();
          listeners.forEach(listener => listener());
          return Promise.resolve(settings);
        }),
    ),
    reset: jest.fn(),
  } as unknown as DataSync;
  const dependencies = {
    profile: {
      settings: jest.fn(() => Promise.resolve(settings)),
    } as unknown as ProfileRepository,
    connection: {
      isOnline: jest.fn(options.online ?? (() => Promise.resolve(true))),
    } as ConnectionRepository,
    dataSync,
    session: {
      logout: jest.fn(() => Promise.resolve()),
    } as unknown as SessionRepository,
    favorites: { clearLocal: jest.fn() } as unknown as FavoriteRepository,
    paymentSelection: { clear: jest.fn() } as unknown as PaymentSelection,
    theme: themeRepository(),
  };
  const callbacks = {
    onMessage: jest.fn(),
    onLocalDataCleared: jest.fn(),
    onSessionExpired: jest.fn(),
  };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useSettingsViewModel(dependencies, callbacks);
    return null;
  }
  await ReactTestRenderer.act(async () => {
    mounted.push(ReactTestRenderer.create(<Harness />));
  });
  const viewModel = () => current.value as ViewModel;
  const act = (action: () => unknown) =>
    ReactTestRenderer.act(async () => {
      await action();
    });
  return { viewModel, act, dependencies, callbacks };
}

test('mostra o tema e a conexão e avisa quando a conexão volta', async () => {
  let online = false;
  const { viewModel, act, callbacks } = await renderViewModel({
    online: () => Promise.resolve(online),
  });

  await act(() => viewModel().refresh());
  expect(themeLabel(viewModel().state.theme)).toBe('Escuro');
  expect(connectionHint(viewModel().state.online)).toBe(
    'sem conexão com o servidor',
  );

  online = true;
  await act(() => viewModel().checkNow());
  expect(connectionHint(viewModel().state.online)).toBe('conectado');
  expect(callbacks.onMessage).toHaveBeenLastCalledWith(
    'Conexão restaurada.',
    'success',
  );
});

test('sincroniza e mostra a última sincronização, e avisa sem rede', async () => {
  const { viewModel, act, callbacks } = await renderViewModel({});

  expect(viewModel().syncHint).toBe('ainda não sincronizado nesta sessão');
  await act(() => viewModel().sync());
  expect(viewModel().syncHint).toBe('última sincronização: agora');
  expect(callbacks.onMessage).toHaveBeenLastCalledWith(
    'Dados sincronizados.',
    'success',
  );

  const offline = await renderViewModel({
    syncNow: () => Promise.reject(new NetworkError()),
  });
  await offline.act(() => offline.viewModel().sync());
  expect(offline.viewModel().state.online).toBe(false);
  expect(offline.viewModel().state.syncing).toBe(false);
});

test('limpar dados locais encerra a sessão e limpa a memória', async () => {
  const { viewModel, act, dependencies, callbacks } = await renderViewModel({});

  await act(() => viewModel().clearLocalData());
  await act(() => viewModel().clearLocalData());

  expect(dependencies.session.logout).toHaveBeenCalledTimes(1);
  expect(dependencies.favorites.clearLocal).toHaveBeenCalled();
  expect(dependencies.paymentSelection.clear).toHaveBeenCalled();
  expect(dependencies.dataSync.reset).toHaveBeenCalled();
  expect(callbacks.onMessage).toHaveBeenCalledWith(
    'Dados locais apagados.',
    'warning',
  );
  expect(callbacks.onLocalDataCleared).toHaveBeenCalledTimes(1);
});

test('formata a última sincronização em minutos e horas', () => {
  const now = new Date('2026-11-21T14:00:00Z');
  expect(formatLastSync(new Date('2026-11-21T13:52:00Z'), now)).toBe(
    'última sincronização: há 8 min',
  );
  expect(formatLastSync(new Date('2026-11-21T11:30:00Z'), now)).toBe(
    'última sincronização: há 2 h',
  );
});
