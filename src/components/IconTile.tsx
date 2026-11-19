import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type IconTileProps = {
  icon: IconName;
  size?: number;
  iconSize?: number;
};

export function IconTile({ icon, size = 42, iconSize = 22 }: IconTileProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size / 3,
          backgroundColor: colors.soft,
        },
      ]}
    >
      <Icon name={icon} size={iconSize} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
});
