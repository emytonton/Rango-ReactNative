import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToastKind } from '../../components';
import type { LocalNotifier } from '../../core/native/localNotifier';
import { ApiError } from '../../core/network/apiError';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type {
  NotificationPrefs,
  ProfileRepository,
} from '../../data/profile/profileRepository';
import type { PushWatcher } from '../../data/push/pushWatcher';

export type NotificationPref = keyof NotificationPrefs;

const LOAD_ERROR = 'Não foi possível carregar as preferências.';
const SAVE_ERROR = 'Não foi possível salvar a preferência.';

export const TEST_PUSH = {
  id: 900_001,
  title: 'Notificação de teste',
  body: 'Tudo certo: as notificações do Rango estão chegando.',
};

export type NotificationSettingsState = {
  prefs: NotificationPrefs | null;
  errorMessage: string | null;
  permitted: boolean;
};

type NotificationSettingsDependencies = {
  profile: ProfileRepository;
  notifier: LocalNotifier;
  pushWatcher: PushWatcher;
};

type NotificationSettingsCallbacks = {
  onMessage: (text: string, kind: ToastKind) => void;
  onSessionExpired: () => void;
};

export function useNotificationSettingsViewModel(
  dependencies: NotificationSettingsDependencies,
  callbacks: NotificationSettingsCallbacks,
) {
  const { profile, notifier, pushWatcher } = dependencies;
  const [state, setState] = useState<NotificationSettingsState>({
    prefs: null,
    errorMessage: null,
    permitted: true,
  });
  const callbacksRef = useRef(callbacks);
  const confirmed = useRef<NotificationPrefs | null>(null);
  const saveId = useRef(0);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const refreshPermission = useCallback(async () => {
    const permitted = await notifier.isPermitted();
    setState(current => ({ ...current, permitted }));
    return permitted;
  }, [notifier]);

  const load = useCallback(async () => {
    setState(current => ({ ...current, errorMessage: null }));
    try {
      const { notifications } = await profile.settings();
      confirmed.current = notifications;
      setState(current => ({ ...current, prefs: notifications }));
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        callbacksRef.current.onSessionExpired();
        return;
      }
      setState(current => ({
        ...current,
        errorMessage: error instanceof ApiError ? error.message : LOAD_ERROR,
      }));
    }
  }, [profile]);

  useEffect(() => {
    load();
    refreshPermission();
  }, [load, refreshPermission]);

  const toggle = useCallback(
    async (pref: NotificationPref) => {
      const current = state.prefs;
      if (!current) {
        return;
      }
      const next = { ...current, [pref]: !current[pref] };
      const id = ++saveId.current;
      setState(previous => ({ ...previous, prefs: next }));
      try {
        const { notifications } = await profile.updateNotifications(next);
        confirmed.current = notifications;
        if (id === saveId.current) {
          setState(previous => ({ ...previous, prefs: notifications }));
        }
      } catch (error) {
        if (error instanceof SessionExpiredError) {
          callbacksRef.current.onSessionExpired();
          return;
        }
        if (id === saveId.current) {
          setState(previous => ({ ...previous, prefs: confirmed.current }));
        }
        callbacksRef.current.onMessage(SAVE_ERROR, 'error');
      }
    },
    [profile, state.prefs],
  );

  const requestPermission = useCallback(async () => {
    const permitted = await notifier.askPermission();
    setState(current => ({ ...current, permitted }));
    return permitted;
  }, [notifier]);

  const sendTest = useCallback(async () => {
    const permitted = state.permitted || (await requestPermission());
    if (permitted) {
      pushWatcher.show(TEST_PUSH);
    }
  }, [state.permitted, requestPermission, pushWatcher]);

  return {
    state,
    retry: load,
    toggle,
    sendTest,
    requestPermission,
    refreshPermission,
  };
}
