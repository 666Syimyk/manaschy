import { useCallback } from 'react';
import { useGuideStore } from '@/features/local-state/store';
import type { Locale } from '@/features/guides/types';
import { ky } from './ky';
import { ru, type TranslationKey } from './ru';

export type TranslationParams = Record<string, string | number>;

export function translate(
  locale: Locale,
  key: TranslationKey,
  params: TranslationParams = {},
): string {
  const dictionary = locale === 'ky' ? ky : ru;
  return dictionary[key].replace(/\{([a-zA-Z0-9_]+)\}/g, (token, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : token,
  );
}

export function useT() {
  const locale = useGuideStore((state) => state.locale);
  return useCallback(
    (key: TranslationKey, params?: TranslationParams) => translate(locale, key, params),
    [locale],
  );
}

export { ky, ru };
export type { TranslationKey };
