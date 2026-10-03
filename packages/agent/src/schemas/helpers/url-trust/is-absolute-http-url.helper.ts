/**
 * Parseable absolute http(s) URL — matches the leniency `z.string().url()`
 * used to give these fields, minus non-http schemes. Trust membership is
 * enforced separately (source policy + enforceAvailableMediaUrls).
 */
export function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
