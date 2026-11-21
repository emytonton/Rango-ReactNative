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

export type ProfileUpdate = {
  name: string;
  email: string;
  phone: string;
};

export type ProfileRepository = {
  me(): Promise<User>;
  update(data: ProfileUpdate): Promise<User>;
  uploadAvatar(uri: string): Promise<User>;
  removeAvatar(): Promise<User>;
  settings(): Promise<UserSettings>;
  updateTheme(theme: ThemeMode): Promise<UserSettings>;
  unreadNotifications(): Promise<number>;
};

export function createProfileRepository(
  http: HttpClient,
  call: AuthorizedCaller,
): ProfileRepository {
  return {
    me: () => call(accessToken => http.request<User>('/me', { accessToken })),
    update: data =>
      call(accessToken =>
        http.request<User>('/me', { method: 'PATCH', body: data, accessToken }),
      ),
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
      }),
    removeAvatar: () =>
      call(accessToken =>
        http.request<User>('/me/avatar', { method: 'DELETE', accessToken }),
      ),
    settings: () =>
      call(accessToken =>
        http.request<UserSettings>('/me/settings', { accessToken }),
      ),
    updateTheme: theme =>
      call(accessToken =>
        http.request<UserSettings>('/me/settings', {
          method: 'PATCH',
          body: { theme },
          accessToken,
        }),
      ),
    unreadNotifications: () =>
      call(accessToken =>
        http.request<{ unreadCount: number }>('/notifications?pageSize=1', {
          accessToken,
        }),
      ).then(response => response.unreadCount),
  };
}
