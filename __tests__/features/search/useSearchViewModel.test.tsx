import ReactTestRenderer from 'react-test-renderer';
import { NetworkError } from '../../../src/core/network/apiError';
import type { CartRepository } from '../../../src/data/cart/cartRepository';
import type { ProductSummary } from '../../../src/data/catalog/catalogApi';
import type { CatalogRepository } from '../../../src/data/catalog/catalogRepository';
import type { SearchRepository } from '../../../src/data/search/searchRepository';
import {
  activeFilters,
  defaultFilters,
  filtersForHomeSection,
  toProductQuery,
  type SearchFilters,
} from '../../../src/features/search/searchFilters';
import { useSearchViewModel } from '../../../src/features/search/useSearchViewModel';

type ViewModel = ReturnType<typeof useSearchViewModel>;

const acai: ProductSummary = {
  id: 'p13',
  name: 'Açaí 500ml',
  restaurant: 'Açaí da Praia',
  category: { name: 'Sobremesas', slug: 'sobremesas' },
  description: 'Com granola e banana',
  price: 24.9,
  oldPrice: null,
  rating: 4.7,
  deliveryTime: { min: 15, max: 25 },
  imageUrl: null,
  imageHue: 300,
  isAvailable: true,
  isFavorite: false,
};

async function renderViewModel(
  search: Partial<SearchRepository> = {},
  catalog: Partial<CatalogRepository> = {},
  initialFilters: SearchFilters = defaultFilters,
) {
  const onMessage = jest.fn();
  const searchRepository: SearchRepository = {
    recent: jest.fn(() => Promise.resolve(['pizza'])),
    saveRecent: jest.fn((term: string) => Promise.resolve([term, 'pizza'])),
    clearRecent: jest.fn(() => Promise.resolve()),
    categories: jest.fn(() => Promise.resolve([])),
    suggestions: jest.fn(() => Promise.resolve([acai])),
    search: jest.fn(() => Promise.resolve([acai])),
    ...search,
  };
  const catalogRepository: CatalogRepository = {
    home: jest.fn(),
    productsByCategory: jest.fn(),
    product: jest.fn(),
    setFavorite: jest.fn(() => Promise.resolve(true)),
    ...catalog,
  };
  const cartRepository: CartRepository = {
    addItem: jest.fn(() => Promise.resolve(1)),
    cart: jest.fn(),
    updateQuantity: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    applyCoupon: jest.fn(),
  };
  const current: { value?: ViewModel } = {};
  function Harness() {
    current.value = useSearchViewModel(
      searchRepository,
      catalogRepository,
      cartRepository,
      initialFilters,
      { onMessage, onSessionExpired: jest.fn() },
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
  return { viewModel, act, onMessage, searchRepository };
}

afterEach(() => jest.useRealTimers());

test('filtros ativos viram chips e parâmetros da busca', () => {
  const filters: SearchFilters = {
    category: { name: 'Pizza', slug: 'pizza' },
    maxPrice: 40,
    minRating: 4.5,
    maxTime: 30,
    sort: 'price_asc',
  };

  expect(activeFilters(filters).map(filter => filter.label)).toEqual([
    'Pizza',
    'até R$ 40,00',
    '4,5+ estrelas',
    'até 30 min',
    'Menor preço',
  ]);
  expect(toProductQuery(filters, '  açaí ')).toEqual({
    term: 'açaí',
    categorySlug: 'pizza',
    maxPrice: 40,
    minRating: 4.5,
    maxDeliveryTime: 30,
    sort: 'price_asc',
  });
  expect(filtersForHomeSection('recommended')).toMatchObject({
    minRating: 4.5,
    sort: 'rating',
  });
});

test('sem termo mostra recentes e sugestões sem buscar', async () => {
  const { viewModel, searchRepository } = await renderViewModel();

  expect(viewModel().state.idle).toBe(true);
  expect(viewModel().state.recent).toEqual(['pizza']);
  expect(viewModel().state.suggestions[0]).toEqual({
    name: 'Açaí 500ml',
    hint: 'Açaí da Praia · 4,7 · R$ 24,90',
  });
  expect(searchRepository.search).not.toHaveBeenCalled();
});

test('digitar espera o debounce antes de buscar', async () => {
  jest.useFakeTimers();
  const { viewModel, act, searchRepository } = await renderViewModel();

  await act(vm => vm.changeQuery('aca'));
  await act(vm => vm.changeQuery('acai'));
  expect(searchRepository.search).not.toHaveBeenCalled();
  expect(viewModel().state.loading).toBe(true);

  await act(() => jest.advanceTimersByTime(350));
  expect(searchRepository.search).toHaveBeenCalledTimes(1);
  expect(searchRepository.search).toHaveBeenCalledWith(
    expect.objectContaining({ term: 'acai' }),
  );
  expect(viewModel().state.results).toHaveLength(1);
});

test('rascunho só vale ao aplicar e limpar volta ao padrão', async () => {
  const { viewModel, act, onMessage } = await renderViewModel();

  await act(vm => vm.openFilters());
  await act(vm => vm.changeDraft({ ...vm.state.draft, maxTime: 25 }));
  expect(viewModel().state.activeFilters).toEqual([]);

  await act(vm => vm.applyFilters());
  expect(viewModel().state.activeFilters).toEqual([
    { key: 'time', label: 'até 25 min' },
  ]);
  expect(onMessage).toHaveBeenCalledWith('Filtros aplicados.', 'success');

  await act(vm => vm.clearFilters());
  expect(viewModel().state.idle).toBe(true);
});

test('abrir um resultado guarda o termo nas recentes', async () => {
  const { viewModel, act, searchRepository } = await renderViewModel();

  await act(vm => vm.pickTerm('açaí'));
  await act(vm => vm.openProduct());

  expect(searchRepository.saveRecent).toHaveBeenCalledWith('açaí');
  expect(viewModel().state.recent).toEqual(['açaí', 'pizza']);
});

test('favoritar desfaz a marcação quando o servidor falha', async () => {
  const { viewModel, act, onMessage } = await renderViewModel(
    {},
    { setFavorite: () => Promise.reject(new NetworkError()) },
    filtersForHomeSection('fast'),
  );

  await act(() => new Promise<void>(resolve => setTimeout(resolve, 0)));
  expect(viewModel().state.results).toHaveLength(1);

  await act(vm => vm.toggleFavorite('p13'));
  expect(viewModel().state.results[0].isFavorite).toBe(false);
  expect(onMessage).toHaveBeenCalledWith(
    'Não foi possível atualizar os favoritos.',
    'error',
  );
});
