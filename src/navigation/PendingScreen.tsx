import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, SecondaryButton } from '../components';
import { spacing, useTheme } from '../theme';
import { routeTitles, type RootStackParamList } from './routes';

type PendingScreenProps = {
  shortcutText?: string;
  onShortcut?: () => void;
};

export function PendingScreen({
  shortcutText,
  onShortcut,
}: PendingScreenProps) {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const title = routeTitles[route.name as keyof RootStackParamList];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <Text style={[typography.title, { color: colors.text }]}>{title}</Text>
      <Text
        style={[typography.bodyLarge, styles.message, { color: colors.text2 }]}
      >
        Esta tela ainda não foi implementada.
      </Text>
      {shortcutText && onShortcut && (
        <PrimaryButton text={shortcutText} onPress={onShortcut} />
      )}
      {navigation.canGoBack() && (
        <SecondaryButton text="Voltar" onPress={navigation.goBack} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screenHorizontal,
  },
  message: { textAlign: 'center' },
});
