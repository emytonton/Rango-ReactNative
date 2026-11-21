import type { HttpClient } from '../../core/network/httpClient';
import type { ThemeMode } from '../../theme';
import type { User } from '../auth/authApi';
import type { AuthorizedCaller } from '../auth/authorizedCaller';

export type NotificationPrefs = {
  orders: boolean;
  promos: boolean;
  news: boolean;
};

export type UserSettings = {
  theme: ThemeMode;
  notifications: NotificationPrefs;
};

export type ProfileRepository = {
  me(): Promise<User>;
  settings(): Promise<UserSettings>;
  unreadNotifications(): Promise<number>;
};

export function createProfileRepository(
  http: HttpClient,
  call: AuthorizedCaller,
): ProfileRepository {
  return {
    me: () => call(accessToken => http.request<User>('/me', { accessToken })),
    settings: () =>
      call(accessToken =>
        http.request<UserSettings>('/me/settings', { accessToken }),
      ),
    unreadNotifications: () =>
      call(accessToken =>
        http.request<{ unreadCount: number }>('/notifications?pageSize=1', {
          accessToken,
        }),
      ).then(response => response.unreadCount),
  };
}
