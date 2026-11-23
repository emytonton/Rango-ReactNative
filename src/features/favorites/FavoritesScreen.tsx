import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomBar,
  EmptyState,
  ErrorState,
  Skeleton,
  useToast,
  type BottomTab,
} from '../../components';
import { useConnectionChange } from '../../core/connectivity/useConnectivity';
import type { ConnectivityMonitor } from '../../core/native/connectivityMonitor';
import type { CartRepository } from '../../data/cart/cartRepository';
import type { FavoriteRepository } from '../../data/favorite/favoriteRepository';
import { fonts, useTheme } from '../../theme';
import { FavoriteCard } from './components/FavoriteCard';
import {
  favoritesCountLabel,
  isFavoritesEmpty,
  useFavoritesViewModel,
} from './useFavoritesViewModel';

type FavoritesScreenProps = {
  favoriteRepository: FavoriteRepository;
  cartRepository: CartRepository;
  connectivityMonitor: ConnectivityMonitor;
  onOpenProduct: (productId: string) => void;
  onExplore: () => void;
  onTab: (tab: BottomTab) => void;
  onSessionExpired: () => void;
};

export function FavoritesScreen({
  favoriteRepository,
  cartRepository,
  connectivityMonitor,
  onOpenProduct,
  onExplore,
  onTab,
  onSessionExpired,
}: FavoritesScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const viewModel = useFavoritesViewModel(favoriteRepository, cartRepository, {
    onMessage: toast.show,
    onSessionExpired,
  });
  const { state, refresh } = viewModel;

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
  useConnectionChange(connectivityMonitor, online => online && refresh());

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Favoritos</Text>
        {state.loaded && (
          <Text style={[styles.count, { color: colors.text2 }]}>
            {favoritesCountLabel(state.items.length)}
          </Text>
        )}
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {state.items.length > 0 ? (
          state.items.map(item => (
            <FavoriteCard
              key={item.id}
              name={item.name}
              subtitle={item.subtitle}
              price={item.price}
              imageUrl={item.imageUrl}
              imageHue={item.imageHue}
              onOpen={() => onOpenProduct(item.id)}
              onRemove={() => viewModel.remove(item.id)}
              onAdd={() => viewModel.addToCart(item.id)}
            />
          ))
        ) : isFavoritesEmpty(state) ? (
          <EmptyState
            icon="favoriteBorder"
            title="Nenhum favorito ainda"
            message="Toque no coração dos pratos que você ama para encontrá-los rápido aqui."
            actionText="Explorar produtos"
            onAction={onExplore}
            primaryAction
          />
        ) : state.errorMessage ? (
          <ErrorState
            message={state.errorMessage}
            actionText="Tentar novamente"
            onAction={viewModel.retry}
          />
        ) : (
          [0, 1, 2].map(index => (
            <Skeleton key={index} height={110} radius={20} />
          ))
        )}
      </ScrollView>
      <BottomBar selected="favorites" onSelect={onTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 21,
    letterSpacing: -0.6,
  },
  count: { fontFamily: fonts.semiBold, fontSize: 12.5 },
  content: {
    gap: 12,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
});
