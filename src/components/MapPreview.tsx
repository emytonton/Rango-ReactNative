import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { Icon } from './Icon';

const PIN_COLOR = '#E53935';
const PULSE_DURATION_MS = 1800;

type MapPreviewProps = {
  imageUrl: string | null;
};

export function MapPreview({ imageUrl }: MapPreviewProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: PULSE_DURATION_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const ring = {
    opacity: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.45, 0],
    }),
    transform: [
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2.4],
        }),
      },
    ],
  };

  return (
    <View style={styles.map}>
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />
      )}
      <Animated.View style={[styles.ring, ring]} />
      <Icon name="locationOn" size={34} color={PIN_COLOR} />
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 132,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'hsla(160, 25%, 82%, 0.7)',
  },
  ring: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PIN_COLOR,
  },
});
