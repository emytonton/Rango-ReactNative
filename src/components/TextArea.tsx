import { StyleSheet, TextInput } from 'react-native';
import { fonts, useTheme } from '../theme';

type TextAreaProps = {
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  maxLength?: number;
};

export function TextArea({
  value,
  placeholder,
  onChangeText,
  maxLength,
}: TextAreaProps) {
  const { colors } = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.text2}
      maxLength={maxLength}
      multiline
      textAlignVertical="top"
      style={[
        styles.area,
        {
          backgroundColor: colors.surface2,
          borderColor: colors.border,
          color: colors.text,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  area: {
    minHeight: 78,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 1.5,
    fontFamily: fonts.medium,
    fontSize: 13.5,
  },
});
