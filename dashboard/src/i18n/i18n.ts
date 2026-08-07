import { createI18n } from 'vue-i18n';

import { DEFAULT_LOCALE, isLocaleCode, type LocaleCode } from './locale-codes';
import type { LocaleMessages } from './locale-messages.types';
import { defaultMessages, localeLoaders } from './messages';

// Type the translation schema so `t(...)` keys are checked at compile time.
declare module 'vue-i18n' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface DefineLocaleMessage extends LocaleMessages {}
}

const STORAGE_KEY = 'vision-locale';

function detectInitialLocale(): LocaleCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isLocaleCode(saved)) return saved;
  } catch {
    /* storage unavailable — fall through to browser detection */
  }

  const browser = navigator.language?.toLowerCase() ?? '';
  const base = browser.split('-')[0];
  if (isLocaleCode(base)) return base;

  return DEFAULT_LOCALE;
}

/**
 * The app-wide i18n instance. Content (the model output) is localized by the
 * harness prompts; vue-i18n handles the static UI chrome. Messages are typed,
 * so translation keys are checked at compile time.
 *
 * Only the default locale is registered upfront; every other locale is
 * code-split and loaded on demand via `loadLocale`.
 */
export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: { [DEFAULT_LOCALE]: defaultMessages },
});

/**
 * Loads a locale's message bundle (if not already loaded) and makes it the
 * active locale. Safe to call repeatedly; already-active locales are no-ops.
 */
export async function loadLocale(code: LocaleCode): Promise<void> {
  const global = i18n.global;
  if (global.locale.value === code) return;

  const messages = await localeLoaders[code]();
  global.setLocaleMessage(code, messages);
  global.locale.value = code;
}

// Kick off loading the detected initial locale (no-op when it's the default).
const initialLocale = detectInitialLocale();
if (initialLocale !== DEFAULT_LOCALE) {
  void loadLocale(initialLocale);
}
