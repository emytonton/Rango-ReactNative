import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SettingsRow,
  ThemePreview,
  TopBar,
  type IconName,
} from '../../components';
import type { ThemeRepository } from '../../data/theme/themeRepository';
import { darkColors, lightColors, useTheme, type ThemeMode } from '../../theme';
import { isPreviewActive, useThemeViewModel } from './useThemeViewModel';

type ThemeOption = {
  key: ThemeMode;
  label: string;
  hint: string;
  icon: IconName;
};

const options: ThemeOption[] = [
  {
    key: 'light',
    label: 'Claro',
    hint: 'Fundo branco, laranja de destaque',
    icon: 'lightMode',
  },
  {
    key: 'dark',
    label: 'Escuro',
    hint: 'Fundo escuro, laranja preservado',
    icon: 'darkMode',
  },
  {
    key: 'system',
    label: 'Usar configuração do sistema',
    hint: 'Segue o tema do smartphone',
    icon: 'brightnessAuto',
  },
];

type ThemeScreenProps = {
  themeRepository: ThemeRepository;
  onBack: () => void;
  onSessionExpired: () => void;
};

export function ThemeScreen({
  themeRepository,
  onBack,
  onSessionExpired,
}: ThemeScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const systemDark = useColorScheme() === 'dark';
  const { theme, select } = useThemeViewModel(themeRepository, {
    onSessionExpired,
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar title="Tema" onBack={onBack} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 22 + insets.bottom },
        ]}
      >
        <View style={styles.previews}>
          <ThemePreview
            name="Claro"
            palette={lightColors}
            selected={isPreviewActive(theme, false, systemDark)}
          />
          <ThemePreview
            name="Escuro"
            palette={darkColors}
            selected={isPreviewActive(theme, true, systemDark)}
          />
        </View>
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
              radioSelected={theme === option.key}
              showChevron={false}
              divider={index > 0}
              onPress={() => select(option.key)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 16, paddingTop: 16, paddingHorizontal: 18 },
  previews: { flexDirection: 'row', gap: 11 },
  group: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
});
