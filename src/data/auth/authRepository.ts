import type { AuthApi, User } from './authApi';
import type { SessionRepository } from './sessionRepository';

export type SignupData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
};

export type AuthRepository = {
  register(data: SignupData): Promise<User>;
};

export function createAuthRepository(
  api: AuthApi,
  sessionRepository: SessionRepository,
): AuthRepository {
  return {
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
