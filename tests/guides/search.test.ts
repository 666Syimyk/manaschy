import { guideArticles } from '../../src/data/guides';
import { normalizeSearchText, searchGuides } from '../../src/features/guides/search';

describe('normalizeSearchText', () => {
  it('normalizes Unicode width, case, whitespace, and punctuation', () => {
    expect(normalizeSearchText('  МАНАС—Семетей,  СЕЙТЕК! ')).toBe('манас семетей сейтек');
    expect(normalizeSearchText('２０２３')).toBe('2023');
  });

  it('preserves searchable Kyrgyz letters', () => {
    expect(normalizeSearchText('Ң—Ө,Ү!')).toBe('ң ө ү');
  });
});

describe('searchGuides', () => {
  it('returns the complete registry for an empty or whitespace query', () => {
    expect(searchGuides('', 'ru')).toEqual(guideArticles);
    expect(searchGuides(' \n\t ', 'ky')).toEqual(guideArticles);
  });

  it('finds content from either locale even when the other locale is selected', () => {
    expect(searchGuides('дүйнөнүн эс тутуму', 'ru').map(({ id }) => id)).toContain(
      'memory-of-world-2023',
    );
    expect(searchGuides('международный реестр', 'ky').map(({ id }) => id)).toContain(
      'memory-of-world-2023',
    );
  });

  it('ranks Russian and Kyrgyz title matches above body-only matches', () => {
    expect(searchGuides('манасчи', 'ru')[0]?.id).toBe('manaschi');
    expect(searchGuides('варианттуулугун', 'ky')[0]?.id).toBe('variation');
  });

  it('finds guides through titles of their cited sources', () => {
    const ids = searchGuides('Intergovernmental Committee', 'ru').map(({ id }) => id);

    expect(ids).toContain('unesco-2013');
    expect(ids).toContain('trilogy');
    expect(ids).not.toContain('orozbakov-manuscripts');
  });

  it('preserves registry order when scores are equal', () => {
    const ids = searchGuides('тринадцати', 'ru').map(({ id }) => id);

    expect(ids).toEqual(['trilogy', 'variation', 'semetey-cycle']);
  });
});
