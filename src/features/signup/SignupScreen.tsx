import { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type KeyboardTypeOptions,
  type TextInputInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BackButton,
  Checkbox,
  PrimaryButton,
  TextAction,
  TextField,
  useToast,
  type IconName,
} from '../../components';
import type { AuthRepository } from '../../data/auth/authRepository';
import { fonts, useTheme } from '../../theme';
import type { SignupField } from './signupValidation';
import { useSignupViewModel } from './useSignupViewModel';

type FieldSpec = {
  field: SignupField;
  label: string;
  placeholder: string;
  icon: IconName;
  keyboardType: KeyboardTypeOptions;
  password?: boolean;
  autoComplete: 'name' | 'email' | 'tel' | 'new-password';
};

const fieldSpecs: FieldSpec[] = [
  {
    field: 'name',
    label: 'Nome completo',
    placeholder: 'Maria Silva',
    icon: 'person',
    keyboardType: 'default',
    autoComplete: 'name',
  },
  {
    field: 'email',
    label: 'E-mail',
    placeholder: 'voce@email.com',
    icon: 'mail',
    keyboardType: 'email-address',
    autoComplete: 'email',
  },
  {
    field: 'phone',
    label: 'Telefone',
    placeholder: '(11) 90000-0000',
    icon: 'call',
    keyboardType: 'phone-pad',
    autoComplete: 'tel',
  },
  {
    field: 'password',
    label: 'Senha',
    placeholder: 'Mínimo 6 caracteres',
    icon: 'lock',
    keyboardType: 'default',
    password: true,
    autoComplete: 'new-password',
  },
  {
    field: 'passwordConfirmation',
    label: 'Confirmar senha',
    placeholder: 'Repita a senha',
    icon: 'lockReset',
    keyboardType: 'default',
    password: true,
    autoComplete: 'new-password',
  },
];

type SignupScreenProps = {
  authRepository: AuthRepository;
  onBack: () => void;
  onLogin: () => void;
  onRegistered: () => void;
};

export function SignupScreen({
  authRepository,
  onBack,
  onLogin,
  onRegistered,
}: SignupScreenProps) {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const viewModel = useSignupViewModel(authRepository, {
    onMessage: toast.show,
    onRegistered,
  });
  const inputs = useRef<(TextInputInstance | null)[]>([]);

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[
        styles.screen,
        { backgroundColor: colors.surface, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text
          accessibilityRole="header"
          style={[typography.button, { color: colors.text }]}
        >
          Criar conta
        </Text>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 26 + insets.bottom },
        ]}
      >
        {fieldSpecs.map((spec, index) => {
          const last = index === fieldSpecs.length - 1;
          return (
            <TextField
              key={spec.field}
              ref={input => {
                inputs.current[index] = input;
              }}
              label={spec.label}
              placeholder={spec.placeholder}
              icon={spec.icon}
              value={viewModel.form[spec.field]}
              onChangeText={value => viewModel.changeField(spec.field, value)}
              error={viewModel.errors[spec.field]}
              valid={viewModel.isValid(spec.field)}
              secureTextEntry={spec.password}
              keyboardType={spec.keyboardType}
              autoComplete={spec.autoComplete}
              autoCapitalize={spec.field === 'name' ? 'words' : 'none'}
              autoCorrect={false}
              returnKeyType={last ? 'done' : 'next'}
              submitBehavior={last ? 'blurAndSubmit' : 'submit'}
              onSubmitEditing={() => inputs.current[index + 1]?.focus()}
            />
          );
        })}
        <TermsRow
          accepted={viewModel.termsAccepted}
          onToggle={viewModel.toggleTerms}
        />
        <PrimaryButton
          text="Criar conta"
          loadingText="Criando conta..."
          loading={viewModel.loading}
          dimmed={!viewModel.termsAccepted}
          onPress={viewModel.submit}
          style={styles.submit}
        />
        <TextAction prompt="Já tem conta?" action="Entrar" onPress={onLogin} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type TermsRowProps = {
  accepted: boolean;
  onToggle: () => void;
};

function TermsRow({ accepted, onToggle }: TermsRowProps) {
  const { colors, typography } = useTheme();
  const highlight = [styles.termsHighlight, { color: colors.primary }];
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: accepted }}
      onPress={onToggle}
      style={styles.terms}
    >
      <Checkbox checked={accepted} />
      <Text
        style={[typography.label, styles.termsText, { color: colors.text2 }]}
      >
        Li e aceito os <Text style={highlight}>Termos de uso</Text> e a{' '}
        <Text style={highlight}>Política de privacidade</Text>.
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  content: {
    gap: 14,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  terms: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  termsText: {
    flex: 1,
    fontFamily: fonts.medium,
    lineHeight: 17,
  },
  termsHighlight: { fontFamily: fonts.bold },
  submit: { marginTop: 4 },
});
