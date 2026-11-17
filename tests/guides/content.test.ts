import {
  getGuideById,
  getGuideStaticParams,
  getPublishedGuides,
  guideArticles,
  guideTopics,
  referenceSources,
} from '../../src/data/guides';
import {
  countLocalizedWords,
  validateGuideRegistry,
} from '../../src/features/guides/validation';

const EXPECTED_GUIDE_IDS = [
  'trilogy',
  'manaschi',
  'variation',
  'manas-cycle',
  'semetey-cycle',
  'seytek-cycle',
  'orozbakov-recording',
  'orozbakov-manuscripts',
  'unesco-2013',
  'memory-of-world-2023',
] as const;

describe('published guide corpus', () => {
  it('ships exactly the ten approved guides with stable unique IDs', () => {
    const ids = guideArticles.map(({ id }) => id);

    expect(ids).toEqual(EXPECTED_GUIDE_IDS);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))).toBe(true);
  });

  it('passes the production registry validator', () => {
    expect(validateGuideRegistry(guideArticles, referenceSources, guideTopics)).toEqual([]);
  });

  it('contains 250-600 words in each locale and at least two paragraphs per guide', () => {
    for (const guide of guideArticles) {
      const paragraphs = guide.sections.flatMap(({ paragraphs: items }) => items);
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);

      for (const locale of ['ru', 'ky'] as const) {
        const count = paragraphs.reduce(
          (total, paragraph) => total + countLocalizedWords(paragraph.text[locale]),
          0,
        );
        expect(count).toBeGreaterThanOrEqual(250);
        expect(count).toBeLessThanOrEqual(600);
      }
    }
  });

  it('cites every paragraph and resolves every source and topic', () => {
    const sourceIds = new Set<string>(referenceSources.map(({ id }) => id));
    const topicIds = new Set<string>(guideTopics.map(({ id }) => id));

    for (const guide of guideArticles) {
      expect(guide.topicIds.length).toBeGreaterThan(0);
      expect(guide.topicIds.every((id) => topicIds.has(id))).toBe(true);

      const citedSourceIds = new Set<string>();
      for (const paragraph of guide.sections.flatMap(({ paragraphs }) => paragraphs)) {
        expect(paragraph.claimRefs.length).toBeGreaterThan(0);
        for (const reference of paragraph.claimRefs) {
          expect(sourceIds.has(reference.sourceId)).toBe(true);
          citedSourceIds.add(reference.sourceId);
        }
      }
      expect(citedSourceIds.size).toBeGreaterThanOrEqual(1);
    }
  });

  it('has positive reading times and contains no prototype or permission claims', () => {
    const unsafeText =
      /placeholder|lorem ipsum|текст будет добавлен|контент будет добавлен|permission_granted|разрешение получено|уруксат алынды/i;

    for (const guide of guideArticles) {
      expect(guide.readingMinutes).toBeGreaterThan(0);
      expect(JSON.stringify(guide)).not.toMatch(unsafeText);
    }
  });

  it('exposes pure guide lookup and static route selectors', () => {
    expect(getPublishedGuides()).toEqual(guideArticles);
    expect(getGuideById('manaschi')?.id).toBe('manaschi');
    expect(getGuideById('unknown-guide')).toBeUndefined();
    expect(getGuideStaticParams()).toEqual(EXPECTED_GUIDE_IDS.map((id) => ({ id })));
  });
});
