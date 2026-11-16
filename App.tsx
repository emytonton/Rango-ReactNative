import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  AppContainerProvider,
  createAppContainer,
} from './src/di/AppContainer';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/theme';

const container = createAppContainer();

function App() {
  return (
    <SafeAreaProvider>
      <AppContainerProvider container={container}>
        <ThemeProvider>
          <ThemedNavigation />
        </ThemeProvider>
      </AppContainerProvider>
    </SafeAreaProvider>
  );
}

function ThemedNavigation() {
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

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default App;
