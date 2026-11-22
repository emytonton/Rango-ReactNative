import { useEffect } from 'react';
import { AppState, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DashedButton,
  DashedNote,
  ErrorState,
  SettingsRow,
  Skeleton,
  TopBar,
  useToast,
  type IconName,
} from '../../components';
import type { LocalNotifier } from '../../core/native/localNotifier';
import type { ProfileRepository } from '../../data/profile/profileRepository';
import type { PushWatcher } from '../../data/push/pushWatcher';
import { useTheme } from '../../theme';
import {
  useNotificationSettingsViewModel,
  type NotificationPref,
} from './useNotificationSettingsViewModel';

type PrefOption = {
  key: NotificationPref;
  label: string;
  hint: string;
  icon: IconName;
};

const options: PrefOption[] = [
  {
    key: 'orders',
    label: 'Pedidos',
    hint: 'Confirmação, preparo e entrega',
    icon: 'receiptLong',
  },
  {
    key: 'promos',
    label: 'Promoções',
    hint: 'Cupons e ofertas exclusivas',
    icon: 'localOffer',
  },
  {
    key: 'news',
    label: 'Novidades',
    hint: 'Novos restaurantes e recursos',
    icon: 'campaign',
  },
];

type NotificationSettingsScreenProps = {
  profileRepository: ProfileRepository;
  notifier: LocalNotifier;
  pushWatcher: PushWatcher;
  onBack: () => void;
  onSessionExpired: () => void;
};

export function NotificationSettingsScreen({
  profileRepository,
  notifier,
  pushWatcher,
  onBack,
  onSessionExpired,
}: NotificationSettingsScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const {
    state,
    retry,
    toggle,
    sendTest,
    requestPermission,
    refreshPermission,
  } = useNotificationSettingsViewModel(
    { profile: profileRepository, notifier, pushWatcher },
    { onMessage: toast.show, onSessionExpired },
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', status => {
      if (status === 'active') {
        refreshPermission();
      }
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  const { prefs } = state;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar title="Notificações" onBack={onBack} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 22 + insets.bottom },
        ]}
      >
        {prefs ? (
          <View
            style={[
              styles.group,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {options.map((option, index) => (
              <SettingsRow
                key={option.key}
                icon={option.icon}
                label={option.label}
                hint={option.hint}
                switchChecked={prefs[option.key]}
                showChevron={false}
                divider={index > 0}
                onPress={() => toggle(option.key)}
              />
            ))}
          </View>
        ) : state.errorMessage ? (
          <ErrorState
            message={state.errorMessage}
            actionText="Tentar novamente"
            onAction={retry}
          />
        ) : (
          <Skeleton height={195} radius={20} shimmer />
        )}
        <DashedButton
          text="Enviar notificação de teste"
          icon="notificationsActive"
          onPress={sendTest}
          accent
        />
        {state.permitted ? (
          <DashedNote
            icon="verifiedUser"
            text="Permissão de notificações concedida pelo sistema."
            iconColor={colors.success}
          />
        ) : (
          <DashedNote
            icon="notificationsOff"
            text="Notificações desativadas no sistema. Toque para permitir."
            iconColor={colors.error}
            onPress={requestPermission}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 12, paddingTop: 16, paddingHorizontal: 18 },
  group: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
});
