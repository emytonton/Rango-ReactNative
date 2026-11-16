import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BrandMark,
  InfoBanner,
  PrimaryButton,
  SecondaryButton,
} from '../../components';
import type { SessionRepository } from '../../data/auth/sessionRepository';
import { radius, spacing, useTheme } from '../../theme';
import { useWelcomeViewModel } from './useWelcomeViewModel';

const heroImage = require('../../assets/images/welcome_hero.jpeg');

type WelcomeScreenProps = {
  sessionRepository: SessionRepository;
  onLogin: () => void;
  onSignup: () => void;
  onSessionRestored: () => void;
};

export function WelcomeScreen({
  sessionRepository,
  onLogin,
  onSignup,
  onSessionRestored,
}: WelcomeScreenProps) {
  const state = useWelcomeViewModel({ sessionRepository, onSessionRestored });

  if (state.status === 'checkingSession') {
    return <WelcomeSplash />;
  }
  return (
    <WelcomeContent
      savedSessionName={state.savedSessionName}
      onLogin={onLogin}
      onSignup={onSignup}
    />
  );
}

type WelcomeContentProps = {
  savedSessionName: string | null;
  onLogin: () => void;
  onSignup: () => void;
};

export function WelcomeContent({
  savedSessionName,
  onLogin,
  onSignup,
}: WelcomeContentProps) {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, paddingTop: insets.top },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <BrandMark />
        <Image
          source={heroImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          style={styles.hero}
        />
        <Text
          style={[typography.display, styles.title, { color: colors.text }]}
        >
          {'Comida boa,\nentrega rápida.'}
        </Text>
        <Text
          style={[
            typography.bodyLarge,
            styles.subtitle,
            { color: colors.text2 },
          ]}
        >
          Os melhores restaurantes da sua região em poucos toques. Pediu,
          chegou.
        </Text>
        {savedSessionName !== null && (
          <InfoBanner
            icon="lock"
            text={`Sessão salva com segurança · ${savedSessionName}`}
            style={styles.banner}
          />
        )}
      </ScrollView>
      <View
        style={[
          styles.actions,
          {
            backgroundColor: colors.surface,
            paddingBottom: 30 + insets.bottom,
          },
        ]}
      >
        <PrimaryButton text="Entrar" onPress={onLogin} />
        <SecondaryButton text="Criar conta" onPress={onSignup} />
        <Text
          style={[typography.caption, styles.terms, { color: colors.text2 }]}
        >
          Ao continuar você aceita os Termos de uso e a Política de privacidade.
        </Text>
      </View>
    </View>
  );
}

function WelcomeSplash() {
  const { colors } = useTheme();
  return (
    <View style={[styles.splash, { backgroundColor: colors.surface }]}>
      <BrandMark />
      <ActivityIndicator
        color={colors.primary}
        size="small"
        style={styles.splashIndicator}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 14,
    paddingHorizontal: spacing.screenHorizontal,
  },
  hero: {
    marginTop: 22,
    width: '100%',
    height: 318,
    borderRadius: radius.xl,
  },
  title: { marginTop: 26 },
  subtitle: { marginTop: 10 },
  banner: { marginTop: 18 },
  actions: {
    gap: 11,
    paddingTop: 18,
    paddingHorizontal: spacing.screenHorizontal,
  },
  terms: { textAlign: 'center' },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashIndicator: { marginTop: spacing.xl },
});
