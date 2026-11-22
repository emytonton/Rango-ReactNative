import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Avatar,
  BadgeIconButton,
  BottomBar,
  CategoryChip,
  ErrorState,
  Icon,
  ProductRow,
  ProductTile,
  SearchBarButton,
  SectionHeader,
  useToast,
  type BottomTab,
  type IconName,
} from '../../components';
import type { CartRepository } from '../../data/cart/cartRepository';
import type { CatalogRepository } from '../../data/catalog/catalogRepository';
import type { PushWatcher } from '../../data/push/pushWatcher';
import { fonts, useTheme } from '../../theme';
import { HomeSkeleton, ProductRowSkeleton } from './components/HomeSkeleton';
import { PromoBanner } from './components/PromoBanner';
import {
  useHomeViewModel,
  type HomeSectionModel,
  type HomeState,
} from './useHomeViewModel';

export type HomeNavigation = {
  onOpenProduct: (productId: string) => void;
  onSeeAll: (sectionKey: string) => void;
  onProfile: () => void;
  onAddress: () => void;
  onNotifications: () => void;
  onCart: () => void;
  onSearch: () => void;
  onTab: (tab: BottomTab) => void;
  onSessionExpired: () => void;
};

type HomeScreenProps = HomeNavigation & {
  catalogRepository: CatalogRepository;
  cartRepository: CartRepository;
  pushWatcher: PushWatcher;
};

type ProductActions = {
  onOpen: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
  onAdd: (productId: string) => void;
};

const sectionIcons: Record<string, IconName> = {
  offers: 'localOffer',
  popular: 'whatshot',
  recommended: 'thumbUp',
};

export function HomeScreen({
  catalogRepository,
  cartRepository,
  pushWatcher,
  ...navigation
}: HomeScreenProps) {
  const { colors } = useTheme();
  const toast = useToast();
  const viewModel = useHomeViewModel(catalogRepository, cartRepository, {
    onMessage: toast.show,
    onSessionExpired: navigation.onSessionExpired,
  });
  const { state, refresh } = viewModel;
  const { arrivals } = useSyncExternalStore(
    pushWatcher.subscribe,
    pushWatcher.state,
  );
  useEffect(() => {
    if (arrivals > 0) {
      refresh();
    }
  }, [arrivals, refresh]);
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
  const productActions: ProductActions = {
    onOpen: navigation.onOpenProduct,
    onToggleFavorite: viewModel.toggleFavorite,
    onAdd: viewModel.addToCart,
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <HomeHeader
        state={state}
        navigation={navigation}
        onSelectCategory={viewModel.selectCategory}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {state.loading ? (
          <HomeSkeleton />
        ) : state.errorMessage ? (
          <View style={styles.padded}>
            <ErrorState
              message={state.errorMessage}
              actionText="Tentar novamente"
              onAction={viewModel.load}
            />
          </View>
        ) : (
          <>
            <View style={styles.padded}>
              <PromoBanner />
            </View>
            {state.selectedCategory ? (
              <CategoryList state={state} actions={productActions} />
            ) : (
              state.sections.map(section => (
                <SectionRail
                  key={section.key}
                  section={section}
                  actions={productActions}
                  onSeeAll={() => navigation.onSeeAll(section.key)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
      <BottomBar selected="home" onSelect={navigation.onTab} />
    </View>
  );
}

type HomeHeaderProps = {
  state: HomeState;
  navigation: HomeNavigation;
  onSelectCategory: HomeViewModel['selectCategory'];
};

type HomeViewModel = ReturnType<typeof useHomeViewModel>;

function HomeHeader({ state, navigation, onSelectCategory }: HomeHeaderProps) {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          paddingTop: insets.top + 4,
        },
      ]}
    >
      <View style={styles.headerTop}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Perfil"
            onPress={navigation.onProfile}
          >
            <Avatar
              initials={state.initials}
              imageUrl={state.avatarUrl}
              size={42}
              radius={15}
              fontSize={13}
            />
          </Pressable>
          <View style={styles.greeting}>
            <Text
              style={[typography.label, styles.hello, { color: colors.text2 }]}
            >
              Olá, {state.firstName}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={navigation.onAddress}
              style={styles.address}
            >
              <Icon name="locationOn" size={16} color={colors.primary} />
              <Text
                numberOfLines={1}
                style={[styles.addressText, { color: colors.text }]}
              >
                {state.addressShort ?? 'Adicionar endereço'}
              </Text>
              <Icon name="expandMore" size={16} color={colors.text2} />
            </Pressable>
          </View>
          <BadgeIconButton
            icon="notifications"
            accessibilityLabel="Notificações"
            onPress={navigation.onNotifications}
            showDot={state.hasUnreadNotifications}
          />
          <BadgeIconButton
            icon="shoppingBag"
            accessibilityLabel="Carrinho"
            onPress={navigation.onCart}
            filled
            count={state.cartCount}
          />
        </View>
        <SearchBarButton
          placeholder="O que você quer comer hoje?"
          onPress={navigation.onSearch}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <CategoryChip
          label="Todos"
          selected={state.selectedCategory === null}
          onPress={() => onSelectCategory(null)}
        />
        {state.categories.map(category => (
          <CategoryChip
            key={category.slug}
            label={category.name}
            selected={state.selectedCategory?.slug === category.slug}
            onPress={() => onSelectCategory(category)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

type CategoryListProps = { state: HomeState; actions: ProductActions };

function CategoryList({ state, actions }: CategoryListProps) {
  const count = state.categoryProducts.length;
  return (
    <View style={[styles.padded, styles.section]}>
      <SectionHeader
        title={state.selectedCategory?.name ?? ''}
        trailingText={
          state.categoryLoading
            ? undefined
            : count === 1
            ? '1 item'
            : `${count} itens`
        }
      />
      <View style={styles.list}>
        {state.categoryLoading
          ? [0, 1, 2].map(index => <ProductRowSkeleton key={index} />)
          : state.categoryProducts.map(product => (
              <ProductRow
                key={product.id}
                product={product}
                onOpen={() => actions.onOpen(product.id)}
                onToggleFavorite={() => actions.onToggleFavorite(product.id)}
                onAdd={() => actions.onAdd(product.id)}
              />
            ))}
      </View>
    </View>
  );
}

type SectionRailProps = {
  section: HomeSectionModel;
  actions: ProductActions;
  onSeeAll: () => void;
};

function SectionRail({ section, actions, onSeeAll }: SectionRailProps) {
  return (
    <View style={styles.section}>
      <View style={styles.padded}>
        <SectionHeader
          title={section.title}
          icon={sectionIcons[section.key] ?? 'bolt'}
          actionText="Ver tudo"
          onAction={onSeeAll}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {section.products.map(product => (
          <ProductTile
            key={product.id}
            product={product}
            onOpen={() => actions.onOpen(product.id)}
            onToggleFavorite={() => actions.onToggleFavorite(product.id)}
            onAdd={() => actions.onAdd(product.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { borderBottomWidth: 1 },
  headerTop: { gap: 13, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  greeting: { flex: 1, minWidth: 0, gap: 1 },
  hello: { fontSize: 11.5 },
  address: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { maxWidth: 150, fontFamily: fonts.bold, fontSize: 13 },
  chips: { gap: 8, paddingHorizontal: 20, paddingVertical: 13 },
  content: { gap: 22, paddingTop: 16, paddingBottom: 22 },
  padded: { paddingHorizontal: 20 },
  section: { gap: 13 },
  list: { gap: 12 },
  rail: { gap: 13, paddingHorizontal: 20, paddingTop: 2, paddingBottom: 6 },
});
