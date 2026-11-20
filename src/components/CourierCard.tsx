import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';
import { ProductImage } from './ProductImage';

type CourierCardProps = {
  name: string;
  subtitle: string;
  photoUrl: string | null;
  onChat: () => void;
  onCall: () => void;
};

export function CourierCard({
  name,
  subtitle,
  photoUrl,
  onChat,
  onCall,
}: CourierCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <ProductImage imageUrl={photoUrl} hue={250} style={styles.photo} />
      <View style={styles.texts}>
        <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.subtitle, { color: colors.text2 }]}>
          {subtitle}
        </Text>
      </View>
      <ContactButton
        icon="chatBubbleOutline"
        label="Conversar com o entregador"
        onPress={onChat}
        background={colors.surface}
        tint={colors.primary}
        borderColor={colors.border}
      />
      <ContactButton
        icon="call"
        label="Ligar para o entregador"
        onPress={onCall}
        background={colors.primary}
        tint={colors.onPrimary}
        borderColor={colors.primary}
      />
    </View>
  );
}

type ContactButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  background: string;
  tint: string;
  borderColor: string;
};

function ContactButton({
  icon,
  label,
  onPress,
  background,
  tint,
  borderColor,
}: ContactButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: background,
          borderColor,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Icon name={icon} size={20} color={tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
  },
  photo: { width: 44, height: 44, borderRadius: 22 },
  texts: { flex: 1, gap: 1 },
  name: { fontFamily: fonts.bold, fontSize: 13.5 },
  subtitle: { fontFamily: fonts.semiBold, fontSize: 11.5 },
  button: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
