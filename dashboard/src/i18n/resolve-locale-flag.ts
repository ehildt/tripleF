import type { LocaleCode } from './locale-codes';

/**
 * Map a locale code to the ISO 3166-1-alpha-2 country code used by the
 * `flag-icons` CSS classes (`.fi-{code}`). Regional languages without a
 * single country flag (Catalan, Basque, Galician) return `null` so the UI
 * can fall back to a generic globe icon.
 *
 * Ambiguous multi-country languages use a sensible primary default
 * (e.g. English → US, Spanish → Spain, Portuguese → Portugal, Chinese → CN).
 */
const LOCALE_TO_COUNTRY: Partial<Record<LocaleCode, string>> = {
  am: 'et', // Amharic → Ethiopia
  ar: 'sa', // Arabic → Saudi Arabia
  az: 'az', // Azerbaijani → Azerbaijan
  be: 'by', // Belarusian → Belarus
  bg: 'bg', // Bulgarian → Bulgaria
  bn: 'bd', // Bengali → Bangladesh
  bs: 'ba', // Bosnian → Bosnia and Herzegovina
  cs: 'cz', // Czech → Czechia
  cy: 'gb-wls', // Welsh → Wales
  da: 'dk', // Danish → Denmark
  de: 'de', // German → Germany
  el: 'gr', // Greek → Greece
  en: 'us', // English → United States
  es: 'es', // Spanish → Spain
  et: 'ee', // Estonian → Estonia
  fa: 'ir', // Persian → Iran
  fi: 'fi', // Finnish → Finland
  fr: 'fr', // French → France
  ga: 'ie', // Irish → Ireland
  gd: 'gb-sct', // Scottish Gaelic → Scotland
  gu: 'in', // Gujarati → India
  ha: 'ng', // Hausa → Nigeria
  he: 'il', // Hebrew → Israel
  hi: 'in', // Hindi → India
  hr: 'hr', // Croatian → Croatia
  hu: 'hu', // Hungarian → Hungary
  id: 'id', // Indonesian → Indonesia
  is: 'is', // Icelandic → Iceland
  it: 'it', // Italian → Italy
  ja: 'jp', // Japanese → Japan
  kk: 'kz', // Kazakh → Kazakhstan
  km: 'kh', // Khmer → Cambodia
  ko: 'kr', // Korean → South Korea
  lb: 'lu', // Luxembourgish → Luxembourg
  lt: 'lt', // Lithuanian → Lithuania
  lv: 'lv', // Latvian → Latvia
  mk: 'mk', // Macedonian → North Macedonia
  mr: 'in', // Marathi → India
  ms: 'my', // Malay → Malaysia
  mt: 'mt', // Maltese → Malta
  my: 'mm', // Burmese → Myanmar
  nb: 'no', // Norwegian → Norway
  ne: 'np', // Nepali → Nepal
  nl: 'nl', // Dutch → Netherlands
  pa: 'in', // Punjabi → India
  pl: 'pl', // Polish → Poland
  pt: 'pt', // Portuguese → Portugal
  ro: 'ro', // Romanian → Romania
  ru: 'ru', // Russian → Russia
  si: 'lk', // Sinhala → Sri Lanka
  sk: 'sk', // Slovak → Slovakia
  sl: 'si', // Slovenian → Slovenia
  sq: 'al', // Albanian → Albania
  sr: 'rs', // Serbian → Serbia
  sv: 'se', // Swedish → Sweden
  sw: 'ke', // Swahili → Kenya
  ta: 'in', // Tamil → India
  te: 'in', // Telugu → India
  th: 'th', // Thai → Thailand
  tl: 'ph', // Tagalog → Philippines
  tr: 'tr', // Turkish → Turkey
  uk: 'ua', // Ukrainian → Ukraine
  ur: 'pk', // Urdu → Pakistan
  uz: 'uz', // Uzbek → Uzbekistan
  vi: 'vn', // Vietnamese → Vietnam
  yo: 'ng', // Yoruba → Nigeria
  zh: 'cn', // Chinese → China
  zu: 'za', // Zulu → South Africa
};

/**
 * Resolve the `flag-icons` country code for a locale, or `null` when the
 * language has no single country flag (Catalan, Basque, Galician).
 */
export function resolveLocaleFlag(code: LocaleCode): string | null {
  return LOCALE_TO_COUNTRY[code] ?? null;
}
