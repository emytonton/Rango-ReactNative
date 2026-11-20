import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';

export type UnderlineTab<T extends string> = {
  key: T;
  label: string;
};

type UnderlineTabsProps<T extends string> = {
  tabs: UnderlineTab<T>[];
  selected: T;
  onSelect: (key: T) => void;
};

export function UnderlineTabs<T extends string>({
  tabs,
  selected,
  onSelect,
}: UnderlineTabsProps<T>) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="tablist" style={styles.row}>
      {tabs.map(tab => {
        const active = tab.key === selected;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(tab.key)}
          >
            <Text
              style={[
                styles.label,
                active && styles.activeLabel,
                { color: active ? colors.primary : colors.text2 },
              ]}
            >
              {tab.label}
            </Text>
            <View
              style={[
                styles.bar,
                { backgroundColor: active ? colors.primary : 'transparent' },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 22 },
  label: {
    paddingBottom: 12,
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    lineHeight: 18,
  },
  activeLabel: { fontFamily: fonts.extraBold },
  bar: { height: 3, borderRadius: 2 },
});
