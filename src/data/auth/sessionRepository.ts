import { ApiError } from '../../core/network/apiError';
import type { SecureStorage } from '../storage/secureStorage';
import type { AuthApi, AuthSession } from './authApi';

export type SessionRestore =
  | { type: 'none' }
  | { type: 'restored'; userName: string }
  | { type: 'unreachable'; userName: string };

export type SessionRepository = {
  getAccessToken(): string | null;
  restore(): Promise<SessionRestore>;
  renewAccessToken(): Promise<string | null>;
  save(session: AuthSession): Promise<void>;
  clear(): Promise<void>;
  logout(): Promise<void>;
};

const KEY_REFRESH = 'refresh_token';
const KEY_USER_NAME = 'user_name';

export function createSessionRepository(
  api: AuthApi,
  storage: SecureStorage,
  onClear: () => Promise<void> = async () => undefined,
): SessionRepository {
  let accessToken: string | null = null;
  let pendingRefresh: Promise<AuthSession | null> | null = null;

  async function save(session: AuthSession) {
    await storage.put(KEY_REFRESH, session.refreshToken);
    await storage.put(KEY_USER_NAME, session.user.name);
    accessToken = session.accessToken;
  }

  async function clear() {
    await storage.remove(KEY_REFRESH);
    await storage.remove(KEY_USER_NAME);
    accessToken = null;
    await onClear();
  }

  async function refreshOnce(): Promise<AuthSession | null> {
    const refreshToken = await storage.get(KEY_REFRESH);
    if (!refreshToken) {
      return null;
    }
    const session = await api.refresh(refreshToken);
    await save(session);
    return session;
  }

  function singleRefresh(): Promise<AuthSession | null> {
    if (!pendingRefresh) {
      pendingRefresh = refreshOnce().finally(() => {
        pendingRefresh = null;
      });
    }
    return pendingRefresh;
  }

  return {
    getAccessToken: () => accessToken,
    save,
    clear,

    async restore() {
      const userName = (await storage.get(KEY_USER_NAME)) ?? '';
      try {
        const session = await singleRefresh();
        return session
          ? { type: 'restored', userName: session.user.name }
          : { type: 'none' };
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await clear();
          return { type: 'none' };
        }
        return { type: 'unreachable', userName };
      }
    },

    async logout() {
      const refreshToken = await storage.get(KEY_REFRESH);
      if (refreshToken) {
        await api.logout(refreshToken).catch(() => undefined);
      }
      await clear();
    },

    async renewAccessToken() {
      try {
        const session = await singleRefresh();
        return session?.accessToken ?? null;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await clear();
          return null;
        }
        throw error;
      }
    },
  };
}
