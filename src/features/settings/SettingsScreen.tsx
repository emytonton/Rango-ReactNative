import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsGroup, SettingsRow, TopBar, useToast } from '../../components';
import type { SessionRepository } from '../../data/auth/sessionRepository';
import type { ConnectionRepository } from '../../data/connection/connectionRepository';
import type { FavoriteRepository } from '../../data/favorite/favoriteRepository';
import type { PaymentSelection } from '../../data/payment/paymentSelection';
import type { ProfileRepository } from '../../data/profile/profileRepository';
import type { DataSync } from '../../data/sync/dataSync';
import type { ThemeRepository } from '../../data/theme/themeRepository';
import { useTheme } from '../../theme';
import {
  connectionHint,
  themeLabel,
  useSettingsViewModel,
} from './useSettingsViewModel';

const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

export type SettingsNavigation = {
  onBack: () => void;
  onTheme: () => void;
  onNotifications: () => void;
  onPersonalData: () => void;
  onAddresses: () => void;
  onPayments: () => void;
  onLocalDataCleared: () => void;
  onSessionExpired: () => void;
};

type SettingsScreenProps = {
  profileRepository: ProfileRepository;
  connectionRepository: ConnectionRepository;
  dataSync: DataSync;
  sessionRepository: SessionRepository;
  favoriteRepository: FavoriteRepository;
  paymentSelection: PaymentSelection;
  themeRepository: ThemeRepository;
  navigation: SettingsNavigation;
};

export function SettingsScreen({
  profileRepository,
  connectionRepository,
  dataSync,
  sessionRepository,
  favoriteRepository,
  paymentSelection,
  themeRepository,
  navigation,
}: SettingsScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const viewModel = useSettingsViewModel(
    {
      profile: profileRepository,
      connection: connectionRepository,
      dataSync,
      session: sessionRepository,
      favorites: favoriteRepository,
      paymentSelection,
      theme: themeRepository,
    },
    {
      onMessage: toast.show,
      onLocalDataCleared: navigation.onLocalDataCleared,
      onSessionExpired: navigation.onSessionExpired,
    },
  );
  const { state, refresh } = viewModel;

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar title="Configurações" onBack={navigation.onBack} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 22 + insets.bottom },
        ]}
      >
        <SettingsGroup title="Preferências">
          <SettingsRow
            icon="darkMode"
            label="Tema"
            value={themeLabel(state.theme)}
            onPress={navigation.onTheme}
          />
          <SettingsRow
            icon="notifications"
            label="Notificações"
            onPress={navigation.onNotifications}
            divider
          />
          <SettingsRow
            icon="language"
            label="Idioma"
            value="Português"
            onPress={viewModel.language}
            divider
          />
        </SettingsGroup>
        <SettingsGroup title="Conta">
          <SettingsRow
            icon="person"
            label="Dados pessoais"
            onPress={navigation.onPersonalData}
          />
          <SettingsRow
            icon="locationOn"
            label="Endereços"
            onPress={navigation.onAddresses}
            divider
          />
          <SettingsRow
            icon="wallet"
            label="Formas de pagamento"
            onPress={navigation.onPayments}
            divider
          />
        </SettingsGroup>
        <SettingsGroup title="Dados e conexão">
          <SettingsRow
            icon="wifiOff"
            label="Modo offline"
            hint={connectionHint(state.online)}
            switchChecked={state.online === false}
            showChevron={false}
            onPress={viewModel.checkNow}
          />
          <SettingsRow
            icon="sync"
            label="Sincronizar agora"
            hint={state.syncing ? 'sincronizando...' : viewModel.syncHint}
            onPress={viewModel.sync}
            disabled={state.syncing}
            divider
          />
          <SettingsRow
            icon="deleteSweep"
            label="Limpar dados locais"
            hint="carrinho, favoritos e sessão"
            onPress={viewModel.clearLocalData}
            disabled={state.clearing}
            danger
            divider
          />
        </SettingsGroup>
        <SettingsGroup title="Sobre">
          <SettingsRow
            icon="help"
            label="Central de ajuda"
            onPress={viewModel.help}
          />
          <SettingsRow
            icon="description"
            label="Termos e privacidade"
            onPress={viewModel.terms}
            divider
          />
        </SettingsGroup>
        <Text style={[styles.version, { color: colors.text2 }]}>
          rango v1.0.0 · build 2026.08
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 18, paddingTop: 16, paddingHorizontal: 18 },
  version: { textAlign: 'center', fontFamily: monospace, fontSize: 10 },
});
