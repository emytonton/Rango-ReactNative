import ReactTestRenderer from 'react-test-renderer';
import { ApiError } from '../../../src/core/network/apiError';
import type {
  PaymentMethod,
  PaymentRepository,
} from '../../../src/data/payment/paymentRepository';
import { createPaymentSelection } from '../../../src/data/payment/paymentSelection';
import {
  brandOf,
  formatCardNumber,
  formatExpiryCvv,
  isValidCardNumber,
} from '../../../src/features/payment/cardInput';
import { usePaymentViewModel } from '../../../src/features/payment/usePaymentViewModel';

type ViewModel = ReturnType<typeof usePaymentViewModel>;

const methods: PaymentMethod[] = [
  {
    id: 1,
    type: 'pix',
    label: 'PIX',
    detail: 'Aprovação imediata',
    brand: null,
    last4: null,
  },
  {
    id: 2,
    type: 'credit',
    label: 'Cartão de crédito',
    detail: 'Visa •••• 4410',
    brand: 'Visa',
    last4: '4410',
  },
  {
    id: 4,
    type: 'cash',
    label: 'Dinheiro',
    detail: 'Pagamento na entrega',
    brand: null,
    last4: null,
  },
];

async function renderViewModel(repository: Partial<PaymentRepository> = {}) {
  const callbacks = {
    onMessage: jest.fn(),
    onSessionExpired: jest.fn(),
    onDone: jest.fn(),
  };
  const paymentSelection = createPaymentSelection();
  const paymentRepository: PaymentRepository = {
    list: jest.fn(() => Promise.resolve(methods)),
    createCard: jest.fn(card =>
      Promise.resolve({
        id: 9,
        type: card.type,
        label: 'Cartão de crédito',
        detail: `${card.brand} •••• ${card.last4}`,
        brand: card.brand,
        last4: card.last4,
      }),
    ),
    ...repository,
  };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = usePaymentViewModel(
      paymentRepository,
      paymentSelection,
      callbacks,
    );
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
  return { viewModel, act, callbacks, paymentSelection, paymentRepository };
}

test('carrega as formas com PIX selecionado e o troco no dinheiro', async () => {
  const { viewModel } = await renderViewModel();

  expect(viewModel().state.selectedId).toBe(1);
  expect(viewModel().state.options[2].hint).toBe('Troco para R$ 100,00');
  expect(viewModel().showCardForm).toBe(false);
});

test('dinheiro confirma com troco para 100', async () => {
  const { act, callbacks, paymentSelection } = await renderViewModel();

  await act(vm => vm.select(4));
  await act(vm => vm.confirm());

  expect(paymentSelection.current()).toMatchObject({
    methodId: 4,
    type: 'cash',
    changeFor: 100,
  });
  expect(callbacks.onDone).toHaveBeenCalled();
});

test('cartão sem dados novos usa o cartão salvo', async () => {
  const { viewModel, act, paymentSelection, paymentRepository } =
    await renderViewModel();

  await act(vm => vm.select(2));
  expect(viewModel().showCardForm).toBe(true);
  await act(vm => vm.confirm());

  expect(paymentRepository.createCard).not.toHaveBeenCalled();
  expect(paymentSelection.current()?.methodId).toBe(2);
});

test('cartão inválido mostra os erros por campo', async () => {
  const { viewModel, act, callbacks } = await renderViewModel();

  await act(vm => vm.select(2));
  await act(vm => vm.changeCard('number', '4111 1111 1111 1112'));
  await act(vm => vm.confirm());

  expect(viewModel().state.cardErrors).toEqual({
    number: 'Número do cartão inválido.',
    holder: 'Informe o nome impresso no cartão.',
    expiryCvv: 'Validade ou CVV inválidos.',
  });
  expect(callbacks.onDone).not.toHaveBeenCalled();

  await act(vm => vm.changeCard('holder', 'MARINA ALVES'));
  expect(viewModel().state.cardErrors.holder).toBeUndefined();
});

test('cartão novo válido envia só bandeira e 4 últimos dígitos', async () => {
  const { act, paymentRepository, paymentSelection } = await renderViewModel();

  await act(vm => vm.select(2));
  await act(vm => vm.changeCard('number', '4111 1111 1111 1111'));
  await act(vm => vm.changeCard('holder', 'MARINA ALVES'));
  await act(vm => vm.changeCard('expiryCvv', '12/30 123'));
  await act(vm => vm.confirm());

  expect(paymentRepository.createCard).toHaveBeenCalledWith({
    type: 'credit',
    brand: 'Visa',
    last4: '1111',
  });
  expect(paymentSelection.current()).toMatchObject({
    methodId: 9,
    detail: 'Visa •••• 1111',
  });
});

test('erro ao salvar o cartão avisa e não sai da tela', async () => {
  const { act, callbacks } = await renderViewModel({
    createCard: () =>
      Promise.reject(
        new ApiError(400, 'VALIDATION_ERROR', 'Informe a bandeira do cartão.'),
      ),
  });

  await act(vm => vm.select(2));
  await act(vm => vm.changeCard('number', '4111111111111111'));
  await act(vm => vm.changeCard('holder', 'MARINA ALVES'));
  await act(vm => vm.changeCard('expiryCvv', '1230123'));
  await act(vm => vm.confirm());

  expect(callbacks.onMessage).toHaveBeenCalledWith(
    'Informe a bandeira do cartão.',
    'error',
  );
  expect(callbacks.onDone).not.toHaveBeenCalled();
});

test('máscaras e regras do cartão', () => {
  expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
  expect(formatExpiryCvv('1230123')).toBe('12/30 123');
  expect(brandOf('5500000000000004')).toBe('Mastercard');
  expect(brandOf('6362970000457013')).toBe('Elo');
  expect(isValidCardNumber('4111111111111111')).toBe(true);
  expect(isValidCardNumber('4111111111111112')).toBe(false);
});
