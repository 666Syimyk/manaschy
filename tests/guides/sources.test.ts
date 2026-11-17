import {
  getPublishedSources,
  getSourceById,
  getSourceStaticParams,
  guideTopics,
  referenceSources,
} from '../../src/data/guides';
import { validateSourceRegistry } from '../../src/features/guides/validation';

const EXPECTED_SOURCE_IDS = [
  'unesco-ich-00876',
  'unesco-decision-8-com-8-19',
  'unesco-memory-orozbakov',
  'unesco-memory-announcement-2023',
  'orozbakov-2018-volume-1',
  'orozbakov-2018-volume-2',
  'orozbakov-2018-volume-3',
  'orozbakov-2018-volume-4',
] as const;

describe('verified source registry', () => {
  it('contains UNESCO records and all four original-text volumes', () => {
    expect(referenceSources.map(({ id }) => id)).toEqual(EXPECTED_SOURCE_IDS);
    expect(validateSourceRegistry(referenceSources, guideTopics)).toEqual([]);
  });

  it('keeps every source published, HTTPS, and link-only', () => {
    for (const source of referenceSources) {
      expect(source.url.startsWith('https://')).toBe(true);
      expect(source.status).toBe('published');
      expect(source.rightsScope).toBe('link_only');
      expect(source.lastCheckedAt).toMatch(/^2026-09-(27|28)$/);
    }
  });

  it('does not claim permission to copy or redistribute source material', () => {
    const permissionClaim =
      /permission_granted|reuse (?:is )?permitted|разрешено переиспользование|кайра колдонууга уруксат/i;

    for (const source of referenceSources) {
      const claims = [source.title, source.rightsNote.ru, source.rightsNote.ky];
      expect(claims).not.toEqual(expect.arrayContaining([expect.stringMatching(permissionClaim)]));
    }
  });

  it('has unique stable source IDs', () => {
    const ids = referenceSources.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))).toBe(true);
  });

  it('exposes pure published-source selectors and static params', () => {
    expect(getPublishedSources()).toEqual(referenceSources);
    expect(getSourceById('unesco-memory-orozbakov')?.publisher).toBe('UNESCO');
    expect(getSourceById('unknown-source')).toBeUndefined();
    expect(getSourceStaticParams()).toEqual(EXPECTED_SOURCE_IDS.map((id) => ({ id })));
  });
});

describe('guide topics', () => {
  it('has unique stable IDs and non-empty labels in both locales', () => {
    const ids = guideTopics.map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))).toBe(true);
    for (const topic of guideTopics) {
      expect(topic.label.ru.trim()).not.toBe('');
      expect(topic.label.ky.trim()).not.toBe('');
    }
  });
});
