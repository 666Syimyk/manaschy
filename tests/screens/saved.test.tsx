jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

import { fireEvent, render } from '@testing-library/react-native';
import { SavedScreen } from '../../src/features/saved/saved-screen';
import { DEFAULT_LOCAL_STATE } from '../../src/features/local-state/schema';
import { useGuideStore } from '../../src/features/local-state/store';

function resetStore() {
  useGuideStore.setState({
    ...useGuideStore.getInitialState(),
    ...DEFAULT_LOCAL_STATE,
    onboarded: true,
    savedGuideIds: [],
    guideProgress: {},
    hydrated: true,
  });
}

describe('saved and reading history', () => {
  beforeEach(() => {
    mockPush.mockClear();
    resetStore();
  });

  it('prunes invalid IDs, preserves registry order, and sorts history by recency', async () => {
    useGuideStore.setState({
      savedGuideIds: ['variation', 'removed-guide', 'trilogy'],
      guideProgress: {
        trilogy: {
          firstOpenedAt: '2026-09-20T10:00:00.000Z',
          lastOpenedAt: '2026-09-25T10:00:00.000Z',
        },
        variation: {
          firstOpenedAt: '2026-09-20T10:00:00.000Z',
          lastOpenedAt: '2026-09-27T10:00:00.000Z',
        },
        manaschi: {
          firstOpenedAt: '2026-09-20T10:00:00.000Z',
          lastOpenedAt: '2026-09-26T10:00:00.000Z',
        },
        'removed-guide': {
          firstOpenedAt: '2026-09-20T10:00:00.000Z',
          lastOpenedAt: '2026-09-28T10:00:00.000Z',
        },
      },
    });

    const screen = await render(<SavedScreen />);
    expect(screen.getAllByTestId(/^saved-guide-/).map((node) => node.props.testID)).toEqual([
      'saved-guide-trilogy',
      'saved-guide-variation',
    ]);
    expect(screen.getAllByTestId(/^recent-guide-/).map((node) => node.props.testID)).toEqual([
      'recent-guide-variation',
      'recent-guide-manaschi',
      'recent-guide-trilogy',
    ]);
    expect(screen.queryByTestId('saved-guide-removed-guide')).toBeNull();
    expect(screen.queryByTestId('recent-guide-removed-guide')).toBeNull();

    await fireEvent.press(
      screen.getAllByRole('link', { name: /единая эпическая трилогия/ })[0],
    );
    expect(mockPush).toHaveBeenCalledWith('/guide/trilogy');
  });

  it('shows a truthful independent empty state for each section', async () => {
    const screen = await render(<SavedScreen />);

    expect(screen.getByText('Нет сохранённых материалов')).toBeTruthy();
    expect(screen.getByText('История чтения пуста')).toBeTruthy();
    expect(screen.getByText(/Используйте кнопку сохранения/)).toBeTruthy();
    expect(screen.getByText(/Недавно открытые материалы/)).toBeTruthy();
  });
});
