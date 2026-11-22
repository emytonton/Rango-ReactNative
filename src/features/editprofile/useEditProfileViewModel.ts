import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ToastKind } from '../../components';
import { initialsOf } from '../../core/format/formatters';
import type {
  PhotoPicker,
  PhotoPickResult,
  PickedPhoto,
} from '../../core/image/photoPicker';
import type { CropRect } from '../../core/image/squareCrop';
import { ApiError, NetworkError } from '../../core/network/apiError';
import { apiBaseUrl } from '../../core/network/config';
import type { User } from '../../data/auth/authApi';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type { ProfileRepository } from '../../data/profile/profileRepository';
import {
  profileFields,
  validateProfile,
  type EditProfileErrors,
  type EditProfileForm,
  type ProfileField,
} from './editProfileForm';

export type EditProfileState = {
  loading: boolean;
  loaded: boolean;
  errorMessage: string | null;
  form: EditProfileForm;
  submitted: boolean;
  saving: boolean;
  serverErrors: EditProfileErrors;
  avatarUrl: string | null;
  photoSheetVisible: boolean;
  cropSource: PickedPhoto | null;
  uploadingPhoto: boolean;
};

type EditProfileCallbacks = {
  onMessage: (text: string, kind: ToastKind) => void;
  onSaved: () => void;
  onSessionExpired: () => void;
};

const initialState: EditProfileState = {
  loading: true,
  loaded: false,
  errorMessage: null,
  form: { name: '', email: '', phone: '' },
  submitted: false,
  saving: false,
  serverErrors: {},
  avatarUrl: null,
  photoSheetVisible: false,
  cropSource: null,
  uploadingPhoto: false,
};

function avatarOf(user: User): string | null {
  return user.avatarUrl ? apiBaseUrl + user.avatarUrl : null;
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError || error instanceof NetworkError
    ? error.message
    : fallback;
}

