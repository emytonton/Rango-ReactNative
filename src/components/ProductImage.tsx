import type { ReactNode } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type ProductImageProps = {
  imageUrl: string | null;
  hue: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function ProductImage({
  imageUrl,
  hue,
  style,
  children,
}: ProductImageProps) {
  return (
    <View
      style={[
        styles.box,
        { backgroundColor: `hsla(${hue}, 60%, 80%, 0.55)` },
        style,
      ]}
    >
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
});
