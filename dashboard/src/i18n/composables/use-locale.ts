import { useI18n } from 'vue-i18n';

import { loadLocale } from '../i18n';
import { LOCALE_CODES, type LocaleCode } from '../locale-codes';

const STORAGE_KEY = 'vision-locale';

/**
 * Locale state and switching. The active locale is persisted so the choice
 * survives reloads; `setLocale` lazily loads the target locale's bundle (it
 * is code-split and fetched on demand) before activating it, then persists
 * the choice. The supported list is derived from the shipped translation
 * bundles.
 */
export function useLocale() {
  const { locale } = useI18n();

  async function setLocale(code: LocaleCode) {
    await loadLocale(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* storage unavailable — the choice stays in-memory only */
    }
  }

  return {
    locale,
    setLocale,
    supportedLocales: LOCALE_CODES,
  };
}
