import { LOCALE_CODES } from './locale-registry';

/**
 * The supported locale codes, auto-derived from the locale files in
 * `./locales` (see `./locale-registry`). Adding or removing a locale file is
 * all that's needed — do not edit this list by hand.
 */
export { LOCALE_CODES };

export type LocaleCode = (typeof LOCALE_CODES)[number];

export const DEFAULT_LOCALE: LocaleCode = 'en';

export function isLocaleCode(value: string): value is LocaleCode {
  return (LOCALE_CODES as readonly string[]).includes(value);
}
