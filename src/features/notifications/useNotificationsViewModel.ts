import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { NotificationTone, ToastKind } from '../../components';
import { formatRelativeTime } from '../../core/format/formatters';
import { ApiError } from '../../core/network/apiError';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type {
  AppNotification,
  NotificationRepository,
} from '../../data/notification/notificationRepository';
import type { PushWatcher } from '../../data/push/pushWatcher';

export type NotificationItem = {
  id: number;
  title: string;
  text: string;
  time: string;
  tone: NotificationTone;
  unread: boolean;
  orderCode: string | null;
};

export type NotificationsState = {
  loading: boolean;
  loaded: boolean;
  errorMessage: string | null;
  items: NotificationItem[];
};

type NotificationsCallbacks = {
  onMessage: (text: string, kind: ToastKind) => void;
  onOpenOrder: (code: string) => void;
  onSessionExpired: () => void;
};

const initialState: NotificationsState = {
  loading: true,
  loaded: false,
  errorMessage: null,
  items: [],
};

export function unreadLabel(items: NotificationItem[]): string {
  const count = items.filter(item => item.unread).length;
  return count > 0 ? `${count} não lidas` : 'tudo lido';
}

export function isNotificationsEmpty(state: NotificationsState): boolean {
  return (
    state.loaded && state.errorMessage === null && state.items.length === 0
  );
}

function toItem(notification: AppNotification, now: Date): NotificationItem {
  return {
    id: notification.id,
    title: notification.title,
    text: notification.body,
    time: formatRelativeTime(notification.createdAt, now),
    tone: notification.kind,
    unread: !notification.isRead,
    orderCode: notification.orderCode,
  };
}

export function useNotificationsViewModel(
  repository: NotificationRepository,
  pushWatcher: PushWatcher,
  callbacks: NotificationsCallbacks,
) {
  const [state, setState] = useState<NotificationsState>(initialState);
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);
  const request = useRef(0);
  const { arrivals } = useSyncExternalStore(
    pushWatcher.subscribe,
    pushWatcher.state,
  );

  useEffect(() => {
    stateRef.current = state;
    callbacksRef.current = callbacks;
  });

  const handleSessionError = (error: unknown): boolean => {
    if (error instanceof SessionExpiredError) {
      callbacksRef.current.onSessionExpired();
      return true;
    }
    return false;
  };

  const setUnread = (ids: Set<number>, unread: boolean) =>
    setState(current => ({
      ...current,
      items: current.items.map(item =>
        ids.has(item.id) ? { ...item, unread } : item,
      ),
    }));

  const load = useCallback(async () => {
    const id = ++request.current;
    setState(current => ({ ...current, loading: true, errorMessage: null }));
    try {
      const page = await repository.list();
      if (request.current !== id) {
        return;
      }
      const now = new Date();
      setState({
        loading: false,
        loaded: true,
        errorMessage: null,
        items: page.data.map(item => toItem(item, now)),
      });
    } catch (error) {
      if (request.current !== id || handleSessionError(error)) {
        return;
      }
      const message =
        error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar as notificações.';
      setState(current =>
        current.loaded
          ? { ...current, loading: false }
          : { ...current, loading: false, errorMessage: message },
      );
    }
  }, [repository]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    if (stateRef.current.loaded) {
      load();
    }
  }, [load]);

  useEffect(() => {
    if (arrivals > 0) {
      refresh();
    }
  }, [arrivals, refresh]);

  const open = useCallback(
    async (id: number) => {
      const item = stateRef.current.items.find(current => current.id === id);
      if (!item) {
        return;
      }
      if (item.orderCode) {
        callbacksRef.current.onOpenOrder(item.orderCode);
      }
      if (!item.unread) {
        return;
      }
      setUnread(new Set([id]), false);
      try {
        await repository.markRead(id);
      } catch (error) {
        if (!handleSessionError(error)) {
          setUnread(new Set([id]), true);
        }
      }
    },
    [repository],
  );

  const readAll = useCallback(async () => {
    const ids = new Set(
      stateRef.current.items.filter(item => item.unread).map(item => item.id),
    );
    setUnread(ids, false);
    try {
      await repository.markAllRead();
      callbacksRef.current.onMessage(
        'Notificações marcadas como lidas.',
        'success',
      );
    } catch (error) {
      if (handleSessionError(error)) {
        return;
      }
      setUnread(ids, true);
      callbacksRef.current.onMessage(
        'Não foi possível marcar as notificações.',
        'error',
      );
    }
  }, [repository]);

  return { state, retry: load, refresh, open, readAll };
}
