import { isValidEmail } from '../../core/validation/email';

export type ProfileField = 'name' | 'email' | 'phone';

export type EditProfileForm = Record<ProfileField, string>;

export type EditProfileErrors = Partial<Record<ProfileField, string>>;

export const profileFields: ProfileField[] = ['name', 'email', 'phone'];

export function validateProfile(form: EditProfileForm): EditProfileErrors {
  const errors: EditProfileErrors = {};
  if (form.name.trim().length < 3) {
    errors.name = 'Informe seu nome completo.';
  }
  if (!isValidEmail(form.email)) {
    errors.email = 'E-mail inválido.';
  }
  const digits = form.phone.replace(/\D/g, '').length;
  if (digits < 10 || digits > 11) {
    errors.phone = 'Telefone incompleto.';
  }
  return errors;
}
