import type { CartRepository } from '../cart/cartRepository';
import type { FavoriteRepository } from '../favorite/favoriteRepository';
import type {
  ProfileRepository,
  UserSettings,
} from '../profile/profileRepository';

export type DataSync = {
  lastSyncedAt(): Date | null;
  subscribe(listener: () => void): () => void;
  syncNow(): Promise<UserSettings>;
  reset(): void;
};

export function createDataSync(
  profile: ProfileRepository,
  favorites: FavoriteRepository,
  cart: CartRepository,
  clock: () => Date = () => new Date(),
): DataSync {
  let syncedAt: Date | null = null;
  const listeners = new Set<() => void>();

  const update = (value: Date | null) => {
    syncedAt = value;
    listeners.forEach(listener => listener());
  };

  return {
    lastSyncedAt: () => syncedAt,
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    syncNow: async () => {
      const [settings] = await Promise.all([
        profile.settings(),
        favorites.list(),
        cart.cart(),
      ]);
      update(clock());
      return settings;
    },
    reset: () => update(null),
  };
}
