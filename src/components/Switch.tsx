import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

const TRACK_WIDTH = 40;
const KNOB_SIZE = 18;
const PADDING = 2.5;
const TRAVEL = TRACK_WIDTH - KNOB_SIZE - PADDING * 2;

type SwitchProps = {
  checked: boolean;
};

export function Switch({ checked }: SwitchProps) {
  const { colors } = useTheme();
  const position = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(position, {
      toValue: checked ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [checked, position]);

  return (
    <View
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      style={[
        styles.track,
        { backgroundColor: checked ? colors.primary : colors.border },
      ]}
    >
      <Animated.View
        style={[
          styles.knob,
          {
            transform: [
              {
                translateX: position.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, TRAVEL],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: 23,
    borderRadius: 12,
    padding: PADDING,
    justifyContent: 'center',
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#FFFFFF',
  },
});
