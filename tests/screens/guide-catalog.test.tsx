jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { getGuideById } from '../../src/data/guides';
import { ArticleCatalogScreen } from '../../src/features/guides/catalog-screen';
import { DEFAULT_LOCAL_STATE } from '../../src/features/local-state/schema';
import { useGuideStore } from '../../src/features/local-state/store';

function resetStore(locale: 'ru' | 'ky' = 'ru') {
  useGuideStore.setState({
    ...useGuideStore.getInitialState(),
    ...DEFAULT_LOCAL_STATE,
    locale,
    onboarded: true,
    savedGuideIds: [],
    guideProgress: {},
    hydrated: true,
  });
}

describe('guide catalog', () => {
  beforeEach(() => {
    mockPush.mockClear();
    resetStore();
  });

  it('searches locally, shows a truthful zero state, and clears the query', async () => {
    const screen = await render(<ArticleCatalogScreen />);

    expect(screen.getAllByTestId(/^guide-card-/)).toHaveLength(10);
    const search = screen.getByLabelText('Поиск по материалам');
    await fireEvent.changeText(search, 'манасчи');

    expect(screen.getByText('Манасчи: носитель и исполнитель традиции')).toBeTruthy();
    expect(screen.queryByTestId('guide-card-memory-of-world-2023')).toBeNull();

    await fireEvent.changeText(search, 'совершенно отсутствующий запрос');
    expect(screen.getByText('Ничего не найдено')).toBeTruthy();
    expect(screen.getByText('Попробуйте другой запрос или очистите фильтры.')).toBeTruthy();

    await fireEvent.press(screen.getAllByRole('button', { name: 'Очистить поиск' })[0]);
    await waitFor(() => {
      expect(screen.getByLabelText('Поиск по материалам').props.value).toBe('');
      expect(screen.getAllByTestId(/^guide-card-/)).toHaveLength(10);
    });
  });

  it('filters by an accessible topic chip and opens the selected guide', async () => {
    const screen = await render(<ArticleCatalogScreen />);
    const chip = screen.getByRole('button', { name: 'Документальное наследие' });

    await fireEvent.press(chip);
    expect(chip.props.accessibilityState).toEqual({ selected: true });
    expect(screen.queryByTestId('guide-card-trilogy')).toBeNull();
    expect(screen.getByTestId('guide-card-orozbakov-manuscripts')).toBeTruthy();

    const guide = getGuideById('orozbakov-manuscripts');
    await fireEvent.press(
      screen.getByRole('link', { name: guide?.title.ru }),
    );
    expect(mockPush).toHaveBeenCalledWith('/guide/orozbakov-manuscripts');
  });

  it('localizes every topic chip in Kyrgyz', async () => {
    resetStore('ky');
    const screen = await render(<ArticleCatalogScreen />);

    expect(screen.getByRole('button', { name: 'Бардык темалар' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Документалдык мурас' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Аткаруучулук өнөр' })).toBeTruthy();
  });
});
