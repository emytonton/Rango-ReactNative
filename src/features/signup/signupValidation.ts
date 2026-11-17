import { isValidEmail } from '../../core/validation/email';

export type SignupField =
  | 'name'
  | 'email'
  | 'phone'
  | 'password'
  | 'passwordConfirmation';

export type SignupForm = Record<SignupField, string>;

export type SignupErrors = Partial<Record<SignupField, string>>;

export const emptySignupForm: SignupForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirmation: '',
};

export function validateSignup(form: SignupForm): SignupErrors {
  const errors: SignupErrors = {};
  if (form.name.trim().length < 3) {
    errors.name = 'Informe seu nome completo.';
  }
  if (!isValidEmail(form.email)) {
    errors.email = 'E-mail inválido.';
  }
  if (form.phone.replace(/\D/g, '').length < 10) {
    errors.phone = 'Telefone incompleto.';
  }
  if (form.password.length < 6) {
    errors.password = 'Mínimo de 6 caracteres.';
  }
  if (
    !form.passwordConfirmation ||
    form.passwordConfirmation !== form.password
  ) {
    errors.passwordConfirmation = 'As senhas não coincidem.';
  }
  return errors;
}
