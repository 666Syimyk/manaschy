import { Tabs } from 'expo-router';
import { MobileTabBar } from '@/components/nav/mobile-tab-bar';
import { useIsDesktop } from '@/hooks/use-breakpoint';
import { palette } from '@/theme';

export default function TabsLayout() {
  const isDesktop = useIsDesktop();

  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: palette.ivory } }}
      tabBar={isDesktop ? () => null : (props) => <MobileTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="guides" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="sources" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
