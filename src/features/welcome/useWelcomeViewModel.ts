import { useEffect, useRef, useState } from 'react';
import type { SessionRepository } from '../../data/auth/sessionRepository';

export type WelcomeUiState =
  | { status: 'checkingSession' }
  | { status: 'ready'; savedSessionName: string | null };

type WelcomeViewModelParams = {
  sessionRepository: SessionRepository;
  onSessionRestored: () => void;
};

export function useWelcomeViewModel({
  sessionRepository,
  onSessionRestored,
}: WelcomeViewModelParams): WelcomeUiState {
  const [state, setState] = useState<WelcomeUiState>({
    status: 'checkingSession',
  });
  const onRestoredRef = useRef(onSessionRestored);
  onRestoredRef.current = onSessionRestored;

  useEffect(() => {
    let active = true;
    sessionRepository.restore().then(result => {
      if (!active) {
        return;
      }
      if (result.type === 'none') {
        setState({ status: 'ready', savedSessionName: null });
      } else {
        onRestoredRef.current();
      }
    });
    return () => {
      active = false;
    };
  }, [sessionRepository]);

  return state;
}
