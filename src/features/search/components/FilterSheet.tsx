import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, OptionChip, RadioOption, Slider } from '../../../components';
import { formatPrice } from '../../../core/format/formatters';
import type { Category } from '../../../data/catalog/catalogApi';
import { fonts, useTheme } from '../../../theme';
import {
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  ratingOptions,
  sortOptions,
  timeOptions,
  type SearchFilters,
} from '../searchFilters';

type FilterSheetProps = {
  visible: boolean;
  draft: SearchFilters;
  categories: Category[];
  onChange: (draft: SearchFilters) => void;
  onClear: () => void;
  onApply: () => void;
  onDismiss: () => void;
};

export function FilterSheet({
  visible,
  draft,
  categories,
  onChange,
  onClear,
  onApply,
  onDismiss,
}: FilterSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const offset = useRef(new Animated.Value(600)).current;

  const backdrop = useRef(new Animated.Value(0)).current;
  const [exclusionKey, setExclusionKey] = useState<number>();
  const remeasure = () => setExclusionKey(key => (key ?? 0) + 1);

  useEffect(() => {
    if (!visible) {
      return;
    }
    offset.setValue(600);
    backdrop.setValue(0);
    Animated.parallel([
      Animated.spring(offset, {
        toValue: 0,
        damping: 22,
        stiffness: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(remeasure);
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismiss();
      return true;
    });
    return () => back.remove();
  }, [visible, offset, backdrop, onDismiss]);

  if (!visible) {
    return null;
  }

  const set = (patch: Partial<SearchFilters>) =>
    onChange({ ...draft, ...patch });

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdrop }]}>
        <Pressable
          accessibilityLabel="Fechar filtros"
          onPress={onDismiss}
          style={[StyleSheet.absoluteFill, styles.backdrop]}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            paddingBottom: 18 + insets.bottom,
            transform: [{ translateY: offset }],
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Filtros</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={onDismiss}
            style={[styles.close, { borderColor: colors.border }]}
          >
            <Icon name="close" size={19} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={remeasure}
          onScrollEndDrag={remeasure}
          contentContainerStyle={styles.sections}
        >
          <Section title="Categoria">
            <View style={styles.wrap}>
              <OptionChip
                label="Todos"
                selected={draft.category === null}
                onPress={() => set({ category: null })}
              />
              {categories.map(category => (
                <OptionChip
                  key={category.slug}
                  label={category.name}
                  selected={draft.category?.slug === category.slug}
                  onPress={() => set({ category })}
                />
              ))}
            </View>
          </Section>
          <Section
            title="Faixa de preço"
            trailing={`até ${formatPrice(draft.maxPrice)}`}
          >
            <Slider
              value={draft.maxPrice}
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              onChange={maxPrice => set({ maxPrice })}
              exclusionKey={exclusionKey}
            />
            <View style={styles.range}>
              <Text style={[styles.rangeText, { color: colors.text2 }]}>
                {formatPriceShort(PRICE_MIN)}
              </Text>
              <Text style={[styles.rangeText, { color: colors.text2 }]}>
                {formatPriceShort(PRICE_MAX)}
              </Text>
            </View>
          </Section>
          <Section title="Avaliação mínima">
            <View style={styles.row}>
              {ratingOptions.map(([value, label]) => (
                <OptionChip
                  key={label}
                  label={label}
                  selected={draft.minRating === value}
                  onPress={() => set({ minRating: value })}
                />
              ))}
            </View>
          </Section>
          <Section title="Tempo de entrega">
            <View style={styles.row}>
              {timeOptions.map(([value, label]) => (
                <OptionChip
                  key={label}
                  label={label}
                  selected={draft.maxTime === value}
                  onPress={() => set({ maxTime: value })}
                />
              ))}
            </View>
          </Section>
          <Section title="Ordenar por" gap={7}>
            {sortOptions.map(option => (
              <RadioOption
                key={option.value}
                label={option.option}
                selected={draft.sort === option.value}
                onPress={() => set({ sort: option.value })}
              />
            ))}
          </Section>
        </ScrollView>
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={onClear}
            style={[
              styles.button,
              styles.clearButton,
              { borderColor: colors.border },
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Limpar filtros
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onApply}
            style={[
              styles.button,
              styles.applyButton,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
              Aplicar filtros
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

type SectionProps = {
  title: string;
  trailing?: string;
  gap?: number;
  children: ReactNode;
};

function Section({ title, trailing, gap = 9, children }: SectionProps) {
  const { colors } = useTheme();
  return (
    <View style={{ gap }}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
        {trailing && (
          <Text style={[styles.sectionTrailing, { color: colors.primary }]}>
            {trailing}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

function formatPriceShort(value: number): string {
  return `R$ ${value}`;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  sheet: {
    maxHeight: '90%',
    gap: 14,
    paddingTop: 12,
    paddingHorizontal: 18,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  handle: { alignSelf: 'center', width: 44, height: 4.5, borderRadius: 3 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontFamily: fonts.extraBold, fontSize: 18, letterSpacing: -0.5 },
  close: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sections: { gap: 18 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontFamily: fonts.extraBold, fontSize: 13 },
  sectionTrailing: { fontFamily: fonts.extraBold, fontSize: 12.5 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  row: { flexDirection: 'row', gap: 7 },
  range: { flexDirection: 'row', justifyContent: 'space-between' },
  rangeText: { fontFamily: fonts.semiBold, fontSize: 11 },
  footer: { flexDirection: 'row', gap: 10 },
  button: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: { flex: 1, borderWidth: 1.5 },
  applyButton: { flex: 1.4 },
  buttonText: { fontFamily: fonts.bold, fontSize: 14 },
});
