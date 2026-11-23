import { NetworkError } from '../../src/core/network/apiError';
import { createLocalCache } from '../../src/data/cache/localCache';
import type { SecureStorage } from '../../src/data/storage/secureStorage';

function memoryStorage(values: Record<string, string> = {}): SecureStorage {
  return {
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
}

const savedAt = new Date(2026, 10, 22, 13, 40);

test('guarda o valor com a hora de gravação', async () => {
  const cache = createLocalCache(memoryStorage(), () => savedAt);

  await cache.put('home', { sections: ['offers'] });

  expect(await cache.get('home')).toEqual({
    value: { sections: ['offers'] },
    savedAt,
  });
  expect(await cache.get('orders_live')).toBeNull();
});

test('limpar apaga só as chaves do cache', async () => {
  const values: Record<string, string> = { refresh_token: 'abc' };
  const cache = createLocalCache(memoryStorage(values), () => savedAt);

  await cache.put('home', 1);
  await cache.put('favorites', [2]);
  await cache.clear();

  expect(await cache.get('home')).toBeNull();
  expect(await cache.get('favorites')).toBeNull();
  expect(values).toEqual({ refresh_token: 'abc' });
});

test('descarta um valor corrompido', async () => {
  const values: Record<string, string> = {
    cache_home: '{quebrado',
    cache_home_at: String(savedAt.getTime()),
    cache_index: 'home',
  };
  const cache = createLocalCache(memoryStorage(values));

  expect(await cache.get('home')).toBeNull();
  expect(values).toEqual({ cache_index: '' });
});

test('busca salva a resposta e usa a cópia sem conexão', async () => {
  const cache = createLocalCache(memoryStorage(), () => savedAt);

  const online = await cache.fetchOrCached('cart', () =>
    Promise.resolve(['p1']),
  );
  const offline = await cache.fetchOrCached('cart', () =>
    Promise.reject(new NetworkError()),
  );

  expect(online).toEqual(['p1']);
  expect(offline).toEqual(['p1']);
});

test('sem conexão e sem cópia salva repassa o erro', async () => {
  const cache = createLocalCache(memoryStorage(), () => savedAt);

  await expect(
    cache.fetchOrCached('cart', () => Promise.reject(new NetworkError())),
  ).rejects.toBeInstanceOf(NetworkError);
});
