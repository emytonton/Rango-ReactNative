import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type RangoColors } from './colors';
import { typography, type RangoTypography } from './typography';

export type ThemeMode = 'light' | 'dark' | 'system';

export type RangoTheme = {
  colors: RangoColors;
  typography: RangoTypography;
};

const ThemeContext = createContext<RangoTheme>({
  colors: lightColors,
  typography,
});

type ThemeProviderProps = {
  mode?: ThemeMode;
  children: ReactNode;
};

export function ThemeProvider({
  mode = 'system',
  children,
}: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  const theme = useMemo<RangoTheme>(
    () => ({ colors: isDark ? darkColors : lightColors, typography }),
    [isDark],
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): RangoTheme {
  return useContext(ThemeContext);
}
