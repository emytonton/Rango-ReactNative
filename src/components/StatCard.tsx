import { StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

type StatCardProps = {
  icon: IconName;
  iconColor: string;
  value: string;
  label: string;
};

export function StatCard({ icon, iconColor, value, label }: StatCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface2, borderColor: colors.border },
      ]}
    >
      <Icon name={icon} size={19} color={iconColor} />
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.text2 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: 15,
    borderWidth: 1,
  },
  value: { fontFamily: fonts.extraBold, fontSize: 13 },
  label: { fontFamily: fonts.semiBold, fontSize: 10 },
});
