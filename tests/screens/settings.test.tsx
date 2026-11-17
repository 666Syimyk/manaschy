jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SettingsScreen } from '../../src/features/settings/settings-screen';
import { DEFAULT_LOCAL_STATE, GUIDE_STORE_KEY } from '../../src/features/local-state/schema';
import { useGuideStore } from '../../src/features/local-state/store';

function resetStore() {
  useGuideStore.setState({
    ...useGuideStore.getInitialState(),
    ...DEFAULT_LOCAL_STATE,
    onboarded: true,
    savedGuideIds: ['trilogy'],
    guideProgress: {
      trilogy: {
        firstOpenedAt: '2026-09-20T10:00:00.000Z',
        lastOpenedAt: '2026-09-21T10:00:00.000Z',
      },
    },
    hydrated: true,
  });
}

describe('settings', () => {
  beforeEach(async () => {
    mockReplace.mockClear();
    mockPush.mockClear();
    jest.clearAllMocks();
    await AsyncStorage.clear();
    resetStore();
  });

  it('persists language and text-size changes immediately', async () => {
    const screen = await render(<SettingsScreen />);

    await fireEvent.press(screen.getByRole('radio', { name: 'Большой' }));
    await waitFor(() => expect(useGuideStore.getState().fontScale).toBe('large'));
    await fireEvent.press(screen.getByRole('radio', { name: 'Кыргызча' }));
    await waitFor(() => expect(useGuideStore.getState().locale).toBe('ky'));

    expect(AsyncStorage.setItem).toHaveBeenCalled();
    const stored = await AsyncStorage.getItem(GUIDE_STORE_KEY);
    expect(stored).toContain('"fontScale":"large"');
    expect(stored).toContain('"locale":"ky"');
  });

  it('requires explicit confirmation, supports cancel, and returns home after reset', async () => {
    const screen = await render(<SettingsScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Сбросить локальные данные' }));
    expect(screen.getByText(/Это действие нельзя отменить/)).toBeTruthy();
    expect(useGuideStore.getState().savedGuideIds).toEqual(['trilogy']);

    await fireEvent.press(screen.getByRole('button', { name: 'Отмена' }));
    expect(screen.queryByText(/Это действие нельзя отменить/)).toBeNull();
    expect(useGuideStore.getState().savedGuideIds).toEqual(['trilogy']);

    await fireEvent.press(screen.getByRole('button', { name: 'Сбросить локальные данные' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Удалить данные' }));
    await waitFor(() => {
      expect(useGuideStore.getState().onboarded).toBe(false);
      expect(useGuideStore.getState().savedGuideIds).toEqual([]);
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(GUIDE_STORE_KEY);
  });
});
