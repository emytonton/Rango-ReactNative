import { NetworkError } from '../../src/core/network/apiError';
import type { ProfileRepository } from '../../src/data/profile/profileRepository';
import type { SecureStorage } from '../../src/data/storage/secureStorage';
import { createThemeRepository } from '../../src/data/theme/themeRepository';
import { isPreviewActive } from '../../src/features/theme/useThemeViewModel';

function memoryStorage(initial: Record<string, string> = {}): SecureStorage {
  const values = { ...initial };
  return {
    get: key => Promise.resolve(values[key] ?? null),
    put: (key, value) => {
      values[key] = value;
      return Promise.resolve();
    },
    remove: key => {
      delete values[key];
      return Promise.resolve();
    },
  };
}

test('carrega o tema salvo e envia a escolha ao backend', async () => {
  const updateTheme = jest.fn(() => Promise.resolve({}));
  const storage = memoryStorage({ theme: 'dark' });
  const repository = createThemeRepository(storage, {
    updateTheme,
  } as unknown as ProfileRepository);
  const listener = jest.fn();
  repository.subscribe(listener);

  await repository.load();
  expect(repository.current()).toBe('dark');

  expect(await repository.select('light')).toBe(true);
  expect(updateTheme).toHaveBeenCalledWith('light');
  expect(await storage.get('theme')).toBe('light');
  expect(await storage.get('theme_pending')).toBeNull();
  expect(listener).toHaveBeenCalledTimes(2);
});

test('sem rede guarda a escolha pendente e ignora o tema do backend', async () => {
  let online = false;
  const updateTheme = jest.fn(() =>
    online ? Promise.resolve({}) : Promise.reject(new NetworkError()),
  );
  const storage = memoryStorage();
  const repository = createThemeRepository(storage, {
    updateTheme,
  } as unknown as ProfileRepository);

  expect(await repository.select('dark')).toBe(false);
  expect(await storage.get('theme_pending')).toBe('dark');

  await repository.onRemote('light');
  expect(repository.current()).toBe('dark');

  online = true;
  expect(await repository.pushPending()).toBe(true);
  await repository.onRemote('light');
  expect(repository.current()).toBe('light');
});

test('destaca a pré-visualização do tema ativo', () => {
  expect(isPreviewActive('light', false, true)).toBe(true);
  expect(isPreviewActive('dark', false, false)).toBe(false);
  expect(isPreviewActive('system', true, true)).toBe(true);
  expect(isPreviewActive('system', true, false)).toBe(false);
});
