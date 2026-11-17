import { createContext, useContext, type ReactNode } from 'react';
import { createHttpClient } from '../core/network/httpClient';
import { createAuthApi } from '../data/auth/authApi';
import {
  createSessionRepository,
  type SessionRepository,
} from '../data/auth/sessionRepository';
import { createKeychainStorage } from '../data/storage/secureStorage';

export type AppContainer = {
  sessionRepository: SessionRepository;
};

export function createAppContainer(): AppContainer {
  const http = createHttpClient();
  const storage = createKeychainStorage();
  return {
    sessionRepository: createSessionRepository(createAuthApi(http), storage),
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
