import { StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type IconInfoRowProps = {
  icon: IconName;
  label: string;
  value: string;
};

export function IconInfoRow({ icon, label, value }: IconInfoRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.tile, { backgroundColor: colors.surface2 }]}>
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.texts}>
        <Text style={[styles.label, { color: colors.text2 }]}>
          {label.toUpperCase()}
        </Text>
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 11 },
  tile: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 1 },
  label: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.4 },
  value: { fontFamily: fonts.semiBold, fontSize: 13 },
});
