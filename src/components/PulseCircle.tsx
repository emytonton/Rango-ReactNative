import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const PULSE_MS = 1900;
const PULSE_SPREAD = 16;

type PulseCircleProps = {
  size: number;
  color: string;
  pulsing?: boolean;
  children?: ReactNode;
};

export function PulseCircle({
  size,
  color,
  pulsing = true,
  children,
}: PulseCircleProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulsing) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: PULSE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, pulsing]);

  const circle = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[styles.center, circle]}>
      {pulsing && (
        <Animated.View
          style={[
            styles.ring,
            circle,
            {
              backgroundColor: color,
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 0],
              }),
              transform: [
                {
                  scale: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1 + (PULSE_SPREAD * 2) / size],
                  }),
                },
              ],
            },
          ]}
        />
      )}
      <View style={[styles.center, circle, { backgroundColor: color }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
});
