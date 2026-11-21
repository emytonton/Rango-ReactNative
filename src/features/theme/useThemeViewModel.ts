import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type { ThemeRepository } from '../../data/theme/themeRepository';
import type { ThemeMode } from '../../theme';

type ThemeCallbacks = {
  onSessionExpired: () => void;
};

export function isPreviewActive(
  theme: ThemeMode,
  previewDark: boolean,
  systemDark: boolean,
): boolean {
  if (theme === 'system') {
    return previewDark === systemDark;
  }
  return (theme === 'dark') === previewDark;
}

export function useThemeViewModel(
  themeRepository: ThemeRepository,
  callbacks: ThemeCallbacks,
) {
  const theme = useSyncExternalStore(
    themeRepository.subscribe,
    themeRepository.current,
  );
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const sync = useCallback(async (request: () => Promise<boolean>) => {
    try {
      await request();
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        callbacksRef.current.onSessionExpired();
      }
    }
  }, []);

  useEffect(() => {
    sync(themeRepository.pushPending);
  }, [themeRepository, sync]);

  const select = useCallback(
    (next: ThemeMode) => {
      if (next !== themeRepository.current()) {
        sync(() => themeRepository.select(next));
      }
    },
    [themeRepository, sync],
  );

  return { theme, select };
}
