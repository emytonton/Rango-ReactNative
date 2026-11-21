import { Image, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';

type AvatarProps = {
  initials: string;
  imageUrl?: string | null;
  size?: number;
  radius?: number;
  fontSize?: number;
};

export function Avatar({
  initials,
  imageUrl,
  size = 66,
  radius = 22,
  fontSize = 21,
}: AvatarProps) {
  const { colors } = useTheme();
  const frame = { width: size, height: size, borderRadius: radius };
  return (
    <View
      style={[
        styles.avatar,
        frame,
        { backgroundColor: colors.soft, borderColor: colors.border },
      ]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[StyleSheet.absoluteFill, frame]}
        />
      ) : (
        <Text style={[styles.initials, { fontSize, color: colors.primary }]}>
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: { fontFamily: fonts.extraBold },
});
