/**
 * Google locale params: `hl` takes a language code, `gl` takes a COUNTRY
 * code. Our tools accept a single `lang` input, so the country is resolved
 * with the platform's CLDR likely-subtags data (Intl.Locale.maximize):
 * de→DE, en→US, ja→JP, zh→CN, pt→BR, … Languages without a resolvable
 * region send only `hl`, never an invalid `gl`.
 */
export function applyLocaleParams(
  body: Record<string, unknown>,
  lang?: string,
): void {
  if (!lang) return;
  body.hl = lang;
  const country = resolveLikelyCountry(lang);
  if (country) body.gl = country;
}

/** Resolve the most likely country for a language tag via CLDR data. */
function resolveLikelyCountry(lang: string): string | undefined {
  try {
    const region = new Intl.Locale(lang).maximize().region;
    return region ? region.toLowerCase() : undefined;
  } catch {
    return undefined;
  }
}
