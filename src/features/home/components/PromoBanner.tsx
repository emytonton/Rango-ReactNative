import { Platform, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../../../theme';

export function PromoBanner() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.banner,
        {
          backgroundImage: `linear-gradient(118deg, ${colors.primary}, ${colors.primary2})`,
        },
      ]}
    >
      <View style={styles.texts}>
        <Text style={styles.tag}>Só hoje</Text>
        <Text style={styles.title}>{'20% OFF acima\nde R$ 40'}</Text>
        <View style={styles.code}>
          <Text style={styles.codeText}>RANGO10</Text>
        </View>
      </View>
      <View style={styles.art}>
        <Text style={styles.artText}>{'promo\nimg'}</Text>
      </View>
    </View>
  );
}

const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 22,
    boxShadow: '0px 14px 28px -14px rgba(255, 107, 0, 0.8)',
  },
  texts: { flex: 1, gap: 6 },
  tag: {
    fontFamily: fonts.extraBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 19,
    lineHeight: 23,
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
  code: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  codeText: {
    fontFamily: monospace,
    fontWeight: '700',
    fontSize: 11,
    color: '#FFFFFF',
  },
  art: {
    width: 88,
    height: 88,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  artText: {
    fontFamily: monospace,
    fontSize: 9,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
