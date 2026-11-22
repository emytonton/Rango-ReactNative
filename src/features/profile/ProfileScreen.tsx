import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Avatar,
  BadgeIconButton,
  BottomBar,
  ErrorState,
  MenuRow,
  OutlineButton,
  Skeleton,
  useToast,
  type BottomTab,
} from '../../components';
import { initialsOf } from '../../core/format/formatters';
import type { AddressRepository } from '../../data/address/addressRepository';
import type { SessionRepository } from '../../data/auth/sessionRepository';
import type { ThemeRepository } from '../../data/theme/themeRepository';
import type { PaymentRepository } from '../../data/payment/paymentRepository';
import type { ProfileRepository } from '../../data/profile/profileRepository';
import { fonts, useTheme } from '../../theme';
import { profileHints, useProfileViewModel } from './useProfileViewModel';

export type ProfileNavigation = {
  onNotifications: () => void;
  onEditProfile: () => void;
  onAddresses: () => void;
  onPayments: () => void;
  onSettings: () => void;
  onTheme: () => void;
  onTab: (tab: BottomTab) => void;
  onLoggedOut: () => void;
  onSessionExpired: () => void;
};

type ProfileScreenProps = {
  profileRepository: ProfileRepository;
  addressRepository: AddressRepository;
  paymentRepository: PaymentRepository;
  sessionRepository: SessionRepository;
  themeRepository: ThemeRepository;
  navigation: ProfileNavigation;
};

export function ProfileScreen({
  profileRepository,
  addressRepository,
  paymentRepository,
  sessionRepository,
  themeRepository,
  navigation,
}: ProfileScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const viewModel = useProfileViewModel(
    {
      profile: profileRepository,
      addresses: addressRepository,
      payments: paymentRepository,
      session: sessionRepository,
      theme: themeRepository,
    },
    {
      onMessage: toast.show,
      onLoggedOut: navigation.onLoggedOut,
      onSessionExpired: navigation.onSessionExpired,
    },
  );
  const { state, refresh } = viewModel;
  const hints = profileHints(state);
  const hint = (text: string) => (state.loaded ? text : null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={{ height: insets.top, backgroundColor: colors.surface }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>Perfil</Text>
            <BadgeIconButton
              icon="notifications"
              accessibilityLabel="Notificações"
              onPress={navigation.onNotifications}
              showDot={state.unreadCount > 0}
              compact
            />
          </View>
          {state.loaded ? (
            <View style={styles.account}>
              <Avatar
                initials={initialsOf(state.name)}
                imageUrl={state.avatarUrl}
              />
              <View style={styles.accountTexts}>
                <Text style={[styles.name, { color: colors.text }]}>
                  {state.name}
                </Text>
                <Text style={[styles.detail, { color: colors.text2 }]}>
                  {state.email}
                </Text>
                {state.phone.length > 0 && (
                  <Text style={[styles.detail, { color: colors.text2 }]}>
                    {state.phone}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.account}>
              <Skeleton width={66} height={66} radius={22} />
              <View style={styles.accountTexts}>
                <Skeleton height={58} radius={12} />
              </View>
            </View>
          )}
          <OutlineButton
            text="Editar perfil"
            onPress={navigation.onEditProfile}
          />
        </View>
        <View style={styles.menu}>
          {state.errorMessage ? (
            <ErrorState
              message={state.errorMessage}
              actionText="Tentar novamente"
              onAction={viewModel.retry}
            />
          ) : (
            <>
              <MenuRow
                icon="person"
                label="Editar perfil"
                hint="nome, e-mail e telefone"
                onPress={navigation.onEditProfile}
              />
              <MenuRow
                icon="locationOn"
                label="Endereços"
                hint={hint(hints.addresses)}
                onPress={navigation.onAddresses}
              />
              <MenuRow
                icon="wallet"
                label="Formas de pagamento"
                hint={hint(hints.payments)}
                onPress={navigation.onPayments}
              />
              <MenuRow
                icon="settings"
                label="Configurações"
                onPress={navigation.onSettings}
              />
              <MenuRow
                icon="notifications"
                label="Notificações"
                hint={hint(hints.notifications)}
                onPress={navigation.onNotifications}
              />
              <MenuRow
                icon="darkMode"
                label="Tema"
                hint={hint(hints.theme)}
                onPress={navigation.onTheme}
              />
              <MenuRow icon="help" label="Ajuda" onPress={viewModel.help} />
              <MenuRow
                icon="logout"
                label="Sair da conta"
                onPress={viewModel.logout}
                danger
              />
            </>
          )}
        </View>
      </ScrollView>
      <BottomBar selected="profile" onSelect={navigation.onTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    gap: 15,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontFamily: fonts.extraBold, fontSize: 21, letterSpacing: -0.6 },
  account: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  accountTexts: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontFamily: fonts.extraBold, fontSize: 17.5, letterSpacing: -0.4 },
  detail: { fontFamily: fonts.medium, fontSize: 12.5 },
  menu: { gap: 8, paddingTop: 14, paddingHorizontal: 18, paddingBottom: 20 },
});
