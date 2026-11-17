import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type EmptyStateProps = {
  icon: IconName;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon,
  title,
  message,
  actionText,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.art,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Icon name={icon} size={42} color={colors.text2} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.text2 }]}>{message}</Text>
      {actionText && onAction && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={[
            styles.action,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.actionText, { color: colors.text }]}>
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
  art: {
    width: 96,
    height: 96,
    borderRadius: 32,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.extraBold, fontSize: 17, textAlign: 'center' },
  message: {
    maxWidth: 250,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19.5,
    textAlign: 'center',
  },
  action: {
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  actionText: { fontFamily: fonts.bold, fontSize: 13.5 },
});
