import type { LocalNotifier } from '../../src/core/native/localNotifier';
import type { SessionRepository } from '../../src/data/auth/sessionRepository';
import type {
  AppNotification,
  NotificationRepository,
} from '../../src/data/notification/notificationRepository';
import { createPushWatcher } from '../../src/data/push/pushWatcher';
import type { SecureStorage } from '../../src/data/storage/secureStorage';

function memoryStorage(): SecureStorage {
  const values: Record<string, string> = {};
  return {
    get: key => Promise.resolve(values[key] ?? null),
    put: (key, value) => {
      values[key] = value;
      return Promise.resolve();
    },
    remove: key => {
      delete values[key];
      return Promise.resolve();
    },
  };
}

test('avisa só as notificações novas, por banner ou notificação local', async () => {
  let unread = [{ id: 1, title: 'Antiga', body: '' }];
  const notifier = { show: jest.fn(), requestPermission: jest.fn() };
  const watcher = createPushWatcher(
    {
      unread: () => Promise.resolve(unread as AppNotification[]),
    } as unknown as NotificationRepository,
    { getAccessToken: () => 'token' } as unknown as SessionRepository,
    memoryStorage(),
    notifier as unknown as LocalNotifier,
  );

  await watcher.poll();
  expect(watcher.state().banner).toBeNull();

  unread = [...unread, { id: 2, title: 'Saiu para entrega', body: 'Rafael' }];
  await watcher.poll();
  expect(watcher.state().banner?.title).toBe('Saiu para entrega');
  expect(watcher.state().arrivals).toBe(1);

  watcher.setForeground(false);
  unread = [...unread, { id: 3, title: 'Chegou', body: 'Bom apetite' }];
  await watcher.poll();
  expect(notifier.show).toHaveBeenCalledWith(3, 'Chegou', 'Bom apetite');
  expect(watcher.state().arrivals).toBe(2);
});
