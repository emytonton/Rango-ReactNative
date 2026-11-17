import ReactTestRenderer from 'react-test-renderer';
import { ApiError } from '../../../src/core/network/apiError';
import type { AuthRepository } from '../../../src/data/auth/authRepository';
import { useSignupViewModel } from '../../../src/features/signup/useSignupViewModel';

type ViewModel = ReturnType<typeof useSignupViewModel>;

const filled = {
  name: 'Ana Teste',
  email: 'marina.alves@email.com',
  phone: '11987654321',
  password: 'teste123',
  passwordConfirmation: 'teste123',
} as const;

async function renderViewModel(register: AuthRepository['register']) {
  const onMessage = jest.fn();
  const onRegistered = jest.fn();
  const authRepository: AuthRepository = { register };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useSignupViewModel(authRepository, {
      onMessage,
      onRegistered,
    });
    return null;
  }
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<Harness />);
  });
  const viewModel = () => current.value as ViewModel;
  const act = (action: (vm: ViewModel) => unknown) =>
    ReactTestRenderer.act(async () => {
      await action(viewModel());
    });
  const fill = async () => {
    for (const [field, value] of Object.entries(filled)) {
      await act(vm => vm.changeField(field as keyof typeof filled, value));
    }
  };
  return { viewModel, act, fill, onMessage, onRegistered };
}

test('sem aceitar os termos avisa e não envia', async () => {
  const register = jest.fn();
  const { act, fill, onMessage } = await renderViewModel(register);

  await fill();
  await act(vm => vm.submit());

  expect(onMessage).toHaveBeenCalledWith(
    'Aceite os termos para continuar.',
    'error',
  );
  expect(register).not.toHaveBeenCalled();
});

test('erro de e-mail em uso marca o campo e some ao editar', async () => {
  const register = jest.fn(() =>
    Promise.reject(
      new ApiError(409, 'EMAIL_IN_USE', 'Este e-mail já está cadastrado.', [
        { field: 'email', message: 'Este e-mail já está cadastrado.' },
      ]),
    ),
  );
  const { viewModel, act, fill, onMessage } = await renderViewModel(register);

  await fill();
  await act(vm => vm.toggleTerms());
  await act(vm => vm.submit());

  expect(viewModel().errors.email).toBe('Este e-mail já está cadastrado.');
  expect(viewModel().isValid('name')).toBe(true);
  expect(viewModel().loading).toBe(false);
  expect(onMessage).not.toHaveBeenCalled();

  await act(vm => vm.changeField('email', 'ana@email.com'));
  expect(viewModel().errors.email).toBeUndefined();
});

test('cadastro aceito avisa e segue para a home', async () => {
  const register = jest.fn(() => Promise.resolve({} as never));
  const { act, fill, onMessage, onRegistered } = await renderViewModel(
    register,
  );

  await fill();
  await act(vm => vm.toggleTerms());
  await act(vm => vm.submit());

  expect(register).toHaveBeenCalledWith(filled);
  expect(onMessage).toHaveBeenCalledWith(
    'Conta criada com sucesso!',
    'success',
  );
  expect(onRegistered).toHaveBeenCalledTimes(1);
});