export function useEditProfileViewModel(
  profile: ProfileRepository,
  photoPicker: PhotoPicker,
  callbacks: EditProfileCallbacks,
) {
  const [state, setState] = useState<EditProfileState>(initialState);
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);
  const busy = useRef({ saving: false, photo: false });

  useEffect(() => {
    stateRef.current = state;
    callbacksRef.current = callbacks;
  });

  const errors = useMemo<EditProfileErrors>(
    () => ({
      ...(state.submitted ? validateProfile(state.form) : {}),
      ...state.serverErrors,
    }),
    [state.form, state.submitted, state.serverErrors],
  );

  const initials = initialsOf(state.form.name);

  const toast = (text: string, kind: ToastKind) =>
    callbacksRef.current.onMessage(text, kind);

  const handleSessionError = (error: unknown): boolean => {
    if (error instanceof SessionExpiredError) {
      callbacksRef.current.onSessionExpired();
      return true;
    }
    return false;
  };

  const load = useCallback(async () => {
    setState(current => ({ ...current, loading: true, errorMessage: null }));
    try {
      const user = await profile.me();
      setState(current => ({
        ...current,
        loading: false,
        loaded: true,
        form: { name: user.name, email: user.email, phone: user.phone ?? '' },
        avatarUrl: avatarOf(user),
      }));
    } catch (error) {
      if (handleSessionError(error)) {
        return;
      }
      setState(current => ({
        ...current,
        loading: false,
        errorMessage: messageOf(error, 'Não foi possível carregar o perfil.'),
      }));
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const changeField = useCallback((field: ProfileField, value: string) => {
    setState(current => {
      const serverErrors = { ...current.serverErrors };
      delete serverErrors[field];
      return {
        ...current,
        form: { ...current.form, [field]: value },
        serverErrors,
      };
    });
  }, []);

  const save = useCallback(async () => {
    const current = stateRef.current;
    if (!current.loaded || busy.current.saving) {
      return;
    }
    setState(value => ({ ...value, submitted: true }));
    if (Object.keys(validateProfile(current.form)).length > 0) {
      return;
    }
    busy.current.saving = true;
    setState(value => ({ ...value, saving: true }));
    try {
      await profile.update({
        name: current.form.name.trim(),
        email: current.form.email.trim(),
        phone: current.form.phone.trim(),
      });
      toast('Perfil atualizado com sucesso.', 'success');
      callbacksRef.current.onSaved();
    } catch (error) {
      if (handleSessionError(error)) {
        return;
      }
      const fieldErrors: EditProfileErrors = {};
      if (error instanceof ApiError) {
        error.details.forEach(detail => {
          const field = profileFields.find(name => name === detail.field);
          if (field) {
            fieldErrors[field] = detail.message;
          }
        });
      }
      setState(value => ({ ...value, serverErrors: fieldErrors }));
      if (Object.keys(fieldErrors).length === 0) {
        toast(messageOf(error, 'Não foi possível salvar o perfil.'), 'error');
      }
    } finally {
      busy.current.saving = false;
      setState(value => ({ ...value, saving: false }));
    }
  }, [profile]);

  const openPhoto = useCallback(() => {
    const current = stateRef.current;
    if (current.loaded && !busy.current.photo) {
      setState(value => ({ ...value, photoSheetVisible: true }));
    }
  }, []);

  const closePhoto = useCallback(() => {
    setState(value => ({ ...value, photoSheetVisible: false }));
  }, []);

  const handlePick = useCallback(
    (result: PhotoPickResult, deniedMessage: string) => {
      if (result.kind === 'picked') {
        setState(value => ({ ...value, cropSource: result.photo }));
      } else if (result.kind === 'permissionDenied') {
        toast(deniedMessage, 'warning');
      } else if (result.kind === 'failed') {
        toast('Não foi possível ler a imagem.', 'error');
      }
    },
    [],
  );

  const takePhoto = useCallback(async () => {
    closePhoto();
    handlePick(
      await photoPicker.takePhoto(),
      'Permita o acesso à câmera para tirar a foto.',
    );
  }, [photoPicker, closePhoto, handlePick]);

  const pickFromGallery = useCallback(async () => {
    closePhoto();
    handlePick(
      await photoPicker.pickFromGallery(),
      'Permita o acesso à galeria para escolher a foto.',
    );
  }, [photoPicker, closePhoto, handlePick]);

  const updateAvatar = useCallback(
    async (
      request: () => Promise<User>,
      successMessage: string,
      kind: ToastKind,
    ) => {
      if (busy.current.photo) {
        return;
      }
      busy.current.photo = true;
      setState(value => ({ ...value, uploadingPhoto: true }));
      try {
        const user = await request();
        setState(value => ({ ...value, avatarUrl: avatarOf(user) }));
        toast(successMessage, kind);
      } catch (error) {
        if (!handleSessionError(error)) {
          toast(messageOf(error, 'Não foi possível ler a imagem.'), 'error');
        }
      } finally {
        busy.current.photo = false;
        setState(value => ({ ...value, uploadingPhoto: false }));
      }
    },
    [],
  );

  const removePhoto = useCallback(() => {
    closePhoto();
    updateAvatar(() => profile.removeAvatar(), 'Foto removida.', 'warning');
  }, [profile, closePhoto, updateAvatar]);

  const cancelCrop = useCallback(() => {
    setState(value => ({ ...value, cropSource: null }));
  }, []);

  const confirmCrop = useCallback(
    (rect: CropRect) => {
      const source = stateRef.current.cropSource;
      if (!source) {
        return;
      }
      setState(value => ({ ...value, cropSource: null }));
      updateAvatar(
        async () =>
          profile.uploadAvatar(await photoPicker.cropSquare(source, rect)),
        'Foto atualizada.',
        'success',
      );
    },
    [profile, photoPicker, updateAvatar],
  );

  return {
    state,
    errors,
    initials,
    retry: load,
    changeField,
    save,
    openPhoto,
    closePhoto,
    takePhoto,
    pickFromGallery,
    removePhoto,
    cancelCrop,
    confirmCrop,
  };
}
