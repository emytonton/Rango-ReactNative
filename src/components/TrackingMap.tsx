import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { Icon } from './Icon';
import { PulseCircle } from './PulseCircle';

const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

type TrackingMapProps = {
  imageUrl: string | null;
  caption: string;
};

export function TrackingMap({ imageUrl, caption }: TrackingMapProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.map}>
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />
      )}
      <PulseCircle size={52} color={colors.primary}>
        <Icon name="deliveryDining" size={27} color={colors.onPrimary} />
      </PulseCircle>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 150,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'hsla(160, 25%, 82%, 0.7)',
  },
  caption: {
    position: 'absolute',
    left: 12,
    bottom: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    fontFamily: monospace,
    fontSize: 9.5,
    color: 'rgba(0, 0, 0, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});
