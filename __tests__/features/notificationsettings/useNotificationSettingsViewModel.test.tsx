import ReactTestRenderer from 'react-test-renderer';
import type { LocalNotifier } from '../../../src/core/native/localNotifier';
import { NetworkError } from '../../../src/core/network/apiError';
import type {
  NotificationPrefs,
  ProfileRepository,
} from '../../../src/data/profile/profileRepository';
import type { PushWatcher } from '../../../src/data/push/pushWatcher';
import {
  TEST_PUSH,
  useNotificationSettingsViewModel,
} from '../../../src/features/notificationsettings/useNotificationSettingsViewModel';

type ViewModel = ReturnType<typeof useNotificationSettingsViewModel>;

const mounted: ReactTestRenderer.ReactTestRenderer[] = [];

afterEach(() => {
  ReactTestRenderer.act(() => {
    mounted.splice(0).forEach(renderer => renderer.unmount());
  });
});

const defaults: NotificationPrefs = { orders: true, promos: true, news: false };

async function renderViewModel(options: {
  update?: (prefs: NotificationPrefs) => Promise<unknown>;
  permitted?: boolean;
  granted?: boolean;
}) {
  const dependencies = {
    profile: {
      settings: jest.fn(() =>
        Promise.resolve({ theme: 'light', notifications: defaults }),
      ),
      updateNotifications: jest.fn(
        options.update ??
          ((notifications: NotificationPrefs) =>
            Promise.resolve({ theme: 'light', notifications })),
      ),
    } as unknown as ProfileRepository,
    notifier: {
      isPermitted: jest.fn(() => Promise.resolve(options.permitted ?? true)),
      askPermission: jest.fn(() => Promise.resolve(options.granted ?? false)),
    } as unknown as LocalNotifier,
    pushWatcher: { show: jest.fn() } as unknown as PushWatcher,
  };
  const callbacks = { onMessage: jest.fn(), onSessionExpired: jest.fn() };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useNotificationSettingsViewModel(dependencies, callbacks);
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

test('carrega as preferências e salva a alteração em PATCH /me/settings', async () => {
  const { viewModel, act, dependencies } = await renderViewModel({});

  expect(viewModel().state.prefs).toEqual(defaults);
  await act(() => viewModel().toggle('news'));
  expect(dependencies.profile.updateNotifications).toHaveBeenCalledWith({
    orders: true,
    promos: true,
    news: true,
  });
  expect(viewModel().state.prefs?.news).toBe(true);
});

test('volta ao valor salvo e avisa quando a preferência não é salva', async () => {
  const { viewModel, act, callbacks } = await renderViewModel({
    update: () => Promise.reject(new NetworkError()),
  });

  await act(() => viewModel().toggle('promos'));
  expect(viewModel().state.prefs).toEqual(defaults);
  expect(callbacks.onMessage).toHaveBeenCalledWith(
    'Não foi possível salvar a preferência.',
    'error',
  );
});

test('envia a notificação de teste quando há permissão', async () => {
  const { viewModel, act, dependencies } = await renderViewModel({});

  expect(viewModel().state.permitted).toBe(true);
  await act(() => viewModel().sendTest());
  expect(dependencies.pushWatcher.show).toHaveBeenCalledWith(TEST_PUSH);
});

test('pede a permissão antes do teste e não envia se for negada', async () => {
  const denied = await renderViewModel({ permitted: false });
  expect(denied.viewModel().state.permitted).toBe(false);
  await denied.act(() => denied.viewModel().sendTest());
  expect(denied.dependencies.notifier.askPermission).toHaveBeenCalled();
  expect(denied.dependencies.pushWatcher.show).not.toHaveBeenCalled();

  const granted = await renderViewModel({ permitted: false, granted: true });
  await granted.act(() => granted.viewModel().sendTest());
  expect(granted.viewModel().state.permitted).toBe(true);
  expect(granted.dependencies.pushWatcher.show).toHaveBeenCalledWith(TEST_PUSH);
});
