import { NetworkError } from '../../src/core/network/apiError';
import type { HttpClient } from '../../src/core/network/httpClient';
import type { AuthorizedCaller } from '../../src/data/auth/authorizedCaller';
import {
  createLocalCache,
  type LocalCache,
} from '../../src/data/cache/localCache';
import type { ProductSummary } from '../../src/data/catalog/catalogApi';
import { createFavoriteRepository } from '../../src/data/favorite/favoriteRepository';
import type { SecureStorage } from '../../src/data/storage/secureStorage';

test('guarda os ids salvos e avisa quem está ouvindo', async () => {
  const request = jest.fn((path: string) =>
    Promise.resolve(
      path.startsWith('/favorites?')
        ? { data: [{ id: 'burger-duplo-cheddar' }] }
        : { productId: 'smash-bacon', isFavorite: true },
    ),
  );
  const call: AuthorizedCaller = action => action('token');
  const repository = createFavoriteRepository(
    { request } as unknown as HttpClient,
    call,
    {
      get: () => Promise.resolve(null),
      put: () => Promise.resolve(),
      remove: () => Promise.resolve(),
    } as unknown as LocalCache,
  );
  const listener = jest.fn();
  repository.subscribe(listener);

  await repository.list();
  await repository.setFavorite('smash-bacon', true);

  expect([...repository.favoriteIds()]).toEqual([
    'burger-duplo-cheddar',
    'smash-bacon',
  ]);
  expect(listener).toHaveBeenCalledTimes(2);
});

test('sem conexão enfileira o favorito e reenvia quando a conexão volta', async () => {
  const values: Record<string, string> = {};
  const storage: SecureStorage = {
    get: key => Promise.resolve(values[key] ?? null),
    put: (key, value) => {
      values[key] = value;
      return Promise.resolve();
    },
    remove: key => {
      delete values[key];
      return Promise.resolve();
    },
  };
  let online = true;
  const request = jest.fn((path: string) => {
    if (!online) {
      return Promise.reject(new NetworkError());
    }
    return Promise.resolve(
      path.startsWith('/favorites?')
        ? { data: [{ id: 'burger-duplo-cheddar' }] }
        : { productId: 'feijoada', isFavorite: true },
    );
  });
  const call: AuthorizedCaller = action => action('token');
  const repository = createFavoriteRepository(
    { request } as unknown as HttpClient,
    call,
    createLocalCache(storage),
    id => Promise.resolve({ id } as ProductSummary),
  );

  await repository.list();
  online = false;
  expect(await repository.setFavorite('feijoada', true)).toBe(true);
  const offline = await repository.list();

  expect(offline.map(product => product.id)).toEqual([
    'burger-duplo-cheddar',
    'feijoada',
  ]);
  expect(repository.favoriteIds().has('feijoada')).toBe(true);

  online = true;
  await repository.syncPending();

  expect(request).toHaveBeenCalledWith('/favorites/feijoada', {
    method: 'PUT',
    accessToken: 'token',
  });
  expect(values.cache_favorites_pending).toBeUndefined();
});
