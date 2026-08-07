/**
 * The static list of supported locale codes. This is the single source of
 * truth for which locales the app supports — adding a translation file to
 * `./locales` requires adding its code here (and a loader in `./messages`).
 *
 * Kept static (rather than derived from a bundled `messages` record) so the
 * locale bundles can be code-split and lazy-loaded instead of shipped upfront.
 */
export const LOCALE_CODES = [
  'am',
  'ar',
  'az',
  'be',
  'bg',
  'bn',
  'bs',
  'ca',
  'cs',
  'cy',
  'da',
  'de',
  'el',
  'en',
  'es',
  'et',
  'eu',
  'fa',
  'fi',
  'fr',
  'ga',
  'gd',
  'gl',
  'gu',
  'ha',
  'he',
  'hi',
  'hr',
  'hu',
  'id',
  'is',
  'it',
  'ja',
  'kk',
  'km',
  'ko',
  'lb',
  'lt',
  'lv',
  'mk',
  'mr',
  'ms',
  'mt',
  'my',
  'nb',
  'ne',
  'nl',
  'pa',
  'pl',
  'pt',
  'ro',
  'ru',
  'si',
  'sk',
  'sl',
  'sq',
  'sr',
  'sv',
  'sw',
  'ta',
  'te',
  'th',
  'tl',
  'tr',
  'uk',
  'ur',
  'uz',
  'vi',
  'yo',
  'zh',
  'zu',
] as const;

export type LocaleCode = (typeof LOCALE_CODES)[number];

export const DEFAULT_LOCALE: LocaleCode = 'en';

export function isLocaleCode(value: string): value is LocaleCode {
  return (LOCALE_CODES as readonly string[]).includes(value);
}
