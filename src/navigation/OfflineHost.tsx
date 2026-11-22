import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { OfflineBanner, useToast } from '../components';
import {
  useConnectionChange,
  useOnline,
} from '../core/connectivity/useConnectivity';
import { useAppContainer } from '../di/AppContainer';
import { useTheme } from '../theme';

export function OfflineHost({ children }: { children: ReactNode }) {
  const { connectivityMonitor, favoriteRepository } = useAppContainer();
  const { colors } = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const online = useOnline(connectivityMonitor);

  useConnectionChange(connectivityMonitor, isOnline => {
    if (isOnline) {
      toast.show('Conexão restaurada.', 'success');
      favoriteRepository.syncPending().catch(() => undefined);
    }
  });

  return (
    <View style={styles.fill}>
      {!online && (
        <View
          style={{ paddingTop: insets.top, backgroundColor: colors.surface }}
        >
          <OfflineBanner
            title="Você está offline"
            text="Exibindo dados salvos no dispositivo."
          />
        </View>
      )}
      <SafeAreaInsetsContext.Provider
        value={online ? insets : { ...insets, top: 0 }}
      >
        <View style={styles.fill}>{children}</View>
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
