import { createContext, useContext, type ReactNode } from 'react';
import { photoPicker, type PhotoPicker } from '../core/image/photoPicker';
import { localNotifier } from '../core/native/localNotifier';
import { createHttpClient } from '../core/network/httpClient';
import { createAuthApi } from '../data/auth/authApi';
import {
  createAddressRepository,
  type AddressRepository,
} from '../data/address/addressRepository';
import { createAuthorizedCaller } from '../data/auth/authorizedCaller';
import { createLocalCache } from '../data/cache/localCache';
import {
  createAuthRepository,
  type AuthRepository,
} from '../data/auth/authRepository';
import {
  createSessionRepository,
  type SessionRepository,
} from '../data/auth/sessionRepository';
import {
  createConnectionRepository,
  type ConnectionRepository,
} from '../data/connection/connectionRepository';
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
  createFavoriteRepository,
  type FavoriteRepository,
} from '../data/favorite/favoriteRepository';
import {
  createNotificationRepository,
  type NotificationRepository,
} from '../data/notification/notificationRepository';
import {
  createOrderRepository,
  type OrderRepository,
} from '../data/order/orderRepository';
import {
  createPaymentRepository,
  type PaymentRepository,
} from '../data/payment/paymentRepository';
import {
  createPaymentSelection,
  type PaymentSelection,
} from '../data/payment/paymentSelection';
import {
  createProfileRepository,
  type ProfileRepository,
} from '../data/profile/profileRepository';
import {
  createSearchRepository,
  type SearchRepository,
} from '../data/search/searchRepository';
import { createPushWatcher, type PushWatcher } from '../data/push/pushWatcher';
import { createKeychainStorage } from '../data/storage/secureStorage';
import { createDataSync, type DataSync } from '../data/sync/dataSync';
import {
  createThemeRepository,
  type ThemeRepository,
} from '../data/theme/themeRepository';

export type AppContainer = {
  sessionRepository: SessionRepository;
  authRepository: AuthRepository;
  catalogRepository: CatalogRepository;
  favoriteRepository: FavoriteRepository;
  cartRepository: CartRepository;
  searchRepository: SearchRepository;
  addressRepository: AddressRepository;
  paymentRepository: PaymentRepository;
  paymentSelection: PaymentSelection;
  orderRepository: OrderRepository;
  profileRepository: ProfileRepository;
  photoPicker: PhotoPicker;
  connectionRepository: ConnectionRepository;
  dataSync: DataSync;
  themeRepository: ThemeRepository;
  notificationRepository: NotificationRepository;
  pushWatcher: PushWatcher;
};

export function createAppContainer(): AppContainer {
  const http = createHttpClient();
  const storage = createKeychainStorage();
  const authApi = createAuthApi(http);
  const localCache = createLocalCache(storage);
  const sessionRepository = createSessionRepository(
    authApi,
    storage,
    localCache.clear,
  );
  const authorizedCall = createAuthorizedCaller(sessionRepository);
  const favoriteRepository = createFavoriteRepository(http, authorizedCall);
  const cartRepository = createCartRepository(http, authorizedCall);
  const profileRepository = createProfileRepository(http, authorizedCall);
  const notificationRepository = createNotificationRepository(
    http,
    authorizedCall,
  );
  return {
    sessionRepository,
    authRepository: createAuthRepository(authApi, sessionRepository),
    catalogRepository: createCatalogRepository(
      createCatalogApi(http),
      authorizedCall,
      favoriteRepository,
      localCache,
    ),
    favoriteRepository,
    cartRepository,
    searchRepository: createSearchRepository(http, authorizedCall),
    addressRepository: createAddressRepository(http, authorizedCall),
    paymentRepository: createPaymentRepository(http, authorizedCall),
    paymentSelection: createPaymentSelection(),
    orderRepository: createOrderRepository(http, authorizedCall, localCache),
    profileRepository,
    photoPicker,
    connectionRepository: createConnectionRepository(http),
    dataSync: createDataSync(
      profileRepository,
      favoriteRepository,
      cartRepository,
    ),
    themeRepository: createThemeRepository(storage, profileRepository),
    notificationRepository,
    pushWatcher: createPushWatcher(
      notificationRepository,
      sessionRepository,
      storage,
      localNotifier,
    ),
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
