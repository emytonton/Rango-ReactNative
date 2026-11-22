import type { LocalNotifier } from '../../core/native/localNotifier';
import type { SessionRepository } from '../auth/sessionRepository';
import type { NotificationRepository } from '../notification/notificationRepository';
import type { SecureStorage } from '../storage/secureStorage';

const KEY_SEEN = 'push_seen';
const POLL_INTERVAL_MS = 10_000;

export type PushMessage = { id: number; title: string; body: string };

export type PushState = {
  banner: PushMessage | null;
  arrivals: number;
};

export type PushWatcher = {
  state(): PushState;
  subscribe(listener: () => void): () => void;
  start(): void;
  stop(): void;
  setForeground(foreground: boolean): void;
  poll(): Promise<void>;
  dismissBanner(): void;
};

export function createPushWatcher(
  notifications: NotificationRepository,
  session: SessionRepository,
  storage: SecureStorage,
  notifier: LocalNotifier,
  intervalMs: number = POLL_INTERVAL_MS,
): PushWatcher {
  let state: PushState = { banner: null, arrivals: 0 };
  let foreground = true;
  let timer: ReturnType<typeof setInterval> | null = null;
  let polling = false;
  const listeners = new Set<() => void>();

  const update = (patch: Partial<PushState>) => {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener());
  };

  const poll = async () => {
    if (polling) {
      return;
    }
    if (!session.getAccessToken()) {
      await storage.remove(KEY_SEEN);
      return;
    }
    polling = true;
    try {
      const unread = await notifications.unread();
      const saved = await storage.get(KEY_SEEN);
      await storage.put(KEY_SEEN, unread.map(item => item.id).join(','));
      if (saved === null) {
        return;
      }
      const seen = new Set(saved.split(',').filter(Boolean).map(Number));
      const fresh = unread
        .filter(item => !seen.has(item.id))
        .sort((a, b) => a.id - b.id);
      fresh.forEach(item => {
        const message = { id: item.id, title: item.title, body: item.body };
        if (foreground) {
          update({ banner: message, arrivals: state.arrivals + 1 });
        } else {
          update({ arrivals: state.arrivals + 1 });
          notifier.show(message.id, message.title, message.body);
        }
      });
    } catch {
      return;
    } finally {
      polling = false;
    }
  };

  return {
    state: () => state,
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start: () => {
      if (!timer) {
        poll();
        timer = setInterval(poll, intervalMs);
      }
    },
    stop: () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    setForeground: value => {
      foreground = value;
    },
    poll,
    dismissBanner: () => update({ banner: null }),
  };
}
