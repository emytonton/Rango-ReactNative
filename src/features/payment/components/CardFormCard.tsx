import { Platform, StyleSheet, Text, View } from 'react-native';
import { Icon, PlainField } from '../../../components';
import { fonts, useTheme } from '../../../theme';
import { formatCardNumber, formatExpiryCvv } from '../cardInput';
import type { CardField, CardForm, PaymentState } from '../usePaymentViewModel';

const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

type CardFormCardProps = {
  card: CardForm;
  errors: PaymentState['cardErrors'];
  onChange: (field: CardField, value: string) => void;
  onSubmit: () => void;
};

export function CardFormCard({
  card,
  errors,
  onChange,
  onSubmit,
}: CardFormCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Dados do cartão
      </Text>
      <PlainField
        value={formatCardNumber(card.number)}
        onChangeText={value => onChange('number', value)}
        placeholder="Número do cartão"
        icon="creditCard"
        error={errors.number}
        keyboardType="number-pad"
        returnKeyType="next"
      />
      <PlainField
        value={card.holder}
        onChangeText={value => onChange('holder', value)}
        placeholder="Nome impresso no cartão"
        icon="person"
        error={errors.holder}
        autoCapitalize="characters"
        returnKeyType="next"
      />
      <PlainField
        value={formatExpiryCvv(card.expiryCvv)}
        onChangeText={value => onChange('expiryCvv', value)}
        placeholder="Validade e CVV"
        icon="calendarMonth"
        error={errors.expiryCvv}
        keyboardType="number-pad"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      <View style={styles.secure}>
        <Icon name="lock" size={17} color={colors.success} />
        <Text style={[styles.secureText, { color: colors.text2 }]}>
          dados enviados por conexão segura
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 11,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
  },
  title: { fontFamily: fonts.extraBold, fontSize: 13 },
  secure: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secureText: { fontFamily: monospace, fontSize: 10 },
});
