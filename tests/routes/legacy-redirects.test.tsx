jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockRedirect = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'k-1' }),
  Redirect: ({ href }: { href: string }) => {
    mockRedirect(href);
    return null;
  },
}));

import { render } from '@testing-library/react-native';
import EditProfileRedirect from '../../src/app/edit-profile';
import EpisodeRoute from '../../src/app/episode/[id]';
import HistoryRedirect from '../../src/app/history';
import LoginRedirect from '../../src/app/login';
import RegisterRedirect from '../../src/app/register';
import VariantsRedirect from '../../src/app/variants';

describe('legacy route redirects', () => {
  beforeEach(() => mockRedirect.mockClear());

  it.each([
    ['login', LoginRedirect, '/'],
    ['register', RegisterRedirect, '/'],
    ['edit profile', EditProfileRedirect, '/(tabs)/settings'],
    ['episode detail', EpisodeRoute, '/(tabs)/guides'],
    ['variants', VariantsRedirect, '/(tabs)/guides'],
    ['history', HistoryRedirect, '/(tabs)/saved'],
  ])('redirects %s to its exact local destination', async (_name, Component, destination) => {
    await render(<Component />);
    expect(mockRedirect).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith(destination);
  });
});
