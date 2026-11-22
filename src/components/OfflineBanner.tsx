import { StyleSheet, Text, View } from 'react-native';
import { fonts } from '../theme';
import { Icon } from './Icon';

type OfflineBannerProps = {
  title: string;
  text: string;
};

const BANNER_BACKGROUND = '#3A3A3F';
const BANNER_SUBTEXT = '#C7C7CC';

export function OfflineBanner({ title, text }: OfflineBannerProps) {
  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${text}`}
      style={styles.banner}
    >
      <Icon name="cloudOff" size={17} color="#FFFFFF" />
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.text} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 18,
    backgroundColor: BANNER_BACKGROUND,
  },
  title: { fontFamily: fonts.bold, fontSize: 11.5, color: '#FFFFFF' },
  text: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: BANNER_SUBTEXT,
  },
});
