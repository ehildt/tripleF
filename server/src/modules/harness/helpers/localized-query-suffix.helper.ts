/**
 * Localized language-name suffix for search queries, derived from a BCP-47
 * language tag via CLDR display names ("de" → "Deutsch", "ja" → "日本語").
 * Appending the language's own name to a content query strongly biases
 * engines toward localized results — hl/gl only steer the interface.
 *
 * English intentionally yields no suffix: it is the web's default language
 * and the hl/gl params already carry that bias. Nothing is hardcoded — the
 * name comes from the runtime's CLDR data for whatever language the intent
 * classifier detected.
 */
export function localizedQuerySuffix(lang?: string): string {
  if (!lang) return '';

  let code: string;
  try {
    code = new Intl.Locale(lang).language;
  } catch {
    return '';
  }
  if (!code || code === 'en') return '';

  try {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code);
    // CLDR falls back to the bare code for languages it does not know —
    // appending that would just litter the query.
    return !name || name === code ? '' : name;
  } catch {
    return '';
  }
}
