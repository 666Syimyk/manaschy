import { render } from '@testing-library/react-native';
import EpisodeRoute from '../../src/app/episode/[id]';

let mockParams: Record<string, unknown>;
const mockReader = jest.fn((_props: unknown) => null);
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams, Redirect: () => null }));
jest.mock('@/features/episodes/reader-screen', () => ({ EpisodeReaderScreen: (props: unknown) => mockReader(props) }));

beforeEach(() => { mockParams = { id: 'orozbakov-v1-001' }; mockReader.mockClear(); });

it.each(['11', '12'])('passes valid cited page %s to the reader', async (page) => {
  mockParams.page = page;
  await render(<EpisodeRoute />);
  expect(mockReader).toHaveBeenLastCalledWith({ id: 'orozbakov-v1-001', initialPage: Number(page) });
});

it.each([undefined, '', '10', '9999', '11.5', '-11', '9007199254740992', ['11', '12'], 'abc'])('falls back for invalid query %s', async (page) => {
  mockParams.page = page;
  await render(<EpisodeRoute />);
  expect(mockReader).toHaveBeenLastCalledWith({ id: 'orozbakov-v1-001', initialPage: undefined });
});
