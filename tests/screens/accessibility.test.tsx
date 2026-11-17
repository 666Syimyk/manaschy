jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockOpenPublishedSource = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    back: (...args: unknown[]) => mockBack(...args),
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('../../src/services/external-links', () => ({
  openPublishedSource: (...args: unknown[]) => mockOpenPublishedSource(...args),
}));

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { ExternalSourceButton } from '../../src/components/external-source-button';
import { MobileHeader } from '../../src/components/nav/mobile-header';
import { MobileTabBar } from '../../src/components/nav/mobile-tab-bar';
import { SearchField } from '../../src/components/search-field';
import { referenceSources } from '../../src/data/guides';
import { GuideCatalogScreen } from '../../src/features/guides/catalog-screen';
import { GuideReaderScreen } from '../../src/features/guides/reader-screen';
import { DEFAULT_LOCAL_STATE } from '../../src/features/local-state/schema';
import { useGuideStore } from '../../src/features/local-state/store';

const routes = ['index', 'guides', 'sources', 'saved', 'settings'].map((name) => ({
  key: name,
  name,
  params: undefined,
}));

function tabProps(): BottomTabBarProps {
  return {
    state: {
      stale: false,
      type: 'tab',
      key: 'tabs',
      index: 1,
      routeNames: routes.map(({ name }) => name),
      routes,
      history: [],
      preloadedRouteKeys: [],
    },
    descriptors: {},
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    navigation: { navigate: jest.fn() } as never,
  } as BottomTabBarProps;
}

function resetStore(fontScale: 'small' | 'medium' | 'large' = 'medium') {
  useGuideStore.setState({
    ...useGuideStore.getInitialState(),
    ...DEFAULT_LOCAL_STATE,
    fontScale,
    onboarded: true,
    savedGuideIds: [],
    guideProgress: {},
    hydrated: true,
  });
}

describe('production accessibility', () => {
  beforeEach(() => {
    resetStore();
    mockPush.mockClear();
    mockBack.mockClear();
    mockOpenPublishedSource.mockReset();
  });

  it('gives icon-only controls localized labels, 44-point targets, and visible focus', async () => {
    const onClear = jest.fn();
    const searchScreen = await render(
      <SearchField
        value="Манас"
        label="Поиск по материалам"
        placeholder="Название, тема или источник"
        clearLabel="Очистить поиск"
        onChangeText={jest.fn()}
        onClear={onClear}
      />,
    );
    const clear = searchScreen.getByRole('button', { name: 'Очистить поиск' });
    const clearStyle = StyleSheet.flatten(clear.props.style);
    expect(clearStyle.width).toBeGreaterThanOrEqual(44);
    expect(clearStyle.height).toBeGreaterThanOrEqual(44);

    await fireEvent(clear, 'focus');
    await waitFor(() => {
      expect(StyleSheet.flatten(clear.props.style).borderColor).toBe('#CFA15A');
    });
    await fireEvent.press(clear);
    expect(onClear).toHaveBeenCalledTimes(1);
    await searchScreen.unmount();

    const headerScreen = await render(<MobileHeader title="Материал" showBack onBack={mockBack} />);
    const back = headerScreen.getByRole('button', { name: 'Назад' });
    const backStyle = StyleSheet.flatten(back.props.style);
    expect(backStyle.width).toBeGreaterThanOrEqual(44);
    expect(backStyle.height).toBeGreaterThanOrEqual(44);
  });

  it('exposes selected state on topic filters and tabs', async () => {
    const catalog = await render(<GuideCatalogScreen />);
    expect(catalog.getByRole('button', { name: 'Эпизоды' }).props.accessibilityState).toEqual({ selected: true });
    await fireEvent.press(catalog.getByRole('button', { name: 'Статьи' }));
    expect(catalog.getByRole('button', { name: 'Статьи' }).props.accessibilityState).toEqual({ selected: true });
    expect(catalog.getByRole('button', { name: 'Все темы' }).props.accessibilityState).toEqual({
      selected: true,
    });
    await fireEvent.press(catalog.getByRole('button', { name: 'Устная традиция' }));
    expect(catalog.getByRole('button', { name: 'Устная традиция' }).props.accessibilityState).toEqual({
      selected: true,
    });
    await catalog.unmount();

    const navigation = await render(<MobileTabBar {...tabProps()} />);
    expect(navigation.getByRole('tab', { name: 'Материалы' }).props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('propagates large text to article, cards, and navigation', async () => {
    resetStore('large');
    const reader = await render(<GuideReaderScreen id="trilogy" />);
    expect(
      StyleSheet.flatten(reader.getByTestId('guide-paragraph-0-0').props.style).fontSize,
    ).toBeGreaterThan(18);
    expect(
      StyleSheet.flatten(
        reader.getByText('«Семетей» в официальной записи о трилогии').props.style,
      ).fontSize,
    ).toBeGreaterThan(21);
    await reader.unmount();

    const navigation = await render(<MobileTabBar {...tabProps()} />);
    expect(StyleSheet.flatten(navigation.getByText('Материалы').props.style).fontSize).toBeGreaterThan(10);
  });

  it('announces the disabled state while an external source is opening', async () => {
    mockOpenPublishedSource.mockReturnValue(new Promise(() => undefined));
    const screen = await render(<ExternalSourceButton source={referenceSources[0]} />);
    const button = screen.getByRole('button', { name: 'Открыть официальный источник' });

    await fireEvent.press(button);
    await waitFor(() => {
      expect(button.props.accessibilityState).toEqual({ disabled: true });
    });
  });
});
