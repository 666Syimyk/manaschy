jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockPush = jest.fn();
const mockOpenPublishedSource = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));
jest.mock('../../src/services/external-links', () => ({
  openPublishedSource: (...args: unknown[]) => mockOpenPublishedSource(...args),
}));

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SourceDetailScreen } from '../../src/features/sources/detail-screen';
import { SourceDirectoryScreen } from '../../src/features/sources/directory-screen';
import { DEFAULT_LOCAL_STATE } from '../../src/features/local-state/schema';
import { useGuideStore } from '../../src/features/local-state/store';

describe('source directory and detail', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockOpenPublishedSource.mockReset();
    mockOpenPublishedSource.mockResolvedValue({ ok: false, reason: 'unsupported' });
    useGuideStore.setState({
      ...useGuideStore.getInitialState(),
      ...DEFAULT_LOCAL_STATE,
      onboarded: true,
      savedGuideIds: [],
      guideProgress: {},
      hydrated: true,
    });
  });

  it('shows source metadata and filters by an accessible source-type chip', async () => {
    const screen = await render(<SourceDirectoryScreen />);

    expect(screen.getAllByTestId(/^source-card-/)).toHaveLength(8);
    expect(screen.getAllByText('Только внешняя ссылка')).toHaveLength(8);
    expect(screen.getAllByText('Проверено 2026-09-27')).toHaveLength(4);
    expect(screen.getAllByText('Проверено 2026-09-28')).toHaveLength(4);

    const archive = screen.getByRole('button', { name: 'Архив' });
    await fireEvent.press(archive);
    expect(archive.props.accessibilityState).toEqual({ selected: true });
    expect(screen.getAllByTestId(/^source-card-/)).toHaveLength(1);

    await fireEvent.press(
      screen.getByRole('link', {
        name: 'Manuscript of the Kyrgyz epic Manas by the narrator Sagymbay Orozbakov',
      }),
    );
    expect(mockPush).toHaveBeenCalledWith('/source/unesco-memory-orozbakov');
  });

  it('renders citation, check date, rights note, and stays in-app on external failure', async () => {
    const screen = await render(<SourceDetailScreen id="unesco-memory-orozbakov" />);

    expect(screen.getByText('Библиографическая ссылка')).toBeTruthy();
    expect(screen.getByText(/Registration year 2023/)).toBeTruthy();
    expect(screen.getByText('Проверено 2026-09-27')).toBeTruthy();
    expect(screen.getByText(/текст и медиа источника не включены/)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Открыть официальный источник' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Этот источник нельзя открыть на этом устройстве.',
      );
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows a localized in-app fallback for an unknown source ID', async () => {
    const screen = await render(<SourceDetailScreen id="not-a-source" />);

    expect(screen.getByText('Источник не найден')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'К списку источников' }));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/sources');
  });
});
