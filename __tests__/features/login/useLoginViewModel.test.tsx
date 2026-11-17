import ReactTestRenderer from 'react-test-renderer';
import { ApiError } from '../../../src/core/network/apiError';
import type { AuthRepository } from '../../../src/data/auth/authRepository';
import { useLoginViewModel } from '../../../src/features/login/useLoginViewModel';

type ViewModel = ReturnType<typeof useLoginViewModel>;

async function renderViewModel(login: AuthRepository['login']) {
  const onMessage = jest.fn();
  const onLoggedIn = jest.fn();
  const authRepository: AuthRepository = { login, register: jest.fn() };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useLoginViewModel(authRepository, {
      onMessage,
      onLoggedIn,
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
  return { viewModel, act, onMessage, onLoggedIn };
}

afterEach(() => jest.useRealTimers());

test('valida os campos antes de enviar', async () => {
  const login = jest.fn();
  const { viewModel, act } = await renderViewModel(login);

  await act(vm => vm.submit());
  expect(viewModel().errors).toEqual({
    email: 'Informe seu e-mail.',
    password: 'Informe sua senha.',
  });

  await act(vm => vm.changeEmail('marina.alves'));
  await act(vm => vm.changePassword('rango123'));
  await act(vm => vm.submit());
  expect(viewModel().errors.email).toBe('E-mail inválido.');
  expect(viewModel().errors.password).toBeUndefined();
  expect(login).not.toHaveBeenCalled();
});

test('credenciais inválidas marcam a senha', async () => {
  const login = jest.fn(() =>
    Promise.reject(
      new ApiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.'),
    ),
  );
  const { viewModel, act, onMessage } = await renderViewModel(login);

  await act(vm => vm.changeEmail('marina.alves@email.com'));
  await act(vm => vm.changePassword('errada'));
  await act(vm => vm.submit());

  expect(viewModel().errors.password).toBe('Senha incorreta. Tente novamente.');
  expect(viewModel().loading).toBe(false);
  expect(onMessage).not.toHaveBeenCalled();
});

test('login aceito envia manter conectado e segue para a home', async () => {
  jest.useFakeTimers();
  const login = jest.fn(() => Promise.resolve({} as never));
  const { viewModel, act, onLoggedIn } = await renderViewModel(login);

  await act(vm => vm.changeEmail(' marina.alves@email.com '));
  await act(vm => vm.changePassword('rango123'));
  await act(vm => vm.toggleKeepSignedIn());
  await act(vm => vm.submit());

  expect(login).toHaveBeenCalledWith({
    email: ' marina.alves@email.com ',
    password: 'rango123',
    keepSignedIn: false,
  });
  expect(viewModel().success).toBe(true);
  expect(onLoggedIn).not.toHaveBeenCalled();

  await act(() => jest.advanceTimersByTime(700));
  expect(onLoggedIn).toHaveBeenCalledTimes(1);
});
