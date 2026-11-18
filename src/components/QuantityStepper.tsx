import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type QuantityStepperProps = {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
};

export function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
}: QuantityStepperProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.stepper,
        { backgroundColor: colors.surface2, borderColor: colors.border },
      ]}
    >
      <StepButton
        icon="remove"
        accessibilityLabel="Diminuir quantidade"
        onPress={onDecrease}
      />
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <StepButton
        icon="add"
        accessibilityLabel="Aumentar quantidade"
        onPress={onIncrease}
      />
    </View>
  );
}

type StepButtonProps = {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
};

function StepButton({ icon, accessibilityLabel, onPress }: StepButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.surface,
          boxShadow: `0px 1px 3px ${colors.shadow}`,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Icon name={icon} size={19} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    padding: 5,
    borderRadius: 15,
    borderWidth: 1,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    minWidth: 26,
    textAlign: 'center',
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
});
