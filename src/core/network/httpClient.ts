import { ApiError, NetworkError, toApiError } from './apiError';
import { apiBaseUrl } from './config';

const REQUEST_TIMEOUT_MS = 15_000;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  accessToken?: string | null;
};

export type HttpClient = {
  request<T>(path: string, options?: RequestOptions): Promise<T>;
};

export function createHttpClient(baseUrl: string = apiBaseUrl): HttpClient {
  return {
    async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json';
      }
      if (options.accessToken) {
        headers.Authorization = `Bearer ${options.accessToken}`;
      }
      let response: Response;
      try {
        response = await fetch(`${baseUrl}${path}`, {
          method: options.method ?? 'GET',
          headers,
          body:
            options.body === undefined
              ? undefined
              : JSON.stringify(options.body),
          signal: controller.signal,
        });
      } catch (error) {
        throw new NetworkError(error);
      } finally {
        clearTimeout(timeout);
      }
      if (!response.ok) {
        throw await toApiError(response);
      }
      if (response.status === 204) {
        return undefined as T;
      }
      try {
        return (await response.json()) as T;
      } catch {
        throw new ApiError(
          response.status,
          'INVALID_RESPONSE',
          'Resposta inválida do servidor.',
        );
      }
    },
  };
}
