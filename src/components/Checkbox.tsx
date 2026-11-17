import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { Icon } from './Icon';

export function Checkbox({ checked }: { checked: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.box,
        checked
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { borderColor: colors.border },
      ]}
    >
      {checked && <Icon name="check" size={15} color={colors.onPrimary} />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 21,
    height: 21,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
