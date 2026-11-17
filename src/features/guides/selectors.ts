import {
  getGuideById,
  getPublishedGuides,
  getSourceById,
  guideArticles,
} from '../../data/guides';
import type { GuideArticle, GuideProgress, ReferenceSource } from './types';

export function getSourcesForGuide(id: string): ReferenceSource[] {
  const guide = getGuideById(id);
  if (!guide) {
    return [];
  }

  const seen = new Set<string>();
  const sourceIds = guide.sections.flatMap((section) =>
    section.paragraphs.flatMap((paragraph) =>
      paragraph.claimRefs.flatMap(({ sourceId }) => {
        if (seen.has(sourceId)) {
          return [];
        }
        seen.add(sourceId);
        return [sourceId];
      }),
    ),
  );

  return sourceIds.flatMap((sourceId) => {
    const source = getSourceById(sourceId);
    return source ? [source] : [];
  });
}

export function getRelatedGuides(id: string, limit = 3): GuideArticle[] {
  const current = getGuideById(id);
  if (!current || limit <= 0) {
    return [];
  }

  const topicIds = new Set(current.topicIds);
  return getPublishedGuides()
    .map((guide, registryIndex) => ({
      guide,
      registryIndex,
      sharedTopics: guide.topicIds.filter((topicId) => topicIds.has(topicId)).length,
    }))
    .filter(({ guide, sharedTopics }) => guide.id !== id && sharedTopics > 0)
    .sort(
      (left, right) =>
        right.sharedTopics - left.sharedTopics || left.registryIndex - right.registryIndex,
    )
    .slice(0, limit)
    .map(({ guide }) => guide);
}

export function getCompletionSummary(
  progress: Record<string, GuideProgress>,
): { completed: number; total: number } {
  const validGuideIds = new Set<string>(guideArticles.map(({ id }) => id));
  const completed = Object.entries(progress).filter(
    ([id, guideProgress]) => validGuideIds.has(id) && Boolean(guideProgress.completedAt),
  ).length;

  return { completed, total: guideArticles.length };
}

export function getValidSavedGuides(ids: readonly string[]): GuideArticle[] {
  const savedIds = new Set(ids);
  return guideArticles.filter(({ id }) => savedIds.has(id));
}

export function getRecentGuides(progress: Record<string, GuideProgress>): GuideArticle[] {
  return Object.entries(progress)
    .flatMap(([id, guideProgress]) => {
      const guide = getGuideById(id);
      return guide ? [{ guide, lastOpenedAt: guideProgress.lastOpenedAt }] : [];
    })
    .sort((left, right) => {
      const dateDifference = Date.parse(right.lastOpenedAt) - Date.parse(left.lastOpenedAt);
      if (Number.isFinite(dateDifference) && dateDifference !== 0) {
        return dateDifference;
      }
      return guideArticles.findIndex(({ id }) => id === left.guide.id) -
        guideArticles.findIndex(({ id }) => id === right.guide.id);
    })
    .map(({ guide }) => guide);
}
