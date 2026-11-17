import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocalState } from '../guides/types';

export const LEGACY_STORE_KEY = 'manaschy-app-store';

type LegacyStorage = Pick<typeof AsyncStorage, 'getItem' | 'removeItem'>;
type MigratedPreferences = Partial<Pick<LocalState, 'locale' | 'fontScale'>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function migrateLegacyStorage(storage: LegacyStorage): Promise<MigratedPreferences> {
  try {
    const raw = await storage.getItem(LEGACY_STORE_KEY);
    await storage.removeItem(LEGACY_STORE_KEY);

    if (raw === null) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    const candidate = isRecord(parsed) && isRecord(parsed.state) ? parsed.state : parsed;
    if (!isRecord(candidate)) {
      return {};
    }

    const migrated: MigratedPreferences = {};
    if (candidate.language === 'ru' || candidate.language === 'ky') {
      migrated.locale = candidate.language;
    }
    if (
      candidate.fontScale === 'small' ||
      candidate.fontScale === 'medium' ||
      candidate.fontScale === 'large'
    ) {
      migrated.fontScale = candidate.fontScale;
    }
    return migrated;
  } catch {
    return {};
  }
}
