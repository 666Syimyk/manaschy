jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGuideStaticParams, getSourceStaticParams } from '../../src/data/guides';
import { generateStaticParams as generateGuideParams } from '../../src/app/guide/[id]';
import { generateStaticParams as generateSourceParams } from '../../src/app/source/[id]';
import { generateStaticParams as generateEpisodeParams } from '../../src/app/episode/[id]';

describe('static detail parameters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns every published guide ID exactly once without storage access', async () => {
    const params = await generateGuideParams();

    expect(params).toEqual(getGuideStaticParams());
    expect(new Set(params.map(({ id }) => id)).size).toBe(params.length);
    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('returns every published source ID exactly once without storage access', async () => {
    const params = await generateSourceParams();

    expect(params).toEqual(getSourceStaticParams());
    expect(new Set(params.map(({ id }) => id)).size).toBe(params.length);
    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('exports all original sections and preserves the six old redirect URLs', async () => {
    const params = await generateEpisodeParams();
    expect(params).toHaveLength(48);
    expect(new Set(params.map(({ id }) => id)).size).toBe(48);
    expect(params).toEqual(expect.arrayContaining([
      { id: 'orozbakov-v1-001' }, { id: 'orozbakov-v4-031' },
      { id: 'k-1' }, { id: 'k-2' }, { id: 'k-3' },
      { id: 'o-1' }, { id: 'o-2' }, { id: 'o-3' },
    ]));
    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});
