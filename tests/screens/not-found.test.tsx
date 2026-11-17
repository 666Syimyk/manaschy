jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockReplace = jest.fn();
const mockScreenOptions = jest.fn();
const mockDocumentTitle = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
  Stack: {
    Screen: ({ options }: { options: unknown }) => {
      mockScreenOptions(options);
      return null;
    },
  },
}));
jest.mock('expo-router/head', () => ({
  __esModule: true,
  default: ({ children }: { children: { props: { children: string } } }) => {
    mockDocumentTitle(children.props.children);
    return null;
  },
}));

import { fireEvent, render } from '@testing-library/react-native';
import NotFoundRoute from '../../src/app/+not-found';
import { DEFAULT_LOCAL_STATE } from '../../src/features/local-state/schema';
import { useGuideStore } from '../../src/features/local-state/store';

describe('not-found route', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockScreenOptions.mockClear();
    mockDocumentTitle.mockClear();
    useGuideStore.setState({
      ...useGuideStore.getInitialState(),
      ...DEFAULT_LOCAL_STATE,
      onboarded: true,
      savedGuideIds: [],
      guideProgress: {},
      hydrated: true,
    });
  });

  it('sets a localized document title and offers a route home', async () => {
    const screen = await render(<NotFoundRoute />);

    expect(mockScreenOptions).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Страница не найдена' }),
    );
    expect(mockDocumentTitle).toHaveBeenCalledWith('Страница не найдена');
    expect(screen.getByText('Эта ссылка не относится к опубликованному разделу справочника.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Вернуться на главную' }));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});
