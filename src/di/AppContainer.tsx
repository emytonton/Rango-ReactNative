import { createContext, useContext, type ReactNode } from 'react';
import { createHttpClient } from '../core/network/httpClient';
import { createAuthApi } from '../data/auth/authApi';
import { createAuthorizedCaller } from '../data/auth/authorizedCaller';
import {
  createAuthRepository,
  type AuthRepository,
} from '../data/auth/authRepository';
import {
  createSessionRepository,
  type SessionRepository,
} from '../data/auth/sessionRepository';
import {
  createCartRepository,
  type CartRepository,
} from '../data/cart/cartRepository';
import { createCatalogApi } from '../data/catalog/catalogApi';
import {
  createCatalogRepository,
  type CatalogRepository,
} from '../data/catalog/catalogRepository';
import {
  createSearchRepository,
  type SearchRepository,
} from '../data/search/searchRepository';
import { createKeychainStorage } from '../data/storage/secureStorage';

export type AppContainer = {
  sessionRepository: SessionRepository;
  authRepository: AuthRepository;
  catalogRepository: CatalogRepository;
  cartRepository: CartRepository;
  searchRepository: SearchRepository;
};

export function createAppContainer(): AppContainer {
  const http = createHttpClient();
  const storage = createKeychainStorage();
  const authApi = createAuthApi(http);
  const sessionRepository = createSessionRepository(authApi, storage);
  const authorizedCall = createAuthorizedCaller(sessionRepository);
  return {
    sessionRepository,
    authRepository: createAuthRepository(authApi, sessionRepository),
    catalogRepository: createCatalogRepository(
      createCatalogApi(http),
      authorizedCall,
    ),
    cartRepository: createCartRepository(http, authorizedCall),
    searchRepository: createSearchRepository(http, authorizedCall),
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
