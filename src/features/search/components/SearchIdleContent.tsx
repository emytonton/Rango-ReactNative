import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../../components';
import { fonts, useTheme } from '../../../theme';
import type { SearchSuggestion } from '../useSearchViewModel';

type SearchIdleContentProps = {
  recent: string[];
  suggestions: SearchSuggestion[];
  onPickTerm: (term: string) => void;
  onClearRecent: () => void;
};

export function SearchIdleContent({
  recent,
  suggestions,
  onPickTerm,
  onClearRecent,
}: SearchIdleContentProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.block}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>
            Buscas recentes
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClearRecent}
            hitSlop={8}
          >
            <Text style={[styles.clear, { color: colors.primary }]}>
              Limpar
            </Text>
          </Pressable>
        </View>
        <View style={styles.recent}>
          {recent.map(term => (
            <Pressable
              key={term}
              accessibilityRole="button"
              onPress={() => onPickTerm(term)}
              style={[
                styles.recentChip,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Icon name="history" size={16} color={colors.text2} />
              <Text style={[styles.recentText, { color: colors.text }]}>
                {term}
              </Text>
            </Pressable>
          ))}
          {recent.length === 0 && (
            <Text style={[styles.empty, { color: colors.text2 }]}>
              Nenhuma busca recente.
            </Text>
          )}
        </View>
      </View>
      <View style={styles.block}>
        <Text style={[styles.title, { color: colors.text }]}>
          Sugestões para você
        </Text>
        <View style={styles.suggestions}>
          {suggestions.map(suggestion => (
            <Pressable
              key={suggestion.name}
              accessibilityRole="button"
              onPress={() => onPickTerm(suggestion.name)}
              style={styles.suggestion}
            >
              <View style={[styles.trend, { backgroundColor: colors.soft }]}>
                <Icon name="trendingUp" size={19} color={colors.primary} />
              </View>
              <View style={styles.suggestionTexts}>
                <Text style={[styles.suggestionName, { color: colors.text }]}>
                  {suggestion.name}
                </Text>
                <Text style={[styles.suggestionHint, { color: colors.text2 }]}>
                  {suggestion.hint}
                </Text>
              </View>
              <Icon name="northEast" size={18} color={colors.text2} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20 },
  block: { gap: 11 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontFamily: fonts.extraBold, fontSize: 14 },
  clear: { fontFamily: fonts.bold, fontSize: 12 },
  recent: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  recentText: { fontFamily: fonts.semiBold, fontSize: 12.5 },
  empty: { fontFamily: fonts.medium, fontSize: 12.5 },
  suggestions: { gap: 2 },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  trend: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTexts: { flex: 1, gap: 1 },
  suggestionName: { fontFamily: fonts.bold, fontSize: 13.5 },
  suggestionHint: { fontFamily: fonts.medium, fontSize: 11 },
});
