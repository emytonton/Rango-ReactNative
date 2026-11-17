import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomBar,
  EmptyState,
  ErrorState,
  FilterButton,
  ProductRow,
  RemovableChip,
  SearchField,
  useToast,
  type BottomTab,
} from '../../components';
import type { CartRepository } from '../../data/cart/cartRepository';
import type { CatalogRepository } from '../../data/catalog/catalogRepository';
import type { SearchRepository } from '../../data/search/searchRepository';
import { fonts, useTheme } from '../../theme';
import { ProductRowSkeleton } from '../home/components/HomeSkeleton';
import { FilterSheet } from './components/FilterSheet';
import { SearchIdleContent } from './components/SearchIdleContent';
import { filtersForHomeSection, sortLabel } from './searchFilters';
import { useSearchViewModel } from './useSearchViewModel';

type SearchScreenProps = {
  searchRepository: SearchRepository;
  catalogRepository: CatalogRepository;
  cartRepository: CartRepository;
  homeSection?: string;
  onOpenProduct: (productId: string) => void;
  onTab: (tab: BottomTab) => void;
  onSessionExpired: () => void;
};

export function SearchScreen({
  searchRepository,
  catalogRepository,
  cartRepository,
  homeSection,
  onOpenProduct,
  onTab,
  onSessionExpired,
}: SearchScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [initialFilters] = useState(() => filtersForHomeSection(homeSection));
  const viewModel = useSearchViewModel(
    searchRepository,
    catalogRepository,
    cartRepository,
    initialFilters,
    { onMessage: toast.show, onSessionExpired },
  );
  const { state } = viewModel;

  const openProduct = (productId: string) => {
    viewModel.openProduct();
    onOpenProduct(productId);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 6,
          },
        ]}
      >
        <View style={styles.searchRow}>
          <SearchField
            value={state.query}
            placeholder="O que você quer comer hoje?"
            onChangeText={viewModel.changeQuery}
          />
          <FilterButton
            count={state.activeFilters.length}
            onPress={viewModel.openFilters}
          />
        </View>
        {state.activeFilters.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chips}
          >
            {state.activeFilters.map(filter => (
              <RemovableChip
                key={filter.key}
                label={filter.label}
                onRemove={() => viewModel.removeFilter(filter.key)}
              />
            ))}
          </ScrollView>
        )}
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {state.idle ? (
          <SearchIdleContent
            recent={state.recent}
            suggestions={state.suggestions}
            onPickTerm={viewModel.pickTerm}
            onClearRecent={viewModel.clearRecent}
          />
        ) : state.loading ? (
          [0, 1, 2].map(index => <ProductRowSkeleton key={index} />)
        ) : state.errorMessage ? (
          <ErrorState
            message={state.errorMessage}
            actionText="Tentar novamente"
            onAction={viewModel.retry}
          />
        ) : state.results.length === 0 ? (
          <EmptyState
            icon="searchOff"
            title="Nenhum produto encontrado."
            message="Tente outro termo ou ajuste os filtros aplicados."
            actionText="Limpar filtros"
            onAction={viewModel.clearFilters}
          />
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <Text style={[styles.count, { color: colors.text }]}>
                {state.results.length === 1
                  ? '1 resultado'
                  : `${state.results.length} resultados`}
              </Text>
              <Text style={[styles.sort, { color: colors.text2 }]}>
                {sortLabel(state.filters.sort)}
              </Text>
            </View>
            {state.results.map(product => (
              <ProductRow
                key={product.id}
                product={product}
                subtitle={`${product.restaurant} · ${product.category}`}
                onOpen={() => openProduct(product.id)}
                onToggleFavorite={() => viewModel.toggleFavorite(product.id)}
                onAdd={() => viewModel.addToCart(product.id)}
              />
            ))}
          </>
        )}
      </ScrollView>
      <BottomBar selected="search" onSelect={onTab} />
      <FilterSheet
        visible={state.showFilters}
        draft={state.draft}
        categories={state.categories}
        onChange={viewModel.changeDraft}
        onClear={viewModel.clearDraft}
        onApply={viewModel.applyFilters}
        onDismiss={viewModel.closeFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    gap: 11,
    paddingHorizontal: 18,
    paddingBottom: 13,
    borderBottomWidth: 1,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  chipsScroll: { marginHorizontal: -18 },
  chips: { gap: 7, paddingHorizontal: 18 },
  content: {
    gap: 13,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 22,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  count: { fontFamily: fonts.bold, fontSize: 13 },
  sort: { fontFamily: fonts.semiBold, fontSize: 12 },
});
