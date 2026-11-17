import {
  DEFAULT_LOCAL_STATE,
  decodeStoredState,
  sanitizeLocalState,
} from '../../src/features/local-state/schema';

const validGuideIds = new Set(['trilogy', 'manaschi']);

describe('local-state schema', () => {
  it('falls back for absent, corrupt, and unsupported stored payloads', () => {
    expect(decodeStoredState(null, validGuideIds)).toEqual(DEFAULT_LOCAL_STATE);
    expect(decodeStoredState('{broken json', validGuideIds)).toEqual(DEFAULT_LOCAL_STATE);
    expect(
      decodeStoredState(
        JSON.stringify({
          state: { schemaVersion: 2, locale: 'ky', fontScale: 'large', onboarded: true },
          version: 2,
        }),
        validGuideIds,
      ),
    ).toEqual(DEFAULT_LOCAL_STATE);
  });

  it('keeps only approved fields and prunes hostile or malformed values', () => {
    const state = sanitizeLocalState(
      {
        schemaVersion: 1,
        locale: 'ky',
        fontScale: 'huge',
        onboarded: true,
        savedGuideIds: ['trilogy', 'removed-guide', 'trilogy', 42],
        guideProgress: {
          trilogy: {
            firstOpenedAt: '2026-09-25T10:00:00.000Z',
            lastOpenedAt: '2026-09-26T10:00:00.000Z',
            completedAt: 'not-a-date',
            password: 'must-not-survive',
          },
          manaschi: {
            firstOpenedAt: 'yesterday',
            lastOpenedAt: '2026-09-26T10:00:00.000Z',
          },
          'removed-guide': {
            firstOpenedAt: '2026-09-25T10:00:00.000Z',
            lastOpenedAt: '2026-09-26T10:00:00.000Z',
          },
        },
        lastGuideId: 'removed-guide',
        email: 'private@example.com',
        password: 'plaintext',
        birthDate: '2000-01-01',
        avatar: 'data:image/png;base64,secret',
        users: [{ email: 'private@example.com' }],
        messages: [{ text: 'private' }],
        unknown: 'discard me',
      },
      validGuideIds,
    );

    expect(state).toEqual({
      schemaVersion: 1,
      locale: 'ky',
      fontScale: 'medium',
      onboarded: true,
      savedGuideIds: ['trilogy'],
      guideProgress: {
        trilogy: {
          firstOpenedAt: '2026-09-25T10:00:00.000Z',
          lastOpenedAt: '2026-09-26T10:00:00.000Z',
        },
      },
    });
    expect(JSON.stringify(state)).not.toMatch(
      /private@example|plaintext|birthDate|avatar|users|messages|unknown|password/,
    );
  });

  it('decodes a valid Zustand wrapper without changing firstOpenedAt', () => {
    const raw = JSON.stringify({
      state: {
        schemaVersion: 1,
        locale: 'ru',
        fontScale: 'small',
        onboarded: false,
        savedGuideIds: ['manaschi'],
        guideProgress: {
          manaschi: {
            firstOpenedAt: '2026-09-20T08:00:00.000Z',
            lastOpenedAt: '2026-09-21T09:00:00.000Z',
            completedAt: '2026-09-21T09:30:00.000Z',
          },
        },
        lastGuideId: 'manaschi',
      },
      version: 1,
    });

    expect(decodeStoredState(raw, validGuideIds).guideProgress.manaschi).toEqual({
      firstOpenedAt: '2026-09-20T08:00:00.000Z',
      lastOpenedAt: '2026-09-21T09:00:00.000Z',
      completedAt: '2026-09-21T09:30:00.000Z',
    });
  });
});
