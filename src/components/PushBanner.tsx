import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, useTheme } from '../theme';

type PushBannerProps = {
  title: string;
  text: string;
  onPress: () => void;
};

export function PushBanner({ title, text, onPress }: PushBannerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [enter, title, text]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          top: insets.top + 10,
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [-120, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Rango: ${title}. ${text}`}
        onPress={onPress}
        style={styles.card}
      >
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Text style={styles.logoLetter}>r</Text>
        </View>
        <View style={styles.texts}>
          <View style={styles.header}>
            <Text style={styles.app}>Rango</Text>
            <Text style={styles.when}>agora</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.text}>{text}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 11, right: 11, zIndex: 70 },
  card: {
    flexDirection: 'row',
    gap: 11,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 245, 247, 0.96)',
    boxShadow: '0px 12px 30px -8px rgba(0, 0, 0, 0.35)',
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { fontFamily: fonts.extraBold, fontSize: 19, color: '#FFFFFF' },
  texts: { flex: 1, minWidth: 0, gap: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  app: { fontFamily: fonts.extraBold, fontSize: 13, color: '#111111' },
  when: { fontFamily: fonts.semiBold, fontSize: 11, color: '#6B6B70' },
  title: { fontFamily: fonts.bold, fontSize: 12.5, color: '#111111' },
  text: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: '#3C3C41',
  },
});
