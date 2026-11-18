import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type QuantityStepperProps = {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  compact?: boolean;
};

export function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
  compact = false,
}: QuantityStepperProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.stepper,
        compact && styles.stepperCompact,
        { backgroundColor: colors.surface2, borderColor: colors.border },
      ]}
    >
      <StepButton
        icon="remove"
        accessibilityLabel="Diminuir quantidade"
        onPress={onDecrease}
        compact={compact}
      />
      <Text
        style={[
          styles.value,
          compact && styles.valueCompact,
          { color: colors.text },
        ]}
      >
        {value}
      </Text>
      <StepButton
        icon="add"
        accessibilityLabel="Aumentar quantidade"
        onPress={onIncrease}
        compact={compact}
      />
    </View>
  );
}

type StepButtonProps = {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  compact: boolean;
};

function StepButton({
  icon,
  accessibilityLabel,
  onPress,
  compact,
}: StepButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        {
          backgroundColor: colors.surface,
          boxShadow: compact ? undefined : `0px 1px 3px ${colors.shadow}`,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Icon name={icon} size={compact ? 17 : 19} color={colors.text} />
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
  stepperCompact: { gap: 2, padding: 3, borderRadius: 12 },
  button: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: { width: 28, height: 28, borderRadius: 9 },
  value: {
    minWidth: 26,
    textAlign: 'center',
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  valueCompact: { minWidth: 22, fontSize: 13.5 },
});
