jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { GuideReaderScreen } from '../../src/features/guides/reader-screen';
import { DEFAULT_LOCAL_STATE } from '../../src/features/local-state/schema';
import { useGuideStore } from '../../src/features/local-state/store';

function resetStore(overrides: Partial<typeof DEFAULT_LOCAL_STATE> = {}) {
  useGuideStore.setState({
    ...useGuideStore.getInitialState(),
    ...DEFAULT_LOCAL_STATE,
    onboarded: true,
    savedGuideIds: [],
    guideProgress: {},
    hydrated: true,
    ...overrides,
  });
}

describe('guide reader', () => {
  beforeEach(() => {
    mockPush.mockClear();
    resetStore();
  });

  it('opens once per ID and exposes explicit save, complete, and uncomplete actions', async () => {
    const originalOpenGuide = useGuideStore.getState().openGuide;
    const openGuide = jest.fn(originalOpenGuide);
    useGuideStore.setState({ openGuide });
    const screen = await render(<GuideReaderScreen id="trilogy" />);

    await waitFor(() => expect(openGuide).toHaveBeenCalledTimes(1));
    await screen.rerender(<GuideReaderScreen id="trilogy" />);
    expect(openGuide).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByRole('button', { name: 'Сохранить материал' }));
    await waitFor(() => expect(useGuideStore.getState().savedGuideIds).toEqual(['trilogy']));
    expect(screen.getByRole('button', { name: 'Убрать из сохранённого' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Отметить прочитанным' }));
    await waitFor(() => {
      expect(useGuideStore.getState().guideProgress.trilogy?.completedAt).toBeTruthy();
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Отметить непрочитанным' }));
    await waitFor(() => {
      expect(useGuideStore.getState().guideProgress.trilogy?.completedAt).toBeUndefined();
    });
  });

  it('renders cited paragraphs, source links, related guides, and scaled body text', async () => {
    resetStore({ fontScale: 'large' });
    const screen = await render(<GuideReaderScreen id="trilogy" />);

    expect(screen.getByText('«Манас», «Семетей», «Сейтек»: единая эпическая трилогия')).toBeTruthy();
    expect(screen.getByText('Источники материала')).toBeTruthy();
    expect(screen.getByText('Читайте также')).toBeTruthy();
    const paragraph = screen.getByTestId('guide-paragraph-0-0');
    expect(StyleSheet.flatten(paragraph.props.style).fontSize).toBeGreaterThan(18);

    const sourceLink = screen.getAllByRole('link', {
      name: /Kyrgyz epic trilogy: Manas, Semetey, Seytek/,
    })[0];
    await fireEvent.press(sourceLink);
    expect(mockPush).toHaveBeenCalledWith('/source/unesco-ich-00876');
  });

  it('shows a localized in-app fallback for an unknown guide ID', async () => {
    const screen = await render(<GuideReaderScreen id="not-a-guide" />);

    expect(screen.getByText('Материал не найден')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'К каталогу материалов' }));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/guides');
  });
});
