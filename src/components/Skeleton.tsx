import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
} from 'react-native';
import { useTheme } from '../theme';

const SHIMMER_DURATION_MS = 1150;
const SHIMMER_WIDTH = 130;

type SkeletonProps = {
  width?: DimensionValue;
  height: number;
  radius?: number;
  shimmer?: boolean;
};

export function Skeleton({
  width = '100%',
  height,
  radius = 5,
  shimmer = false,
}: SkeletonProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.box,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.skeleton,
        },
      ]}
    >
      {shimmer && <Shimmer />}
    </View>
  );
}

function Shimmer() {
  const [boxWidth, setBoxWidth] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: SHIMMER_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-SHIMMER_WIDTH, boxWidth],
  });

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={event => setBoxWidth(event.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.band, { transform: [{ translateX }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
  band: {
    width: SHIMMER_WIDTH,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
  },
});
