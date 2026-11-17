import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

export type ToastKind = 'success' | 'warning' | 'error';

type ToastMessage = { text: string; kind: ToastKind; id: number };

type ToastContextValue = {
  show(text: string, kind?: ToastKind): void;
};

const TOAST_DURATION_MS = 2600;

const accents: Record<ToastKind, string> = {
  success: '#31C25C',
  warning: '#FF8A34',
  error: '#FF5F58',
};

const icons: Record<ToastKind, IconName> = {
  success: 'checkCircle',
  warning: 'info',
  error: 'error',
};

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const nextId = useRef(0);

  const show = useCallback((text: string, kind: ToastKind = 'success') => {
    nextId.current += 1;
    setMessage({ text, kind, id: nextId.current });
  }, []);

  const hide = useCallback(() => setMessage(null), []);
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message && (
        <ToastHost key={message.id} message={message} onHidden={hide} />
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

type ToastHostProps = {
  message: ToastMessage;
  onHidden: () => void;
};

function ToastHost({ message, onHidden }: ToastHostProps) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.delay(TOAST_DURATION_MS),
      Animated.timing(progress, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => finished && onHidden());
    return () => animation.stop();
  }, [progress, onHidden]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.host,
        { bottom: insets.bottom + 30, opacity: progress },
        { transform: [{ translateY }] },
      ]}
    >
      <Toast text={message.text} kind={message.kind} />
    </Animated.View>
  );
}

export function Toast({ text, kind }: { text: string; kind: ToastKind }) {
  const { colors, typography } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        { backgroundColor: colors.isDark ? '#2C2E33' : '#26262A' },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: accents[kind] }]} />
      <View style={styles.content}>
        <Icon name={icons[kind]} size={20} color="#FFFFFF" />
        <Text style={[typography.label, styles.text]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  toast: {
    flexDirection: 'row',
    borderRadius: 15,
    overflow: 'hidden',
  },
  accent: { width: 3 },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  text: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 17,
  },
});
