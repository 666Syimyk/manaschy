import type {
  GuideArticle,
  LocalizedText,
  ReferenceSource,
  Topic,
} from '../../src/features/guides/types';
import {
  countLocalizedWords,
  validateGuideRegistry,
  validateSourceRegistry,
} from '../../src/features/guides/validation';

const localized = (ru: string, ky = ru): LocalizedText => ({ ru, ky });
const words = (count: number, word: string) => Array.from({ length: count }, () => word).join(' ');

const validTopic: Topic = {
  id: 'living-heritage',
  label: localized('Живое наследие', 'Жандуу мурас'),
};

const validSource: ReferenceSource = {
  id: 'unesco-ich-2013',
  title: 'Kyrgyz epic trilogy: Manas, Semetey, Seytek',
  publisher: 'UNESCO',
  sourceType: 'official',
  url: 'https://ich.unesco.org/en/RL/kyrgyz-epic-trilogy-manas-semetey-seytek-00876',
  citationText: 'UNESCO Intangible Cultural Heritage, 2013.',
  lastCheckedAt: '2026-09-27',
  rightsScope: 'link_only',
  rightsNote: localized('Только ссылка.', 'Шилтеме гана.'),
  status: 'published',
};

const makeGuide = (): GuideArticle => ({
  id: 'valid-guide',
  title: localized('Проверенный материал', 'Текшерилген материал'),
  summary: localized('Краткое описание.', 'Кыскача сүрөттөмө.'),
  sections: [
    {
      id: 'introduction',
      heading: localized('Введение', 'Киришүү'),
      paragraphs: [
        {
          text: {
            ru: words(250, 'слово'),
            ky: words(250, 'сөз'),
          },
          claimRefs: [{ sourceId: validSource.id, locator: 'Overview' }],
        },
      ],
    },
  ],
  topicIds: [validTopic.id],
  readingMinutes: 2,
  status: 'published',
  reviewedAt: '2026-09-27',
});

describe('countLocalizedWords', () => {
  it('counts whitespace-separated Cyrillic words without counting blank input', () => {
    expect(countLocalizedWords('  Манас\nСеметей\tСейтек  ')).toBe(3);
    expect(countLocalizedWords('   ')).toBe(0);
  });
});

describe('validateSourceRegistry', () => {
  it('accepts a complete link-only source and localized topic', () => {
    expect(validateSourceRegistry([validSource], [validTopic])).toEqual([]);
  });

  it('reports duplicate source and topic IDs', () => {
    const errors = validateSourceRegistry(
      [validSource, { ...validSource }],
      [validTopic, { ...validTopic }],
    );

    expect(errors).toContain('Duplicate source id: unesco-ich-2013');
    expect(errors).toContain('Duplicate topic id: living-heritage');
  });

  it('rejects missing locales, insecure URLs, invalid dates, drafts, and bundled-rights claims', () => {
    const source = {
      ...validSource,
      url: 'http://example.com/source',
      lastCheckedAt: '2026-02-30',
      rightsScope: 'permission_granted',
      rightsNote: { ru: 'Только ссылка.' },
      status: 'draft',
    } as unknown as ReferenceSource;

    const errors = validateSourceRegistry([source], [validTopic]);

    expect(errors).toContain('Source unesco-ich-2013 must use an HTTPS URL');
    expect(errors).toContain('Source unesco-ich-2013 has invalid lastCheckedAt: 2026-02-30');
    expect(errors).toContain('Source unesco-ich-2013 must have status published');
    expect(errors).toContain('Source unesco-ich-2013 must have rightsScope link_only');
    expect(errors).toContain('Source unesco-ich-2013 rightsNote is missing locale ky');
  });
});

describe('validateGuideRegistry', () => {
  it('accepts a complete bilingual, cited guide', () => {
    expect(validateGuideRegistry([makeGuide()], [validSource], [validTopic])).toEqual([]);
  });

  it('reports duplicate guide IDs and missing localized fields', () => {
    const first = makeGuide();
    const second = {
      ...makeGuide(),
      title: { ru: 'Только русский' },
    } as unknown as GuideArticle;
    const errors = validateGuideRegistry([first, second], [validSource], [validTopic]);

    expect(errors).toContain('Duplicate guide id: valid-guide');
    expect(errors).toContain('Guide valid-guide title is missing locale ky');
  });

  it.each([
    [249, 'ru', 'Guide valid-guide has 249 ru words; expected 250-600'],
    [601, 'ky', 'Guide valid-guide has 601 ky words; expected 250-600'],
  ] as const)('rejects %i-word %s content', (wordCount, locale, expected) => {
    const guide = makeGuide();
    guide.sections[0].paragraphs[0].text[locale] = words(
      wordCount,
      locale === 'ru' ? 'слово' : 'сөз',
    );

    expect(validateGuideRegistry([guide], [validSource], [validTopic])).toContain(expected);
  });

  it('rejects uncited paragraphs and unresolved source or topic IDs', () => {
    const guide = makeGuide();
    guide.sections[0].paragraphs.push({
      text: localized(words(10, 'дополнение'), words(10, 'кошумча')),
      claimRefs: [],
    });
    guide.sections[0].paragraphs[0].claimRefs = [{ sourceId: 'missing-source' }];
    guide.topicIds = ['missing-topic'];

    const errors = validateGuideRegistry([guide], [validSource], [validTopic]);

    expect(errors).toContain('Guide valid-guide section introduction paragraph 2 has no claim references');
    expect(errors).toContain('Guide valid-guide references unknown source: missing-source');
    expect(errors).toContain('Guide valid-guide references unknown topic: missing-topic');
  });

  it('rejects an invalid review date and a non-published status', () => {
    const guide = {
      ...makeGuide(),
      reviewedAt: '2026-13-01',
      status: 'draft',
    } as unknown as GuideArticle;

    const errors = validateGuideRegistry([guide], [validSource], [validTopic]);

    expect(errors).toContain('Guide valid-guide has invalid reviewedAt: 2026-13-01');
    expect(errors).toContain('Guide valid-guide must have status published');
  });
});
