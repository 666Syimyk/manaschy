import type { GuideProgress, LocalState } from '../guides/types';

export const GUIDE_STORE_KEY = 'manaschy-guide-store-v1';

export const DEFAULT_LOCAL_STATE: LocalState = {
  schemaVersion: 1,
  locale: 'ru',
  fontScale: 'medium',
  onboarded: false,
  savedGuideIds: [],
  guideProgress: {},
};

function createDefaultLocalState(): LocalState {
  return {
    ...DEFAULT_LOCAL_STATE,
    savedGuideIds: [],
    guideProgress: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    return false;
  }

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function sanitizeProgress(value: unknown): GuideProgress | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (!isIsoTimestamp(value.firstOpenedAt) || !isIsoTimestamp(value.lastOpenedAt)) {
    return undefined;
  }

  const progress: GuideProgress = {
    firstOpenedAt: value.firstOpenedAt,
    lastOpenedAt: value.lastOpenedAt,
  };
  if (isIsoTimestamp(value.completedAt)) {
    progress.completedAt = value.completedAt;
  }
  return progress;
}

export function sanitizeLocalState(
  input: unknown,
  validGuideIds: ReadonlySet<string>,
): LocalState {
  if (!isRecord(input) || input.schemaVersion !== 1) {
    return createDefaultLocalState();
  }

  const locale = input.locale === 'ru' || input.locale === 'ky' ? input.locale : 'ru';
  const fontScale =
    input.fontScale === 'small' || input.fontScale === 'medium' || input.fontScale === 'large'
      ? input.fontScale
      : 'medium';
  const savedGuideIds = Array.isArray(input.savedGuideIds)
    ? [...new Set(input.savedGuideIds.filter(
        (id): id is string => typeof id === 'string' && validGuideIds.has(id),
      ))]
    : [];
  const guideProgress: Record<string, GuideProgress> = {};

  if (isRecord(input.guideProgress)) {
    for (const [id, candidate] of Object.entries(input.guideProgress)) {
      if (!validGuideIds.has(id)) {
        continue;
      }
      const progress = sanitizeProgress(candidate);
      if (progress) {
        guideProgress[id] = progress;
      }
    }
  }

  const state: LocalState = {
    schemaVersion: 1,
    locale,
    fontScale,
    onboarded: typeof input.onboarded === 'boolean' ? input.onboarded : false,
    savedGuideIds,
    guideProgress,
  };
  if (typeof input.lastGuideId === 'string' && validGuideIds.has(input.lastGuideId)) {
    state.lastGuideId = input.lastGuideId;
  }
  return state;
}

export function decodeStoredState(
  raw: string | null,
  validGuideIds: ReadonlySet<string>,
): LocalState {
  if (raw === null) {
    return createDefaultLocalState();
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const candidate = isRecord(parsed) && 'state' in parsed ? parsed.state : parsed;
    return sanitizeLocalState(candidate, validGuideIds);
  } catch {
    return createDefaultLocalState();
  }
}
