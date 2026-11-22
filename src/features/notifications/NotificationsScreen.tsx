import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  EmptyState,
  ErrorState,
  NotificationCard,
  Skeleton,
  TopBar,
  useToast,
} from '../../components';
import type { NotificationRepository } from '../../data/notification/notificationRepository';
import type { PushWatcher } from '../../data/push/pushWatcher';
import { fonts, useTheme } from '../../theme';
import {
  isNotificationsEmpty,
  unreadLabel,
  useNotificationsViewModel,
} from './useNotificationsViewModel';

type NotificationsScreenProps = {
  notificationRepository: NotificationRepository;
  pushWatcher: PushWatcher;
  onBack: () => void;
  onOpenOrder: (code: string) => void;
  onSessionExpired: () => void;
};

export function NotificationsScreen({
  notificationRepository,
  pushWatcher,
  onBack,
  onOpenOrder,
  onSessionExpired,
}: NotificationsScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const viewModel = useNotificationsViewModel(
    notificationRepository,
    pushWatcher,
    { onMessage: toast.show, onOpenOrder, onSessionExpired },
  );
  const { state, refresh } = viewModel;

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar
        title="Notificações"
        subtitle={state.loaded ? unreadLabel(state.items) : undefined}
        onBack={onBack}
        trailing={
          <Pressable
            accessibilityRole="button"
            onPress={viewModel.readAll}
            disabled={!state.loaded}
            hitSlop={8}
          >
            <Text style={[styles.readAll, { color: colors.primary }]}>
              Marcar todas como lidas
            </Text>
          </Pressable>
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 20 + insets.bottom },
        ]}
      >
        {state.items.length > 0 ? (
          state.items.map(item => (
            <NotificationCard
              key={item.id}
              title={item.title}
              text={item.text}
              time={item.time}
              tone={item.tone}
              unread={item.unread}
              onPress={() => viewModel.open(item.id)}
            />
          ))
        ) : isNotificationsEmpty(state) ? (
          <EmptyState
            icon="notifications"
            title="Nenhuma notificação"
            message="Avisos sobre seus pedidos e promoções aparecem aqui."
          />
        ) : state.errorMessage ? (
          <ErrorState
            message={state.errorMessage}
            actionText="Tentar novamente"
            onAction={viewModel.retry}
          />
        ) : (
          [0, 1, 2, 3].map(index => (
            <Skeleton key={index} height={92} radius={18} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  readAll: {
    maxWidth: 100,
    textAlign: 'right',
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  content: { gap: 10, paddingTop: 14, paddingHorizontal: 18 },
});
