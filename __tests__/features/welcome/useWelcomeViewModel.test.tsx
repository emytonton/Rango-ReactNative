import ReactTestRenderer from 'react-test-renderer';
import type {
  SessionRepository,
  SessionRestore,
} from '../../../src/data/auth/sessionRepository';
import {
  useWelcomeViewModel,
  type WelcomeUiState,
} from '../../../src/features/welcome/useWelcomeViewModel';

function fakeRepository(result: SessionRestore): SessionRepository {
  return {
    getAccessToken: () => null,
    restore: () => Promise.resolve(result),
    renewAccessToken: () => Promise.resolve(null),
    save: () => Promise.resolve(),
    clear: () => Promise.resolve(),
  };
}

async function renderViewModel(result: SessionRestore) {
  const onSessionRestored = jest.fn();
  const sessionRepository = fakeRepository(result);
  const states: WelcomeUiState[] = [];
  function Harness() {
    states.push(
      useWelcomeViewModel({
        sessionRepository,
        onSessionRestored,
      }),
    );
    return null;
  }
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<Harness />);
  });
  return { states, onSessionRestored };
}

test('sem sessão salva mostra as boas-vindas', async () => {
  const { states, onSessionRestored } = await renderViewModel({ type: 'none' });

  expect(states[0]).toEqual({ status: 'checkingSession' });
  expect(states[states.length - 1]).toEqual({
    status: 'ready',
    savedSessionName: null,
  });
  expect(onSessionRestored).not.toHaveBeenCalled();
});

test('sessão renovada vai direto para a home', async () => {
  const { states, onSessionRestored } = await renderViewModel({
    type: 'restored',
    userName: 'Marina Alves',
  });

  expect(onSessionRestored).toHaveBeenCalledTimes(1);
  expect(states[states.length - 1]).toEqual({ status: 'checkingSession' });
});

test('backend fora do ar entra com a sessão salva', async () => {
  const { onSessionRestored } = await renderViewModel({
    type: 'unreachable',
    userName: 'Marina Alves',
  });

  expect(onSessionRestored).toHaveBeenCalledTimes(1);
});
