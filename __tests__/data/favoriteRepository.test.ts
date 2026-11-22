import type { HttpClient } from '../../src/core/network/httpClient';
import type { AuthorizedCaller } from '../../src/data/auth/authorizedCaller';
import type { LocalCache } from '../../src/data/cache/localCache';
import { createFavoriteRepository } from '../../src/data/favorite/favoriteRepository';

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
