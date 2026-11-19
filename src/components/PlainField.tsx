import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type PlainFieldProps = Omit<TextInputProps, 'style'> & {
  placeholder: string;
  error?: string;
  icon?: IconName;
};

export function PlainField({ error, icon, ...inputProps }: PlainFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.box,
          {
            backgroundColor: colors.surface2,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
      >
        {icon && <Icon name={icon} size={18} color={colors.text2} />}
        <TextInput
          accessibilityLabel={inputProps.placeholder}
          placeholderTextColor={colors.text2}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          style={[styles.input, { color: colors.text }]}
          {...inputProps}
        />
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 5 },
  box: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    padding: 0,
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
  },
  error: { paddingLeft: 4, fontFamily: fonts.bold, fontSize: 11.5 },
});
