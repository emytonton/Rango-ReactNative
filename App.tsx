import {
  createNavigationContainerRef,
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type LinkingOptions,
  type Theme,
} from '@react-navigation/native';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from './src/components';
import {
  AppContainerProvider,
  createAppContainer,
} from './src/di/AppContainer';
import { OfflineHost } from './src/navigation/OfflineHost';
import { PushHost } from './src/navigation/PushHost';
import { RootNavigator } from './src/navigation/RootNavigator';
import type { RootStackParamList } from './src/navigation/routes';
import { ThemeProvider, useTheme } from './src/theme';

const container = createAppContainer();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const tabRoutes: string[] = [
  'Home',
  'Search',
  'Orders',
  'Favorites',
  'Profile',
];

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['rango://'],
  config: { screens: { Notifications: 'notifications' } },
};

function openNotifications() {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Notifications');
  }
}

function App() {
  return (
    <SafeAreaProvider>
      <AppContainerProvider container={container}>
        <ThemedApp />
      </AppContainerProvider>
    </SafeAreaProvider>
  );
}

function ThemedApp() {
  const { themeRepository } = container;
  const [onTab, setOnTab] = useState(false);
  const mode = useSyncExternalStore(
    themeRepository.subscribe,
    themeRepository.current,
  );

  useEffect(() => {
    themeRepository.load();
  }, [themeRepository]);

  return (
    <ThemeProvider mode={mode}>
      <ToastProvider aboveTabBar={onTab}>
        <ThemedNavigation onTabChange={setOnTab} />
      </ToastProvider>
    </ThemeProvider>
  );
}

function ThemedNavigation({
  onTabChange,
}: {
  onTabChange: (onTab: boolean) => void;
}) {
  const { colors } = useTheme();
  const base = colors.isDark ? DarkTheme : DefaultTheme;
  const navigationTheme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.surface,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };
  const updateRoute = () =>
    onTabChange(
      tabRoutes.includes(navigationRef.getCurrentRoute()?.name ?? ''),
    );

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={updateRoute}
      onStateChange={updateRoute}
      theme={navigationTheme}
    >
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      <OfflineHost>
        <RootNavigator />
      </OfflineHost>
      <PushHost onOpen={openNotifications} />
    </NavigationContainer>
  );
}

export default App;
