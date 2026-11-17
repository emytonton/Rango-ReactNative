import { ApiError } from '../../core/network/apiError';
import type { SessionRepository } from './sessionRepository';

export class SessionExpiredError extends Error {
  constructor() {
    super('Sua sessão expirou. Entre novamente.');
    this.name = 'SessionExpiredError';
  }
}

export type AuthorizedCaller = <T>(
  request: (accessToken: string) => Promise<T>,
) => Promise<T>;

export function createAuthorizedCaller(
  session: SessionRepository,
): AuthorizedCaller {
  async function renew(): Promise<string> {
    const token = await session.renewAccessToken();
    if (!token) {
      throw new SessionExpiredError();
    }
    return token;
  }

  return async request => {
    const token = session.getAccessToken() ?? (await renew());
    try {
      return await request(token);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return request(await renew());
      }
      throw error;
    }
  };
}
