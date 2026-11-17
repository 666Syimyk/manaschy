jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockNavigate = jest.fn();
const mockPathname = jest.fn(() => '/guides');
jest.mock('expo-router', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ navigate: (...args: unknown[]) => mockNavigate(...args) }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { DesktopSidebar } from '../../src/components/nav/desktop-sidebar';
import { MobileTabBar } from '../../src/components/nav/mobile-tab-bar';
import { DEFAULT_LOCAL_STATE } from '../../src/features/local-state/schema';
import { useGuideStore } from '../../src/features/local-state/store';

const routes = ['index', 'guides', 'chat', 'sources', 'saved', 'settings'].map((name) => ({
  key: name,
  name,
  params: undefined,
}));

function mobileProps(selectedIndex = 1): BottomTabBarProps {
  return {
    state: {
      stale: false,
      type: 'tab',
      key: 'tabs',
      index: selectedIndex,
      routeNames: routes.map(({ name }) => name),
      routes,
      history: [],
      preloadedRouteKeys: [],
    },
    descriptors: {},
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    navigation: { navigate: mockNavigate } as never,
  } as BottomTabBarProps;
}

describe('production navigation', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockPathname.mockReturnValue('/guides');
    useGuideStore.setState({
      ...DEFAULT_LOCAL_STATE,
      locale: 'ru',
      savedGuideIds: [],
      guideProgress: {},
      lastGuideId: undefined,
      hydrated: true,
    });
  });

  it('exposes exactly six localized, selected, 44-point mobile tabs', async () => {
    const screen = await render(<MobileTabBar {...mobileProps()} />);
    const tabs = screen.getAllByRole('tab');

    expect(tabs).toHaveLength(6);
    expect(tabs.map((tab) => tab.props.accessibilityLabel)).toEqual([
      'Главная',
      'Материалы',
      'Чат',
      'Источники',
      'Сохранённое',
      'Настройки',
    ]);
    expect(screen.getByRole('tab', { name: 'Материалы' }).props.accessibilityState).toEqual({
      selected: true,
    });
    for (const tab of tabs) {
      expect(StyleSheet.flatten(tab.props.style).minHeight).toBeGreaterThanOrEqual(44);
    }

    await fireEvent.press(screen.getByRole('tab', { name: 'Источники' }));
    expect(mockNavigate).toHaveBeenCalledWith('sources');
  });

  it('exposes the same six destinations in desktop navigation', async () => {
    const screen = await render(<DesktopSidebar />);
    const links = screen.getAllByRole('link');

    expect(links).toHaveLength(6);
    expect(links.map((link) => link.props.accessibilityLabel)).toEqual([
      'Главная',
      'Материалы',
      'Чат',
      'Источники',
      'Сохранённое',
      'Настройки',
    ]);
    expect(screen.getByRole('link', { name: 'Материалы' }).props.accessibilityState).toEqual({
      selected: true,
    });
    for (const link of links) {
      expect(StyleSheet.flatten(link.props.style).minHeight).toBeGreaterThanOrEqual(44);
    }

    await fireEvent.press(screen.getByRole('link', { name: 'Настройки' }));
    expect(mockNavigate).toHaveBeenCalledWith('/(tabs)/settings');
  });

  it.each(['/episode/orozbakov-v1-001', '/guide/trilogy'])('keeps Materials selected while reading %s', async (pathname) => {
    mockPathname.mockReturnValue(pathname);
    const screen = await render(<DesktopSidebar />);
    expect(screen.getByRole('link', { name: 'Материалы' }).props.accessibilityState).toEqual({ selected: true });
  });

  it.each(['ru', 'ky'] as const)('selects and opens chat in both menus (%s)', async (locale) => {
    useGuideStore.setState({ locale });
    mockPathname.mockReturnValue('/chat');
    const desktop = await render(<DesktopSidebar />);
    const link = desktop.getByRole('link', { name: 'Чат' });
    expect(link.props.accessibilityState.selected).toBe(true);
    await fireEvent.press(link);
    expect(mockNavigate).toHaveBeenCalledWith('/(tabs)/chat');
    await desktop.unmount();
    const mobile = await render(<MobileTabBar {...mobileProps(2)} />);
    const tab = mobile.getByRole('tab', { name: 'Чат' });
    expect(tab.props.accessibilityState.selected).toBe(true);
    await fireEvent.press(tab);
    expect(mockNavigate).toHaveBeenCalledWith('chat');
  });
});
