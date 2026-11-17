import { type PropsWithChildren, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useIsDesktop } from '@/hooks/use-breakpoint';
import { useT } from '@/i18n';
import { palette } from '@/theme';
import { DesktopSidebar } from './desktop-sidebar';
import { DesktopTopBar } from './desktop-topbar';
import { MobileHeader } from './mobile-header';

export function ResponsiveShell({ children }: PropsWithChildren) {
  const segments = useSegments();
  const isDesktop = useIsDesktop();
  const t = useT();
  const first = String(segments[0] ?? '');
  const second = String(segments[1] ?? 'index');
  const isTabRoute = first === '(tabs)';
  const routeName = isTabRoute ? second : first;
  const title = useMemo(() => {
    const titles: Record<string, string> = {
      index: t('home'),
      guides: t('guides'),
      chat: t('chat'),
      guide: t('guides'),
      episode: t('guides'),
      sources: t('sources'),
      source: t('sources'),
      saved: t('saved'),
      settings: t('settings'),
      privacy: t('privacy'),
      methodology: t('methodology'),
    };
    return titles[routeName] ?? t('appName');
  }, [routeName, t]);

  if (isDesktop) {
    return (
      <View style={styles.desktop}>
        <DesktopSidebar />
        <View style={styles.main}>
          <DesktopTopBar title={title} />
          <View style={styles.content}>{children}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mobile}>
      <MobileHeader title={title} showBack={!isTabRoute} onBack={() => router.back()} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktop: { flex: 1, flexDirection: 'row', backgroundColor: palette.ivory },
  mobile: { flex: 1, backgroundColor: palette.ivory },
  main: { flex: 1, minWidth: 0 },
  content: { flex: 1, overflow: 'hidden' },
});
