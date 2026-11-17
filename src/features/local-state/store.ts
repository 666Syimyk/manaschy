import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { guideArticles } from '../../data/guides';
import type { LocalState, Locale } from '../guides/types';
import { migrateLegacyStorage } from './legacy-migration';
import {
  decodeStoredState,
  DEFAULT_LOCAL_STATE,
  GUIDE_STORE_KEY,
  sanitizeLocalState,
} from './schema';

type FontScale = LocalState['fontScale'];

interface GuideStore extends LocalState {
  hydrated: boolean;
  initialize: () => Promise<void>;
  finishOnboarding: () => Promise<void>;
  setLocale: (locale: Locale) => Promise<void>;
  setFontScale: (fontScale: FontScale) => Promise<void>;
  openGuide: (id: string) => Promise<void>;
  setGuideCompleted: (id: string, completed: boolean) => Promise<void>;
  toggleSavedGuide: (id: string) => Promise<void>;
  resetLocalData: () => Promise<void>;
}

const validGuideIds = new Set<string>(guideArticles.map(({ id }) => id));

function freshDefaults(): LocalState {
  return {
    ...DEFAULT_LOCAL_STATE,
    savedGuideIds: [],
    guideProgress: {},
  };
}

function selectLocalState(state: GuideStore): LocalState {
  const selected: LocalState = {
    schemaVersion: 1,
    locale: state.locale,
    fontScale: state.fontScale,
    onboarded: state.onboarded,
    savedGuideIds: [...state.savedGuideIds],
    guideProgress: Object.fromEntries(
      Object.entries(state.guideProgress).map(([id, progress]) => [id, { ...progress }]),
    ),
  };
  if (state.lastGuideId) {
    selected.lastGuideId = state.lastGuideId;
  }
  return sanitizeLocalState(selected, validGuideIds);
}

async function persistState(state: GuideStore): Promise<void> {
  try {
    await AsyncStorage.setItem(
      GUIDE_STORE_KEY,
      JSON.stringify({ state: selectLocalState(state), version: 1 }),
    );
  } catch {
    // Reading remains fully usable in memory when platform storage is unavailable.
  }
}

function validStoredPreferences(raw: string | null): {
  locale: boolean;
  fontScale: boolean;
} {
  try {
    if (raw === null) return { locale: false, fontScale: false };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return { locale: false, fontScale: false };
    }
    const wrapper = parsed as Record<string, unknown>;
    const candidate =
      typeof wrapper.state === 'object' && wrapper.state !== null
        ? (wrapper.state as Record<string, unknown>)
        : wrapper;
    if (candidate.schemaVersion !== 1) {
      return { locale: false, fontScale: false };
    }
    return {
      locale: candidate.locale === 'ru' || candidate.locale === 'ky',
      fontScale:
        candidate.fontScale === 'small' ||
        candidate.fontScale === 'medium' ||
        candidate.fontScale === 'large',
    };
  } catch {
    return { locale: false, fontScale: false };
  }
}

let initializationPromise: Promise<void> | null = null;

export const useGuideStore = create<GuideStore>((set, get) => ({
  ...freshDefaults(),
  hydrated: false,

  initialize: async () => {
    if (initializationPromise) {
      return initializationPromise;
    }

    initializationPromise = (async () => {
      const legacyPreferences = await migrateLegacyStorage(AsyncStorage);

      let raw: string | null = null;
      try {
        raw = await AsyncStorage.getItem(GUIDE_STORE_KEY);
      } catch {
        raw = null;
      }

      const decoded = decodeStoredState(raw, validGuideIds);
      const validPreferences = validStoredPreferences(raw);
      const nextState: LocalState = {
        ...decoded,
        locale:
          validPreferences.locale || legacyPreferences.locale === undefined
            ? decoded.locale
            : legacyPreferences.locale,
        fontScale:
          validPreferences.fontScale || legacyPreferences.fontScale === undefined
            ? decoded.fontScale
            : legacyPreferences.fontScale,
      };
      set({ ...nextState, lastGuideId: nextState.lastGuideId, hydrated: true });

      const usedLegacyPreference =
        (!validPreferences.locale && legacyPreferences.locale !== undefined) ||
        (!validPreferences.fontScale && legacyPreferences.fontScale !== undefined);
      if (usedLegacyPreference) {
        await persistState(get());
      }
    })();

    try {
      await initializationPromise;
    } finally {
      initializationPromise = null;
    }
  },

  finishOnboarding: async () => {
    set({ onboarded: true });
    await persistState(get());
  },

  setLocale: async (locale) => {
    set({ locale });
    await persistState(get());
  },

  setFontScale: async (fontScale) => {
    set({ fontScale });
    await persistState(get());
  },

  openGuide: async (id) => {
    if (!validGuideIds.has(id)) {
      return;
    }
    const openedAt = new Date().toISOString();
    set((state) => {
      const previous = state.guideProgress[id];
      return {
        guideProgress: {
          ...state.guideProgress,
          [id]: {
            ...previous,
            firstOpenedAt: previous?.firstOpenedAt ?? openedAt,
            lastOpenedAt: openedAt,
          },
        },
        lastGuideId: id,
      };
    });
    await persistState(get());
  },

  setGuideCompleted: async (id, completed) => {
    if (!validGuideIds.has(id)) {
      return;
    }
    const changedAt = new Date().toISOString();
    const previous = get().guideProgress[id];
    if (!previous && !completed) {
      return;
    }

    set((state) => {
      const current = state.guideProgress[id];
      const base = current ?? { firstOpenedAt: changedAt, lastOpenedAt: changedAt };
      const { completedAt: _completedAt, ...withoutCompletion } = base;
      return {
        guideProgress: {
          ...state.guideProgress,
          [id]: completed ? { ...base, completedAt: changedAt } : withoutCompletion,
        },
      };
    });
    await persistState(get());
  },

  toggleSavedGuide: async (id) => {
    if (!validGuideIds.has(id)) {
      return;
    }
    set((state) => ({
      savedGuideIds: state.savedGuideIds.includes(id)
        ? state.savedGuideIds.filter((savedId) => savedId !== id)
        : [...state.savedGuideIds, id],
    }));
    await persistState(get());
  },

  resetLocalData: async () => {
    try {
      await AsyncStorage.removeItem(GUIDE_STORE_KEY);
    } catch {
      // The in-memory reset still succeeds; another reset can retry deletion.
    }
    set({ ...freshDefaults(), lastGuideId: undefined, hydrated: true });
  },
}));
