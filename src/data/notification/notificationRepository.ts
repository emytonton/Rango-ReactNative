import type { NotificationTone } from '../../components';
import type { HttpClient } from '../../core/network/httpClient';
import type { AuthorizedCaller } from '../auth/authorizedCaller';

export type AppNotification = {
  id: number;
  kind: NotificationTone;
  title: string;
  body: string;
  orderId: number | null;
  orderCode: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationPage = {
  data: AppNotification[];
  unreadCount: number;
};

const PAGE_SIZE = 50;

export type NotificationRepository = {
  list(): Promise<NotificationPage>;
  unread(): Promise<AppNotification[]>;
  markRead(id: number): Promise<void>;
  markAllRead(): Promise<void>;
};

export function createNotificationRepository(
  http: HttpClient,
  call: AuthorizedCaller,
): NotificationRepository {
  return {
    list: () =>
      call(accessToken =>
        http.request<NotificationPage>(`/notifications?pageSize=${PAGE_SIZE}`, {
          accessToken,
        }),
      ),
    unread: () =>
      call(accessToken =>
        http.request<NotificationPage>(
          `/notifications?unreadOnly=true&pageSize=${PAGE_SIZE}`,
          { accessToken },
        ),
      ).then(page => page.data),
    markRead: id =>
      call(accessToken =>
        http.request<unknown>(`/notifications/${id}/read`, {
          method: 'POST',
          accessToken,
        }),
      ).then(() => undefined),
    markAllRead: () =>
      call(accessToken =>
        http.request<unknown>('/notifications/read-all', {
          method: 'POST',
          accessToken,
        }),
      ).then(() => undefined),
  };
}
