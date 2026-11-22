import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { Avatar } from './Avatar';
import { Icon } from './Icon';

type EditableAvatarProps = {
  initials: string;
  imageUrl?: string | null;
  onPress: () => void;
  loading?: boolean;
  accessibilityLabel: string;
};

export function EditableAvatar({
  initials,
  imageUrl,
  onPress,
  loading = false,
  accessibilityLabel,
}: EditableAvatarProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: loading }}
      onPress={loading ? undefined : onPress}
    >
      <Avatar
        initials={initials}
        imageUrl={imageUrl}
        size={106}
        radius={34}
        fontSize={30}
      />
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size={28} color="#FFFFFF" />
        </View>
      )}
      <View
        style={[
          styles.badge,
          { backgroundColor: colors.primary, borderColor: colors.surface },
        ]}
      >
        <Icon name="photoCamera" size={17} color={colors.onPrimary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFill,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
