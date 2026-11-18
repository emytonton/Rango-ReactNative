import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToastKind } from '../../components';
import { ApiError, NetworkError } from '../../core/network/apiError';
import { apiBaseUrl } from '../../core/network/config';
import type {
  AddressRepository,
  SavedAddress,
} from '../../data/address/addressRepository';
import { SessionExpiredError } from '../../data/auth/authorizedCaller';

const NEW_ADDRESS_LABEL = 'Outro';
const CEP_MAX_LENGTH = 9;
const DISTRICT_SEPARATORS = [' · ', ',', ' - '];

export type AddressItem = {
  id: number;
  label: string;
  line: string;
  cityLine: string;
  mapImageUrl: string | null;
};

export type AddressField = 'cep' | 'street' | 'complement' | 'district';

export type AddressForm = Record<AddressField, string>;

export type AddressState = {
  loading: boolean;
  errorMessage: string | null;
  addresses: AddressItem[];
  selectedId: number | null;
  formOpen: boolean;
  form: AddressForm;
  errors: Partial<Record<AddressField, string>>;
  saving: boolean;
};

type AddressCallbacks = {
  onMessage: (text: string, kind: ToastKind) => void;
  onSessionExpired: () => void;
};

const emptyForm: AddressForm = {
  cep: '',
  street: '',
  complement: '',
  district: '',
};

const initialState: AddressState = {
  loading: true,
  errorMessage: null,
  addresses: [],
  selectedId: null,
  formOpen: false,
  form: emptyForm,
  errors: {},
  saving: false,
};

export function useAddressViewModel(
  addressRepository: AddressRepository,
  callbacks: AddressCallbacks,
) {
  const [state, setState] = useState<AddressState>(initialState);
  const stateRef = useRef(state);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    stateRef.current = state;
    callbacksRef.current = callbacks;
  });

  const applyList = useCallback((list: SavedAddress[]) => {
    setState(current => ({
      ...current,
      loading: false,
      errorMessage: null,
      addresses: list.map(toAddressItem),
      selectedId:
        list.find(address => address.isSelected)?.id ?? current.selectedId,
    }));
  }, []);

  const load = useCallback(async () => {
    setState(current => ({ ...current, loading: true, errorMessage: null }));
    try {
      applyList(await addressRepository.list());
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
            : 'Não foi possível carregar os endereços.',
      }));
    }
  }, [addressRepository, applyList]);

  useEffect(() => {
    load();
  }, [load]);

  const select = useCallback(
    async (addressId: number) => {
      const previous = stateRef.current.selectedId;
      if (previous === addressId) {
        return;
      }
      setState(current => ({ ...current, selectedId: addressId }));
      try {
        await addressRepository.select(addressId);
        callbacksRef.current.onMessage('Endereço atualizado.', 'success');
      } catch (error) {
        if (error instanceof SessionExpiredError) {
          callbacksRef.current.onSessionExpired();
          return;
        }
        setState(current => ({ ...current, selectedId: previous }));
        callbacksRef.current.onMessage(
          'Não foi possível atualizar o endereço.',
          'error',
        );
      }
    },
    [addressRepository],
  );

  const toggleForm = useCallback(() => {
    setState(current => ({ ...current, formOpen: !current.formOpen }));
  }, []);

  const changeField = useCallback((field: AddressField, value: string) => {
    const next =
      field === 'cep'
        ? value.replace(/[^\d-]/g, '').slice(0, CEP_MAX_LENGTH)
        : value;
    setState(current => {
      const errors = { ...current.errors };
      delete errors[field];
      return { ...current, form: { ...current.form, [field]: next }, errors };
    });
  }, []);

  const save = useCallback(async () => {
    const { form, saving } = stateRef.current;
    if (saving) {
      return;
    }
    const [neighborhood, city] = splitDistrict(form.district);
    setState(current => ({ ...current, saving: true }));
    try {
      await addressRepository.create({
        label: NEW_ADDRESS_LABEL,
        cep: form.cep,
        street: form.street.trim(),
        complement: form.complement.trim() || null,
        neighborhood,
        city,
        select: true,
      });
      applyList(await addressRepository.list());
      setState(current => ({
        ...current,
        formOpen: false,
        form: emptyForm,
        errors: {},
      }));
      callbacksRef.current.onMessage(
        'Endereço salvo no dispositivo.',
        'success',
      );
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        callbacksRef.current.onSessionExpired();
      } else if (error instanceof ApiError) {
        const errors = fieldErrors(error);
        if (Object.keys(errors).length === 0) {
          callbacksRef.current.onMessage(error.message, 'error');
        }
        setState(current => ({ ...current, errors }));
      } else if (error instanceof NetworkError) {
        callbacksRef.current.onMessage(error.message, 'error');
      }
    } finally {
      setState(current => ({ ...current, saving: false }));
    }
  }, [addressRepository, applyList]);

  const selected =
    state.addresses.find(address => address.id === state.selectedId) ??
    state.addresses[0];

  return {
    state,
    mapImageUrl: selected?.mapImageUrl ?? null,
    load,
    select,
    toggleForm,
    changeField,
    save,
  };
}

function toAddressItem(address: SavedAddress): AddressItem {
  return {
    id: address.id,
    label: address.label,
    line: address.line,
    cityLine: address.cityLine,
    mapImageUrl: address.mapImageUrl ? apiBaseUrl + address.mapImageUrl : null,
  };
}

function fieldFor(apiField: string): AddressField | null {
  switch (apiField) {
    case 'cep':
    case 'street':
    case 'complement':
      return apiField;
    case 'neighborhood':
    case 'city':
      return 'district';
    default:
      return null;
  }
}

function fieldErrors(error: ApiError): Partial<Record<AddressField, string>> {
  const errors: Partial<Record<AddressField, string>> = {};
  for (const detail of error.details) {
    const field = fieldFor(detail.field);
    if (field && !errors[field]) {
      errors[field] = detail.message;
    }
  }
  return errors;
}

function splitDistrict(value: string): [string, string] {
  const separator = DISTRICT_SEPARATORS.find(item => value.includes(item));
  if (!separator) {
    return [value.trim(), ''];
  }
  const index = value.lastIndexOf(separator);
  return [
    value.slice(0, index).trim(),
    value.slice(index + separator.length).trim(),
  ];
}
