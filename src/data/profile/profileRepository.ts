import type { HttpClient } from '../../core/network/httpClient';
import type { ThemeMode } from '../../theme';
import type { User } from '../auth/authApi';
import type { AuthorizedCaller } from '../auth/authorizedCaller';
import type { LocalCache } from '../cache/localCache';

export type NotificationPrefs = {
  orders: boolean;
  promos: boolean;
  news: boolean;
};

export type UserSettings = {
  theme: ThemeMode;
  notifications: NotificationPrefs;
};

export type ProfileUpdate = {
  name: string;
  email: string;
  phone: string;
};

const USER_KEY = 'profile';
const SETTINGS_KEY = 'settings';
const UNREAD_KEY = 'unread_notifications';

export type ProfileRepository = {
  me(): Promise<User>;
  update(data: ProfileUpdate): Promise<User>;
  uploadAvatar(uri: string): Promise<User>;
  removeAvatar(): Promise<User>;
  settings(): Promise<UserSettings>;
  updateTheme(theme: ThemeMode): Promise<UserSettings>;
  updateNotifications(prefs: NotificationPrefs): Promise<UserSettings>;
  unreadNotifications(): Promise<number>;
};

export function createProfileRepository(
  http: HttpClient,
  call: AuthorizedCaller,
  cache: LocalCache,
): ProfileRepository {
  const savedUser = (user: User) => {
    cache.put(USER_KEY, user).catch(() => undefined);
    return user;
  };
  const savedSettings = (settings: UserSettings) => {
    cache.put(SETTINGS_KEY, settings).catch(() => undefined);
    return settings;
  };

  return {
    me: () =>
      cache.fetchOrCached(USER_KEY, () =>
        call(accessToken => http.request<User>('/me', { accessToken })),
      ),
    update: data =>
      call(accessToken =>
        http.request<User>('/me', { method: 'PATCH', body: data, accessToken }),
      ).then(savedUser),
    uploadAvatar: uri =>
      call(accessToken => {
        const form = new FormData();
        form.append('file', {
          uri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as unknown as Blob);
        return http.request<User>('/me/avatar', {
          method: 'PUT',
          body: form,
          accessToken,
        });
      }).then(savedUser),
    removeAvatar: () =>
      call(accessToken =>
        http.request<User>('/me/avatar', { method: 'DELETE', accessToken }),
      ).then(savedUser),
    settings: () =>
      cache.fetchOrCached(SETTINGS_KEY, () =>
        call(accessToken =>
          http.request<UserSettings>('/me/settings', { accessToken }),
        ),
      ),
    updateTheme: theme =>
      call(accessToken =>
        http.request<UserSettings>('/me/settings', {
          method: 'PATCH',
          body: { theme },
          accessToken,
        }),
      ).then(savedSettings),
    updateNotifications: notifications =>
      call(accessToken =>
        http.request<UserSettings>('/me/settings', {
          method: 'PATCH',
          body: { notifications },
          accessToken,
        }),
      ).then(savedSettings),
    unreadNotifications: () =>
      cache.fetchOrCached(UNREAD_KEY, () =>
        call(accessToken =>
          http.request<{ unreadCount: number }>('/notifications?pageSize=1', {
            accessToken,
          }),
        ).then(response => response.unreadCount),
      ),
  };
}
