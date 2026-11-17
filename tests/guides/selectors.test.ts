import { guideArticles, referenceSources } from '../../src/data/guides';
import {
  getCompletionSummary,
  getRecentGuides,
  getRelatedGuides,
  getSourcesForGuide,
  getValidSavedGuides,
} from '../../src/features/guides/selectors';
import type { GuideProgress } from '../../src/features/guides/types';

describe('guide selectors', () => {
  it('derives a unique source list from paragraph references', () => {
    const sources = getSourcesForGuide('trilogy');

    expect(sources.map(({ id }) => id)).toEqual([
      'unesco-ich-00876',
      'unesco-decision-8-com-8-19',
    ]);
    expect(sources[0]).toBe(referenceSources[0]);
    expect(getSourcesForGuide('stale-guide')).toEqual([]);
  });

  it('returns related guides by shared topics without the current guide', () => {
    const related = getRelatedGuides('trilogy');
    const trilogyTopicIds = new Set(guideArticles[0].topicIds);

    expect(related).toHaveLength(3);
    expect(related.map(({ id }) => id)).not.toContain('trilogy');
    expect(related.every((guide) => guide.topicIds.some((id) => trilogyTopicIds.has(id)))).toBe(
      true,
    );
    expect(getRelatedGuides('trilogy', 1)).toHaveLength(1);
    expect(getRelatedGuides('stale-guide')).toEqual([]);
  });

  it('counts only completed records that resolve to the current registry', () => {
    const progress: Record<string, GuideProgress> = {
      trilogy: {
        firstOpenedAt: '2026-09-25T10:00:00.000Z',
        lastOpenedAt: '2026-09-26T10:00:00.000Z',
        completedAt: '2026-09-26T10:05:00.000Z',
      },
      manaschi: {
        firstOpenedAt: '2026-09-27T10:00:00.000Z',
        lastOpenedAt: '2026-09-27T10:00:00.000Z',
      },
      'removed-guide': {
        firstOpenedAt: '2026-09-27T11:00:00.000Z',
        lastOpenedAt: '2026-09-27T11:00:00.000Z',
        completedAt: '2026-09-27T11:05:00.000Z',
      },
    };

    expect(getCompletionSummary(progress)).toEqual({ completed: 1, total: guideArticles.length });
  });

  it('prunes stale and duplicate saved IDs in registry order without mutating the caller list', () => {
    const ids = ['variation', 'removed-guide', 'trilogy', 'variation'] as const;
    const original = [...ids];

    expect(getValidSavedGuides(ids).map(({ id }) => id)).toEqual(['trilogy', 'variation']);
    expect(ids).toEqual(original);
  });

  it('sorts valid recent guides by lastOpenedAt and ignores stale progress', () => {
    const progress: Record<string, GuideProgress> = {
      trilogy: {
        firstOpenedAt: '2026-09-20T10:00:00.000Z',
        lastOpenedAt: '2026-09-21T10:00:00.000Z',
      },
      variation: {
        firstOpenedAt: '2026-09-20T10:00:00.000Z',
        lastOpenedAt: '2026-09-23T10:00:00.000Z',
      },
      manaschi: {
        firstOpenedAt: '2026-09-20T10:00:00.000Z',
        lastOpenedAt: '2026-09-22T10:00:00.000Z',
      },
      'removed-guide': {
        firstOpenedAt: '2026-09-20T10:00:00.000Z',
        lastOpenedAt: '2026-09-24T10:00:00.000Z',
      },
    };
    const snapshot = JSON.stringify(progress);

    expect(getRecentGuides(progress).map(({ id }) => id)).toEqual([
      'variation',
      'manaschi',
      'trilogy',
    ]);
    expect(JSON.stringify(progress)).toBe(snapshot);
  });
});
