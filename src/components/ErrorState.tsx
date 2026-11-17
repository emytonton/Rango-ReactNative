import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon } from './Icon';

type ErrorStateProps = {
  message: string;
  actionText: string;
  onAction: () => void;
};

export function ErrorState({ message, actionText, onAction }: ErrorStateProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.box,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Icon name="syncProblem" size={19} color={colors.text2} />
      <Text style={[styles.message, { color: colors.text2 }]}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
        <Text style={[styles.action, { color: colors.primary }]}>
          {actionText}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  message: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    lineHeight: 16,
  },
  action: { fontFamily: fonts.bold, fontSize: 12.5 },
});
