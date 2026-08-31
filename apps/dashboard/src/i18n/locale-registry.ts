import { mapLocaleModule } from './helpers/map-locale-module.helper';
import { type LocaleMessages } from './locale-schema';

/**
 * Auto-discovered locale registry. Every file in `./locales` is picked up via
 * `import.meta.glob`, validated against the Zod schema, and its `languageCode`
 * / `countryCode` keys are read to derive the i18n code and flag. Adding or
 * removing a locale file is all that's needed — there is no manual list to
 * maintain.
 *
 * The schema is enforced here at import time, so an invalid locale file fails
 * the build/test suite immediately.
 */
const localeModules = import.meta.glob<{ default: LocaleMessages }>(
  './locales/*.ts',
  { eager: true },
);

export interface LocaleInfo {
  /** i18n locale code (from the `languageCode` key), e.g. `'en'`. */
  code: string;
  /** ISO 3166-1 alpha-2 country code for the flag (from `countryCode`). */
  countryCode: string;
  /** Native (endonym) language name, e.g. `'English'`. */
  name: string;
  /** The validated message bundle. */
  messages: LocaleMessages;
}

export const locales: LocaleInfo[] = Object.entries(localeModules)
  .map(mapLocaleModule)
  .sort((a, b) => a.code.localeCompare(b.code));

/** All supported locale codes, derived from the locale files. */
export const LOCALE_CODES: readonly string[] = locales.map((l) => l.code);

/** Locale code → flag country code, derived from the locale files. */
export const LOCALE_FLAGS: Readonly<Record<string, string>> =
  Object.fromEntries(locales.map((l) => [l.code, l.countryCode]));
