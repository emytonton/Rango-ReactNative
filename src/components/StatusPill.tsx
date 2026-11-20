import { StyleSheet, Text } from 'react-native';
import { fonts, useTheme } from '../theme';

export type StatusTone = 'progress' | 'success' | 'error';

const TINT_ALPHA = '1F';

type StatusPillProps = {
  label: string;
  tone: StatusTone;
};

export function StatusPill({ label, tone }: StatusPillProps) {
  const { colors } = useTheme();
  const color =
    tone === 'success'
      ? colors.success
      : tone === 'error'
      ? colors.error
      : colors.primary;
  const background = tone === 'progress' ? colors.soft : color + TINT_ALPHA;
  return (
    <Text
      numberOfLines={1}
      style={[styles.pill, { color, backgroundColor: background }]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  pill: {
    overflow: 'hidden',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 9,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
});
