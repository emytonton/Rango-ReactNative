import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '../../../components';
import { fonts, useTheme } from '../../../theme';

type CouponFieldProps = {
  value: string;
  applied: boolean;
  onChange: (value: string) => void;
  onApply: () => void;
};

export function CouponField({
  value,
  applied,
  onChange,
  onApply,
}: CouponFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.box,
          {
            backgroundColor: colors.surface2,
            borderColor: applied ? colors.success : colors.border,
          },
        ]}
      >
        <Icon name="confirmationNumber" size={19} color={colors.text2} />
        <TextInput
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onApply}
          placeholder="Cupom promocional"
          placeholderTextColor={colors.text2}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          style={[styles.input, { color: colors.text }]}
        />
        {applied && (
          <Icon name="checkCircle" size={19} color={colors.success} />
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onApply}
        style={({ pressed }) => [
          styles.apply,
          { borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={[styles.applyText, { color: colors.primary }]}>
          Aplicar
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 9 },
  box: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    fontFamily: fonts.bold,
    fontSize: 13.5,
  },
  apply: {
    height: 50,
    paddingHorizontal: 18,
    borderRadius: 15,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  applyText: { fontFamily: fonts.bold, fontSize: 13.5 },
});
