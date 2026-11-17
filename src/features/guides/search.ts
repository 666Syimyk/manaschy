import { guideArticles, guideTopics, referenceSources } from '../../data/guides';
import type { GuideArticle, Locale } from './types';

const OTHER_LOCALE: Record<Locale, Locale> = {
  ru: 'ky',
  ky: 'ru',
};

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function includesTerm(value: string, term: string): boolean {
  return normalizeSearchText(value).includes(term);
}

function guideSourceText(guide: GuideArticle): string {
  const citedIds = new Set(
    guide.sections.flatMap((section) =>
      section.paragraphs.flatMap((paragraph) =>
        paragraph.claimRefs.map(({ sourceId }) => sourceId),
      ),
    ),
  );

  return referenceSources
    .filter(({ id }) => citedIds.has(id))
    .map(({ title, citationText, publisher = '' }) => `${title} ${citationText} ${publisher}`)
    .join(' ');
}

function scoreTerm(guide: GuideArticle, term: string, locale: Locale): number {
  const alternateLocale = OTHER_LOCALE[locale];
  const topicLabels = guide.topicIds
    .map((id) => guideTopics.find((topic) => topic.id === id)?.label[locale] ?? '')
    .join(' ');
  const selectedBody = guide.sections
    .flatMap((section) => [
      section.heading[locale],
      ...section.paragraphs.map((paragraph) => paragraph.text[locale]),
    ])
    .join(' ');
  const alternateText = [
    guide.title[alternateLocale],
    guide.summary[alternateLocale],
    ...guide.topicIds.map(
      (id) => guideTopics.find((topic) => topic.id === id)?.label[alternateLocale] ?? '',
    ),
    ...guide.sections.flatMap((section) => [
      section.heading[alternateLocale],
      ...section.paragraphs.map((paragraph) => paragraph.text[alternateLocale]),
    ]),
  ].join(' ');

  let score = 0;
  if (includesTerm(guide.title[locale], term)) score += 5;
  if (includesTerm(topicLabels, term)) score += 3;
  if (includesTerm(guide.summary[locale], term)) score += 2;
  if (includesTerm(selectedBody, term)) score += 1;
  if (includesTerm(guideSourceText(guide), term)) score += 1;
  if (includesTerm(alternateText, term)) score += 1;
  return score;
}

export function searchGuides(query: string, locale: Locale): GuideArticle[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [...guideArticles];
  }

  const terms = normalizedQuery.split(' ');
  return guideArticles
    .map((guide, registryIndex) => {
      const termScores = terms.map((term) => scoreTerm(guide, term, locale));
      return {
        guide,
        registryIndex,
        score: termScores.reduce((total, score) => total + score, 0),
        matchesEveryTerm: termScores.every((score) => score > 0),
      };
    })
    .filter(({ matchesEveryTerm }) => matchesEveryTerm)
    .sort((left, right) => right.score - left.score || left.registryIndex - right.registryIndex)
    .map(({ guide }) => guide);
}
