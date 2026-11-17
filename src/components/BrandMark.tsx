import { StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';

export function BrandMark() {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.logo, { backgroundColor: colors.primary }]}>
        <Text style={[styles.logoLetter, { color: colors.onPrimary }]}>r</Text>
      </View>
      <Text style={[styles.name, { color: colors.text }]}>rango</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { fontFamily: fonts.extraBold, fontSize: 20 },
  name: { fontFamily: fonts.extraBold, fontSize: 20, letterSpacing: -0.5 },
});
