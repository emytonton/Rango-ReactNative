import { NetworkError } from '../../src/core/network/apiError';
import type { AuthApi } from '../../src/data/auth/authApi';
import { createSessionRepository } from '../../src/data/auth/sessionRepository';
import type { SecureStorage } from '../../src/data/storage/secureStorage';

test('sair revoga o refresh token e limpa a sessão mesmo sem rede', async () => {
  const values = new Map([['refresh_token', 'abc']]);
  const storage = {
    get: (key: string) => Promise.resolve(values.get(key) ?? null),
    put: (key: string, value: string) => {
      values.set(key, value);
      return Promise.resolve();
    },
    remove: (key: string) => {
      values.delete(key);
      return Promise.resolve();
    },
  } as SecureStorage;
  const logout = jest.fn(() => Promise.reject(new NetworkError()));
  const repository = createSessionRepository(
    { logout } as unknown as AuthApi,
    storage,
  );

  await repository.logout();

  expect(logout).toHaveBeenCalledWith('abc');
  expect(values.size).toBe(0);
});
