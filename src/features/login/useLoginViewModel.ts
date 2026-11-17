import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToastKind } from '../../components';
import { ApiError, NetworkError } from '../../core/network/apiError';
import { isValidEmail } from '../../core/validation/email';
import type { AuthRepository } from '../../data/auth/authRepository';

const SUCCESS_DELAY_MS = 700;

type LoginErrors = { email?: string; password?: string };

type LoginCallbacks = {
  onMessage: (text: string, kind: ToastKind) => void;
  onLoggedIn: () => void;
};

export function useLoginViewModel(
  authRepository: AuthRepository,
  callbacks: LoginCallbacks,
) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const callbacksRef = useRef(callbacks);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const changeEmail = useCallback((value: string) => {
    setEmail(value);
    setErrors(current => ({ ...current, email: undefined }));
  }, []);

  const changePassword = useCallback((value: string) => {
    setPassword(value);
    setErrors(current => ({ ...current, password: undefined }));
  }, []);

  const togglePasswordVisible = useCallback(
    () => setPasswordVisible(value => !value),
    [],
  );

  const toggleKeepSignedIn = useCallback(
    () => setKeepSignedIn(value => !value),
    [],
  );

  const forgotPassword = useCallback(() => {
    callbacksRef.current.onMessage(
      'Recuperação de senha indisponível no momento.',
      'warning',
    );
  }, []);

  const submit = useCallback(async () => {
    if (loading || success) {
      return;
    }
    const validation: LoginErrors = {
      email: !email.trim()
        ? 'Informe seu e-mail.'
        : !isValidEmail(email.trim())
        ? 'E-mail inválido.'
        : undefined,
      password: !password ? 'Informe sua senha.' : undefined,
    };
    if (validation.email || validation.password) {
      setErrors(validation);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await authRepository.login({ email, password, keepSignedIn });
      setLoading(false);
      setSuccess(true);
      timer.current = setTimeout(
        () => callbacksRef.current.onLoggedIn(),
        SUCCESS_DELAY_MS,
      );
    } catch (error) {
      setLoading(false);
      if (error instanceof ApiError) {
        handleApiError(error);
      } else if (error instanceof NetworkError) {
        callbacksRef.current.onMessage(error.message, 'error');
      } else {
        throw error;
      }
    }
  }, [authRepository, email, password, keepSignedIn, loading, success]);

  function handleApiError(error: ApiError) {
    if (error.code === 'INVALID_CREDENTIALS') {
      setErrors({ password: 'Senha incorreta. Tente novamente.' });
      return;
    }
    const fieldError = (field: string) =>
      error.details.find(detail => detail.field === field)?.message;
    const serverErrors = {
      email: fieldError('email'),
      password: fieldError('password'),
    };
    if (serverErrors.email || serverErrors.password) {
      setErrors(serverErrors);
    } else {
      callbacksRef.current.onMessage(error.message, 'error');
    }
  }

  return {
    email,
    password,
    passwordVisible,
    keepSignedIn,
    errors,
    loading,
    success,
    changeEmail,
    changePassword,
    togglePasswordVisible,
    toggleKeepSignedIn,
    forgotPassword,
    submit,
  };
}
