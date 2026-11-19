import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToastKind } from '../../components';
import { ApiError, NetworkError } from '../../core/network/apiError';
import { formatPrice } from '../../core/format/formatters';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';
import type {
  PaymentMethod,
  PaymentRepository,
  PaymentType,
} from '../../data/payment/paymentRepository';
import type { PaymentSelection } from '../../data/payment/paymentSelection';
import {
  brandOf,
  CARD_NUMBER_MAX,
  EXPIRY_CVV_MAX,
  isValidCardNumber,
  isValidExpiryCvv,
  onlyDigits,
} from './cardInput';

const CASH_CHANGE_FOR = 100;

export type PaymentOption = {
  id: number;
  type: PaymentType;
  label: string;
  hint: string;
};

export type CardField = 'number' | 'holder' | 'expiryCvv';

export type CardForm = Record<CardField, string>;

export type PaymentState = {
  loading: boolean;
  errorMessage: string | null;
  options: PaymentOption[];
  selectedId: number | null;
  card: CardForm;
  cardErrors: Partial<Record<CardField, string>>;
  saving: boolean;
};

type PaymentCallbacks = {
  onMessage: (text: string, kind: ToastKind) => void;
  onSessionExpired: () => void;
  onDone: () => void;
};

const emptyCard: CardForm = { number: '', holder: '', expiryCvv: '' };

const initialState: PaymentState = {
  loading: true,
  errorMessage: null,
  options: [],
  selectedId: null,
  card: emptyCard,
  cardErrors: {},
  saving: false,
};

export function usePaymentViewModel(
  paymentRepository: PaymentRepository,
  paymentSelection: PaymentSelection,
  callbacks: PaymentCallbacks,
) {
  const [state, setState] = useState<PaymentState>(initialState);
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    stateRef.current = state;
    callbacksRef.current = callbacks;
  });

  const load = useCallback(async () => {
    setState(current => ({ ...current, loading: true, errorMessage: null }));
    try {
      const options = (await paymentRepository.list()).map(toOption);
      const currentId = paymentSelection.current()?.methodId;
      const selectedId =
        options.find(option => option.id === currentId)?.id ??
        options.find(option => option.type === 'pix')?.id ??
        options[0]?.id ??
        null;
      setState(current => ({
        ...current,
        loading: false,
        options,
        selectedId,
      }));
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        callbacksRef.current.onSessionExpired();
        return;
      }
      setState(current => ({
        ...current,
        loading: false,
        errorMessage:
          error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar as formas de pagamento.',
      }));
    }
  }, [paymentRepository, paymentSelection]);

  useEffect(() => {
    load();
  }, [load]);

  const select = useCallback((id: number) => {
    setState(current => ({ ...current, selectedId: id, cardErrors: {} }));
  }, []);

  const changeCard = useCallback((field: CardField, value: string) => {
    const next =
      field === 'number'
        ? onlyDigits(value, CARD_NUMBER_MAX)
        : field === 'expiryCvv'
        ? onlyDigits(value, EXPIRY_CVV_MAX)
        : value;
    setState(current => {
      const cardErrors = { ...current.cardErrors };
      delete cardErrors[field];
      return {
        ...current,
        card: { ...current.card, [field]: next },
        cardErrors,
      };
    });
  }, []);

  const finish = useCallback(
    (option: PaymentOption) => {
      paymentSelection.select({
        methodId: option.id,
        type: option.type,
        label: option.label,
        detail: option.hint,
        changeFor: option.type === 'cash' ? CASH_CHANGE_FOR : null,
      });
      callbacksRef.current.onDone();
    },
    [paymentSelection],
  );

  const confirm = useCallback(async () => {
    const { options, selectedId, card, saving } = stateRef.current;
    const option = options.find(item => item.id === selectedId);
    if (!option || saving) {
      return;
    }
    if (!isCardType(option.type) || isBlank(card)) {
      finish(option);
      return;
    }
    const cardErrors = validate(card);
    if (Object.keys(cardErrors).length > 0) {
      setState(current => ({ ...current, cardErrors }));
      return;
    }
    setState(current => ({ ...current, saving: true }));
    try {
      const created = await paymentRepository.createCard({
        type: option.type === 'credit' ? 'credit' : 'debit',
        brand: brandOf(card.number),
        last4: card.number.slice(-4),
      });
      finish(toOption(created));
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        callbacksRef.current.onSessionExpired();
      } else if (error instanceof ApiError || error instanceof NetworkError) {
        callbacksRef.current.onMessage(error.message, 'error');
      }
    } finally {
      setState(current => ({ ...current, saving: false }));
    }
  }, [finish, paymentRepository]);

  const selected = state.options.find(option => option.id === state.selectedId);

  return {
    state,
    showCardForm: selected !== undefined && isCardType(selected.type),
    load,
    select,
    changeCard,
    confirm,
  };
}

function toOption(method: PaymentMethod): PaymentOption {
  return {
    id: method.id,
    type: method.type,
    label: method.label,
    hint:
      method.type === 'cash'
        ? `Troco para ${formatPrice(CASH_CHANGE_FOR)}`
        : method.detail,
  };
}

function isCardType(type: PaymentType): boolean {
  return type === 'credit' || type === 'debit';
}

function isBlank(card: CardForm): boolean {
  return (
    card.number === '' && card.holder.trim() === '' && card.expiryCvv === ''
  );
}

function validate(card: CardForm): Partial<Record<CardField, string>> {
  const errors: Partial<Record<CardField, string>> = {};
  if (!isValidCardNumber(card.number)) {
    errors.number = 'Número do cartão inválido.';
  }
  if (card.holder.trim() === '') {
    errors.holder = 'Informe o nome impresso no cartão.';
  }
  if (!isValidExpiryCvv(card.expiryCvv)) {
    errors.expiryCvv = 'Validade ou CVV inválidos.';
  }
  return errors;
}
