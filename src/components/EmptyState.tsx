import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type EmptyStateProps = {
  icon: IconName;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  large?: boolean;
  primaryAction?: boolean;
};

export function EmptyState({
  icon,
  title,
  message,
  actionText,
  onAction,
  large = false,
  primaryAction = false,
}: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, large && styles.containerLarge]}>
      <View
        style={[
          styles.art,
          large && styles.artLarge,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Icon name={icon} size={large ? 58 : 42} color={colors.text2} />
      </View>
      <Text
        style={[
          styles.title,
          large && styles.titleLarge,
          { color: colors.text },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.message,
          large && styles.messageLarge,
          { color: colors.text2 },
        ]}
      >
        {message}
      </Text>
      {actionText && onAction && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={
            primaryAction
              ? [styles.primary, { backgroundColor: colors.primary }]
              : [
                  styles.action,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]
          }
        >
          <Text
            style={
              primaryAction
                ? [styles.primaryText, { color: colors.onPrimary }]
                : [styles.actionText, { color: colors.text }]
            }
          >
            {actionText}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 40,
    paddingHorizontal: 10,
  },
  containerLarge: { gap: 15, padding: 30 },
  art: {
    width: 96,
    height: 96,
    borderRadius: 32,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artLarge: { width: 132, height: 132, borderRadius: 44 },
  title: { fontFamily: fonts.extraBold, fontSize: 17, textAlign: 'center' },
  titleLarge: { fontSize: 19 },
  message: {
    maxWidth: 250,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19.5,
    textAlign: 'center',
  },
  messageLarge: { fontSize: 13.5, lineHeight: 20 },
  action: {
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  actionText: { fontFamily: fonts.bold, fontSize: 13.5 },
  primary: {
    marginTop: 6,
    paddingVertical: 15,
    paddingHorizontal: 26,
    borderRadius: 16,
  },
  primaryText: { fontFamily: fonts.bold, fontSize: 14.5 },
});
