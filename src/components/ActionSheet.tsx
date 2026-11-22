import { useEffect, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

export type SheetAction = {
  icon: IconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

type ActionSheetProps = {
  visible: boolean;
  title: string;
  actions: SheetAction[];
  cancelText: string;
  onDismiss: () => void;
};

export function ActionSheet({
  visible,
  title,
  actions,
  cancelText,
  onDismiss,
}: ActionSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const offset = useRef(new Animated.Value(400)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }
    offset.setValue(400);
    backdrop.setValue(0);
    Animated.parallel([
      Animated.spring(offset, {
        toValue: 0,
        damping: 22,
        stiffness: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismiss();
      return true;
    });
    return () => back.remove();
  }, [visible, offset, backdrop, onDismiss]);

  if (!visible) {
    return null;
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdrop }]}>
        <Pressable
          accessibilityLabel={cancelText}
          onPress={onDismiss}
          style={[StyleSheet.absoluteFill, styles.backdrop]}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            paddingBottom: 18 + insets.bottom,
            transform: [{ translateY: offset }],
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.text }]}
        >
          {title}
        </Text>
        {actions.map(action => {
          const tint = action.danger ? colors.error : colors.primary;
          return (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              onPress={action.onPress}
              style={[
                styles.row,
                {
                  backgroundColor: colors.surface2,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: action.danger
                      ? `${colors.error}1F`
                      : colors.soft,
                  },
                ]}
              >
                <Icon name={action.icon} size={19} color={tint} />
              </View>
              <Text
                style={[
                  styles.label,
                  { color: action.danger ? colors.error : colors.text },
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={onDismiss}
          style={[styles.cancel, { borderColor: colors.border }]}
        >
          <Text style={[styles.cancelText, { color: colors.text }]}>
            {cancelText}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  sheet: {
    gap: 12,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  handle: { alignSelf: 'center', width: 44, height: 4.5, borderRadius: 3 },
  title: { fontFamily: fonts.extraBold, fontSize: 16, paddingHorizontal: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontFamily: fonts.bold, fontSize: 14.5 },
  cancel: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontFamily: fonts.bold, fontSize: 14.5 },
});
