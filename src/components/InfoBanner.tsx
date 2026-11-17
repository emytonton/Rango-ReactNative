import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { radius, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type InfoBannerProps = {
  icon: IconName;
  text: string;
  style?: ViewStyle;
};

export function InfoBanner({ icon, text, style }: InfoBannerProps) {
  const { colors, typography } = useTheme();
  return (
    <View style={[styles.banner, { backgroundColor: colors.soft }, style]}>
      <Icon name={icon} size={19} color={colors.primary} />
      <Text style={[typography.label, styles.text, { color: colors.text }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: radius.banner,
  },
  text: { flex: 1 },
});
