import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';
import { RadioIndicator } from './RadioCard';
import { Switch } from './Switch';

type SettingsGroupProps = {
  title: string;
  children: ReactNode;
};

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.group}>
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: colors.text2 }]}
      >
        {title}
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

type SettingsRowProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  hint?: string;
  value?: string;
  switchChecked?: boolean;
  radioSelected?: boolean;
  showChevron?: boolean;
  divider?: boolean;
  danger?: boolean;
  disabled?: boolean;
  largeHint?: boolean;
};

export function SettingsRow({
  icon,
  label,
  onPress,
  hint,
  value,
  switchChecked,
  radioSelected,
  showChevron = true,
  divider = false,
  danger = false,
  disabled = false,
  largeHint = false,
}: SettingsRowProps) {
  const { colors } = useTheme();
  const tint = danger ? colors.error : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        divider && { borderTopWidth: 1, borderTopColor: colors.border },
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: danger ? `${colors.error}1F` : colors.soft },
        ]}
      >
        <Icon name={icon} size={19} color={tint} />
      </View>
      <View style={styles.texts}>
        <Text
          style={[styles.label, { color: danger ? colors.error : colors.text }]}
        >
          {label}
        </Text>
        {hint ? (
          <Text
            style={[
              styles.hint,
              largeHint && styles.largeHint,
              { color: colors.text2 },
            ]}
          >
            {hint}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={[styles.value, { color: colors.primary }]}>{value}</Text>
      ) : null}
      {switchChecked !== undefined && <Switch checked={switchChecked} />}
      {radioSelected !== undefined && (
        <RadioIndicator selected={radioSelected} />
      )}
      {showChevron && (
        <Icon name="chevronRight" size={20} color={colors.text2} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    paddingLeft: 4,
  },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  dimmed: { opacity: 0.6 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 1 },
  label: { fontFamily: fonts.bold, fontSize: 14 },
  hint: { fontFamily: fonts.medium, fontSize: 11 },
  largeHint: { fontSize: 11.5 },
  value: { fontFamily: fonts.bold, fontSize: 12.5 },
});
