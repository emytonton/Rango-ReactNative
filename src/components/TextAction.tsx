import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';

type TextActionProps = {
  prompt: string;
  action: string;
  onPress: () => void;
};

export function TextAction({ prompt, action, onPress }: TextActionProps) {
  const { colors, typography } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[typography.body, styles.text, { color: colors.text2 }]}>
        {prompt}
      </Text>
      <Pressable accessibilityRole="button" onPress={onPress} hitSlop={6}>
        <Text
          style={[
            typography.body,
            styles.text,
            styles.action,
            { color: colors.primary },
          ]}
        >
          {action}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { fontSize: 13 },
  action: {
    fontFamily: fonts.bold,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
});
