import type { CartRepository } from '../../src/data/cart/cartRepository';
import type { FavoriteRepository } from '../../src/data/favorite/favoriteRepository';
import type { ProfileRepository } from '../../src/data/profile/profileRepository';
import { createDataSync } from '../../src/data/sync/dataSync';

test('busca tudo, guarda o horário e zera ao limpar', async () => {
  const at = new Date('2026-11-21T14:00:00Z');
  const profile = {
    settings: jest.fn(() => Promise.resolve({ theme: 'light' })),
  } as unknown as ProfileRepository;
  const favorites = {
    list: jest.fn(() => Promise.resolve([])),
  } as unknown as FavoriteRepository;
  const cart = {
    cart: jest.fn(() => Promise.resolve({})),
  } as unknown as CartRepository;
  const sync = createDataSync(profile, favorites, cart, () => at);
  const listener = jest.fn();
  sync.subscribe(listener);

  expect((await sync.syncNow()).theme).toBe('light');
  expect(favorites.list).toHaveBeenCalled();
  expect(cart.cart).toHaveBeenCalled();
  expect(sync.lastSyncedAt()).toBe(at);

  sync.reset();
  expect(sync.lastSyncedAt()).toBeNull();
  expect(listener).toHaveBeenCalledTimes(2);
});
