/**
 * True when the URL points at a Google host (google.com, google.de,
 * google.co.uk, shopping.google.*, …) — i.e. a Google Shopping, Google
 * search, or Google redirect link rather than a merchant's own page.
 */
export function isGoogleHostUrl(url: string): boolean {
  try {
    return /(^|\.)google\.[a-z.]+$/.test(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}
