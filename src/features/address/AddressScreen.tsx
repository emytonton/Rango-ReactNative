import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DashedButton,
  ErrorState,
  Icon,
  MapPreview,
  PrimaryButton,
  RadioCard,
  Skeleton,
  TopBar,
  useToast,
} from '../../components';
import type { AddressRepository } from '../../data/address/addressRepository';
import { fonts, useTheme } from '../../theme';
import { AddressFormCard } from './components/AddressFormCard';
import { useAddressViewModel } from './useAddressViewModel';

type AddressScreenProps = {
  addressRepository: AddressRepository;
  onBack: () => void;
  onSessionExpired: () => void;
};

export function AddressScreen({
  addressRepository,
  onBack,
  onSessionExpired,
}: AddressScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const viewModel = useAddressViewModel(addressRepository, {
    onMessage: toast.show,
    onSessionExpired,
  });
  const { state } = viewModel;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <TopBar title="Endereço de entrega" onBack={onBack} />
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
          <MapPreview imageUrl={viewModel.mapImageUrl} />
          {state.loading ? (
            <>
              <Skeleton height={72} radius={17} />
              <Skeleton height={72} radius={17} />
            </>
          ) : (
            state.addresses.map(address => (
              <RadioCard
                key={address.id}
                selected={address.id === state.selectedId}
                onPress={() => viewModel.select(address.id)}
                accessibilityLabel={`${address.label}, ${address.line}`}
              >
                <View style={styles.texts}>
                  <Text style={[styles.label, { color: colors.primary }]}>
                    {address.label}
                  </Text>
                  <Text style={[styles.line, { color: colors.text }]}>
                    {address.line}
                  </Text>
                  <Text style={[styles.city, { color: colors.text2 }]}>
                    {address.cityLine}
                  </Text>
                </View>
                <Icon name="edit" size={19} color={colors.text2} />
              </RadioCard>
            ))
          )}
          {state.formOpen && (
            <AddressFormCard
              form={state.form}
              errors={state.errors}
              saving={state.saving}
              onChange={viewModel.changeField}
              onSave={viewModel.save}
            />
          )}
          <DashedButton
            text="Cadastrar novo endereço"
            icon="addLocationAlt"
            onPress={viewModel.toggleForm}
          />
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
          text="Usar este endereço"
          onPress={onBack}
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
    gap: 12,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  texts: { flex: 1, minWidth: 0, gap: 2 },
  label: { fontFamily: fonts.extraBold, fontSize: 12 },
  line: { fontFamily: fonts.bold, fontSize: 13.5 },
  city: { fontFamily: fonts.medium, fontSize: 11.5 },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 18,
    borderTopWidth: 1,
  },
});
