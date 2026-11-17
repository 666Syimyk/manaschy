import { manasCycleGuide } from './articles/manas-cycle';
import { manaschiGuide } from './articles/manaschi';
import { memoryOfWorld2023Guide } from './articles/memory-of-world-2023';
import { orozbakovManuscriptsGuide } from './articles/orozbakov-manuscripts';
import { orozbakovRecordingGuide } from './articles/orozbakov-recording';
import { semeteyCycleGuide } from './articles/semetey-cycle';
import { seytekCycleGuide } from './articles/seytek-cycle';
import { trilogyGuide } from './articles/trilogy';
import { unesco2013Guide } from './articles/unesco-2013';
import { variationGuide } from './articles/variation';
import { referenceSources } from './sources';
import { guideTopics } from './topics';
import type { GuideArticle, ReferenceSource } from '../../features/guides/types';

export { guideTopics, referenceSources };

export const guideArticles = [
  trilogyGuide,
  manaschiGuide,
  variationGuide,
  manasCycleGuide,
  semeteyCycleGuide,
  seytekCycleGuide,
  orozbakovRecordingGuide,
  orozbakovManuscriptsGuide,
  unesco2013Guide,
  memoryOfWorld2023Guide,
] as const satisfies readonly GuideArticle[];

export function getPublishedSources(): readonly ReferenceSource[] {
  return referenceSources.filter(({ status }) => status === 'published');
}

export function getSourceById(id: string): ReferenceSource | undefined {
  return referenceSources.find((source) => source.id === id);
}

export function getSourceStaticParams(): { id: string }[] {
  return getPublishedSources().map(({ id }) => ({ id }));
}

export function getPublishedGuides(): readonly GuideArticle[] {
  return guideArticles.filter(({ status }) => status === 'published');
}

export function getGuideById(id: string): GuideArticle | undefined {
  return guideArticles.find((guide) => guide.id === id);
}

export function getGuideStaticParams(): { id: string }[] {
  return getPublishedGuides().map(({ id }) => ({ id }));
}
