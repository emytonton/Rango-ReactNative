import type { HttpClient } from '../../core/network/httpClient';

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type AuthSession = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  tokenType: 'Bearer';
  user: User;
};

export type RegisterRequest = {
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
  acceptTerms: true;
};

export type AuthApi = {
  register(request: RegisterRequest): Promise<AuthSession>;
  refresh(refreshToken: string): Promise<AuthSession>;
  logout(refreshToken: string): Promise<void>;
};

export function createAuthApi(http: HttpClient): AuthApi {
  return {
    register: request =>
      http.request<AuthSession>('/auth/register', {
        method: 'POST',
        body: request,
      }),
    refresh: refreshToken =>
      http.request<AuthSession>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
      }),
    logout: refreshToken =>
      http.request<void>('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
      }),
  };
}
