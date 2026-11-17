import { NativeModules, Platform } from 'react-native';

type GestureExclusionModule = {
  exclude(x: number, y: number, width: number, height: number): void;
  clear(): void;
};

const native: GestureExclusionModule | undefined =
  Platform.OS === 'android' ? NativeModules.GestureExclusion : undefined;

export function excludeSystemGestures(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  native?.exclude(x, y, width, height);
}

export function clearSystemGestureExclusion() {
  native?.clear();
}
