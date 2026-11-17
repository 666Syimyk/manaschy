jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import IndexRoute from '../../src/app/index';
import { OnboardingScreen } from '../../src/features/onboarding/onboarding-screen';
import { DEFAULT_LOCAL_STATE } from '../../src/features/local-state/schema';
import { useGuideStore } from '../../src/features/local-state/store';

function resetState(overrides: Partial<typeof DEFAULT_LOCAL_STATE & { hydrated: boolean }> = {}) {
  useGuideStore.setState({
    ...DEFAULT_LOCAL_STATE,
    savedGuideIds: [],
    guideProgress: {},
    lastGuideId: undefined,
    hydrated: true,
    ...overrides,
  });
}

describe('production onboarding', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    resetState();
  });

  it('has one primary action and a working Russian/Kyrgyz selector', async () => {
    const screen = await render(
      <OnboardingScreen onComplete={() => mockReplace('/(tabs)')} />,
    );

    expect(screen.getAllByTestId('onboarding-primary-action')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Начать знакомство' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('radio', { name: 'Кыргызча' }));
    await waitFor(() => {
      expect(useGuideStore.getState().locale).toBe('ky');
      expect(screen.getByRole('button', { name: 'Таанышууну баштоо' })).toBeTruthy();
    });

    await fireEvent.press(screen.getByTestId('onboarding-primary-action'));
    await waitFor(() => {
      expect(useGuideStore.getState().onboarded).toBe(true);
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('finishes onboarding without replacing a direct route when no completion callback is provided', async () => {
    const screen = await render(<OnboardingScreen />);

    await fireEvent.press(screen.getByTestId('onboarding-primary-action'));

    await waitFor(() => expect(useGuideStore.getState().onboarded).toBe(true));
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects hydrated onboarded readers directly to home', async () => {
    resetState({ onboarded: true });

    await render(<IndexRoute />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)'));
  });
});
