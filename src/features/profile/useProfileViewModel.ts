import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToastKind } from '../../components';
import { ApiError } from '../../core/network/apiError';
import { apiBaseUrl } from '../../core/network/config';
import type { AddressRepository } from '../../data/address/addressRepository';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type { SessionRepository } from '../../data/auth/sessionRepository';
import type { PaymentRepository } from '../../data/payment/paymentRepository';
import type { ProfileRepository } from '../../data/profile/profileRepository';
import type { ThemeMode } from '../../theme';

export type ProfileState = {
  loading: boolean;
  loaded: boolean;
  errorMessage: string | null;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  addressCount: number;
  paymentCount: number;
  unreadCount: number;
  theme: ThemeMode;
  loggingOut: boolean;
};

type ProfileRepositories = {
  profile: ProfileRepository;
  addresses: AddressRepository;
  payments: PaymentRepository;
  session: SessionRepository;
};

type ProfileCallbacks = {
  onMessage: (text: string, kind: ToastKind) => void;
  onLoggedOut: () => void;
  onSessionExpired: () => void;
};

const initialState: ProfileState = {
  loading: true,
  loaded: false,
  errorMessage: null,
  name: '',
  email: '',
  phone: '',
  avatarUrl: null,
  addressCount: 0,
  paymentCount: 0,
  unreadCount: 0,
  theme: 'system',
  loggingOut: false,
};

const themeLabels: Record<ThemeMode, string> = {
  light: 'Claro',
  dark: 'Escuro',
  system: 'Sistema',
};

export function profileHints(state: ProfileState) {
  return {
    addresses:
      state.addressCount === 1 ? '1 salvo' : `${state.addressCount} salvos`,
    payments:
      state.paymentCount === 1
        ? '1 método disponível'
        : `${state.paymentCount} métodos disponíveis`,
    notifications:
      state.unreadCount > 0 ? `${state.unreadCount} não lidas` : 'tudo lido',
    theme: themeLabels[state.theme],
  };
}

export function useProfileViewModel(
  repositories: ProfileRepositories,
  callbacks: ProfileCallbacks,
) {
  const { profile, addresses, payments, session } = repositories;
  const [state, setState] = useState<ProfileState>(initialState);
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);
  const request = useRef(0);

  useEffect(() => {
    stateRef.current = state;
    callbacksRef.current = callbacks;
  });

  const load = useCallback(async () => {
    const id = ++request.current;
    setState(current => ({ ...current, loading: true, errorMessage: null }));
    try {
      const [user, settings, unreadCount, addressList, paymentList] =
        await Promise.all([
          profile.me(),
          profile.settings(),
          profile.unreadNotifications(),
          addresses.list(),
          payments.list(),
        ]);
      if (request.current !== id) {
        return;
      }
      setState(current => ({
        ...current,
        loading: false,
        loaded: true,
        errorMessage: null,
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        avatarUrl: user.avatarUrl ? apiBaseUrl + user.avatarUrl : null,
        addressCount: addressList.length,
        paymentCount: paymentList.length,
        unreadCount,
        theme: settings.theme,
      }));
    } catch (error) {
      if (request.current !== id) {
        return;
      }
      if (error instanceof SessionExpiredError) {
        callbacksRef.current.onSessionExpired();
        return;
      }
      const message =
        error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar o perfil.';
      setState(current =>
        current.loaded
          ? { ...current, loading: false }
          : { ...current, loading: false, errorMessage: message },
      );
    }
  }, [profile, addresses, payments]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    if (stateRef.current.loaded) {
      load();
    }
  }, [load]);

  const help = useCallback(() => {
    callbacksRef.current.onMessage('Central de ajuda em breve.', 'warning');
  }, []);

  const logout = useCallback(async () => {
    if (stateRef.current.loggingOut) {
      return;
    }
    request.current++;
    setState(current => ({ ...current, loggingOut: true }));
    await session.logout();
    callbacksRef.current.onMessage('Você saiu da conta.', 'warning');
    callbacksRef.current.onLoggedOut();
  }, [session]);

  return { state, retry: load, refresh, help, logout };
}
