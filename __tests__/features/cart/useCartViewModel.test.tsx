import ReactTestRenderer from 'react-test-renderer';
import { ApiError } from '../../../src/core/network/apiError';
import type {
  Cart,
  CartRepository,
} from '../../../src/data/cart/cartRepository';
import { useCartViewModel } from '../../../src/features/cart/useCartViewModel';

type ViewModel = ReturnType<typeof useCartViewModel>;

function cartWith(quantity: number, discount = 0): Cart {
  const subtotal = 38.9 * quantity;
  const deliveryFee = subtotal >= 60 ? 0 : 7.9;
  return {
    items: [
      {
        id: 7,
        product: {
          id: 'p1',
          name: 'Burger duplo cheddar',
          restaurant: 'Casa do Burger',
          imageUrl: null,
          imageHue: 48,
        },
        quantity,
        addons: [{ id: 'a1', name: 'Bacon extra', price: 4 }],
        notes: 'sem cebola',
        unitPrice: 38.9,
        total: subtotal,
      },
    ],
    coupon: discount
      ? {
          code: 'RANGO10',
          description: '10% de desconto no subtotal',
          percentOff: 10,
          minSubtotal: 0,
          applied: true,
        }
      : null,
    summary: {
      itemCount: quantity,
      subtotal,
      deliveryFee,
      discount,
      total: subtotal + deliveryFee - discount,
      freeDeliveryThreshold: 60,
    },
  };
}

const emptyCart: Cart = {
  items: [],
  coupon: null,
  summary: {
    itemCount: 0,
    subtotal: 0,
    deliveryFee: 0,
    discount: 0,
    total: 0,
    freeDeliveryThreshold: 60,
  },
};

async function renderViewModel(cart: Partial<CartRepository> = {}) {
  const onMessage = jest.fn();
  const cartRepository: CartRepository = {
    addItem: jest.fn(),
    cart: jest.fn(() => Promise.resolve(cartWith(1))),
    updateQuantity: jest.fn((_id: number, quantity: number) =>
      Promise.resolve(cartWith(quantity)),
    ),
    removeItem: jest.fn(() => Promise.resolve(emptyCart)),
    clear: jest.fn(() => Promise.resolve(emptyCart)),
    applyCoupon: jest.fn(() => Promise.resolve(cartWith(1, 3.89))),
    ...cart,
  };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useCartViewModel(cartRepository, {
      onMessage,
      onSessionExpired: jest.fn(),
    });
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
  return { viewModel, act, onMessage, cartRepository };
}

test('carrega linhas e resumo com taxa de entrega', async () => {
  const { viewModel } = await renderViewModel();
  const { state } = viewModel();

  expect(state.lines[0]).toMatchObject({
    name: 'Burger duplo cheddar',
    unitPrice: 'R$ 38,90',
    addons: 'Bacon extra',
    notes: 'sem cebola',
  });
  expect(state.summary).toEqual([
    { label: 'Subtotal', value: 'R$ 38,90' },
    { label: 'Taxa de entrega', value: 'R$ 7,90', highlight: false },
  ]);
  expect(state.total).toBe('R$ 46,80');
});

test('aumentar atualiza a quantidade e libera a entrega grátis', async () => {
  const { viewModel, act, cartRepository } = await renderViewModel();

  await act(vm => vm.increase(7));

  expect(cartRepository.updateQuantity).toHaveBeenCalledWith(7, 2);
  expect(viewModel().state.summary[1]).toEqual({
    label: 'Taxa de entrega',
    value: 'Grátis',
    highlight: true,
  });
});

test('diminuir com uma unidade remove a linha', async () => {
  const { viewModel, act, cartRepository } = await renderViewModel();

  await act(vm => vm.decrease(7));

  expect(cartRepository.removeItem).toHaveBeenCalledWith(7);
  expect(viewModel().state.empty).toBe(true);
});

test('lixeira e limpar avisam a remoção', async () => {
  const { act, onMessage } = await renderViewModel();

  await act(vm => vm.remove(7));
  expect(onMessage).toHaveBeenCalledWith('Produto removido.', 'warning');

  await act(vm => vm.clear());
  expect(onMessage).toHaveBeenCalledWith('Carrinho esvaziado.', 'warning');
});

test('cupom vai em maiúsculas e mostra o desconto', async () => {
  const { viewModel, act, onMessage, cartRepository } = await renderViewModel();

  await act(vm => vm.changeCoupon('rango10'));
  expect(viewModel().state.couponInput).toBe('rango10');

  await act(vm => vm.applyCoupon());
  expect(cartRepository.applyCoupon).toHaveBeenCalledWith('RANGO10');
  expect(viewModel().state.couponApplied).toBe(true);
  expect(viewModel().state.summary[2]).toEqual({
    label: 'Desconto · RANGO10',
    value: '- R$ 3,89',
    highlight: true,
  });
  expect(onMessage).toHaveBeenCalledWith(
    'Cupom RANGO10 aplicado · 10% off.',
    'success',
  );
});

test('cupom inválido mostra a mensagem do servidor', async () => {
  const { viewModel, act, onMessage } = await renderViewModel({
    applyCoupon: () =>
      Promise.reject(new ApiError(422, 'INVALID_COUPON', 'Cupom inválido.')),
  });

  await act(vm => vm.changeCoupon('xyz'));
  await act(vm => vm.applyCoupon());

  expect(onMessage).toHaveBeenCalledWith('Cupom inválido.', 'error');
  expect(viewModel().state.couponApplied).toBe(false);
});
