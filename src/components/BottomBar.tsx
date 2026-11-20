import { createContext, useContext } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';

export type BottomTab = 'home' | 'search' | 'orders' | 'favorites' | 'profile';

export type TabBadges = Partial<Record<BottomTab, number>>;

export const TabBadgesContext = createContext<TabBadges>({});

const tabs: {
  key: BottomTab;
  label: string;
  icon: IconName;
  activeIcon?: IconName;
}[] = [
  { key: 'home', label: 'Início', icon: 'home' },
  { key: 'search', label: 'Buscar', icon: 'search' },
  { key: 'orders', label: 'Pedidos', icon: 'receipt' },
  {
    key: 'favorites',
    label: 'Favoritos',
    icon: 'favoriteBorder',
    activeIcon: 'favorite',
  },
  { key: 'profile', label: 'Perfil', icon: 'person' },
];

type BottomBarProps = {
  selected: BottomTab;
  onSelect: (tab: BottomTab) => void;
};

export function BottomBar({ selected, onSelect }: BottomBarProps) {
  const { colors } = useTheme();
  const badges = useContext(TabBadgesContext);
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 12 + insets.bottom,
        },
      ]}
    >
      {tabs.map(tab => {
        const active = tab.key === selected;
        const tint = active ? colors.primary : colors.text2;
        const badge = badges[tab.key] ?? 0;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(tab.key)}
            style={styles.tab}
          >
            <Icon
              name={active ? tab.activeIcon ?? tab.icon : tab.icon}
              size={23}
              color={tint}
            />
            <Text style={[styles.label, { color: tint }]}>{tab.label}</Text>
            {badge > 0 && (
              <Text
                style={[
                  styles.badge,
                  { backgroundColor: colors.primary, color: colors.onPrimary },
                ]}
              >
                {badge}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 6,
    borderTopWidth: 1,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6 },
  label: { fontFamily: fonts.bold, fontSize: 10 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 16,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    overflow: 'hidden',
    fontFamily: fonts.extraBold,
    fontSize: 9.5,
    lineHeight: 17,
    textAlign: 'center',
  },
});
