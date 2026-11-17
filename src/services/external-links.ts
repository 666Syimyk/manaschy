import * as Linking from 'expo-linking';
import type { ReferenceSource } from '@/features/guides/types';

export type OpenPublishedSourceResult =
  | { ok: true }
  | { ok: false; reason: 'invalid' | 'unsupported' | 'failed' };

function isValidPublishedHttpsSource(source: ReferenceSource): boolean {
  if (source.status !== 'published' || source.rightsScope !== 'link_only') {
    return false;
  }

  try {
    const url = new URL(source.url);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export async function openPublishedSource(
  source: ReferenceSource,
): Promise<OpenPublishedSourceResult> {
  if (!isValidPublishedHttpsSource(source)) {
    return { ok: false, reason: 'invalid' };
  }

  try {
    const supported = await Linking.canOpenURL(source.url);
    if (!supported) {
      return { ok: false, reason: 'unsupported' };
    }
    await Linking.openURL(source.url);
    return { ok: true };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
