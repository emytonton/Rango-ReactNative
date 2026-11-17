import type { AuthApi, User } from './authApi';
import type { SessionRepository } from './sessionRepository';

export type SignupData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
};

export type LoginData = {
  email: string;
  password: string;
  keepSignedIn: boolean;
};

export type AuthRepository = {
  login(data: LoginData): Promise<User>;
  register(data: SignupData): Promise<User>;
};

export function createAuthRepository(
  api: AuthApi,
  sessionRepository: SessionRepository,
): AuthRepository {
  return {
    async login(data) {
      const session = await api.login({
        email: data.email.trim(),
        password: data.password,
        keepSignedIn: data.keepSignedIn,
      });
      await sessionRepository.save(session);
      return session.user;
    },
    async register(data) {
      const session = await api.register({
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        password: data.password,
        passwordConfirmation: data.passwordConfirmation,
        acceptTerms: true,
      });
      await sessionRepository.save(session);
      return session.user;
    },
  };
}
