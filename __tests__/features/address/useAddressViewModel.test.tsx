import ReactTestRenderer from 'react-test-renderer';
import { ApiError } from '../../../src/core/network/apiError';
import { apiBaseUrl } from '../../../src/core/network/config';
import type {
  AddressRepository,
  SavedAddress,
} from '../../../src/data/address/addressRepository';
import { useAddressViewModel } from '../../../src/features/address/useAddressViewModel';

type ViewModel = ReturnType<typeof useAddressViewModel>;

function address(id: number, label: string, isSelected: boolean): SavedAddress {
  return {
    id,
    label,
    cep: '05422-030',
    street: 'Rua das Palmeiras, 128',
    complement: null,
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    line: `${label} linha`,
    cityLine: 'Pinheiros · São Paulo',
    isSelected,
    mapImageUrl: '/static/maps/area.jpg',
  };
}

const saved = [address(2, 'Trabalho', true), address(1, 'Casa', false)];

async function renderViewModel(repository: Partial<AddressRepository> = {}) {
  const onMessage = jest.fn();
  const addressRepository: AddressRepository = {
    list: jest.fn(() => Promise.resolve(saved)),
    create: jest.fn(() => Promise.resolve(address(9, 'Outro', true))),
    select: jest.fn((id: number) => Promise.resolve(address(id, 'Casa', true))),
    ...repository,
  };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useAddressViewModel(addressRepository, {
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
  return { viewModel, act, onMessage, addressRepository };
}

test('carrega os endereços com o selecionado e o mapa do backend', async () => {
  const { viewModel } = await renderViewModel();

  expect(viewModel().state.addresses.map(item => item.label)).toEqual([
    'Trabalho',
    'Casa',
  ]);
  expect(viewModel().state.selectedId).toBe(2);
  expect(viewModel().mapImageUrl).toBe(`${apiBaseUrl}/static/maps/area.jpg`);
});

test('selecionar outro endereço avisa a atualização', async () => {
  const { viewModel, act, onMessage, addressRepository } =
    await renderViewModel();

  await act(vm => vm.select(1));

  expect(addressRepository.select).toHaveBeenCalledWith(1);
  expect(viewModel().state.selectedId).toBe(1);
  expect(onMessage).toHaveBeenCalledWith('Endereço atualizado.', 'success');
});

test('falha ao selecionar volta para o endereço anterior', async () => {
  const { viewModel, act, onMessage } = await renderViewModel({
    select: () => Promise.reject(new ApiError(404, 'NOT_FOUND', 'Não achou.')),
  });

  await act(vm => vm.select(1));

  expect(viewModel().state.selectedId).toBe(2);
  expect(onMessage).toHaveBeenCalledWith(
    'Não foi possível atualizar o endereço.',
    'error',
  );
});

test('CEP aceita só números e hífen', async () => {
  const { viewModel, act } = await renderViewModel();

  await act(vm => vm.changeField('cep', '01a310-1005'));

  expect(viewModel().state.form.cep).toBe('01310-100');
});

test('salvar separa bairro e cidade e fecha o formulário', async () => {
  const { viewModel, act, onMessage, addressRepository } =
    await renderViewModel();

  await act(vm => vm.toggleForm());
  await act(vm => vm.changeField('cep', '01310-100'));
  await act(vm => vm.changeField('street', ' Av. Paulista, 1000 '));
  await act(vm => vm.changeField('district', 'Bela Vista, São Paulo'));
  await act(vm => vm.save());

  expect(addressRepository.create).toHaveBeenCalledWith({
    label: 'Outro',
    cep: '01310-100',
    street: 'Av. Paulista, 1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    select: true,
  });
  expect(viewModel().state.formOpen).toBe(false);
  expect(viewModel().state.form.district).toBe('');
  expect(onMessage).toHaveBeenCalledWith(
    'Endereço salvo no dispositivo.',
    'success',
  );
});

test('erros do backend vão para os campos e o bairro vem antes da cidade', async () => {
  const { viewModel, act } = await renderViewModel({
    create: () =>
      Promise.reject(
        new ApiError(400, 'VALIDATION_ERROR', 'CEP inválido.', [
          { field: 'cep', message: 'CEP inválido.' },
          { field: 'neighborhood', message: 'Informe o bairro.' },
          { field: 'city', message: 'Informe a cidade.' },
        ]),
      ),
  });

  await act(vm => vm.save());

  expect(viewModel().state.errors).toEqual({
    cep: 'CEP inválido.',
    district: 'Informe o bairro.',
  });

  await act(vm => vm.changeField('district', 'Bela Vista'));
  expect(viewModel().state.errors.district).toBeUndefined();
});
