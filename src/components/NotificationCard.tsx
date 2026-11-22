import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

export type NotificationTone = 'order' | 'promo' | 'news';

type NotificationCardProps = {
  title: string;
  text: string;
  time: string;
  tone: NotificationTone;
  unread: boolean;
  onPress: () => void;
};

const PROMO_TILE = 'rgba(34, 164, 71, 0.14)';

const toneIcons: Record<NotificationTone, IconName> = {
  order: 'deliveryDining',
  promo: 'localOffer',
  news: 'campaign',
};

export function NotificationCard({
  title,
  text,
  time,
  tone,
  unread,
  onPress,
}: NotificationCardProps) {
  const { colors } = useTheme();
  const promo = tone === 'promo';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${text}`}
      accessibilityState={{ selected: unread }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: unread ? colors.soft : colors.surface,
          borderColor: unread ? colors.primary : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: promo ? PROMO_TILE : colors.soft },
        ]}
      >
        <Icon
          name={toneIcons[tone]}
          size={19}
          color={promo ? colors.success : colors.primary}
        />
      </View>
      <View style={styles.texts}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontFamily: unread ? fonts.extraBold : fonts.semiBold,
            },
          ]}
        >
          {title}
        </Text>
        <Text style={[styles.text, { color: colors.text2 }]}>{text}</Text>
        <Text style={[styles.time, { color: colors.text2 }]}>{time}</Text>
      </View>
      {unread && (
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, minWidth: 0, gap: 3 },
  title: { fontSize: 13.5 },
  text: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17 },
  time: { fontFamily: fonts.semiBold, fontSize: 10.5 },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 4 },
});
