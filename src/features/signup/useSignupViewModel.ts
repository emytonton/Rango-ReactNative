import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, NetworkError } from '../../core/network/apiError';
import type { AuthRepository } from '../../data/auth/authRepository';
import {
  emptySignupForm,
  validateSignup,
  type SignupErrors,
  type SignupField,
  type SignupForm,
} from './signupValidation';

const fields: SignupField[] = [
  'name',
  'email',
  'phone',
  'password',
  'passwordConfirmation',
];

type SignupCallbacks = {
  onMessage: (text: string, kind: 'success' | 'error') => void;
  onRegistered: () => void;
};

export function useSignupViewModel(
  authRepository: AuthRepository,
  callbacks: SignupCallbacks,
) {
  const [form, setForm] = useState<SignupForm>(emptySignupForm);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState<SignupErrors>({});
  const callbacksRef = useRef(callbacks);
  const mounted = useRef(true);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const errors = useMemo<SignupErrors>(
    () => ({ ...(submitted ? validateSignup(form) : {}), ...serverErrors }),
    [form, submitted, serverErrors],
  );

  const isValid = useCallback(
    (field: SignupField) =>
      submitted && !errors[field] && form[field].length > 0,
    [errors, form, submitted],
  );

  const changeField = useCallback((field: SignupField, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    setServerErrors(current => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const toggleTerms = useCallback(() => setTermsAccepted(value => !value), []);

  const submit = useCallback(async () => {
    if (loading) {
      return;
    }
    setSubmitted(true);
    const hasErrors = Object.keys(validateSignup(form)).length > 0;
    if (!termsAccepted) {
      callbacksRef.current.onMessage(
        'Aceite os termos para continuar.',
        'error',
      );
      return;
    }
    if (hasErrors) {
      return;
    }

    setLoading(true);
    try {
      await authRepository.register(form);
      callbacksRef.current.onMessage('Conta criada com sucesso!', 'success');
      callbacksRef.current.onRegistered();
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors: SignupErrors = {};
        error.details.forEach(detail => {
          const field = fields.find(name => name === detail.field);
          if (field) {
            fieldErrors[field] = detail.message;
          }
        });
        setServerErrors(fieldErrors);
        if (Object.keys(fieldErrors).length === 0) {
          callbacksRef.current.onMessage(error.message, 'error');
        }
      } else if (error instanceof NetworkError) {
        callbacksRef.current.onMessage(error.message, 'error');
      } else {
        throw error;
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [authRepository, form, loading, termsAccepted]);

  return {
    form,
    errors,
    termsAccepted,
    loading,
    isValid,
    changeField,
    toggleTerms,
    submit,
  };
}
