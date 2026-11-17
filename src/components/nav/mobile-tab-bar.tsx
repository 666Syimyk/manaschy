import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '@/i18n';
import { useTextScale } from '@/shared/ui';
import { palette } from '@/theme';

interface TabInfo {
  name: string;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  iconFocused: ComponentProps<typeof Ionicons>['name'];
}

export function MobileTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const t = useT();
  const scale = useTextScale();
  const tabs: TabInfo[] = [
    { name: 'index', label: t('home'), icon: 'home-outline', iconFocused: 'home' },
    { name: 'guides', label: t('guides'), icon: 'book-outline', iconFocused: 'book' },
    { name: 'chat', label: t('chat'), icon: 'chatbubbles-outline', iconFocused: 'chatbubbles' },
    { name: 'sources', label: t('sources'), icon: 'library-outline', iconFocused: 'library' },
    { name: 'saved', label: t('saved'), icon: 'bookmark-outline', iconFocused: 'bookmark' },
    { name: 'settings', label: t('settings'), icon: 'settings-outline', iconFocused: 'settings' },
  ];

  return (
    <View accessibilityRole="tablist" style={[styles.root, { paddingBottom: insets.bottom }]}>
      {tabs.map((tab) => {
        const routeIndex = state.routes.findIndex((route) => route.name === tab.name);
        const focused = state.index === routeIndex;
        return (
          <Pressable
            key={tab.name}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: focused }}
            onPress={() => {
              if (routeIndex >= 0) navigation.navigate(state.routes[routeIndex].name);
            }}
            style={({ pressed }) => [styles.tab, focused && styles.tabFocused, pressed && styles.pressed]}
          >
            <Ionicons
              name={focused ? tab.iconFocused : tab.icon}
              size={22}
              color={focused ? palette.red : palette.muted}
            />
            <Text
              numberOfLines={1}
              style={[styles.label, { fontSize: Math.max(9, 10 * scale) }, focused && styles.labelFocused]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 6,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.goldBorder,
  },
  tab: {
    minHeight: 56,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 2,
    borderTopWidth: 3,
    borderTopColor: 'transparent',
  },
  tabFocused: { borderTopColor: palette.red, backgroundColor: palette.goldSoft },
  label: { color: palette.muted, fontWeight: '700' },
  labelFocused: { color: palette.red, fontWeight: '900' },
  pressed: { opacity: 0.68 },
});
