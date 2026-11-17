import { useEffect, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  View,
  type ViewInstance,
} from 'react-native';
import {
  clearSystemGestureExclusion,
  excludeSystemGestures,
} from '../core/native/gestureExclusion';
import { useTheme } from '../theme';

const THUMB_SIZE = 20;

type SliderProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  exclusionKey?: number;
};

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  exclusionKey,
}: SliderProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const container = useRef<ViewInstance>(null);

  useEffect(() => {
    if (exclusionKey === undefined) {
      return;
    }
    container.current?.measureInWindow((x, y, w, h) =>
      excludeSystemGestures(x, y, w, h),
    );
    return clearSystemGestureExclusion;
  }, [exclusionKey]);
  const latest = useRef({ width, min, max, step, onChange });
  latest.current = { width, min, max, step, onChange };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: event => update(event.nativeEvent.locationX),
      onPanResponderMove: event => update(event.nativeEvent.locationX),
    }),
  ).current;

  function update(x: number) {
    const current = latest.current;
    const usable = current.width - THUMB_SIZE;
    if (usable <= 0) {
      return;
    }
    const fraction = Math.min(Math.max((x - THUMB_SIZE / 2) / usable, 0), 1);
    const raw = current.min + fraction * (current.max - current.min);
    current.onChange(Math.round(raw / current.step) * current.step);
  }

  const fraction = (value - min) / (max - min);
  const offset = fraction * Math.max(width - THUMB_SIZE, 0);

  return (
    <View
      ref={container}
      accessibilityRole="adjustable"
      accessibilityValue={{ min, max, now: value }}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      style={styles.container}
      {...responder.panHandlers}
    >
      <View
        pointerEvents="none"
        style={[styles.track, { backgroundColor: colors.border }]}
      >
        <View
          style={[
            styles.fill,
            { width: offset, backgroundColor: colors.primary },
          ]}
        />
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.thumb,
          {
            left: offset,
            backgroundColor: colors.primary,
            borderColor: colors.surface,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 32, justifyContent: 'center' },
  track: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: THUMB_SIZE / 2,
    overflow: 'hidden',
  },
  fill: { height: 4 },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.25)',
  },
});
