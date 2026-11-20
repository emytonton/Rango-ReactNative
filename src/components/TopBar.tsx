import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, useTheme } from '../theme';
import { BackButton } from './BackButton';

const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

type TopBarProps = {
  title: string;
  subtitle?: string;
  monospaceSubtitle?: boolean;
  onBack: () => void;
  actionText?: string;
  actionColor?: string;
  onAction?: () => void;
};

export function TopBar({
  title,
  subtitle,
  monospaceSubtitle = false,
  onBack,
  actionText,
  actionColor,
  onAction,
}: TopBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          paddingTop: insets.top + 6,
        },
      ]}
    >
      <BackButton onPress={onBack} />
      <View style={styles.texts}>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.text }]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              monospaceSubtitle && styles.mono,
              { color: colors.text2 },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {actionText && onAction && (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text
            style={[styles.action, { color: actionColor ?? colors.primary }]}
          >
            {actionText}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 13,
    borderBottomWidth: 1,
  },
  texts: { flex: 1 },
  title: { fontFamily: fonts.extraBold, fontSize: 16 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 11.5 },
  mono: { fontFamily: monospace, fontSize: 11, fontWeight: '600' },
  action: { fontFamily: fonts.bold, fontSize: 12.5 },
});
