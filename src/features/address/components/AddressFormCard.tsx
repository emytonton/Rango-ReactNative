import { StyleSheet, Text, View } from 'react-native';
import { PlainField, PrimaryButton } from '../../../components';
import { fonts, useTheme } from '../../../theme';
import type {
  AddressField,
  AddressForm,
  AddressState,
} from '../useAddressViewModel';

type AddressFormCardProps = {
  form: AddressForm;
  errors: AddressState['errors'];
  saving: boolean;
  onChange: (field: AddressField, value: string) => void;
  onSave: () => void;
};

export function AddressFormCard({
  form,
  errors,
  saving,
  onChange,
  onSave,
}: AddressFormCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.primary },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Novo endereço</Text>
      <PlainField
        value={form.cep}
        onChangeText={value => onChange('cep', value)}
        placeholder="CEP"
        error={errors.cep}
        keyboardType="number-pad"
        returnKeyType="next"
      />
      <PlainField
        value={form.street}
        onChangeText={value => onChange('street', value)}
        placeholder="Rua e número"
        error={errors.street}
        returnKeyType="next"
      />
      <PlainField
        value={form.complement}
        onChangeText={value => onChange('complement', value)}
        placeholder="Complemento"
        error={errors.complement}
        returnKeyType="next"
      />
      <PlainField
        value={form.district}
        onChangeText={value => onChange('district', value)}
        placeholder="Bairro e cidade"
        error={errors.district}
        returnKeyType="done"
        onSubmitEditing={onSave}
      />
      <PrimaryButton
        text="Salvar endereço"
        onPress={onSave}
        loading={saving}
        style={styles.save}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 11,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  title: { fontFamily: fonts.extraBold, fontSize: 13.5 },
  save: { height: 48, borderRadius: 15 },
});
