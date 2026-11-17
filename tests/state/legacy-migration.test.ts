import { LEGACY_STORE_KEY, migrateLegacyStorage } from '../../src/features/local-state/legacy-migration';

describe('legacy storage migration', () => {
  it('deletes the legacy wrapper before returning only exact safe preferences', async () => {
    const events: string[] = [];
    const storage = {
      getItem: jest.fn(async (key: string) => {
        events.push(`get:${key}`);
        return JSON.stringify({
          state: {
            language: 'ky',
            fontScale: 'large',
            currentUser: {
              email: 'private@example.com',
              birthDate: '2000-01-01',
              avatarUri: 'file://secret',
              mockPassword: 'plaintext',
            },
            users: [{ email: 'private@example.com', password: 'plaintext' }],
            messages: [{ text: 'private conversation' }],
          },
          version: 0,
        });
      }),
      removeItem: jest.fn(async (key: string) => {
        events.push(`remove:${key}`);
      }),
    };

    const migrated = await migrateLegacyStorage(storage);

    expect(migrated).toEqual({ locale: 'ky', fontScale: 'large' });
    expect(Object.keys(migrated)).toEqual(['locale', 'fontScale']);
    expect(JSON.stringify(migrated)).not.toMatch(
      /email|password|birth|avatar|users|messages|private/,
    );
    expect(events).toEqual([`get:${LEGACY_STORE_KEY}`, `remove:${LEGACY_STORE_KEY}`]);
  });

  it('rejects near-match preference values while still deleting the legacy key', async () => {
    const storage = {
      getItem: jest.fn(async () =>
        JSON.stringify({ state: { language: 'KY', fontScale: 'extra-large' } }),
      ),
      removeItem: jest.fn(async () => undefined),
    };

    await expect(migrateLegacyStorage(storage)).resolves.toEqual({});
    expect(storage.removeItem).toHaveBeenCalledWith(LEGACY_STORE_KEY);
  });

  it('returns nothing when deletion fails and permits a later retry', async () => {
    const storage = {
      getItem: jest.fn(async () =>
        JSON.stringify({ state: { language: 'ru', fontScale: 'small' } }),
      ),
      removeItem: jest
        .fn<Promise<void>, [string]>()
        .mockRejectedValueOnce(new Error('storage unavailable'))
        .mockResolvedValueOnce(undefined),
    };

    await expect(migrateLegacyStorage(storage)).resolves.toEqual({});
    await expect(migrateLegacyStorage(storage)).resolves.toEqual({
      locale: 'ru',
      fontScale: 'small',
    });
    expect(storage.removeItem).toHaveBeenCalledTimes(2);
  });
});
