import { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInputInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BackButton,
  CheckboxLabel,
  PasswordToggle,
  PrimaryButton,
  TextAction,
  TextField,
  useToast,
} from '../../components';
import type { AuthRepository } from '../../data/auth/authRepository';
import { fonts, useTheme } from '../../theme';
import { useLoginViewModel } from './useLoginViewModel';

type LoginScreenProps = {
  authRepository: AuthRepository;
  onBack: () => void;
  onSignup: () => void;
  onLoggedIn: () => void;
};

export function LoginScreen({
  authRepository,
  onBack,
  onSignup,
  onLoggedIn,
}: LoginScreenProps) {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const viewModel = useLoginViewModel(authRepository, {
    onMessage: toast.show,
    onLoggedIn,
  });
  const passwordInput = useRef<TextInputInstance>(null);

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
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 24 + insets.bottom },
        ]}
      >
        <View>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: colors.text }]}
          >
            Bem-vinda de volta
          </Text>
          <Text
            style={[typography.body, styles.subtitle, { color: colors.text2 }]}
          >
            Entre para continuar seus pedidos.
          </Text>
          <View style={styles.form}>
            <TextField
              label="E-mail"
              placeholder="voce@email.com"
              icon="mail"
              value={viewModel.email}
              onChangeText={viewModel.changeEmail}
              error={viewModel.errors.email}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordInput.current?.focus()}
            />
            <TextField
              ref={passwordInput}
              label="Senha"
              placeholder="Sua senha"
              icon="lock"
              value={viewModel.password}
              onChangeText={viewModel.changePassword}
              error={viewModel.errors.password}
              secureTextEntry={!viewModel.passwordVisible}
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              onSubmitEditing={viewModel.submit}
              trailing={
                <PasswordToggle
                  visible={viewModel.passwordVisible}
                  onToggle={viewModel.togglePasswordVisible}
                />
              }
            />
            <View style={styles.options}>
              <CheckboxLabel
                checked={viewModel.keepSignedIn}
                label="Manter conectado"
                onToggle={viewModel.toggleKeepSignedIn}
              />
              <Pressable
                accessibilityRole="button"
                onPress={viewModel.forgotPassword}
                hitSlop={8}
              >
                <Text
                  style={[
                    typography.label,
                    styles.forgot,
                    { color: colors.primary },
                  ]}
                >
                  Esqueci minha senha
                </Text>
              </Pressable>
            </View>
            <PrimaryButton
              text="Entrar"
              loadingText="Entrando..."
              loading={viewModel.loading}
              successText={viewModel.success ? 'Bem-vinda!' : undefined}
              onPress={viewModel.submit}
              style={styles.submit}
            />
          </View>
        </View>
        <View style={styles.footer}>
          <TextAction
            prompt="Não tem conta?"
            action="Criar conta"
            onPress={onSignup}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 22, paddingTop: 8 },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 27,
    letterSpacing: -0.9,
  },
  subtitle: { marginTop: 7 },
  form: { marginTop: 24, gap: 15 },
  options: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  forgot: { fontFamily: fonts.bold, fontSize: 12.5 },
  submit: { marginTop: 4 },
  footer: { paddingTop: 22 },
});
