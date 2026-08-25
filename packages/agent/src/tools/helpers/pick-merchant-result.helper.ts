/**
 * Pick the first organic search result that lives on the merchant's own site.
 * Result order already ranks the merchant's product page first for a
 * "{product} {merchant}" query, so the first URL whose host slug carries the
 * store token (or whose label is carried by the token, e.g. "scan" inside
 * "scancomputers") wins.
 */
export function pickMerchantResult(results: Array<{ url?: string }>, storeToken: string): string | undefined {
  if (!storeToken) return undefined;

  for (const { url } of results) {
    if (!url) continue;

    let hostname: string;
    try {
      hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      continue;
    }

    if (hostname.replaceAll('.', '').includes(storeToken)) return url;

    const labelMatch = hostname.split('.').some((label) => label.length >= 4 && storeToken.includes(label));
    if (labelMatch) return url;
  }

  return undefined;
}
