import ReactTestRenderer from 'react-test-renderer';
import type { PhotoPicker } from '../../../src/core/image/photoPicker';
import { ApiError } from '../../../src/core/network/apiError';
import type { User } from '../../../src/data/auth/authApi';
import type { ProfileRepository } from '../../../src/data/profile/profileRepository';
import { useEditProfileViewModel } from '../../../src/features/editprofile/useEditProfileViewModel';

type ViewModel = ReturnType<typeof useEditProfileViewModel>;

const marina: User = {
  id: 1,
  name: 'Marina Alves',
  email: 'marina.alves@email.com',
  phone: '(11) 98876-4410',
  avatarUrl: null,
  createdAt: '2026-11-01T10:00:00.000Z',
} as User;

const photo = { uri: 'file:///foto.jpg', width: 1200, height: 900 };

async function renderViewModel(
  profile: Partial<ProfileRepository> = {},
  picker: Partial<PhotoPicker> = {},
) {
  const profileRepository = {
    me: jest.fn(() => Promise.resolve(marina)),
    update: jest.fn(() => Promise.resolve(marina)),
    uploadAvatar: jest.fn(() =>
      Promise.resolve({ ...marina, avatarUrl: '/uploads/avatars/1-a.jpg' }),
    ),
    removeAvatar: jest.fn(() => Promise.resolve(marina)),
    ...profile,
  } as unknown as ProfileRepository;
  const photoPicker = {
    takePhoto: jest.fn(() =>
      Promise.resolve({ kind: 'picked' as const, photo }),
    ),
    pickFromGallery: jest.fn(() =>
      Promise.resolve({ kind: 'cancelled' as const }),
    ),
    cropSquare: jest.fn(() => Promise.resolve('file:///avatar.jpg')),
    ...picker,
  } as PhotoPicker;
  const callbacks = {
    onMessage: jest.fn(),
    onSaved: jest.fn(),
    onSessionExpired: jest.fn(),
  };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useEditProfileViewModel(
      profileRepository,
      photoPicker,
      callbacks,
    );
    return null;
  }
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<Harness />);
  });
  const viewModel = () => current.value as ViewModel;
  const act = (action: () => unknown) =>
    ReactTestRenderer.act(async () => {
      await action();
    });
  return { viewModel, act, profileRepository, photoPicker, callbacks };
}

test('preenche o formulário com os dados atuais e salva', async () => {
  const { viewModel, act, profileRepository, callbacks } =
    await renderViewModel();

  expect(viewModel().state.form).toEqual({
    name: 'Marina Alves',
    email: 'marina.alves@email.com',
    phone: '(11) 98876-4410',
  });
  expect(viewModel().initials).toBe('MA');

  await act(() => viewModel().changeField('name', '  Marina Souza '));
  await act(() => viewModel().save());

  expect(profileRepository.update).toHaveBeenCalledWith({
    name: 'Marina Souza',
    email: 'marina.alves@email.com',
    phone: '(11) 98876-4410',
  });
  expect(callbacks.onMessage).toHaveBeenCalledWith(
    'Perfil atualizado com sucesso.',
    'success',
  );
  expect(callbacks.onSaved).toHaveBeenCalled();
});

test('não envia com campo inválido e marca o e-mail já cadastrado', async () => {
  const update = jest.fn(() =>
    Promise.reject(
      new ApiError(409, 'EMAIL_IN_USE', 'Este e-mail já está cadastrado.', [
        { field: 'email', message: 'Este e-mail já está cadastrado.' },
      ]),
    ),
  );
  const { viewModel, act, callbacks } = await renderViewModel({ update });

  await act(() => viewModel().changeField('phone', '1199'));
  await act(() => viewModel().save());
  expect(update).not.toHaveBeenCalled();
  expect(viewModel().errors.phone).toBe('Telefone incompleto.');

  await act(() => viewModel().changeField('phone', '(11) 98876-4410'));
  await act(() => viewModel().save());
  expect(viewModel().errors.email).toBe('Este e-mail já está cadastrado.');
  expect(callbacks.onSaved).not.toHaveBeenCalled();

  await act(() => viewModel().changeField('email', 'marina@rango.com'));
  expect(viewModel().errors.email).toBeUndefined();
});

test('tira a foto, recorta e envia o avatar', async () => {
  const { viewModel, act, profileRepository, photoPicker, callbacks } =
    await renderViewModel();

  await act(() => viewModel().openPhoto());
  expect(viewModel().state.photoSheetVisible).toBe(true);

  await act(() => viewModel().takePhoto());
  expect(viewModel().state.photoSheetVisible).toBe(false);
  expect(viewModel().state.cropSource).toEqual(photo);

  const rect = { left: 150, top: 0, size: 900 };
  await act(() => viewModel().confirmCrop(rect));

  expect(photoPicker.cropSquare).toHaveBeenCalledWith(photo, rect);
  expect(profileRepository.uploadAvatar).toHaveBeenCalledWith(
    'file:///avatar.jpg',
  );
  expect(viewModel().state.cropSource).toBeNull();
  expect(viewModel().state.avatarUrl).toMatch(/\/uploads\/avatars\/1-a\.jpg$/);
  expect(callbacks.onMessage).toHaveBeenLastCalledWith(
    'Foto atualizada.',
    'success',
  );
});

test('avisa sem permissão, mostra erro do envio e remove a foto', async () => {
  const uploadAvatar = jest.fn(() =>
    Promise.reject(
      new ApiError(
        415,
        'UNSUPPORTED_IMAGE',
        'Envie uma imagem JPG, PNG ou WEBP.',
      ),
    ),
  );
  const { viewModel, act, profileRepository, callbacks } =
    await renderViewModel(
      { uploadAvatar },
      {
        pickFromGallery: jest.fn(() =>
          Promise.resolve({ kind: 'picked' as const, photo }),
        ),
        takePhoto: jest.fn(() =>
          Promise.resolve({ kind: 'permissionDenied' as const }),
        ),
      },
    );

  await act(() => viewModel().takePhoto());
  expect(callbacks.onMessage).toHaveBeenLastCalledWith(
    'Permita o acesso à câmera para tirar a foto.',
    'warning',
  );

  await act(() => viewModel().pickFromGallery());
  await act(() => viewModel().confirmCrop({ left: 0, top: 0, size: 900 }));
  expect(callbacks.onMessage).toHaveBeenLastCalledWith(
    'Envie uma imagem JPG, PNG ou WEBP.',
    'error',
  );
  expect(viewModel().state.uploadingPhoto).toBe(false);

  await act(() => viewModel().removePhoto());
  expect(profileRepository.removeAvatar).toHaveBeenCalled();
  expect(callbacks.onMessage).toHaveBeenLastCalledWith(
    'Foto removida.',
    'warning',
  );
});
