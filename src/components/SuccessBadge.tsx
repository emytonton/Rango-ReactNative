import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { Icon } from './Icon';

const POP_MS = 500;
const popEasing = Easing.bezier(0.2, 0.9, 0.3, 1);

export function SuccessBadge() {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: POP_MS,
      easing: popEasing,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const scale = progress.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [0.3, 1.12, 1],
  });

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: `${colors.success}1F`,
          opacity: progress,
          transform: [{ scale }],
        },
      ]}
    >
      <Icon name="checkCircle" size={56} color={colors.success} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
