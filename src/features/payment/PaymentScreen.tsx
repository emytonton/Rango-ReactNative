import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ErrorState,
  IconTile,
  type IconName,
  PrimaryButton,
  RadioCard,
  Skeleton,
  TopBar,
  useToast,
} from '../../components';
import type {
  PaymentRepository,
  PaymentType,
} from '../../data/payment/paymentRepository';
import type { PaymentSelection } from '../../data/payment/paymentSelection';
import { fonts, useTheme } from '../../theme';
import { CardFormCard } from './components/CardFormCard';
import { usePaymentViewModel } from './usePaymentViewModel';

const paymentIcons: Record<PaymentType, IconName> = {
  pix: 'qrCode2',
  credit: 'creditCard',
  debit: 'creditScore',
  cash: 'payments',
};

type PaymentScreenProps = {
  paymentRepository: PaymentRepository;
  paymentSelection: PaymentSelection;
  onBack: () => void;
  onDone: () => void;
  onSessionExpired: () => void;
};

export function PaymentScreen({
  paymentRepository,
  paymentSelection,
  onBack,
  onDone,
  onSessionExpired,
}: PaymentScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const viewModel = usePaymentViewModel(paymentRepository, paymentSelection, {
    onMessage: toast.show,
    onSessionExpired,
    onDone,
  });
  const { state } = viewModel;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <TopBar title="Forma de pagamento" onBack={onBack} />
      {state.errorMessage ? (
        <View style={styles.error}>
          <ErrorState
            message={state.errorMessage}
            actionText="Tentar novamente"
            onAction={viewModel.load}
          />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {state.loading
            ? [0, 1, 2, 3].map(index => (
                <Skeleton key={index} height={70} radius={17} />
              ))
            : state.options.map(option => (
                <RadioCard
                  key={option.id}
                  selected={option.id === state.selectedId}
                  onPress={() => viewModel.select(option.id)}
                  accessibilityLabel={`${option.label}, ${option.hint}`}
                  indicatorAtEnd
                >
                  <IconTile icon={paymentIcons[option.type]} />
                  <View style={styles.texts}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.hint, { color: colors.text2 }]}>
                      {option.hint}
                    </Text>
                  </View>
                </RadioCard>
              ))}
          {viewModel.showCardForm && (
            <CardFormCard
              card={state.card}
              errors={state.cardErrors}
              onChange={viewModel.changeCard}
              onSubmit={viewModel.confirm}
            />
          )}
        </ScrollView>
      )}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: 20 + insets.bottom,
          },
        ]}
      >
        <PrimaryButton
          text="Confirmar forma de pagamento"
          onPress={viewModel.confirm}
          loading={state.saving}
          disabled={state.selectedId === null}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  error: { flex: 1, justifyContent: 'center', paddingHorizontal: 18 },
  content: {
    gap: 11,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  texts: { flex: 1, minWidth: 0, gap: 2 },
  label: { fontFamily: fonts.bold, fontSize: 14 },
  hint: { fontFamily: fonts.medium, fontSize: 11.5 },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 18,
    borderTopWidth: 1,
  },
});
