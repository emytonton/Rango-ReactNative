import { createContext, useContext, type ReactNode } from 'react';
import { createHttpClient } from '../core/network/httpClient';
import { createAuthApi } from '../data/auth/authApi';
import {
  createAuthRepository,
  type AuthRepository,
} from '../data/auth/authRepository';
import {
  createSessionRepository,
  type SessionRepository,
} from '../data/auth/sessionRepository';
import { createKeychainStorage } from '../data/storage/secureStorage';

export type AppContainer = {
  sessionRepository: SessionRepository;
  authRepository: AuthRepository;
};

export function createAppContainer(): AppContainer {
  const http = createHttpClient();
  const storage = createKeychainStorage();
  const authApi = createAuthApi(http);
  const sessionRepository = createSessionRepository(authApi, storage);
  return {
    sessionRepository,
    authRepository: createAuthRepository(authApi, sessionRepository),
  };
}

const AppContainerContext = createContext<AppContainer | null>(null);

type AppContainerProviderProps = {
  container: AppContainer;
  children: ReactNode;
};

export function AppContainerProvider({
  container,
  children,
}: AppContainerProviderProps) {
  return (
    <AppContainerContext.Provider value={container}>
      {children}
    </AppContainerContext.Provider>
  );
}

export function useAppContainer(): AppContainer {
  const container = useContext(AppContainerContext);
  if (!container) {
    throw new Error('AppContainerProvider ausente.');
  }
  return container;
}
