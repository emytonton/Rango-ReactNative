import { ApiError } from '../../src/core/network/apiError';
import {
  createAuthorizedCaller,
  SessionExpiredError,
} from '../../src/data/auth/authorizedCaller';
import type { SessionRepository } from '../../src/data/auth/sessionRepository';

function fakeSession(
  token: string | null,
  renewed: string | null,
): SessionRepository {
  return {
    getAccessToken: () => token,
    renewAccessToken: jest.fn(() => Promise.resolve(renewed)),
    restore: jest.fn(),
    save: jest.fn(),
    clear: jest.fn(),
    logout: jest.fn(),
  };
}

const expired = new ApiError(401, 'TOKEN_EXPIRED', 'Token expirado.');

test('usa o token atual quando ele ainda vale', async () => {
  const session = fakeSession('atual', 'novo');
  const call = createAuthorizedCaller(session);

  await expect(call(token => Promise.resolve(token))).resolves.toBe('atual');
  expect(session.renewAccessToken).not.toHaveBeenCalled();
});

test('renova o token expirado e repete a requisição', async () => {
  const session = fakeSession('velho', 'novo');
  const call = createAuthorizedCaller(session);
  const request = jest.fn((token: string) =>
    token === 'velho' ? Promise.reject(expired) : Promise.resolve(token),
  );

  await expect(call(request)).resolves.toBe('novo');
  expect(request).toHaveBeenCalledTimes(2);
});

test('avisa que a sessão expirou quando não consegue renovar', async () => {
  const call = createAuthorizedCaller(fakeSession('velho', null));

  await expect(call(() => Promise.reject(expired))).rejects.toBeInstanceOf(
    SessionExpiredError,
  );
});
