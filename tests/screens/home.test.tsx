jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

import { render } from '@testing-library/react-native';
import { HomeScreen } from '../../src/features/home/home-screen';
import { translate } from '../../src/i18n';
import { DEFAULT_LOCAL_STATE } from '../../src/features/local-state/schema';
import { useGuideStore } from '../../src/features/local-state/store';

describe('production home', () => {
  beforeEach(() => {
    mockPush.mockClear();
    useGuideStore.setState({
      ...DEFAULT_LOCAL_STATE,
      locale: 'ru',
      onboarded: true,
      savedGuideIds: [],
      lastGuideId: 'variation',
      guideProgress: {
        trilogy: {
          firstOpenedAt: '2026-09-25T10:00:00.000Z',
          lastOpenedAt: '2026-09-25T11:00:00.000Z',
          completedAt: '2026-09-25T11:05:00.000Z',
        },
        variation: {
          firstOpenedAt: '2026-09-26T10:00:00.000Z',
          lastOpenedAt: '2026-09-27T11:00:00.000Z',
        },
      },
      hydrated: true,
    });
  });

  it('derives the current total, completion count, featured guide, and recent guide', async () => {
    const screen = await render(<HomeScreen />);

    expect(screen.getByText('1 из 10 прочитано')).toBeTruthy();
    expect(screen.getByText('«Манас», «Семетей», «Сейтек»: единая эпическая трилогия')).toBeTruthy();
    expect(screen.getByText('Как понимать вариативность эпической традиции')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Открыть все материалы' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Открыть источники' })).toBeTruthy();
  });

  it('interpolates typed translations without leaking template markers', () => {
    expect(translate('ky', 'homeProgress', { completed: 2, total: 10 })).toBe(
      '10 материалдын 2 окулду',
    );
  });
});
