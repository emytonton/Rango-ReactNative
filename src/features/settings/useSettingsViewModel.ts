import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ToastKind } from '../../components';
import { ApiError, NetworkError } from '../../core/network/apiError';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type { SessionRepository } from '../../data/auth/sessionRepository';
import type { ConnectionRepository } from '../../data/connection/connectionRepository';
import type { FavoriteRepository } from '../../data/favorite/favoriteRepository';
import type { PaymentSelection } from '../../data/payment/paymentSelection';
import type { ProfileRepository } from '../../data/profile/profileRepository';
import type { DataSync } from '../../data/sync/dataSync';
import type { ThemeMode } from '../../theme';

const CLOCK_TICK_MS = 30_000;

export type SettingsState = {
  theme: ThemeMode;
  online: boolean | null;
  syncing: boolean;
  clearing: boolean;
};

type SettingsDependencies = {
  profile: ProfileRepository;
  connection: ConnectionRepository;
  dataSync: DataSync;
  session: SessionRepository;
  favorites: FavoriteRepository;
  paymentSelection: PaymentSelection;
};

type SettingsCallbacks = {
  onMessage: (text: string, kind: ToastKind) => void;
  onLocalDataCleared: () => void;
  onSessionExpired: () => void;
};

const themeLabels: Record<ThemeMode, string> = {
  light: 'Claro',
  dark: 'Escuro',
  system: 'Sistema',
};

export function themeLabel(theme: ThemeMode): string {
  return themeLabels[theme];
}

export function connectionHint(online: boolean | null): string {
  if (online === null) {
    return 'verificando conexão';
  }
  return online ? 'conectado' : 'sem conexão com o servidor';
}

export function formatLastSync(lastSyncedAt: Date | null, now: Date): string {
  if (!lastSyncedAt) {
    return 'ainda não sincronizado nesta sessão';
  }
  const minutes = Math.floor((now.getTime() - lastSyncedAt.getTime()) / 60000);
  if (minutes < 1) {
    return 'última sincronização: agora';
  }
  if (minutes < 60) {
    return `última sincronização: há ${minutes} min`;
  }
  return `última sincronização: há ${Math.floor(minutes / 60)} h`;
}

export function useSettingsViewModel(
  dependencies: SettingsDependencies,
  callbacks: SettingsCallbacks,
) {
  const {
    profile,
    connection,
    dataSync,
    session,
    favorites,
    paymentSelection,
  } = dependencies;
  const [state, setState] = useState<SettingsState>({
    theme: 'system',
    online: null,
    syncing: false,
    clearing: false,
  });
  const [now, setNow] = useState(() => new Date());
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);
  const busy = useRef({ syncing: false, clearing: false });
  const lastSyncedAt = useSyncExternalStore(
    dataSync.subscribe,
    dataSync.lastSyncedAt,
  );

  useEffect(() => {
    stateRef.current = state;
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const toast = (text: string, kind: ToastKind) =>
    callbacksRef.current.onMessage(text, kind);

  const checkConnection = useCallback(async () => {
    const online = await connection.isOnline();
    setState(current => ({ ...current, online }));
    return online;
  }, [connection]);

  const refresh = useCallback(async () => {
    if (busy.current.clearing) {
      return;
    }
    setNow(new Date());
    checkConnection();
    try {
      const settings = await profile.settings();
      setState(current => ({ ...current, theme: settings.theme }));
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        callbacksRef.current.onSessionExpired();
      }
    }
  }, [profile, checkConnection]);

  const checkNow = useCallback(async () => {
    const wasOffline = stateRef.current.online === false;
    const online = await checkConnection();
    if (online) {
      toast(
        wasOffline ? 'Conexão restaurada.' : 'Conectado ao servidor.',
        'success',
      );
    } else {
      toast('Sem conexão com o servidor.', 'warning');
    }
  }, [checkConnection]);

  const sync = useCallback(async () => {
    if (busy.current.syncing) {
      return;
    }
    busy.current.syncing = true;
    setState(current => ({ ...current, syncing: true }));
    try {
      const settings = await dataSync.syncNow();
      setNow(new Date());
      setState(current => ({
        ...current,
        online: true,
        theme: settings.theme,
      }));
      toast('Dados sincronizados.', 'success');
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        callbacksRef.current.onSessionExpired();
      } else if (error instanceof NetworkError) {
        setState(current => ({ ...current, online: false }));
        toast(error.message, 'error');
      } else {
        toast(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível sincronizar.',
          'error',
        );
      }
    } finally {
      busy.current.syncing = false;
      setState(current => ({ ...current, syncing: false }));
    }
  }, [dataSync]);

  const clearLocalData = useCallback(async () => {
    if (busy.current.clearing) {
      return;
    }
    busy.current.clearing = true;
    setState(current => ({ ...current, clearing: true }));
    await session.logout();
    favorites.clearLocal();
    paymentSelection.clear();
    dataSync.reset();
    toast('Dados locais apagados.', 'warning');
    callbacksRef.current.onLocalDataCleared();
  }, [session, favorites, paymentSelection, dataSync]);

  const language = useCallback(
    () => toast('Apenas português neste protótipo.', 'warning'),
    [],
  );
  const help = useCallback(
    () => toast('Central de ajuda em breve.', 'warning'),
    [],
  );
  const terms = useCallback(
    () => toast('Documentos abertos no navegador.', 'warning'),
    [],
  );

  return {
    state,
    syncHint: formatLastSync(lastSyncedAt, now),
    refresh,
    checkNow,
    sync,
    clearLocalData,
    language,
    help,
    terms,
  };
}
