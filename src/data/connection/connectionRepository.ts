import type { HttpClient } from '../../core/network/httpClient';

export type ConnectionRepository = {
  isOnline(): Promise<boolean>;
};

export function createConnectionRepository(
  http: HttpClient,
): ConnectionRepository {
  return {
    isOnline: () =>
      http
        .request<{ status: string }>('/health')
        .then(health => health.status === 'ok')
        .catch(() => false),
  };
}
