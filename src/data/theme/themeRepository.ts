import { ApiError, NetworkError } from '../../core/network/apiError';
import type { ThemeMode } from '../../theme';
import type { ProfileRepository } from '../profile/profileRepository';
import type { SecureStorage } from '../storage/secureStorage';

const KEY_THEME = 'theme';
const KEY_PENDING = 'theme_pending';
const modes: ThemeMode[] = ['light', 'dark', 'system'];

export type ThemeRepository = {
  current(): ThemeMode;
  subscribe(listener: () => void): () => void;
  load(): Promise<void>;
  select(theme: ThemeMode): Promise<boolean>;
  pushPending(): Promise<boolean>;
  onRemote(theme: ThemeMode): Promise<void>;
};

function toMode(value: string | null): ThemeMode | null {
  return modes.find(mode => mode === value) ?? null;
}

export function createThemeRepository(
  storage: SecureStorage,
  profile: ProfileRepository,
): ThemeRepository {
  let theme: ThemeMode = 'system';
  let pending: ThemeMode | null = null;
  const listeners = new Set<() => void>();

  const apply = (next: ThemeMode) => {
    if (next !== theme) {
      theme = next;
      listeners.forEach(listener => listener());
    }
  };

  const pushPending = async () => {
    const sending = pending;
    if (!sending) {
      return true;
    }
    try {
      await profile.updateTheme(sending);
    } catch (error) {
      if (error instanceof ApiError || error instanceof NetworkError) {
        return false;
      }
      throw error;
    }
    if (pending === sending) {
      pending = null;
      await storage.remove(KEY_PENDING);
    }
    return true;
  };

  return {
    current: () => theme,
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    load: async () => {
      const [saved, savedPending] = await Promise.all([
        storage.get(KEY_THEME),
        storage.get(KEY_PENDING),
      ]);
      pending = toMode(savedPending);
      apply(toMode(saved) ?? 'system');
    },
    select: async next => {
      pending = next;
      apply(next);
      await Promise.all([
        storage.put(KEY_THEME, next),
        storage.put(KEY_PENDING, next),
      ]);
      return pushPending();
    },
    pushPending,
    onRemote: async remote => {
      if (pending || !toMode(remote)) {
        return;
      }
      apply(remote);
      await storage.put(KEY_THEME, remote);
    },
  };
}
