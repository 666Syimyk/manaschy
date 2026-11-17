import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { usePathname, useRouter } from 'expo-router';
import { useT } from '@/i18n';
import { useTextScale } from '@/shared/ui';
import { palette } from '@/theme';

interface NavItem {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  iconFocused: ComponentProps<typeof Ionicons>['name'];
  path: string;
  publicPath: string;
}

function SidebarItem({ item, active }: { item: NavItem; active: boolean }) {
  const router = useRouter();
  const scale = useTextScale();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
      onPress={() => router.navigate(item.path as never)}
      style={({ pressed }) => [
        styles.item,
        active && styles.itemActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
        <Ionicons
          name={active ? item.iconFocused : item.icon}
          size={20}
          color={active ? palette.red : palette.muted}
        />
      </View>
      <Text style={[styles.itemLabel, { fontSize: 14 * scale }, active && styles.itemLabelActive]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

export function DesktopSidebar() {
  const pathname = usePathname();
  const t = useT();
  const scale = useTextScale();
  const items: NavItem[] = [
    { label: t('home'), icon: 'home-outline', iconFocused: 'home', path: '/(tabs)', publicPath: '/' },
    { label: t('guides'), icon: 'book-outline', iconFocused: 'book', path: '/(tabs)/guides', publicPath: '/guides' },
    { label: t('chat'), icon: 'chatbubbles-outline', iconFocused: 'chatbubbles', path: '/(tabs)/chat', publicPath: '/chat' },
    { label: t('sources'), icon: 'library-outline', iconFocused: 'library', path: '/(tabs)/sources', publicPath: '/sources' },
    { label: t('saved'), icon: 'bookmark-outline', iconFocused: 'bookmark', path: '/(tabs)/saved', publicPath: '/saved' },
    { label: t('settings'), icon: 'settings-outline', iconFocused: 'settings', path: '/(tabs)/settings', publicPath: '/settings' },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.brand}>
        <View accessibilityElementsHidden style={styles.brandMark}>
          <Text style={styles.brandMarkText}>M</Text>
        </View>
        <View>
          <Text style={[styles.brandName, { fontSize: 21 * scale }]}>Manaschy</Text>
          <Text style={[styles.brandCaption, { fontSize: 10 * scale }]}>{t('onboardingEyebrow')}</Text>
        </View>
      </View>

      <View accessibilityLabel={t('appName')} style={styles.navigation}>
        {items.map((item) => {
          const active = item.publicPath === '/'
            ? pathname === '/' || pathname === '/index' || pathname === '/(tabs)'
            : pathname === item.publicPath || pathname.startsWith(`${item.publicPath}/`) ||
              (item.publicPath === '/guides' && (pathname.startsWith('/episode/') || pathname.startsWith('/guide/')));
          return <SidebarItem key={item.path} item={item} active={active} />;
        })}
      </View>

      <View style={styles.note}>
        <Ionicons name="cloud-offline-outline" size={20} color={palette.gold} />
        <Text style={[styles.noteText, { fontSize: 12 * scale }]}>
          {t('onboardingFeatureOfflineBody')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 252,
    padding: 16,
    gap: 18,
    backgroundColor: palette.surface,
    borderRightWidth: 1,
    borderRightColor: palette.goldBorder,
  },
  brand: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.red,
    borderWidth: 2,
    borderColor: palette.gold,
  },
  brandMarkText: { color: palette.white, fontFamily: 'serif', fontSize: 22, fontWeight: '900' },
  brandName: { color: palette.red, fontFamily: 'serif', fontWeight: '900' },
  brandCaption: { maxWidth: 155, color: palette.muted, fontWeight: '600' },
  navigation: { flex: 1, gap: 6 },
  item: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemActive: { backgroundColor: palette.goldSoft, borderColor: palette.goldBorder },
  iconWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  iconWrapActive: { backgroundColor: palette.surface },
  itemLabel: { color: palette.ink, fontWeight: '700' },
  itemLabelActive: { color: palette.red, fontWeight: '900' },
  pressed: { opacity: 0.7 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 13,
    borderRadius: 15,
    backgroundColor: palette.ivory,
    borderWidth: 1,
    borderColor: palette.goldBorder,
  },
  noteText: { flex: 1, color: palette.muted, lineHeight: 18 },
});
