import { StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme, type RangoColors } from '../theme';

type ThemePreviewProps = {
  name: string;
  palette: RangoColors;
  selected: boolean;
};

export function ThemePreview({ name, palette, selected }: ThemePreviewProps) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityLabel={name}
      accessibilityState={{ selected }}
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <View style={[styles.bar, { backgroundColor: palette.primary }]} />
      <View
        style={[
          styles.block,
          { backgroundColor: palette.surface2, borderColor: palette.border },
        ]}
      />
      <View style={[styles.blockSmall, { backgroundColor: palette.border }]} />
      <View style={[styles.cta, { backgroundColor: palette.primary }]} />
      <Text style={[styles.label, { color: palette.text }]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: 7,
    padding: 13,
    borderRadius: 18,
    borderWidth: 2,
  },
  bar: { height: 8, width: '60%', borderRadius: 4 },
  block: { height: 34, borderRadius: 10, borderWidth: 1 },
  blockSmall: { height: 8, width: '75%', borderRadius: 4 },
  cta: { height: 22, borderRadius: 8 },
  label: { fontFamily: fonts.extraBold, fontSize: 11 },
});
