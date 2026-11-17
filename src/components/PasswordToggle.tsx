import { Pressable } from 'react-native';
import { useTheme } from '../theme';
import { Icon } from './Icon';

type PasswordToggleProps = {
  visible: boolean;
  onToggle: () => void;
};

export function PasswordToggle({ visible, onToggle }: PasswordToggleProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
      onPress={onToggle}
      hitSlop={10}
    >
      <Icon
        name={visible ? 'visibilityOff' : 'visibility'}
        size={20}
        color={colors.text2}
      />
    </Pressable>
  );
}
