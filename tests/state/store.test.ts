jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { guideArticles } from '../../src/data/guides';
import { LEGACY_STORE_KEY } from '../../src/features/local-state/legacy-migration';
import { DEFAULT_LOCAL_STATE, GUIDE_STORE_KEY } from '../../src/features/local-state/schema';
import { useGuideStore } from '../../src/features/local-state/store';

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

function resetStore() {
  useGuideStore.setState({ ...DEFAULT_LOCAL_STATE, lastGuideId: undefined, hydrated: false });
}

describe('guide store', () => {
  beforeEach(async () => {
    jest.useRealTimers();
    await storage.clear();
    jest.clearAllMocks();
    resetStore();
  });

  it('removes legacy data before reading production state and keeps valid production preferences', async () => {
    const events: string[] = [];
    storage.getItem.mockImplementation(async (key) => {
      events.push(`get:${key}`);
      if (key === LEGACY_STORE_KEY) {
        return JSON.stringify({ state: { language: 'ky', fontScale: 'large' } });
      }
      if (key === GUIDE_STORE_KEY) {
        return JSON.stringify({
          state: { ...DEFAULT_LOCAL_STATE, locale: 'ru', fontScale: 'small' },
          version: 1,
        });
      }
      return null;
    });
    storage.removeItem.mockImplementation(async (key) => {
      events.push(`remove:${key}`);
    });

    await useGuideStore.getState().initialize();

    expect(events.slice(0, 3)).toEqual([
      `get:${LEGACY_STORE_KEY}`,
      `remove:${LEGACY_STORE_KEY}`,
      `get:${GUIDE_STORE_KEY}`,
    ]);
    expect(useGuideStore.getState()).toMatchObject({
      hydrated: true,
      locale: 'ru',
      fontScale: 'small',
    });
  });

  it('uses safe legacy preferences only when production values are absent or invalid', async () => {
    storage.getItem.mockImplementation(async (key) => {
      if (key === LEGACY_STORE_KEY) {
        return JSON.stringify({ state: { language: 'ky', fontScale: 'large' } });
      }
      return JSON.stringify({
        state: { ...DEFAULT_LOCAL_STATE, locale: 'invalid', fontScale: 'huge' },
        version: 1,
      });
    });

    await useGuideStore.getState().initialize();

    expect(useGuideStore.getState()).toMatchObject({ locale: 'ky', fontScale: 'large' });
  });

  it('ignores unknown guides and preserves firstOpenedAt while refreshing lastOpenedAt', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-27T10:00:00.000Z'));

    await useGuideStore.getState().openGuide('removed-guide');
    expect(useGuideStore.getState().guideProgress).toEqual({});

    await useGuideStore.getState().openGuide('trilogy');
    expect(useGuideStore.getState().guideProgress.trilogy).toEqual({
      firstOpenedAt: '2026-09-27T10:00:00.000Z',
      lastOpenedAt: '2026-09-27T10:00:00.000Z',
    });

    jest.setSystemTime(new Date('2026-09-27T11:00:00.000Z'));
    await useGuideStore.getState().openGuide('trilogy');
    expect(useGuideStore.getState().guideProgress.trilogy).toEqual({
      firstOpenedAt: '2026-09-27T10:00:00.000Z',
      lastOpenedAt: '2026-09-27T11:00:00.000Z',
    });
  });

  it('toggles bookmarks without duplicates and supports explicit complete/uncomplete', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-27T12:00:00.000Z'));

    await useGuideStore.getState().toggleSavedGuide('trilogy');
    await useGuideStore.getState().toggleSavedGuide('removed-guide');
    expect(useGuideStore.getState().savedGuideIds).toEqual(['trilogy']);

    await useGuideStore.getState().toggleSavedGuide('trilogy');
    expect(useGuideStore.getState().savedGuideIds).toEqual([]);

    await useGuideStore.getState().setGuideCompleted('manaschi', true);
    expect(useGuideStore.getState().guideProgress.manaschi.completedAt).toBe(
      '2026-09-27T12:00:00.000Z',
    );
    await useGuideStore.getState().setGuideCompleted('manaschi', false);
    expect(useGuideStore.getState().guideProgress.manaschi.completedAt).toBeUndefined();
  });

  it('removes the production key and restores onboarding defaults', async () => {
    useGuideStore.setState({
      onboarded: true,
      locale: 'ky',
      fontScale: 'large',
      savedGuideIds: ['trilogy'],
      lastGuideId: 'trilogy',
    });

    await useGuideStore.getState().resetLocalData();

    expect(storage.removeItem).toHaveBeenCalledWith(GUIDE_STORE_KEY);
    expect(useGuideStore.getState()).toMatchObject({ ...DEFAULT_LOCAL_STATE, hydrated: true });
    expect(useGuideStore.getState().lastGuideId).toBeUndefined();
  });

  it('keeps the catalog and in-memory actions usable when storage rejects', async () => {
    storage.getItem.mockRejectedValue(new Error('read failed'));
    storage.setItem.mockRejectedValue(new Error('write failed'));
    storage.removeItem.mockRejectedValue(new Error('remove failed'));

    await expect(useGuideStore.getState().initialize()).resolves.toBeUndefined();
    await expect(useGuideStore.getState().finishOnboarding()).resolves.toBeUndefined();
    await expect(useGuideStore.getState().toggleSavedGuide('trilogy')).resolves.toBeUndefined();
    await expect(useGuideStore.getState().resetLocalData()).resolves.toBeUndefined();

    expect(useGuideStore.getState().hydrated).toBe(true);
    expect(guideArticles).toHaveLength(10);
  });
});
