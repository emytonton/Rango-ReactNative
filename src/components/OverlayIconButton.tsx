import { Pressable, StyleSheet } from 'react-native';
import { Icon, type IconName } from './Icon';

type OverlayIconButtonProps = {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  color?: string;
};

export function OverlayIconButton({
  icon,
  accessibilityLabel,
  onPress,
  color = '#1F1F1F',
}: OverlayIconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.button}
    >
      <Icon name={icon} size={21} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.18)',
  },
});
