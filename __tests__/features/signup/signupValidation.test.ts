import {
  emptySignupForm,
  validateSignup,
} from '../../../src/features/signup/signupValidation';

const validForm = {
  name: 'Ana Teste',
  email: 'ana@email.com',
  phone: '(11) 98765-4321',
  password: 'teste123',
  passwordConfirmation: 'teste123',
};

test('formulário vazio marca todos os campos', () => {
  expect(validateSignup(emptySignupForm)).toEqual({
    name: 'Informe seu nome completo.',
    email: 'E-mail inválido.',
    phone: 'Telefone incompleto.',
    password: 'Mínimo de 6 caracteres.',
    passwordConfirmation: 'As senhas não coincidem.',
  });
});

test('formulário preenchido não tem erros', () => {
  expect(validateSignup(validForm)).toEqual({});
});

test('telefone conta só os dígitos e confirmação precisa ser igual', () => {
  expect(
    validateSignup({
      ...validForm,
      phone: '(11) 9876-54',
      passwordConfirmation: 'teste124',
    }),
  ).toEqual({
    phone: 'Telefone incompleto.',
    passwordConfirmation: 'As senhas não coincidem.',
  });
});
